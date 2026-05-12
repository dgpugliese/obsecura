const { useState, useEffect, useRef, useMemo, useCallback } = React;
const theme = {
  name: "dark",
  bg: "#08090c",
  bgGrid: "#0c0e13",
  panel: "#0f1116",
  panelHi: "#15181f",
  panelLo: "#0b0d12",
  border: "#1d212b",
  borderHi: "#2a2f3d",
  ink: "#e9ecf2",
  inkDim: "#9aa0ad",
  inkFaint: "#7a818c",
  accent: "oklch(0.82 0.16 195)",
  accentSoft: "oklch(0.82 0.16 195 / 0.18)",
  accentLine: "oklch(0.82 0.16 195 / 0.45)",
  secure: "oklch(0.78 0.17 150)",
  warn: "oklch(0.75 0.18 60)",
  danger: "oklch(0.68 0.22 25)"
};
const HEX = "0123456789ABCDEF";
const CIPHER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789#$%&*+=<>/\\|".split("");
function randHex(len = 4) {
  let s = "";
  for (let i = 0; i < len; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}
function ScrambleText({ value, speed = 80, lockProgress = 1, color, style, charset = CIPHER_CHARS }) {
  if (lockProgress >= 1) {
    return /* @__PURE__ */ React.createElement("span", { style: { color, fontVariantNumeric: "tabular-nums", ...style } }, value);
  }
  return /* @__PURE__ */ React.createElement(ScrambleTextAnimated, { value, speed, lockProgress, color, style, charset });
}
function ScrambleTextAnimated({ value, speed, lockProgress, color, style, charset }) {
  const [out, setOut] = useState(() => value.split("").map(() => charset[Math.floor(Math.random() * charset.length)]).join(""));
  useEffect(() => {
    const id = setInterval(() => {
      const lockedLen = Math.floor(value.length * lockProgress);
      let s = "";
      for (let i = 0; i < value.length; i++) {
        if (i < lockedLen) s += value[i];
        else if (value[i] === " ") s += " ";
        else s += charset[Math.floor(Math.random() * charset.length)];
      }
      setOut(s);
    }, speed);
    return () => clearInterval(id);
  }, [value, lockProgress, speed, charset]);
  return /* @__PURE__ */ React.createElement("span", { style: { color, fontVariantNumeric: "tabular-nums", ...style } }, out);
}
function HexStream({ len = 32, speed = 60, style, color, paused = false }) {
  const [s, setS] = useState(() => randHex(len));
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setS(randHex(len)), speed);
    return () => clearInterval(id);
  }, [len, speed, paused]);
  return /* @__PURE__ */ React.createElement("span", { style: { color, ...style } }, s);
}
function HexDump({ rows = 6, cols = 16, speed = 80, color, dim, paused = false }) {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setSeed((x) => x + 1), speed);
    return () => clearInterval(id);
  }, [speed, paused]);
  const lines = useMemo(() => {
    const out = [];
    for (let r = 0; r < rows; r++) {
      const offset = (r * cols).toString(16).toUpperCase().padStart(8, "0");
      const bytes = [];
      for (let c = 0; c < cols; c++) bytes.push(randHex(2));
      out.push({ offset, bytes });
    }
    return out;
  }, [seed, rows, cols]);
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 10.5, lineHeight: 1.65, color: dim, letterSpacing: "0.04em" } }, lines.map((l, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("span", { style: { opacity: 0.55 } }, l.offset, " "), /* @__PURE__ */ React.createElement("span", { style: { color } }, l.bytes.join(" ")), /* @__PURE__ */ React.createElement("span", { style: { opacity: 0.45, marginLeft: 14 } }, l.bytes.map((b) => {
    const code = parseInt(b, 16);
    return code >= 32 && code <= 126 ? String.fromCharCode(code) : "\xB7";
  }).join("")))));
}
function EntropyBar({ width = 220, height = 38, color, dim, speed = 90, paused = false }) {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setSeed((x) => x + 1), speed);
    return () => clearInterval(id);
  }, [speed, paused]);
  const bars = useMemo(() => {
    const n = 56;
    return Array.from({ length: n }, () => 0.25 + Math.random() * 0.75);
  }, [seed]);
  const bw = (width - (bars.length - 1) * 2) / bars.length;
  return /* @__PURE__ */ React.createElement("svg", { width, height, style: { display: "block" } }, bars.map((v, i) => {
    const h = Math.max(2, v * height);
    return /* @__PURE__ */ React.createElement(
      "rect",
      {
        key: i,
        x: i * (bw + 2),
        y: height - h,
        width: bw,
        height: h,
        fill: i % 6 === 0 ? color : dim,
        opacity: i % 6 === 0 ? 0.95 : 0.55
      }
    );
  }));
}
function Clock({ color, style }) {
  const [t, setT] = useState(() => /* @__PURE__ */ new Date());
  useEffect(() => {
    const id = setInterval(() => setT(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(id);
  }, []);
  const pad = (n) => String(n).padStart(2, "0");
  return /* @__PURE__ */ React.createElement("span", { style: { color, fontFamily: "var(--mono)", fontVariantNumeric: "tabular-nums", ...style } }, pad(t.getUTCHours()), ":", pad(t.getUTCMinutes()), ":", pad(t.getUTCSeconds()), " UTC");
}
function Countdown({ totalSeconds = 86400, color, style }) {
  const [s, setS] = useState(totalSeconds - 793);
  useEffect(() => {
    const id = setInterval(() => setS((v) => Math.max(0, v - 1)), 1e3);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const sec = s % 60;
  return /* @__PURE__ */ React.createElement("span", { style: { color, fontFamily: "var(--mono)", fontVariantNumeric: "tabular-nums", ...style } }, String(h).padStart(2, "0"), ":", String(m).padStart(2, "0"), ":", String(sec).padStart(2, "0"));
}
function Panel({ children, style, label, right, accent = false }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: theme.panel,
    border: `1px solid ${accent ? theme.accentLine : theme.border}`,
    borderRadius: 6,
    position: "relative",
    ...style
  } }, label && /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderBottom: `1px solid ${theme.border}`,
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.18em",
    color: theme.inkFaint,
    textTransform: "uppercase"
  } }, /* @__PURE__ */ React.createElement("span", null, label), /* @__PURE__ */ React.createElement("span", null, right)), children);
}
function Tag({ children, accent, secure, warn, danger, style, onClick }) {
  let color = theme.inkDim, bg = "transparent", border = theme.border;
  if (accent) {
    color = theme.accent;
    border = theme.accentLine;
    bg = theme.accentSoft;
  }
  if (secure) {
    color = theme.secure;
    border = theme.secure;
  }
  if (warn) {
    color = theme.warn;
    border = theme.warn;
  }
  if (danger) {
    color = theme.danger;
    border = theme.danger;
  }
  return /* @__PURE__ */ React.createElement("span", { onClick, style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 8px",
    borderRadius: 3,
    border: `1px solid ${border}`,
    background: bg,
    color,
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    ...style
  } }, children);
}
function Dot({ color, size = 8, pulse }) {
  return /* @__PURE__ */ React.createElement("span", { style: {
    display: "inline-block",
    width: size,
    height: size,
    borderRadius: "50%",
    background: color,
    boxShadow: pulse ? `0 0 0 0 ${color}` : void 0,
    animation: pulse ? "obs-pulse 1.6s infinite" : void 0
  } });
}
function IcLock({ size = 16, color }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M4 7V5a4 4 0 0 1 8 0v2", stroke: color, strokeWidth: "1.4" }), /* @__PURE__ */ React.createElement("rect", { x: "2.5", y: "7", width: "11", height: "7", rx: "1.5", stroke: color, strokeWidth: "1.4" }), /* @__PURE__ */ React.createElement("circle", { cx: "8", cy: "10", r: "1", fill: color }));
}
function IcCheck({ size = 12, color }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 12 12" }, /* @__PURE__ */ React.createElement("path", { d: "M2 6 L5 9 L10 3", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }));
}
function IcPlus({ size = 28, color, weight = 1.6 }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 28 28" }, /* @__PURE__ */ React.createElement("line", { x1: "14", y1: "6", x2: "14", y2: "22", stroke: color, strokeWidth: weight, strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "14", x2: "22", y2: "14", stroke: color, strokeWidth: weight, strokeLinecap: "round" }));
}
function IcCopy({ size = 14, color }) {
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 14 14", fill: "none" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "8", height: "9", stroke: color, strokeWidth: "1.3" }), /* @__PURE__ */ React.createElement("rect", { x: "5.5", y: "5.5", width: "8", height: "9", stroke: color, strokeWidth: "1.3", fill: theme.panel }));
}
function ZKPipeline({ width = 1080, height = 70, intensity = 1.4 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = width * dpr;
    cvs.height = height * dpr;
    const ctx = cvs.getContext("2d");
    ctx.scale(dpr, dpr);
    const particles = [];
    const trackY = height / 2;
    const startX = 110;
    const endX = width - 110;
    const spawn = () => {
      particles.push({
        x: startX,
        y: trackY + (Math.random() - 0.5) * 18,
        vx: 1.4 + Math.random() * 1.6,
        char: HEX[Math.floor(Math.random() * 16)] + HEX[Math.floor(Math.random() * 16)]
      });
    };
    let raf, last = performance.now(), acc = 0;
    const tick = (now) => {
      const dt = now - last;
      last = now;
      acc += dt;
      const spawnEvery = 60 / intensity;
      while (acc > spawnEvery) {
        spawn();
        acc -= spawnEvery;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, trackY);
      ctx.lineTo(endX, trackY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `600 11px JetBrains Mono, monospace`;
      ctx.textBaseline = "middle";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        if (Math.random() < 0.06) p.char = HEX[Math.floor(Math.random() * 16)] + HEX[Math.floor(Math.random() * 16)];
        if (p.x > endX) {
          particles.splice(i, 1);
          continue;
        }
        const t = (p.x - startX) / (endX - startX);
        const alpha = Math.min(1, t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = i % 5 === 0 ? theme.accent : theme.inkFaint;
        ctx.fillText(p.char, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      const drawNode = (x, label) => {
        ctx.strokeStyle = theme.borderHi;
        ctx.fillStyle = theme.panelHi;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, trackY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = theme.ink;
        ctx.font = `600 10px JetBrains Mono, monospace`;
        ctx.textAlign = "center";
        ctx.fillText(label, x, trackY + 1);
        ctx.textAlign = "start";
      };
      drawNode(startX, "ENC");
      drawNode(endX, "STO");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, height, intensity]);
  return /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, style: { width, height, display: "block" } });
}
const MAGIC = new Uint8Array([79, 66, 83, 49]);
const MAGIC_V2 = new Uint8Array([79, 66, 83, 50]);
const ARGON2_PARAMS = { mem: 65536, time: 3, parallelism: 1, hashLen: 32 };
const PASSPHRASE_WORDS = [
  "amber",
  "anchor",
  "axiom",
  "beacon",
  "blaze",
  "bramble",
  "brick",
  "candle",
  "canyon",
  "cedar",
  "cipher",
  "cobalt",
  "copper",
  "coral",
  "crane",
  "crimson",
  "crystal",
  "dahlia",
  "dawn",
  "delta",
  "dune",
  "ember",
  "falcon",
  "fern",
  "forge",
  "frost",
  "garnet",
  "glade",
  "granite",
  "harbor",
  "haven",
  "hedge",
  "horizon",
  "iris",
  "ivory",
  "ivy",
  "jade",
  "journey",
  "juniper",
  "kestrel",
  "lantern",
  "lichen",
  "marble",
  "meadow",
  "mercury",
  "mesa",
  "mist",
  "moss",
  "myth",
  "nebula",
  "oak",
  "obsidian",
  "onyx",
  "orbit",
  "otter",
  "peak",
  "pebble",
  "pine",
  "pivot",
  "plum",
  "polar",
  "poppy",
  "prism",
  "quartz",
  "quill",
  "raven",
  "reef",
  "rift",
  "river",
  "rune",
  "sable",
  "sage",
  "sapphire",
  "silver",
  "slate",
  "solstice",
  "spire",
  "spruce",
  "star",
  "steel",
  "stone",
  "storm",
  "summit",
  "tangerine",
  "thistle",
  "tide",
  "timber",
  "topaz",
  "torch",
  "trail",
  "tundra",
  "twilight",
  "umber",
  "vale",
  "vault",
  "velvet",
  "verdant",
  "vesper",
  "violet",
  "vortex",
  "walnut",
  "wave",
  "willow",
  "winter",
  "wolf",
  "xenon",
  "yarrow",
  "zephyr",
  "zinc"
];
function secureRandInt(max) {
  if (max <= 0 || max > 4294967296) throw new Error("secureRandInt out of range");
  const limit = Math.floor(4294967296 / max) * max;
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}
function generatePassphrase() {
  const w = () => PASSPHRASE_WORDS[secureRandInt(PASSPHRASE_WORDS.length)];
  const n = () => String(secureRandInt(100)).padStart(2, "0");
  return [w(), w(), n(), w()].join("-");
}
function b64uEncode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64uDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function generateKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
async function exportRawKey(key) {
  return new Uint8Array(await crypto.subtle.exportKey("raw", key));
}
async function importRawKey(raw) {
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function packFiles(fileList) {
  const meta = {
    v: 1,
    files: fileList.map((f) => ({ name: f.name, size: f.size, type: f.type || "application/octet-stream" }))
  };
  const headerJson = new TextEncoder().encode(JSON.stringify(meta));
  const headerLen = new Uint8Array(4);
  new DataView(headerLen.buffer).setUint32(0, headerJson.length, true);
  const bodies = await Promise.all(fileList.map((f) => f.arrayBuffer().then((b) => new Uint8Array(b))));
  const total = 4 + headerJson.length + bodies.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  out.set(headerLen, off);
  off += 4;
  out.set(headerJson, off);
  off += headerJson.length;
  for (const b of bodies) {
    out.set(b, off);
    off += b.length;
  }
  return out;
}
function unpackFiles(plain) {
  const dv = new DataView(plain.buffer, plain.byteOffset, plain.byteLength);
  const headerLen = dv.getUint32(0, true);
  const headerJson = new TextDecoder().decode(plain.subarray(4, 4 + headerLen));
  const meta = JSON.parse(headerJson);
  let off = 4 + headerLen;
  return meta.files.map((f) => {
    const data = plain.subarray(off, off + f.size);
    off += f.size;
    return { name: f.name, type: f.type, data };
  });
}
async function encryptBlob(plain, key) {
  const keyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const t0 = performance.now();
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
  const encryptMs = performance.now() - t0;
  const out = new Uint8Array(MAGIC.length + iv.length + ct.length);
  out.set(MAGIC, 0);
  out.set(iv, MAGIC.length);
  out.set(ct, MAGIC.length + iv.length);
  return { blob: out, encryptMs, kdfMs: 0, dataKey: keyRaw };
}
async function decryptBlob(blob, key) {
  for (let i = 0; i < MAGIC.length; i++) {
    if (blob[i] !== MAGIC[i]) throw new Error("not an obscura ciphertext file");
  }
  const iv = blob.subarray(MAGIC.length, MAGIC.length + 12);
  const ct = blob.subarray(MAGIC.length + 12);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
}
function blobMagic(blob) {
  if (blob.length < 4) return null;
  for (let i = 0; i < 4; i++) {
    if (blob[i] === MAGIC[i]) continue;
    if (blob[i] !== MAGIC_V2[i]) return null;
    return "v2";
  }
  return blob[3] === MAGIC_V2[3] ? "v2" : "v1";
}
async function deriveKEK(passphrase, salt) {
  if (typeof argon2 === "undefined" || !argon2.hash) {
    throw new Error("argon2 wasm not loaded \u2014 passphrase mode unavailable");
  }
  const r = await argon2.hash({
    pass: passphrase,
    salt,
    type: argon2.ArgonType.Argon2id,
    ...ARGON2_PARAMS
  });
  return crypto.subtle.importKey("raw", r.hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encryptBlobV2(plain, passphrase) {
  const dek = await generateKey();
  const dekRaw = await exportRawKey(dek);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const tKdf = performance.now();
  const kek = await deriveKEK(passphrase, salt);
  const kdfMs = performance.now() - tKdf;
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, kek, dekRaw));
  const dataIv = crypto.getRandomValues(new Uint8Array(12));
  const tEnc = performance.now();
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: dataIv }, dek, plain));
  const encryptMs = performance.now() - tEnc;
  const out = new Uint8Array(4 + 16 + 12 + 48 + 12 + ct.length);
  let off = 0;
  out.set(MAGIC_V2, off);
  off += 4;
  out.set(salt, off);
  off += 16;
  out.set(wrapIv, off);
  off += 12;
  out.set(wrapped, off);
  off += 48;
  out.set(dataIv, off);
  off += 12;
  out.set(ct, off);
  return { blob: out, encryptMs, kdfMs, dataKey: dekRaw };
}
async function decryptBlobV2(blob, passphrase) {
  for (let i = 0; i < MAGIC_V2.length; i++) {
    if (blob[i] !== MAGIC_V2[i]) throw new Error("not an OBS2 file");
  }
  const salt = blob.subarray(4, 20);
  const wrapIv = blob.subarray(20, 32);
  const wrapped = blob.subarray(32, 80);
  const dataIv = blob.subarray(80, 92);
  const ct = blob.subarray(92);
  const kek = await deriveKEK(passphrase, salt);
  const dekRaw = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: wrapIv }, kek, wrapped));
  const dek = await importRawKey(dekRaw);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: dataIv }, dek, ct));
}
async function sha256Hex(bytes) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  let s = "";
  for (let i = 0; i < h.length; i++) s += h[i].toString(16).padStart(2, "0");
  return s;
}
function fingerprintRows(hex) {
  const top = hex.slice(0, 12).toUpperCase();
  const pair = (s, i) => s.slice(i, i + 2);
  return [
    `${pair(top, 0)}:${pair(top, 2)}:${pair(top, 4)}`,
    `${pair(top, 6)}:${pair(top, 8)}:${pair(top, 10)}`
  ];
}
function shannonEntropy(bytes) {
  if (!bytes || !bytes.length) return 0;
  const SAMPLE = 65536;
  let view = bytes;
  if (bytes.length > SAMPLE) {
    const stride = Math.floor(bytes.length / SAMPLE);
    const sampled = new Uint8Array(SAMPLE);
    for (let i = 0; i < SAMPLE; i++) sampled[i] = bytes[i * stride];
    view = sampled;
  }
  const counts = new Uint32Array(256);
  for (let i = 0; i < view.length; i++) counts[view[i]]++;
  let h = 0;
  const n = view.length;
  for (let i = 0; i < 256; i++) {
    if (!counts[i]) continue;
    const p = counts[i] / n;
    h -= p * Math.log2(p);
  }
  return h;
}
function fmtMs(ms) {
  if (ms == null) return "\u2014";
  if (ms < 1) return "<1ms";
  if (ms < 1e3) return Math.round(ms) + "ms";
  return (ms / 1e3).toFixed(2) + "s";
}
function fmtThroughput(bytes, ms) {
  if (!bytes || !ms) return "\u2014";
  const mbps = bytes / (1024 * 1024) / (ms / 1e3);
  if (mbps >= 100) return mbps.toFixed(0) + " MB/s";
  return mbps.toFixed(1) + " MB/s";
}
function fmtBytes(b) {
  if (b == null) return "\u2014";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(2) + " MB";
}
function hexLine(bytes) {
  if (!bytes || !bytes.length) return "";
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
    if (i < bytes.length - 1) s += " ";
  }
  return s;
}
const BUILD_SHA = true ? "db4d96c" : "dev";
const MARKETING_MODE = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("marketing") === "1";
const BUILD_TIME = true ? "2026-05-12T03:29:41Z" : "";
const BUILD_VERSION = true ? "v0.1.1" : "dev";
function useNarrow(threshold = 720) {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth < threshold);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < threshold);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [threshold]);
  return narrow;
}
function clampNum(n, min, max, fallback) {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
function tryUpload(blob, { ttl, maxDL }, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.setRequestHeader("content-type", "application/octet-stream");
    xhr.setRequestHeader("x-obscura-ttl", String(ttl));
    xhr.setRequestHeader("x-obscura-maxdl", String(maxDL));
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total * 100);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(null);
        }
      } else {
        console.warn("upload failed", xhr.status, xhr.responseText);
        resolve(null);
      }
    };
    xhr.onerror = () => {
      console.info("backend not reachable, falling back to file-only mode");
      resolve(null);
    };
    xhr.ontimeout = () => resolve(null);
    xhr.send(blob);
  });
}
function downloadBytes(name, bytes, type = "application/octet-stream") {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2e3);
}
function LayoutToggle({ layout, setLayout }) {
  const opts = [
    { v: "centered", label: "CENTER" },
    { v: "sidebar", label: "PRO" },
    { v: "terminal", label: "TERM" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", border: `1px solid ${theme.border}`, borderRadius: 3, overflow: "hidden" } }, opts.map((o) => {
    const on = layout === o.v;
    return /* @__PURE__ */ React.createElement("button", { key: o.v, onClick: () => setLayout(o.v), style: {
      padding: "4px 8px",
      background: on ? theme.accentSoft : "transparent",
      color: on ? theme.accent : theme.inkDim,
      border: "none",
      borderLeft: o.v === "sidebar" || o.v === "terminal" ? `1px solid ${theme.border}` : "none",
      fontFamily: "var(--mono)",
      fontSize: 10,
      letterSpacing: "0.14em",
      cursor: "pointer"
    } }, o.label);
  }));
}
function TopBar({ subtitle, layout, setLayout, narrow = false, marketing = false }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: narrow ? "10px 14px" : "14px 22px",
    borderBottom: `1px solid ${theme.border}`,
    background: theme.panelLo,
    fontFamily: "var(--mono)",
    gap: 8
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 22,
    height: 22,
    borderRadius: 4,
    flex: "0 0 22px",
    background: theme.accentSoft,
    border: `1px solid ${theme.accentLine}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  } }, /* @__PURE__ */ React.createElement(IcLock, { size: 12, color: theme.accent })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, letterSpacing: "0.32em", color: theme.ink } }, "OBSCURA"), !narrow && !marketing && /* @__PURE__ */ React.createElement(
    "a",
    {
      href: BUILD_SHA && BUILD_SHA !== "dev" ? `https://github.com/dgpugliese/Obsecura/commit/${BUILD_SHA}` : "#",
      target: "_blank",
      rel: "noopener",
      title: BUILD_TIME ? `built ${BUILD_TIME}` : "build identifier",
      style: {
        fontSize: 10,
        color: theme.inkFaint,
        letterSpacing: "0.18em",
        textDecoration: "none"
      }
    },
    BUILD_VERSION,
    " \xB7 build ",
    BUILD_SHA
  )), !narrow && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 18, background: theme.border, margin: "0 4px" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: theme.inkDim, whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("a", { href: "/transparency.html", style: { color: theme.inkDim, textDecoration: "none" } }, "transparency"), " \xB7 ", /* @__PURE__ */ React.createElement("a", { href: "/status.html", style: { color: theme.inkDim, textDecoration: "none" } }, "status"), " \xB7 ", /* @__PURE__ */ React.createElement("a", { href: "/privacy.html", style: { color: theme.inkDim, textDecoration: "none" } }, "privacy"), " \xB7 ", /* @__PURE__ */ React.createElement("a", { href: "/support.html", style: { color: theme.inkDim, textDecoration: "none" } }, "support")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: narrow ? 8 : 14, fontSize: 11, color: theme.inkDim } }, subtitle && !narrow && !marketing && /* @__PURE__ */ React.createElement("span", { style: { color: theme.inkFaint } }, subtitle), !narrow && !marketing && /* @__PURE__ */ React.createElement(Clock, { color: theme.ink }), !narrow && !marketing && /* @__PURE__ */ React.createElement(Tag, { secure: true }, /* @__PURE__ */ React.createElement(Dot, { color: theme.secure, pulse: true }), " secure"), /* @__PURE__ */ React.createElement(Tag, { accent: true }, "ZK \xB7 OK"), !narrow && /* @__PURE__ */ React.createElement(LayoutToggle, { layout, setLayout })));
}
function SpecStrip({ active = false, narrow = false, stats = null, ttl = 24, maxDL = 1 }) {
  const entropy = stats?.ctEntropy;
  const entropyWhole = entropy != null ? Math.floor(entropy) : null;
  const entropyFrac = entropy != null ? entropy.toFixed(3).split(".")[1] : null;
  const entropyPct = entropy != null ? Math.min(100, entropy / 8 * 100) : 0;
  return /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: narrow ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 14 } }, /* @__PURE__ */ React.createElement(Panel, { label: "cipher", right: "01" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 14px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: theme.ink, fontFamily: "var(--mono)" } }, "AES-256", /* @__PURE__ */ React.createElement("span", { style: { color: theme.accent } }, "/GCM")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 10, color: theme.inkDim, fontFamily: "var(--mono)", lineHeight: 1.7 } }, /* @__PURE__ */ React.createElement("div", null, "nonce \xB7\xB7\xB7 96 bit \xB7 per-message random"), /* @__PURE__ */ React.createElement("div", null, "tag \xB7\xB7\xB7\xB7\xB7 128 bit \xB7 authenticated"), /* @__PURE__ */ React.createElement("div", null, "kdf \xB7\xB7\xB7\xB7\xB7 argon2id \xB7 m=64MB t=3 (passphrase mode)")))), /* @__PURE__ */ React.createElement(Panel, { label: "server access", right: "02" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 14px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: theme.ink, fontFamily: "var(--mono)" } }, "ZERO\u2013", /* @__PURE__ */ React.createElement("span", { style: { color: theme.accent } }, "KNOWLEDGE")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 10, color: theme.inkDim, fontFamily: "var(--mono)", lineHeight: 1.7 } }, /* @__PURE__ */ React.createElement("div", null, "operator can read \xB7\xB7\xB7\xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "ciphertext only")), /* @__PURE__ */ React.createElement("div", null, "keys leave device \xB7\xB7\xB7\xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "never")), /* @__PURE__ */ React.createElement("div", null, "app access logs \xB7\xB7\xB7\xB7\xB7\xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "none"))))), /* @__PURE__ */ React.createElement(Panel, { label: "ttl", right: "03" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 14px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: theme.ink, fontFamily: "var(--mono)" } }, ttl, /* @__PURE__ */ React.createElement("span", { style: { color: theme.inkFaint } }, "h"), " / ", maxDL, /* @__PURE__ */ React.createElement("span", { style: { color: theme.inkFaint } }, "dl")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 10, color: theme.inkDim, fontFamily: "var(--mono)", lineHeight: 1.7 } }, /* @__PURE__ */ React.createElement("div", null, "self-destructs after read"), /* @__PURE__ */ React.createElement("div", null, "or ", /* @__PURE__ */ React.createElement(Countdown, { color: theme.ink }), " remaining"), /* @__PURE__ */ React.createElement("div", null, "purge \xB7\xB7\xB7 R2 delete + KV delete")))), /* @__PURE__ */ React.createElement(Panel, { label: "entropy", right: "04" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 14px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between" } }, entropy != null ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: theme.ink, fontFamily: "var(--mono)" } }, entropyWhole, ".", /* @__PURE__ */ React.createElement("span", { style: { color: theme.accent } }, entropyFrac)) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: theme.inkFaint, fontFamily: "var(--mono)" } }, "\u2014.", /* @__PURE__ */ React.createElement("span", null, "\u2014\u2014\u2014")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: theme.inkFaint, fontFamily: "var(--mono)" } }, "bits/byte")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, height: 6, background: theme.panelLo, border: `1px solid ${theme.border}`, borderRadius: 2, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: entropyPct + "%", height: "100%", background: theme.accent, transition: "width 0.4s ease-out" } })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontSize: 9, color: theme.inkFaint, fontFamily: "var(--mono)", letterSpacing: "0.06em" } }, entropy != null ? `shannon \xB7 ${stats.ctBytes >= 65536 ? "64KB sample" : "full ciphertext"}` : "awaiting payload"))));
}
function LeftRail({ screen, active = false, stats = null, events = [], passEnabled = false }) {
  const fpRows = stats?.keyFpHex ? fingerprintRows(stats.keyFpHex) : null;
  const recentEvents = events.slice(-7);
  const fmtT = (ms) => {
    const s = Math.floor(ms / 1e3);
    return `+${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${String(Math.floor(ms % 1e3)).padStart(3, "0").slice(0, 2)}`;
  };
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement(Panel, { label: "status", right: /* @__PURE__ */ React.createElement(Dot, { color: theme.secure, pulse: true }) }, /* @__PURE__ */ React.createElement("div", { style: { padding: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.85, color: theme.inkDim } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "cipher"), /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "AES-256-GCM")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "auth"), /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "GCM tag \xB7 128b")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "transport"), /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "TLS \xB7 browser")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "kdf"), /* @__PURE__ */ React.createElement("span", { style: { color: passEnabled ? theme.ink : theme.inkFaint } }, passEnabled ? "argon2id \xB7 m=64MB" : "off")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "screen"), /* @__PURE__ */ React.createElement("span", { style: { color: theme.accent } }, screen))))), /* @__PURE__ */ React.createElement(Panel, { label: "key fingerprint" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 12px 10px" } }, fpRows ? /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 11, color: theme.ink, letterSpacing: "0.06em", lineHeight: 1.7 } }, fpRows[0], /* @__PURE__ */ React.createElement("br", null), fpRows[1]) : /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 11, color: theme.inkFaint, lineHeight: 1.7 } }, "[ no key generated yet ]"), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 10, color: theme.inkFaint, fontFamily: "var(--mono)" } }, "sha256(data key) \xB7 first 48 bits \xB7 read OOB to verify"))), /* @__PURE__ */ React.createElement(Panel, { label: "recent ciphertext" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 12px 12px", fontFamily: "var(--mono)", fontSize: 10.5, lineHeight: 1.65 } }, stats?.ctHead ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { color: theme.inkFaint, fontSize: 9, letterSpacing: "0.08em" } }, "HEAD \xB7 ", stats.mode === "v2" ? "OBS2" : "OBS1", " \xB7 16 of ", stats.ctBytes.toLocaleString(), " B"), /* @__PURE__ */ React.createElement("div", { style: { color: theme.accent, marginTop: 4, wordBreak: "break-all" } }, hexLine(stats.ctHead)), /* @__PURE__ */ React.createElement("div", { style: { color: theme.inkFaint, fontSize: 9, letterSpacing: "0.08em", marginTop: 8 } }, "TAIL \xB7 last 16"), /* @__PURE__ */ React.createElement("div", { style: { color: theme.accent, marginTop: 4, wordBreak: "break-all" } }, hexLine(stats.ctTail))) : /* @__PURE__ */ React.createElement("div", { style: { color: theme.inkFaint } }, "[ no ciphertext yet ]", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, letterSpacing: "0.08em" } }, "OBS1 = magic(4) \xB7 iv(12) \xB7 ct+tag"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, letterSpacing: "0.08em" } }, "OBS2 = magic(4) \xB7 salt(16) \xB7 wrapIv(12) \xB7 wrappedDek(48) \xB7 iv(12) \xB7 ct+tag")))), /* @__PURE__ */ React.createElement(Panel, { label: "audit ledger" }, /* @__PURE__ */ React.createElement("div", { style: { padding: 12, fontFamily: "var(--mono)", fontSize: 10.5, color: theme.inkDim, lineHeight: 1.85 } }, recentEvents.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { color: theme.inkFaint } }, "[ no events yet ]") : recentEvents.map((e, i) => /* @__PURE__ */ React.createElement("div", { key: i }, /* @__PURE__ */ React.createElement("span", { style: { color: theme.inkFaint } }, fmtT(e.t)), " ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, e.name))))));
}
function ZKPipelineCompact({ active = false }) {
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: 86, padding: "8px 4px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" } }, [
    { label: "you", sub: "encrypt" },
    { label: "tls", sub: "transit" },
    { label: "vault", sub: "opaque" },
    { label: "them", sub: "decrypt" }
  ].map((n, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { textAlign: "center", flex: 1, position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 28,
    height: 28,
    margin: "0 auto",
    border: `1px solid ${i === 1 || i === 2 ? theme.border : theme.accentLine}`,
    background: i === 1 || i === 2 ? theme.panelLo : theme.accentSoft,
    borderRadius: 4,
    fontFamily: "var(--mono)",
    fontSize: 10,
    fontWeight: 700,
    color: i === 1 || i === 2 ? theme.inkDim : theme.accent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  } }, n.label.slice(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 9, color: theme.ink, marginTop: 4 } }, n.label), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 8, color: theme.inkFaint } }, n.sub)))), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 22,
    height: 1,
    background: `repeating-linear-gradient(90deg, ${theme.accent} 0 4px, transparent 4px 8px)`,
    animation: active ? "obs-march 1.4s linear infinite" : "none",
    opacity: 0.7
  } }));
}
function RightRail({ files, active = false, stats = null }) {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement(Panel, { label: "payload", right: `${files.length} file${files.length === 1 ? "" : "s"}` }, /* @__PURE__ */ React.createElement("div", { style: { padding: files.length ? 8 : 22 } }, files.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 11, color: theme.inkFaint, textAlign: "center", lineHeight: 1.7 } }, "[ no files queued ]", /* @__PURE__ */ React.createElement("br", null), "awaiting drop") : files.map((f, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    padding: "10px 8px",
    borderBottom: i < files.length - 1 ? `1px dashed ${theme.border}` : "none"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 12, color: theme.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, f.name), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint } }, f.size)), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, height: 3, background: theme.panelLo, borderRadius: 2, overflow: "hidden", border: `1px solid ${theme.border}` } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: `${f.pct}%`,
    height: "100%",
    background: f.state === "sealed" ? theme.secure : theme.accent,
    transition: "width 0.2s linear"
  } })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 4, display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 9, color: theme.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" } }, /* @__PURE__ */ React.createElement("span", { style: { color: f.state === "sealed" ? theme.secure : f.state === "encrypting" ? theme.accent : theme.inkFaint } }, f.state === "sealed" ? "\u25CF sealed" : f.state === "encrypting" ? "\u25CF encrypting" : "\u25CB queued"), /* @__PURE__ */ React.createElement("span", null, Math.round(f.pct), "%")))))), /* @__PURE__ */ React.createElement(Panel, { label: "vitals" }, /* @__PURE__ */ React.createElement("div", { style: { padding: 12, fontFamily: "var(--mono)", fontSize: 10.5, lineHeight: 1.85, color: theme.inkDim } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "crypto"), /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "webcrypto \xB7 subtle")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "plaintext"), /* @__PURE__ */ React.createElement("span", { style: { color: stats ? theme.ink : theme.inkFaint } }, stats ? fmtBytes(stats.ptBytes) : "\u2014")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "ciphertext"), /* @__PURE__ */ React.createElement("span", { style: { color: stats ? theme.ink : theme.inkFaint } }, stats ? `${fmtBytes(stats.ctBytes)} (+${stats.ctBytes - stats.ptBytes}B)` : "\u2014")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "encrypt"), /* @__PURE__ */ React.createElement("span", { style: { color: stats ? theme.ink : theme.inkFaint } }, stats ? fmtMs(stats.encryptMs) : "\u2014")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "throughput"), /* @__PURE__ */ React.createElement("span", { style: { color: stats ? theme.accent : theme.inkFaint } }, stats ? fmtThroughput(stats.ptBytes, stats.encryptMs) : "\u2014")), stats?.kdfMs ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "argon2id"), /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, fmtMs(stats.kdfMs))) : null)), /* @__PURE__ */ React.createElement(Panel, { label: "zk transit", right: active ? "live" : "idle" }, /* @__PURE__ */ React.createElement("div", { style: { padding: 8 } }, /* @__PURE__ */ React.createElement(ZKPipelineCompact, { active }))));
}
function PayloadInline({ files }) {
  if (!files.length) return null;
  return /* @__PURE__ */ React.createElement(Panel, { label: "payload", right: `${files.length} file${files.length === 1 ? "" : "s"}` }, /* @__PURE__ */ React.createElement("div", { style: { padding: 8 } }, files.map((f, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    padding: "10px 8px",
    borderBottom: i < files.length - 1 ? `1px dashed ${theme.border}` : "none"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 12, color: theme.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, f.name), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint } }, f.size)), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, height: 3, background: theme.panelLo, borderRadius: 2, overflow: "hidden", border: `1px solid ${theme.border}` } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: `${f.pct}%`,
    height: "100%",
    background: f.state === "sealed" ? theme.secure : theme.accent,
    transition: "width 0.2s linear"
  } })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 4, display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 9, color: theme.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" } }, /* @__PURE__ */ React.createElement("span", { style: { color: f.state === "sealed" ? theme.secure : f.state === "encrypting" ? theme.accent : theme.inkFaint } }, f.state === "sealed" ? "\u25CF sealed" : f.state === "encrypting" ? "\u25CF encrypting" : "\u25CB queued"), /* @__PURE__ */ React.createElement("span", null, Math.round(f.pct), "%"))))));
}
function HeroEmpty({ onBrowse, onSettings, onCompose, ttl, maxDL }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "relative",
    height: 360,
    borderRadius: 6,
    border: `1px dashed ${theme.borderHi}`,
    background: `radial-gradient(circle at 50% 50%, ${theme.panelHi}, ${theme.panelLo} 70%)`,
    overflow: "hidden",
    cursor: "pointer"
  }, onClick: onBrowse }, [
    { top: 10, left: 10, rot: 0 },
    { top: 10, right: 10, rot: 90 },
    { bottom: 10, right: 10, rot: 180 },
    { bottom: 10, left: 10, rot: 270 }
  ].map((c, i) => /* @__PURE__ */ React.createElement("svg", { key: i, width: "22", height: "22", style: { position: "absolute", ...c, transform: `rotate(${c.rot}deg)` } }, /* @__PURE__ */ React.createElement("path", { d: "M2 22 L2 2 L22 2", fill: "none", stroke: theme.accent, strokeWidth: "1.5" }))), /* @__PURE__ */ React.createElement("svg", { width: "100%", height: "100%", style: { position: "absolute", inset: 0, opacity: 0.18 } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: "grid-empty", width: "24", height: "24", patternUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("path", { d: "M 24 0 L 0 0 0 24", fill: "none", stroke: theme.inkFaint, strokeWidth: "0.5" }))), /* @__PURE__ */ React.createElement("rect", { width: "100%", height: "100%", fill: "url(#grid-empty)" })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 76,
    height: 76,
    borderRadius: 8,
    border: `1px solid ${theme.accentLine}`,
    background: theme.accentSoft,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  } }, /* @__PURE__ */ React.createElement(IcPlus, { size: 36, color: theme.accent, weight: 1.6 })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18, fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, color: theme.ink } }, "drop_files ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.accent } }, "--encrypt")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontFamily: "var(--mono)", fontSize: 12, color: theme.inkDim } }, "max 50MB \xB7 or click to browse \xB7 pasted text accepted"), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Tag, null, "\u2318 + V paste"), /* @__PURE__ */ React.createElement(Tag, null, "\u2318 + O browse"), /* @__PURE__ */ React.createElement(Tag, null, "folder ok")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    e.stopPropagation();
    onCompose?.();
  }, style: {
    padding: "6px 12px",
    border: `1px solid ${theme.border}`,
    background: theme.panelLo,
    color: theme.inkDim,
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer"
  } }, "compose text"), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    e.stopPropagation();
    onSettings?.();
  }, style: {
    padding: "6px 12px",
    border: `1px solid ${theme.border}`,
    background: theme.panelLo,
    color: theme.inkDim,
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer"
  } }, "ttl ", ttl, "h \xB7 ", maxDL, "x \xB7 configure"))), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 16, bottom: 12, fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint } }, "idle \xB7 awaiting input"), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", right: 16, bottom: 12, fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint } }, /* @__PURE__ */ React.createElement(ScrambleText, { value: "0x00000000", speed: 200, color: theme.inkFaint })));
}
function HeroDragOver({ files }) {
  const totalMB = files.reduce((a, f) => a + f.bytes, 0) / 1e6;
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "relative",
    height: 360,
    borderRadius: 6,
    border: `2px solid ${theme.accent}`,
    background: theme.accentSoft,
    overflow: "hidden",
    boxShadow: `0 0 0 6px ${theme.accentSoft}, 0 0 60px ${theme.accentSoft} inset`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    background: `repeating-linear-gradient(45deg, transparent 0 14px, ${theme.accentSoft} 14px 16px)`,
    animation: "obs-march 1.2s linear infinite"
  } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 96,
    height: 96,
    borderRadius: 8,
    border: `2px solid ${theme.accent}`,
    background: theme.panel,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  } }, /* @__PURE__ */ React.createElement(IcPlus, { size: 44, color: theme.accent, weight: 2 })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18, fontFamily: "var(--mono)", fontSize: 30, fontWeight: 700, color: theme.ink } }, "release_to_encrypt()"), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontFamily: "var(--mono)", fontSize: 12, color: theme.ink } }, files.length || 3, " files detected \xB7 ", totalMB ? totalMB.toFixed(1) : "41.6", " MB \xB7 within limits")));
}
function HeroEncrypting({ files, stage, uploadPct }) {
  const active = files.find((f) => f.state === "encrypting") || files[0];
  const stageLabel = stage === "packing" ? "packing payload" : stage === "encrypting" ? "encrypting \xB7 AES-256-GCM" : stage === "uploading" ? `uploading \xB7 ${Math.round(uploadPct)}%` : "preparing";
  const realPct = stage === "packing" ? 8 : stage === "encrypting" ? 35 : stage === "uploading" ? 50 + uploadPct / 2 : 0;
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "relative",
    height: 360,
    borderRadius: 6,
    border: `1px solid ${theme.borderHi}`,
    background: theme.panel,
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1px 1fr", height: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Tag, { accent: true }, "\u25CF ", stageLabel), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color: theme.ink } }, active?.name || "payload"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 11, color: theme.inkDim, marginTop: 4 } }, active?.size, " \xB7 ", files.length > 1 ? `${files.length} files` : "1 file", " \xB7 authenticated")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 11, color: theme.inkDim, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", null, stage === "uploading" ? "vault.transit" : "cipher.stream"), /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, realPct.toFixed(1), "%")), /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: theme.panelLo, border: `1px solid ${theme.border}`, position: "relative", borderRadius: 2, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: `${realPct}%`,
    background: theme.accent,
    boxShadow: `0 0 12px ${theme.accent}`,
    transition: "width 0.2s linear"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    background: `repeating-linear-gradient(90deg, transparent 0 7px, ${theme.panelLo}55 7px 8px)`
  } })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontFamily: "var(--mono)", fontSize: 10, color: theme.inkDim } }, /* @__PURE__ */ React.createElement("div", null, "stage", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink, fontSize: 13 } }, stage || "\u2014")), /* @__PURE__ */ React.createElement("div", null, "files", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink, fontSize: 13 } }, files.length)), /* @__PURE__ */ React.createElement("div", null, stage === "uploading" ? "uploaded" : "progress", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink, fontSize: 13 } }, Math.round(realPct), "%"))))), /* @__PURE__ */ React.createElement("div", { style: { background: theme.border } }), /* @__PURE__ */ React.createElement("div", { style: { padding: 18, position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint, marginBottom: 8, letterSpacing: "0.18em", textTransform: "uppercase" } }, "ciphertext \xB7 live"), /* @__PURE__ */ React.createElement(HexDump, { rows: 11, cols: 14, color: theme.accent, dim: theme.inkFaint, speed: 70 }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    background: `linear-gradient(to bottom, transparent, ${theme.panel})`,
    pointerEvents: "none"
  } }))));
}
function HeroDone({ files, onReset, link, onDownload, mode, passphrase, onBurn, canBurn }) {
  const totalMB = files.reduce((a, f) => a + f.bytes, 0) / 1e6;
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const displayLink = link ? link.replace(/^https?:\/\//, "") : "obs.cr/d/local";
  const remote = mode === "remote";
  const copy = () => {
    if (!link) return;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const qrSvg = useMemo(() => {
    if (!showQR || !link || typeof qrcode === "undefined") return null;
    try {
      const qr = qrcode(0, "M");
      qr.addData(link);
      qr.make();
      return qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
    } catch (e) {
      console.error("qr generate failed", e);
      return null;
    }
  }, [showQR, link]);
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "relative",
    height: 360,
    borderRadius: 6,
    border: `1px solid ${theme.accentLine}`,
    background: `radial-gradient(circle at 30% 0%, ${theme.accentSoft}, ${theme.panel} 60%)`,
    overflow: "hidden",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(Tag, { secure: true }, /* @__PURE__ */ React.createElement(IcCheck, { size: 11, color: theme.secure }), " sealed"), /* @__PURE__ */ React.createElement(Tag, null, files.length, " files \xB7 ", totalMB.toFixed(1), " MB"), /* @__PURE__ */ React.createElement(Tag, null, "argon2id \xB7 m=64MB")), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 11, color: theme.inkDim } }, "expires in ", /* @__PURE__ */ React.createElement(Countdown, { color: theme.ink }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint, letterSpacing: "0.2em", textTransform: "uppercase" } }, "recipient link"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    padding: "16px 18px",
    border: `1px solid ${theme.borderHi}`,
    borderRadius: 4,
    background: theme.panelLo,
    fontFamily: "var(--mono)",
    fontSize: 16,
    color: theme.ink,
    letterSpacing: "0.02em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  } }, /* @__PURE__ */ React.createElement("span", { style: { color: theme.inkFaint } }, "https://"), /* @__PURE__ */ React.createElement(ScrambleText, { value: displayLink, speed: 110, color: theme.ink })), /* @__PURE__ */ React.createElement("button", { onClick: copy, style: {
    padding: "16px 18px",
    border: `1px solid ${theme.accentLine}`,
    background: theme.accentSoft,
    color: theme.accent,
    fontFamily: "var(--mono)",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 4,
    cursor: "pointer"
  } }, /* @__PURE__ */ React.createElement(IcCopy, { size: 14, color: theme.accent }), " ", copied ? "copied" : "copy"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowQR((v) => !v), style: {
    padding: "16px 18px",
    border: `1px solid ${showQR ? theme.accentLine : theme.border}`,
    background: showQR ? theme.accentSoft : theme.panelHi,
    color: showQR ? theme.accent : theme.ink,
    fontFamily: "var(--mono)",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 4,
    cursor: "pointer"
  } }, "QR"), /* @__PURE__ */ React.createElement("button", { onClick: onDownload, style: {
    padding: "16px 18px",
    border: `1px solid ${theme.border}`,
    background: theme.panelHi,
    color: theme.ink,
    fontFamily: "var(--mono)",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 4,
    cursor: "pointer"
  } }, "SAVE"), canBurn && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onBurn,
      title: "Burn this share now",
      style: {
        padding: "16px 18px",
        border: `1px solid ${theme.danger}`,
        background: "transparent",
        color: theme.danger,
        fontFamily: "var(--mono)",
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        borderRadius: 4,
        cursor: "pointer"
      }
    },
    "BURN"
  ), /* @__PURE__ */ React.createElement("button", { onClick: onReset, style: {
    padding: "16px 18px",
    border: `1px solid ${theme.border}`,
    background: theme.panelHi,
    color: theme.ink,
    fontFamily: "var(--mono)",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 4,
    cursor: "pointer"
  } }, "NEW")), showQR && qrSvg && /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 12,
    padding: 14,
    border: `1px solid ${theme.border}`,
    background: theme.panelLo,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    gap: 14
  } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        width: 144,
        height: 144,
        background: "#fff",
        padding: 6,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 144px"
      },
      dangerouslySetInnerHTML: { __html: qrSvg.replace(/<svg/, '<svg style="width:100%;height:100%;display:block"') }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint, letterSpacing: "0.18em", textTransform: "uppercase" } }, "scan to receive"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 11, color: theme.inkDim, marginTop: 6, lineHeight: 1.6 } }, "point the recipient's phone camera at this code.", /* @__PURE__ */ React.createElement("br", null), "fragment (", passphrase ? "id only \xB7 passphrase separately" : "key included", ") is encoded."))), passphrase && /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 10,
    padding: "10px 12px",
    border: `1px solid ${theme.warn}`,
    borderRadius: 4,
    background: theme.panelLo,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.warn, letterSpacing: "0.18em", textTransform: "uppercase" } }, "passphrase \xB7 share separately"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 16, color: theme.ink, marginTop: 4, letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis" } }, passphrase)), /* @__PURE__ */ React.createElement("button", { onClick: () => navigator.clipboard?.writeText(passphrase), style: {
    padding: "8px 12px",
    border: `1px solid ${theme.border}`,
    background: theme.panelHi,
    color: theme.ink,
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer"
  } }, "COPY")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, display: "flex", gap: 12, fontFamily: "var(--mono)", fontSize: 10.5, color: theme.inkDim, flexWrap: "wrap" } }, remote && passphrase && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, "ciphertext on vault \xB7 key wrapped under ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "argon2id")), /* @__PURE__ */ React.createElement("span", null, "\xB7 recipient enters passphrase to unlock")), remote && !passphrase && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, "ciphertext on vault \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "recipient just opens link")), /* @__PURE__ */ React.createElement("span", null, "\xB7 key never left this browser")), !remote && passphrase && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, "ciphertext saved to ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "payload.obscura")), /* @__PURE__ */ React.createElement("span", null, "\xB7 deliver file + link + passphrase separately")), !remote && !passphrase && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, "ciphertext saved to ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.ink } }, "payload.obscura")), /* @__PURE__ */ React.createElement("span", null, "\xB7 deliver file + link separately (no backend)"), /* @__PURE__ */ React.createElement("span", null, "\xB7 key never left this browser")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
    marginBottom: 10,
    padding: "8px 12px",
    border: `1px dashed ${theme.border}`,
    borderRadius: 3,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    fontFamily: "var(--mono)",
    fontSize: 10.5,
    color: theme.inkDim
  } }, /* @__PURE__ */ React.createElement("span", null, "obscura is free & open source \xB7 tips keep the lights on"), /* @__PURE__ */ React.createElement("a", { href: "/support.html", style: {
    color: theme.accent,
    textDecoration: "none",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase"
  } }, "support \u2192")), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 } }, "zero-knowledge transit"), /* @__PURE__ */ React.createElement(ZKPipeline, { width: 1080, height: 70, intensity: 1.4 })));
}
function HeroCompose({ onSend, onClose }) {
  const [text, setText] = useState("");
  const [name, setName] = useState("note.txt");
  const submit = () => {
    if (!text) return;
    const file = new File([new Blob([text], { type: "text/plain" })], name || "note.txt", { type: "text/plain" });
    onSend([file]);
  };
  return /* @__PURE__ */ React.createElement("div", { style: {
    minHeight: 360,
    borderRadius: 6,
    border: `1px solid ${theme.borderHi}`,
    background: theme.panel,
    padding: 22,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 14
  } }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: "6px 12px",
    border: `1px solid ${theme.border}`,
    background: theme.panelHi,
    color: theme.inkDim,
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer"
  } }, "\u2190 back"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint, letterSpacing: "0.2em", textTransform: "uppercase" } }, "compose \xB7 plaintext stays in your browser"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: name,
      onChange: (e) => setName(e.target.value),
      placeholder: "filename.txt",
      style: {
        padding: "10px 12px",
        border: `1px solid ${theme.borderHi}`,
        background: theme.panelLo,
        color: theme.ink,
        fontFamily: "var(--mono)",
        fontSize: 13,
        borderRadius: 3,
        outline: "none"
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      autoFocus: true,
      value: text,
      onChange: (e) => setText(e.target.value),
      placeholder: "paste or type the secret you want to send\u2026",
      style: {
        flex: 1,
        minHeight: 200,
        padding: "12px 14px",
        border: `1px solid ${theme.borderHi}`,
        background: theme.panelLo,
        color: theme.ink,
        fontFamily: "var(--mono)",
        fontSize: 13,
        borderRadius: 3,
        outline: "none",
        resize: "vertical",
        letterSpacing: "0.02em"
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint } }, text.length, " char", text.length === 1 ? "" : "s", " \xB7 ", fmtSize(new Blob([text]).size)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: submit,
      disabled: !text,
      style: {
        padding: "12px 22px",
        border: `1px solid ${text ? theme.accentLine : theme.border}`,
        background: text ? theme.accentSoft : "transparent",
        color: text ? theme.accent : theme.inkFaint,
        fontFamily: "var(--mono)",
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        borderRadius: 4,
        cursor: text ? "pointer" : "not-allowed"
      }
    },
    "ENCRYPT \u2192"
  )));
}
function HeroSettings({ ttl, setTtl, maxDL, setMaxDL, passEnabled, setPassEnabled, passphrase, setPassphrase, onClose, narrow = false }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    minHeight: 360,
    borderRadius: 6,
    border: `1px solid ${theme.borderHi}`,
    background: theme.panel,
    padding: narrow ? 16 : 22,
    display: "flex",
    flexDirection: "column",
    gap: narrow ? 14 : 18
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint, letterSpacing: "0.2em", textTransform: "uppercase" } }, "dispatch parameters"), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: {
    padding: "6px 12px",
    border: `1px solid ${theme.border}`,
    background: theme.panelHi,
    color: theme.inkDim,
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer"
  } }, "\u2190 back")), /* @__PURE__ */ React.createElement("div", { style: {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr 1fr",
    gap: narrow ? 14 : 22
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    padding: 14,
    border: `1px solid ${theme.border}`,
    borderRadius: 4,
    background: theme.panelHi
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 9, color: theme.inkFaint, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", null, "ttl"), /* @__PURE__ */ React.createElement("span", null, "01")), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, color: theme.ink } }, ttl, /* @__PURE__ */ React.createElement("span", { style: { color: theme.inkFaint } }, "h")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 12 } }, [1, 2, 4, 8, 12, 24].map((n) => /* @__PURE__ */ React.createElement("button", { key: n, onClick: () => setTtl(n), style: {
    padding: "8px 0",
    border: `1px solid ${ttl === n ? theme.accentLine : theme.border}`,
    background: ttl === n ? theme.accentSoft : "transparent",
    color: ttl === n ? theme.accent : theme.inkDim,
    fontFamily: "var(--mono)",
    fontSize: 11,
    borderRadius: 3,
    cursor: "pointer"
  } }, n, "h"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontFamily: "var(--mono)", fontSize: 10, color: theme.inkDim, lineHeight: 1.7 } }, "after which all ciphertext", /* @__PURE__ */ React.createElement("br", null), "is unrecoverable.")), /* @__PURE__ */ React.createElement("div", { style: {
    padding: 14,
    border: `1px solid ${theme.border}`,
    borderRadius: 4,
    background: theme.panelHi
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 9, color: theme.inkFaint, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", null, "downloads"), /* @__PURE__ */ React.createElement("span", null, "02")), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, color: theme.ink } }, maxDL, /* @__PURE__ */ React.createElement("span", { style: { color: theme.inkFaint } }, "x")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 12 } }, [1, 3, 5, 10].map((n) => /* @__PURE__ */ React.createElement("button", { key: n, onClick: () => setMaxDL(n), style: {
    flex: 1,
    padding: "8px 0",
    border: `1px solid ${maxDL === n ? theme.accentLine : theme.border}`,
    background: maxDL === n ? theme.accentSoft : "transparent",
    color: maxDL === n ? theme.accent : theme.inkDim,
    fontFamily: "var(--mono)",
    fontSize: 11,
    borderRadius: 3,
    cursor: "pointer"
  } }, n, "x"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, fontFamily: "var(--mono)", fontSize: 10, color: theme.inkDim, lineHeight: 1.7 } }, "link self-destructs after", /* @__PURE__ */ React.createElement("br", null), "final read.")), /* @__PURE__ */ React.createElement("div", { style: {
    padding: 14,
    border: `1px solid ${passEnabled ? theme.accentLine : theme.border}`,
    borderRadius: 4,
    background: passEnabled ? theme.accentSoft : theme.panelHi
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 9, color: theme.inkFaint, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", null, "passphrase"), /* @__PURE__ */ React.createElement("span", null, "03")), /* @__PURE__ */ React.createElement("button", { onClick: () => setPassEnabled(!passEnabled), style: {
    width: "100%",
    padding: "8px 0",
    border: `1px solid ${passEnabled ? theme.accentLine : theme.border}`,
    background: passEnabled ? theme.accentSoft : "transparent",
    color: passEnabled ? theme.accent : theme.inkDim,
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer",
    marginBottom: 10
  } }, passEnabled ? "\u25CF ENABLED" : "\u25CB DISABLED"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: passphrase,
      onChange: (e) => setPassphrase(e.target.value),
      disabled: !passEnabled,
      style: {
        width: "100%",
        padding: "8px 10px",
        border: `1px solid ${theme.borderHi}`,
        background: theme.panelLo,
        color: theme.ink,
        fontFamily: "var(--mono)",
        fontSize: 12,
        borderRadius: 3,
        outline: "none",
        boxSizing: "border-box",
        opacity: passEnabled ? 1 : 0.4
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setPassphrase(generatePassphrase()),
      disabled: !passEnabled,
      style: {
        width: "100%",
        marginTop: 8,
        padding: "6px 0",
        border: `1px solid ${theme.border}`,
        background: "transparent",
        color: theme.inkDim,
        fontFamily: "var(--mono)",
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        borderRadius: 3,
        cursor: passEnabled ? "pointer" : "not-allowed",
        opacity: passEnabled ? 1 : 0.4
      }
    },
    "\u21BB regenerate"
  ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontFamily: "var(--mono)", fontSize: 10, color: theme.inkDim, lineHeight: 1.7 } }, "argon2id wraps the key.", /* @__PURE__ */ React.createElement("br", null), "recipient enters this", /* @__PURE__ */ React.createElement("br", null), "(share separately)."))));
}
function CommandStrip({ screen, marketing = false }) {
  const cmd = {
    empty: "$ obscura --watch ./drop --cipher aes-256-gcm",
    drag: "$ obscura.queue.add(files) [staged]",
    encrypting: "$ obscura.encrypt(stream) --aes-256-gcm",
    done: "$ obscura.publish() >> #i=<id>&k=<key>",
    settings: "$ obscura --configure ttl downloads"
  }[screen];
  return /* @__PURE__ */ React.createElement("div", { style: {
    borderTop: `1px solid ${theme.border}`,
    padding: "8px 12px",
    fontFamily: "var(--mono)",
    fontSize: 11,
    color: theme.inkDim,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: theme.panelLo,
    borderRadius: 4,
    border: `1px solid ${theme.border}`
  } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { style: { color: theme.accent } }, "\u203A"), " ", cmd), /* @__PURE__ */ React.createElement("span", { style: { color: theme.inkFaint } }, screen.toUpperCase(), marketing ? "" : " \xB7 0x" + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, "0")));
}
function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1e6) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1e9) return (bytes / 1e6).toFixed(1) + " MB";
  return (bytes / 1e9).toFixed(2) + " GB";
}
function App() {
  const [screen, setScreen] = useState("empty");
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [stage, setStage] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const downloadedRef = useRef(false);
  const [layout, setLayoutState] = useState(() => {
    return localStorage.getItem("obscura.layout") || "centered";
  });
  const setLayout = (v) => {
    setLayoutState(v);
    localStorage.setItem("obscura.layout", v);
  };
  const [ttl, setTtl] = useState(() => {
    const allowed = [1, 2, 4, 8, 12, 24];
    const raw = parseInt(localStorage.getItem("obscura.ttl"), 10);
    return allowed.includes(raw) ? raw : 24;
  });
  const [maxDL, setMaxDL] = useState(() => clampNum(parseInt(localStorage.getItem("obscura.maxdl"), 10), 1, 100, 3));
  const [passEnabled, setPassEnabled] = useState(() => localStorage.getItem("obscura.passEnabled") === "1");
  const [passphrase, setPassphrase] = useState(() => generatePassphrase());
  const [cryptoStats, setCryptoStats] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  useEffect(() => {
    localStorage.setItem("obscura.ttl", String(ttl));
  }, [ttl]);
  useEffect(() => {
    localStorage.setItem("obscura.maxdl", String(maxDL));
  }, [maxDL]);
  useEffect(() => {
    localStorage.setItem("obscura.passEnabled", passEnabled ? "1" : "0");
  }, [passEnabled]);
  const narrow = useNarrow();
  const dragDepth = useRef(0);
  const fileInputRef = useRef(null);
  const subs = {
    empty: "ready \xB7 awaiting payload",
    drag: "intent detected \xB7 files staged",
    encrypting: "stream cipher engaged",
    done: "sealed \xB7 link issued \xB7 awaiting recipient",
    settings: "configure dispatch parameters",
    compose: "compose \xB7 plaintext stays in browser"
  };
  const acceptFiles = useCallback(async (fileList) => {
    const fileArr = Array.from(fileList).slice(0, 10);
    if (!fileArr.length) return;
    const meta = fileArr.map((f) => ({
      name: f.name,
      bytes: f.size,
      size: fmtSize(f.size),
      state: "queued",
      pct: 0
    }));
    setFiles(meta);
    setResult(null);
    downloadedRef.current = false;
    setUploadPct(0);
    setScreen("encrypting");
    const events = [];
    const t0Wall = performance.now();
    const evt = (name) => {
      events.push({ t: performance.now() - t0Wall, name });
      setAuditEvents([...events]);
    };
    const setStageWithFiles = (s, pct, state) => {
      setStage(s);
      setFiles((prev) => prev.map((f) => ({ ...f, state, pct })));
    };
    try {
      evt("session.init");
      setStageWithFiles("packing", 8, "queued");
      const plain = await packFiles(fileArr);
      evt(`files.packed (${plain.byteLength}B)`);
      setStageWithFiles("encrypting", 35, "encrypting");
      const base = `${location.origin}${location.pathname}`;
      let blob, keyEnc = null, passUsed = null;
      let encMeta = null;
      if (passEnabled) {
        if (typeof argon2 === "undefined" || !argon2.hash) {
          alert("argon2 wasm hasn't loaded yet \u2014 disabling passphrase for this send.");
          setPassEnabled(false);
          throw new Error("argon2 unavailable");
        }
        const trimmed = passphrase.trim();
        if (!trimmed) {
          alert("Passphrase is empty. Open Settings to generate or enter one.");
          throw new Error("empty passphrase");
        }
        passUsed = trimmed;
        encMeta = await encryptBlobV2(plain, passUsed);
        blob = encMeta.blob;
        evt(`argon2id.derive (${fmtMs(encMeta.kdfMs)})`);
      } else {
        evt("key.generated");
        const key = await generateKey();
        encMeta = await encryptBlob(plain, key);
        blob = encMeta.blob;
        keyEnc = b64uEncode(await exportRawKey(key));
      }
      evt(`aes-gcm.encrypt (${fmtMs(encMeta.encryptMs)})`);
      const keyFpHex = await sha256Hex(encMeta.dataKey);
      const ctEntropy = shannonEntropy(blob);
      const ctHead = blob.subarray(0, Math.min(16, blob.length));
      const ctTail = blob.subarray(Math.max(0, blob.length - 16));
      setCryptoStats({
        keyFpHex,
        ptBytes: plain.byteLength,
        ctBytes: blob.byteLength,
        encryptMs: encMeta.encryptMs,
        kdfMs: encMeta.kdfMs || 0,
        ctEntropy,
        ctHead,
        ctTail,
        mode: passEnabled ? "v2" : "v1"
      });
      setStageWithFiles("uploading", 50, "encrypting");
      const upload = await tryUpload(blob, { ttl, maxDL }, (pct) => {
        setUploadPct(pct);
        setFiles((prev) => prev.map((f) => ({ ...f, state: "encrypting", pct: 50 + pct / 2 })));
      });
      if (upload?.id) {
        evt(`share.created (id=${upload.id.slice(0, 8)}\u2026)`);
        const link = passEnabled ? `${base}#i=${upload.id}` : `${base}#i=${upload.id}&k=${keyEnc}`;
        setResult({ blob, link, id: upload.id, mode: "remote", expiresAt: upload.expiresAt, passphrase: passUsed });
      } else if (passEnabled) {
        const link = `${base}#p=1`;
        setResult({ blob, link, mode: "local", passphrase: passUsed });
      } else {
        const link = `${base}#k=${keyEnc}`;
        setResult({ blob, link, mode: "local" });
      }
      if (passEnabled) setPassphrase(generatePassphrase());
      setStage(null);
      setFiles((prev) => prev.map((f) => ({ ...f, state: "sealed", pct: 100 })));
      setScreen("done");
    } catch (err) {
      console.error("encrypt failed", err);
      alert("Encryption failed: " + err.message);
      setStage(null);
      setScreen("empty");
      setFiles([]);
    }
  }, [ttl, maxDL, passEnabled, passphrase]);
  useEffect(() => {
    const onEnter = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files")) {
        e.preventDefault();
        dragDepth.current += 1;
        setScreen((s) => s === "empty" ? "drag" : s);
      }
    };
    const onOver = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files")) {
        e.preventDefault();
      }
    };
    const onLeave = (e) => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setScreen((s) => s === "drag" ? "empty" : s);
      }
    };
    const onDrop = (e) => {
      e.preventDefault();
      dragDepth.current = 0;
      const dropped = e.dataTransfer?.files;
      if (dropped && dropped.length) acceptFiles(dropped);
      else setScreen("empty");
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [acceptFiles]);
  useEffect(() => {
    if (screen === "done" && result?.blob && result.mode === "local" && !downloadedRef.current) {
      downloadedRef.current = true;
      downloadBytes("payload.obscura", result.blob);
    }
  }, [screen, result]);
  const reset = () => {
    setFiles([]);
    setResult(null);
    downloadedRef.current = false;
    setCryptoStats(null);
    setAuditEvents([]);
    setScreen("empty");
  };
  const browse = () => fileInputRef.current?.click();
  const saveAgain = () => {
    if (result?.blob) downloadBytes("payload.obscura", result.blob);
  };
  const burnNow = useCallback(async () => {
    if (!result?.id) return;
    if (!confirm("Burn this share now? The recipient link will return 410.")) return;
    try {
      await fetch(`/api/d/${result.id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("delete failed (may already be gone)", err);
    }
    reset();
  }, [result]);
  useEffect(() => {
    const onPaste = (e) => {
      if (screen !== "empty") return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const text = e.clipboardData?.getData("text/plain");
      if (!text || !text.trim()) return;
      e.preventDefault();
      const file = new File([new Blob([text], { type: "text/plain" })], "note.txt", { type: "text/plain" });
      acceptFiles([file]);
    };
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "o" && screen === "empty") {
        e.preventDefault();
        browse();
      }
    };
    window.addEventListener("paste", onPaste);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKey);
    };
  }, [screen, acceptFiles]);
  let hero;
  const active = screen === "encrypting" || screen === "done";
  const effectiveLayout = narrow ? "centered" : layout;
  if (screen === "empty") hero = /* @__PURE__ */ React.createElement(HeroEmpty, { onBrowse: browse, onSettings: () => setScreen("settings"), onCompose: () => setScreen("compose"), ttl, maxDL });
  else if (screen === "compose") hero = /* @__PURE__ */ React.createElement(HeroCompose, { onSend: (files2) => acceptFiles(files2), onClose: () => setScreen("empty") });
  else if (screen === "drag") hero = /* @__PURE__ */ React.createElement(HeroDragOver, { files });
  else if (screen === "encrypting") hero = /* @__PURE__ */ React.createElement(HeroEncrypting, { files, stage, uploadPct });
  else if (screen === "done") hero = /* @__PURE__ */ React.createElement(HeroDone, { files, onReset: reset, link: result?.link, onDownload: saveAgain, mode: result?.mode, passphrase: result?.passphrase, onBurn: burnNow, canBurn: result?.mode === "remote" && !!result?.id });
  else if (screen === "settings") hero = /* @__PURE__ */ React.createElement(
    HeroSettings,
    {
      ttl,
      setTtl,
      maxDL,
      setMaxDL,
      passEnabled,
      setPassEnabled,
      passphrase,
      setPassphrase,
      narrow,
      onClose: () => setScreen("empty")
    }
  );
  return /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    minHeight: "100vh",
    background: theme.bg,
    color: theme.ink,
    fontFamily: "var(--mono)",
    position: "relative"
  } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: fileInputRef,
      type: "file",
      multiple: true,
      style: { display: "none" },
      onChange: (e) => e.target.files && acceptFiles(e.target.files)
    }
  ), /* @__PURE__ */ React.createElement("svg", { width: "100%", height: "100%", style: { position: "fixed", inset: 0, opacity: 0.5, pointerEvents: "none" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: "bggrid", width: "48", height: "48", patternUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("path", { d: "M 48 0 L 0 0 0 48", fill: "none", stroke: theme.bgGrid, strokeWidth: "1" }))), /* @__PURE__ */ React.createElement("rect", { width: "100%", height: "100%", fill: "url(#bggrid)" })), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", display: "flex", flexDirection: "column", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement(TopBar, { subtitle: subs[screen], layout, setLayout, narrow, marketing: MARKETING_MODE }), effectiveLayout === "sidebar" && /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    padding: 22,
    display: "grid",
    gridTemplateColumns: "260px 1fr 280px",
    gap: 18,
    minHeight: 0
  } }, /* @__PURE__ */ React.createElement(LeftRail, { screen, active, stats: cryptoStats, events: auditEvents, passEnabled }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14, minWidth: 0 } }, hero, /* @__PURE__ */ React.createElement(SpecStrip, { active, stats: cryptoStats, ttl, maxDL }), /* @__PURE__ */ React.createElement(CommandStrip, { screen, marketing: MARKETING_MODE })), /* @__PURE__ */ React.createElement(RightRail, { files, active, stats: cryptoStats })), effectiveLayout === "centered" && /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    padding: narrow ? "20px 14px" : "40px 22px",
    display: "flex",
    justifyContent: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    maxWidth: 760,
    display: "flex",
    flexDirection: "column",
    gap: narrow ? 12 : 18
  } }, hero, /* @__PURE__ */ React.createElement(PayloadInline, { files }), /* @__PURE__ */ React.createElement(SpecStrip, { active, narrow, stats: cryptoStats, ttl, maxDL }), /* @__PURE__ */ React.createElement(CommandStrip, { screen, marketing: MARKETING_MODE }))), effectiveLayout === "terminal" && /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    padding: narrow ? "16px 12px" : "32px 22px",
    display: "flex",
    justifyContent: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    maxWidth: 920,
    border: `1px solid ${theme.borderHi}`,
    borderRadius: 8,
    background: theme.panel,
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderBottom: `1px solid ${theme.border}`,
    background: theme.panelLo
  } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" } }), /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" } }), /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: "50%", background: "#27c93f" } }), /* @__PURE__ */ React.createElement("span", { style: {
    flex: 1,
    textAlign: "center",
    fontFamily: "var(--mono)",
    fontSize: 11,
    color: theme.inkDim,
    letterSpacing: "0.18em"
  } }, "obscura ~ encrypt"), /* @__PURE__ */ React.createElement("span", { style: { width: 60 } })), /* @__PURE__ */ React.createElement("div", { style: { padding: narrow ? 14 : 22, display: "flex", flexDirection: "column", gap: 14 } }, hero, /* @__PURE__ */ React.createElement(PayloadInline, { files }), /* @__PURE__ */ React.createElement(CommandStrip, { screen, marketing: MARKETING_MODE }))))));
}
function HeroDecrypt({ onPick, status, error, inputMode, passphraseExpected, passphrase, setPassphrase, onSubmitPassphrase }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "relative",
    minHeight: 360,
    borderRadius: 6,
    border: `1px dashed ${error ? theme.danger : theme.borderHi}`,
    background: `radial-gradient(circle at 50% 50%, ${theme.panelHi}, ${theme.panelLo} 70%)`,
    overflow: "hidden",
    cursor: inputMode ? "default" : "pointer"
  }, onClick: inputMode ? void 0 : onPick }, [
    { top: 10, left: 10, rot: 0 },
    { top: 10, right: 10, rot: 90 },
    { bottom: 10, right: 10, rot: 180 },
    { bottom: 10, left: 10, rot: 270 }
  ].map((c, i) => /* @__PURE__ */ React.createElement("svg", { key: i, width: "22", height: "22", style: { position: "absolute", ...c, transform: `rotate(${c.rot}deg)` } }, /* @__PURE__ */ React.createElement("path", { d: "M2 22 L2 2 L22 2", fill: "none", stroke: error ? theme.danger : theme.accent, strokeWidth: "1.5" }))), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", padding: "60px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360 } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 76,
    height: 76,
    borderRadius: 8,
    border: `1px solid ${theme.accentLine}`,
    background: theme.accentSoft,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  } }, /* @__PURE__ */ React.createElement(IcLock, { size: 36, color: theme.accent })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18, fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, color: theme.ink } }, "decrypt ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.accent } }, passphraseExpected ? "--passphrase" : "--key=fragment")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontFamily: "var(--mono)", fontSize: 12, color: theme.inkDim, textAlign: "center" } }, status || (inputMode ? "enter the passphrase shared by the sender" : passphraseExpected ? "drop the .obscura ciphertext \xB7 passphrase will be required" : "drop the .obscura ciphertext or click to browse")), inputMode && /* @__PURE__ */ React.createElement("form", { onSubmit: (e) => {
    e.preventDefault();
    onSubmitPassphrase();
  }, style: { marginTop: 18, width: "100%", maxWidth: 480, display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      autoFocus: true,
      type: "text",
      value: passphrase,
      onChange: (e) => setPassphrase(e.target.value),
      placeholder: "copper-axiom-94-river",
      style: {
        flex: 1,
        padding: "12px 14px",
        border: `1px solid ${theme.borderHi}`,
        background: theme.panelLo,
        color: theme.ink,
        fontFamily: "var(--mono)",
        fontSize: 14,
        borderRadius: 3,
        outline: "none",
        letterSpacing: "0.04em"
      }
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", style: {
    padding: "12px 18px",
    border: `1px solid ${theme.accentLine}`,
    background: theme.accentSoft,
    color: theme.accent,
    fontFamily: "var(--mono)",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer"
  } }, "UNLOCK")), error && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontFamily: "var(--mono)", fontSize: 11, color: theme.danger } }, "\u2717 ", error)), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 16, bottom: 12, fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint } }, "recipient mode \xB7 ", passphraseExpected ? "passphrase + argon2id" : "key in url fragment"));
}
function HeroDecrypted({ outputs, onReset, onDownload, onSaveAll, savedSet }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "relative",
    minHeight: 360,
    borderRadius: 6,
    border: `1px solid ${theme.accentLine}`,
    background: `radial-gradient(circle at 30% 0%, ${theme.accentSoft}, ${theme.panel} 60%)`,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 14
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Tag, { secure: true }, /* @__PURE__ */ React.createElement(IcCheck, { size: 11, color: theme.secure }), " decrypted"), /* @__PURE__ */ React.createElement(Tag, null, outputs.length, " file", outputs.length === 1 ? "" : "s", " \xB7 ", fmtSize(outputs.reduce((a, o) => a + o.data.length, 0)))), /* @__PURE__ */ React.createElement("div", { style: {
    padding: "10px 14px",
    border: `1px solid ${theme.warn}`,
    borderRadius: 4,
    background: theme.panelLo,
    fontFamily: "var(--mono)",
    fontSize: 11,
    color: theme.warn,
    letterSpacing: "0.04em"
  } }, "\u26A0 this link is now spent \u2014 save before closing the tab."), /* @__PURE__ */ React.createElement("div", { style: {
    border: `1px solid ${theme.border}`,
    background: theme.panelLo,
    borderRadius: 4
  } }, outputs.map((o, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderBottom: i < outputs.length - 1 ? `1px solid ${theme.border}` : "none"
  } }, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 13, color: theme.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, o.name), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 10, color: theme.inkFaint } }, fmtSize(o.data.length), " \xB7 ", o.type || "application/octet-stream")), /* @__PURE__ */ React.createElement("button", { onClick: () => onDownload(o), style: {
    padding: "8px 14px",
    border: `1px solid ${savedSet?.has(o.name) ? theme.secure : theme.accentLine}`,
    background: savedSet?.has(o.name) ? "transparent" : theme.accentSoft,
    color: savedSet?.has(o.name) ? theme.secure : theme.accent,
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer"
  } }, savedSet?.has(o.name) ? "\u2713 SAVED" : "SAVE")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { onClick: onSaveAll, style: {
    padding: "10px 18px",
    border: `1px solid ${theme.accentLine}`,
    background: theme.accentSoft,
    color: theme.accent,
    fontFamily: "var(--mono)",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer",
    fontWeight: 700
  } }, "SAVE ALL (", outputs.length, ")"), /* @__PURE__ */ React.createElement("button", { onClick: onReset, style: {
    marginLeft: "auto",
    padding: "8px 14px",
    border: `1px solid ${theme.border}`,
    background: theme.panelHi,
    color: theme.ink,
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer"
  } }, "RESET")), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 10.5, color: theme.inkDim, lineHeight: 1.6 } }, "plaintext never touched the server \xB7 save individual files with their SAVE button")));
}
function HeroGone({ reason }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "relative",
    minHeight: 360,
    borderRadius: 6,
    border: `1px solid ${theme.danger}`,
    background: theme.panel,
    padding: 40,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 76,
    height: 76,
    borderRadius: 8,
    border: `1px solid ${theme.danger}`,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--mono)",
    fontSize: 44,
    fontWeight: 700,
    color: theme.danger
  } }, "\xD7"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color: theme.ink, letterSpacing: "0.02em" } }, "share ", /* @__PURE__ */ React.createElement("span", { style: { color: theme.danger } }, "spent")), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 12, color: theme.inkDim, textAlign: "center", maxWidth: 480, lineHeight: 1.7 } }, reason || "this link has already been read or has expired.", /* @__PURE__ */ React.createElement("br", null), "the ciphertext was purged from the vault on first download.", /* @__PURE__ */ React.createElement("br", null), "ask the sender to issue a new one."));
}
function DecryptApp({ keyBytes, id, passphraseMode }) {
  const [phase, setPhase] = useState(id ? "fetching" : "await");
  const [outputs, setOutputs] = useState([]);
  const [error, setError] = useState(null);
  const [layout, setLayoutState] = useState(() => localStorage.getItem("obscura.layout") || "centered");
  const setLayout = (v) => {
    setLayoutState(v);
    localStorage.setItem("obscura.layout", v);
  };
  const narrow = useNarrow();
  const [passphrase, setPassphrase] = useState("");
  const [pendingBlob, setPendingBlob] = useState(null);
  const [saved, setSaved] = useState(() => /* @__PURE__ */ new Set());
  const fileInputRef = useRef(null);
  const dragDepth = useRef(0);
  const fetchedRef = useRef(false);
  const decryptV1 = useCallback(async (blob) => {
    if (!keyBytes) throw new Error("missing key \u2014 link is incomplete");
    const key = await importRawKey(keyBytes);
    const plain = await decryptBlob(blob, key);
    return unpackFiles(plain);
  }, [keyBytes]);
  const decryptV2 = useCallback(async (blob, pass) => {
    const plain = await decryptBlobV2(blob, pass);
    return unpackFiles(plain);
  }, []);
  const onBlob = useCallback(async (blob) => {
    setError(null);
    const m = blobMagic(blob);
    if (!m) {
      setError("not an obscura ciphertext file");
      setPhase("err");
      return;
    }
    if (m === "v2") {
      setPendingBlob(blob);
      setPhase("needPass");
      return;
    }
    setPhase("working");
    try {
      const files = await decryptV1(blob);
      setOutputs(files);
      setPhase("ok");
    } catch (err) {
      console.error(err);
      setError(err.message || "decrypt failed");
      setPhase("err");
    }
  }, [decryptV1]);
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setPhase("working");
    const ab = await file.arrayBuffer();
    onBlob(new Uint8Array(ab));
  }, [onBlob]);
  const submitPassphrase = useCallback(async () => {
    if (!pendingBlob || !passphrase.trim()) return;
    setPhase("working");
    try {
      const files = await decryptV2(pendingBlob, passphrase.trim());
      setOutputs(files);
      setPhase("ok");
    } catch (err) {
      console.error(err);
      setError(err.message || "decrypt failed \xB7 wrong passphrase?");
      setPhase("needPass");
    }
  }, [pendingBlob, passphrase, decryptV2]);
  useEffect(() => {
    if (!id || fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/d/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 410 || res.status === 404) {
            setError(body.error || (res.status === 410 ? "expired" : "not found"));
            setPhase("gone");
            return;
          }
          throw new Error(body.error || `fetch failed (${res.status})`);
        }
        const ab = await res.arrayBuffer();
        await onBlob(new Uint8Array(ab));
      } catch (err) {
        console.error(err);
        setError(err.message || "fetch failed");
        setPhase("err");
      }
    })();
  }, [id, onBlob]);
  useEffect(() => {
    const onEnter = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files")) {
        e.preventDefault();
        dragDepth.current += 1;
      }
    };
    const onOver = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files")) e.preventDefault();
    };
    const onLeave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
    };
    const onDrop = (e) => {
      e.preventDefault();
      dragDepth.current = 0;
      const f = e.dataTransfer?.files?.[0];
      if (f) handleFile(f);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [handleFile]);
  const reset = () => {
    setPhase(id ? "fetching" : "await");
    setOutputs([]);
    setError(null);
    setPassphrase("");
    setPendingBlob(null);
    setSaved(/* @__PURE__ */ new Set());
    fetchedRef.current = false;
  };
  const browse = () => fileInputRef.current?.click();
  const saveOne = (o) => {
    downloadBytes(o.name, o.data, o.type);
    setSaved((prev) => {
      const n = new Set(prev);
      n.add(o.name);
      return n;
    });
  };
  const saveAll = () => {
    outputs.forEach((o, i) => {
      setTimeout(() => saveOne(o), i * 120);
    });
  };
  const inPassPrompt = phase === "needPass";
  const status = phase === "fetching" ? "fetching ciphertext \xB7 then decrypt" : phase === "working" ? pendingBlob ? "deriving key \xB7 argon2id m=64MB t=3" : "decrypting \xB7 verifying GCM tag" : null;
  const subtitle = phase === "ok" ? "decrypted \xB7 plaintext recovered" : phase === "err" ? "decrypt failed \xB7 key or ciphertext invalid" : phase === "gone" ? "share spent \xB7 ciphertext purged" : phase === "needPass" ? "passphrase required" : phase === "fetching" ? "fetching from vault" : phase === "working" ? "decrypting in-browser" : "recipient mode \xB7 awaiting ciphertext";
  let hero;
  if (phase === "ok") {
    hero = /* @__PURE__ */ React.createElement(HeroDecrypted, { outputs, onReset: reset, onDownload: saveOne, onSaveAll: saveAll, savedSet: saved });
  } else if (phase === "gone") {
    hero = /* @__PURE__ */ React.createElement(HeroGone, { reason: error });
  } else {
    hero = /* @__PURE__ */ React.createElement(
      HeroDecrypt,
      {
        onPick: browse,
        status,
        error: phase === "err" || phase === "needPass" ? error : null,
        inputMode: inPassPrompt,
        passphraseExpected: passphraseMode || inPassPrompt,
        passphrase,
        setPassphrase,
        onSubmitPassphrase: submitPassphrase
      }
    );
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    minHeight: "100vh",
    background: theme.bg,
    color: theme.ink,
    fontFamily: "var(--mono)",
    position: "relative"
  } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: fileInputRef,
      type: "file",
      accept: ".obscura,application/octet-stream",
      style: { display: "none" },
      onChange: (e) => e.target.files?.[0] && handleFile(e.target.files[0])
    }
  ), /* @__PURE__ */ React.createElement("svg", { width: "100%", height: "100%", style: { position: "fixed", inset: 0, opacity: 0.5, pointerEvents: "none" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: "bggrid-d", width: "48", height: "48", patternUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("path", { d: "M 48 0 L 0 0 0 48", fill: "none", stroke: theme.bgGrid, strokeWidth: "1" }))), /* @__PURE__ */ React.createElement("rect", { width: "100%", height: "100%", fill: "url(#bggrid-d)" })), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", display: "flex", flexDirection: "column", minHeight: "100vh" } }, /* @__PURE__ */ React.createElement(TopBar, { subtitle, layout, setLayout, narrow, marketing: MARKETING_MODE }), /* @__PURE__ */ React.createElement("div", { style: {
    flex: 1,
    padding: narrow ? "20px 14px" : "40px 22px",
    display: "flex",
    justifyContent: "center"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    maxWidth: 760,
    display: "flex",
    flexDirection: "column",
    gap: narrow ? 12 : 18
  } }, hero, /* @__PURE__ */ React.createElement(SpecStrip, { active: phase === "working" || phase === "fetching", narrow }), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 6,
    padding: "10px 0 4px",
    fontFamily: "var(--mono)",
    fontSize: 10,
    color: theme.inkFaint,
    letterSpacing: "0.06em",
    display: "flex",
    justifyContent: "center",
    gap: 14,
    flexWrap: "wrap"
  } }, /* @__PURE__ */ React.createElement("a", { href: "/transparency.html", style: { color: "inherit", textDecoration: "none" } }, "transparency"), /* @__PURE__ */ React.createElement("span", null, "\xB7"), /* @__PURE__ */ React.createElement("a", { href: "/status.html", style: { color: "inherit", textDecoration: "none" } }, "status"), /* @__PURE__ */ React.createElement("span", null, "\xB7"), /* @__PURE__ */ React.createElement("a", { href: "/privacy.html", style: { color: "inherit", textDecoration: "none" } }, "privacy"), /* @__PURE__ */ React.createElement("span", null, "\xB7"), /* @__PURE__ */ React.createElement("a", { href: "/support.html", style: { color: "inherit", textDecoration: "none" } }, "support"))))));
}
function Entry() {
  const hash = window.location.hash || "";
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const k = params.get("k");
  const rawI = params.get("i");
  const p = params.get("p");
  const id = rawI && /^[a-f0-9]{16}$/.test(rawI) ? rawI : null;
  if (k) {
    try {
      const keyBytes = b64uDecode(k);
      if (keyBytes.length === 32) return /* @__PURE__ */ React.createElement(DecryptApp, { keyBytes, id });
    } catch (e) {
      console.error("invalid key in fragment", e);
    }
  }
  if (id || p === "1") {
    return /* @__PURE__ */ React.createElement(DecryptApp, { passphraseMode: true, id });
  }
  return /* @__PURE__ */ React.createElement(App, null);
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Entry, null));
