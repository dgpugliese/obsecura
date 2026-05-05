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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({ ok: true, ts: Date.now() });
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      return handleUpload(request, env);
    }

    const m = url.pathname.match(/^\/api\/d\/([a-f0-9]{16})$/);
    if (m) {
      const id = m[1];
      if (request.method === "GET") return handleDownload(id, env, ctx);
      if (request.method === "HEAD") return handleHead(id, env);
      if (request.method === "DELETE") return handleManualPurge(id, env);
      return new Response("method not allowed", { status: 405 });
    }

    if (url.pathname.startsWith("/api/")) {
      return new Response("not found", { status: 404 });
    }

    // Root → Obscura.html. Preserves the URL fragment because fragments
    // never get sent to the server in the first place.
    if (url.pathname === "/" || url.pathname === "") {
      const u = new URL(request.url);
      u.pathname = "/Obscura.html";
      return env.ASSETS.fetch(new Request(u.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(sweepOrphans(env));
  },
};

async function handleUpload(request, env) {
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
    ctx.waitUntil(purge(id, env));
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
    ctx.waitUntil(purge(id, env));
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

async function handleManualPurge(id, env) {
  if (!HEX_ID.test(id)) return jerr(400, "bad id");
  await purge(id, env);
  return new Response(null, { status: 204 });
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
