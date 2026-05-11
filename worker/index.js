// Obscura zero-knowledge transit Worker.
//
// Storage model:
//   R2 (BLOBS): raw ciphertext, keyed by random 16-hex id.
//   KV (META):  { expiresAt, downloads, size, createdAt } per id, with TTL
//               so abandoned metadata reaps itself.
//
// The server never sees plaintext, never sees the key (key lives in the URL
// fragment), and never persists access logs.

const HEX_ID = /^[a-f0-9]{16}$/;

// Strict CSP for the HTML shell. `script-src` is restricted to self plus the
// two CDNs we vendor pinned-by-SRI assets from. `connect-src 'self'` keeps
// the page from talking to anyone but our own Worker — defense in depth on
// top of SRI for the zero-knowledge promise. `frame-ancestors 'none'`
// blocks clickjacking.
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://unpkg.com https://cdn.jsdelivr.net 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = {
  "content-security-policy": CSP,
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "permissions-policy": "geolocation=(), camera=(), microphone=(), payment=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
};

function withSecurityHeaders(res) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

// Allowed Origins for the upload endpoint. The page is the only thing that
// should be POSTing ciphertext; everything else (curl, scripts from other
// sites, scrapers) gets rejected. Production hosts are pinned in this list;
// local dev allows any localhost/127.0.0.1 port so `wrangler dev` works
// regardless of the port wrangler picks.
const PROD_ALLOWED_ORIGINS = new Set([
  "https://obscr.app",
  "https://www.obscr.app",
]);

function originAllowed(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (PROD_ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    if ((u.hostname === "localhost" || u.hostname === "127.0.0.1") && u.protocol === "http:") {
      return true;
    }
  } catch { /* malformed Origin header */ }
  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({ ok: true, ts: Date.now() });
    }

    if (url.pathname === "/api/transparency") {
      return handleTransparency(env);
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      return handleUpload(request, env, ctx);
    }

    const m = url.pathname.match(/^\/api\/d\/([a-f0-9]{16})$/);
    if (m) {
      const id = m[1];
      if (request.method === "GET") return handleDownload(id, env, ctx);
      if (request.method === "HEAD") return handleHead(id, env);
      if (request.method === "DELETE") return handleManualPurge(id, env, ctx);
      return new Response("method not allowed", { status: 405 });
    }

    if (url.pathname.startsWith("/api/")) {
      return jerr(404, "not found");
    }

    // status.obscr.app pins the root to /status. We let the asset binding
    // (which html_handling rewrites .html → bare path) handle the canonical
    // form by re-issuing as /status and following one redirect inline, so
    // the visitor's URL bar reads status.obscr.app/status without a flash.
    // The main domain doesn't need any root rewrite — the assets binding
    // serves index.html at / automatically.
    const host = url.hostname;
    const isRoot = url.pathname === "/" || url.pathname === "";
    if (isRoot && host === "status.obscr.app") {
      const u = new URL(request.url);
      u.pathname = "/status";
      const res = await env.ASSETS.fetch(new Request(u.toString(), { headers: request.headers }));
      if (res.status === 200) return withSecurityHeaders(res);
      // Fallback: follow one redirect if assets binding emits a 3xx.
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (loc) {
          const followed = await env.ASSETS.fetch(new Request(new URL(loc, u).toString(), { headers: request.headers }));
          if (followed.status === 200) return withSecurityHeaders(followed);
        }
      }
    }

    const res = await env.ASSETS.fetch(request);

    // Replace the asset binding's bare 404 with our styled page. ASSETS
    // returns 404 for any path that doesn't match a file in the bundle.
    if (res.status === 404) {
      return serveNotFound(request, env);
    }

    // Apply security headers to HTML responses; pass everything else through
    // untouched so binary assets keep their content-type.
    const ct = res.headers.get("content-type") || "";
    if (ct.startsWith("text/html")) return withSecurityHeaders(res);
    return res;
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(sweepOrphans(env));
  },
};

// Minimum well-formed sizes per format. Both magics are 4 bytes.
//   OBS1: magic(4) + iv(12) + ct/tag(>=16)               = 32
//   OBS2: magic(4) + salt(16) + wrapIv(12) + wrappedDek(48)
//         + dataIv(12) + ct/tag(>=16)                    = 108
const MIN_OBS1 = 32;
const MIN_OBS2 = 108;

async function handleUpload(request, env, ctx) {
  if (!originAllowed(request)) return jerr(403, "forbidden origin");

  const ttl = clampInt(request.headers.get("X-Obscura-TTL"), 1, parseInt(env.MAX_TTL_HOURS, 10) || 168, 24);
  const maxDL = clampInt(request.headers.get("X-Obscura-MaxDL"), 1, parseInt(env.MAX_DOWNLOADS, 10) || 100, 1);
  const maxBytes = parseInt(env.MAX_BLOB_BYTES, 10) || 50 * 1024 * 1024;

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) return jerr(400, "empty payload");
  if (body.byteLength > maxBytes) return jerr(413, "payload too large");

  // Sanity-check the magic header so we don't store random POSTed garbage.
  // OBS1 = key in URL fragment. OBS2 = passphrase-wrapped DEK.
  const head = new Uint8Array(body, 0, Math.min(4, body.byteLength));
  const isObs1 = head[0] === 0x4f && head[1] === 0x42 && head[2] === 0x53 && head[3] === 0x31;
  const isObs2 = head[0] === 0x4f && head[1] === 0x42 && head[2] === 0x53 && head[3] === 0x32;
  if (!isObs1 && !isObs2) return jerr(400, "not an obscura ciphertext");
  if (isObs1 && body.byteLength < MIN_OBS1) return jerr(400, "obs1 ciphertext truncated");
  if (isObs2 && body.byteLength < MIN_OBS2) return jerr(400, "obs2 ciphertext truncated");

  const id = randomHexId(8);
  const now = Date.now();
  const expiresAt = now + ttl * 3600 * 1000;

  await env.BLOBS.put(id, body, {
    httpMetadata: { contentType: "application/octet-stream" },
  });

  await env.META.put(
    id,
    JSON.stringify({ expiresAt, downloads: maxDL, size: body.byteLength, createdAt: now }),
    { expirationTtl: Math.max(60, ttl * 3600 + 60) }
  );

  ctx.waitUntil(bumpStat(env, "created"));

  return Response.json({ id, expiresAt, downloads: maxDL });
}

async function handleHead(id, env) {
  if (!HEX_ID.test(id)) return new Response(null, { status: 400 });
  const metaStr = await env.META.get(id);
  if (!metaStr) return new Response(null, { status: 404 });
  const meta = JSON.parse(metaStr);
  if (meta.expiresAt < Date.now() || meta.downloads <= 0) return new Response(null, { status: 410 });
  return new Response(null, {
    status: 200,
    headers: {
      "x-obscura-size": String(meta.size),
      "x-obscura-expires": String(meta.expiresAt),
      "x-obscura-downloads": String(meta.downloads),
    },
  });
}

async function handleDownload(id, env, ctx) {
  if (!HEX_ID.test(id)) return jerr(400, "bad id");

  const metaStr = await env.META.get(id);
  if (!metaStr) return jerr(404, "not found");
  const meta = JSON.parse(metaStr);

  if (meta.expiresAt < Date.now()) {
    ctx.waitUntil(Promise.all([purge(id, env), bumpStat(env, "expired")]));
    return jerr(410, "expired");
  }
  if (meta.downloads <= 0) {
    ctx.waitUntil(purge(id, env));
    return jerr(410, "exhausted");
  }

  const obj = await env.BLOBS.get(id);
  if (!obj) {
    ctx.waitUntil(env.META.delete(id));
    return jerr(410, "gone");
  }

  // Best-effort decrement. KV is eventually consistent so two simultaneous
  // GETs could each see the same `downloads` value and both succeed; that's
  // an accepted MVP race. Durable Objects would close it.
  const remaining = meta.downloads - 1;
  if (remaining <= 0) {
    ctx.waitUntil(Promise.all([purge(id, env), bumpStat(env, "exhausted")]));
  } else {
    const newMeta = { ...meta, downloads: remaining };
    const ttlSec = Math.max(60, Math.floor((meta.expiresAt - Date.now()) / 1000));
    ctx.waitUntil(env.META.put(id, JSON.stringify(newMeta), { expirationTtl: ttlSec }));
  }

  return new Response(obj.body, {
    status: 200,
    headers: {
      "content-type": "application/octet-stream",
      "content-length": String(meta.size),
      "cache-control": "no-store",
      "x-obscura-downloads-remaining": String(remaining),
    },
  });
}

async function handleManualPurge(id, env, ctx) {
  if (!HEX_ID.test(id)) return jerr(400, "bad id");
  // Only count a burn if the share actually existed — otherwise anyone could
  // inflate the counter by hitting random IDs.
  const existed = (await env.META.get(id)) !== null;
  await purge(id, env);
  if (existed) ctx.waitUntil(bumpStat(env, "burned"));
  return new Response(null, { status: 204 });
}

async function serveNotFound(request, env) {
  // The assets binding's html_handling rewrites /foo.html -> /foo with a 307,
  // so request the canonical extensionless path directly. We also follow one
  // redirect by re-issuing against the resolved Location, in case future
  // assets-binding behavior differs.
  const tryPaths = ["/404", "/404.html"];
  for (const path of tryPaths) {
    const u = new URL(request.url);
    u.pathname = path;
    const res = await env.ASSETS.fetch(new Request(u.toString(), { headers: request.headers }));
    if (res.status === 200) {
      return withSecurityHeaders(new Response(res.body, {
        status: 404,
        headers: res.headers,
      }));
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (loc) {
        const followed = await env.ASSETS.fetch(new Request(new URL(loc, u).toString(), { headers: request.headers }));
        if (followed.status === 200) {
          return withSecurityHeaders(new Response(followed.body, {
            status: 404,
            headers: followed.headers,
          }));
        }
      }
    }
  }
  return withSecurityHeaders(new Response("not found\n", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  }));
}

async function purge(id, env) {
  await Promise.allSettled([env.BLOBS.delete(id), env.META.delete(id)]);
}

async function sweepOrphans(env) {
  // KV expirationTtl reaps metadata; orphans in R2 only happen if a put
  // succeeded but META delete didn't. List a page and check each.
  let cursor;
  let scanned = 0;
  do {
    const page = await env.BLOBS.list({ limit: 200, cursor });
    for (const obj of page.objects) {
      scanned++;
      const meta = await env.META.get(obj.key);
      if (!meta) await env.BLOBS.delete(obj.key);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor && scanned < 2000); // safety cap per run
}

// ============================================================
// Transparency counters
// ============================================================
//
// Daily aggregate counters stored in KV under `stat:YYYY-MM-DD:<event>`.
// Events: created, burned, expired, exhausted. Plus two cumulative manual
// counters at `stat:abuse:received` and `stat:abuse:actioned`, updated by the
// operator out-of-band (e.g. `wrangler kv key put`).
//
// Increment is read-then-write — two writes in the same second can race and
// undercount by one. This is acceptable: these numbers are aggregate, public,
// and explicitly labeled "best-effort" on the transparency page.

const STAT_TTL_SEC = 90 * 24 * 3600;

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function bumpStat(env, event) {
  const key = `stat:${todayUTC()}:${event}`;
  const cur = parseInt((await env.META.get(key)) || "0", 10) || 0;
  await env.META.put(key, String(cur + 1), { expirationTtl: STAT_TTL_SEC });
}

async function handleTransparency(env) {
  const days = 30;
  const today = new Date();
  const dateKeys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dateKeys.push(d.toISOString().slice(0, 10));
  }
  const events = ["created", "burned", "expired", "exhausted"];

  // Fan out all KV reads in parallel instead of 122 sequential awaits.
  const fetches = [];
  for (const date of dateKeys) {
    for (const ev of events) {
      fetches.push(env.META.get(`stat:${date}:${ev}`));
    }
  }
  fetches.push(env.META.get("stat:abuse:received"));
  fetches.push(env.META.get("stat:abuse:actioned"));
  const results = await Promise.all(fetches);

  const daily = {};
  let i = 0;
  for (const date of dateKeys) {
    const row = { date };
    for (const ev of events) {
      const v = results[i++];
      row[ev] = v ? parseInt(v, 10) : 0;
    }
    daily[date] = row;
  }
  const abuseReceived = parseInt(results[i++] || "0", 10) || 0;
  const abuseActioned = parseInt(results[i++] || "0", 10) || 0;

  return Response.json(
    {
      generatedAt: Date.now(),
      windowDays: days,
      note: "Aggregate daily counts. No per-share data, no IPs, no identifiers. Best-effort: simultaneous events in the same second may undercount by one.",
      events: {
        created: "share uploaded",
        burned: "manually purged by sender",
        expired: "TTL elapsed before final download",
        exhausted: "all downloads consumed",
      },
      daily,
      abuse: { received: abuseReceived, actioned: abuseActioned, cumulative: true },
    },
    {
      headers: { "cache-control": "public, max-age=300" },
    }
  );
}

function clampInt(raw, min, max, fallback) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function randomHexId(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < buf.length; i++) s += buf[i].toString(16).padStart(2, "0");
  return s;
}

function jerr(status, message) {
  return Response.json({ error: message }, { status });
}
