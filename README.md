# OBSCURA

**Zero-knowledge ephemeral file transfer.** Files are encrypted in your browser with AES-256-GCM before they ever leave the page. The server stores ciphertext only — keys never touch the wire — and the share link self-destructs after a configurable read count or TTL.

→ **Live:** https://obscr.app

> ⚠ **Disclaimer.** OBSCURA is provided **AS IS** under the [MIT License](LICENSE). It has **not been independently security-audited** and is **not appropriate for regulated data** (HIPAA / PCI / CJIS / classified). No SLA, no key recovery, no warranty. Read **[DISCLAIMER.md](DISCLAIMER.md)** and **[PRIVACY.md](PRIVACY.md)** before using it for anything that matters.

---

## How it works

1. You drop files (or paste text) into the page.
2. The browser generates a random 256-bit key, packs the files, and runs AES-256-GCM locally.
3. The ciphertext is uploaded to a Cloudflare Worker; the key stays in the URL fragment (`#k=…`), which browsers never send to servers.
4. The recipient opens the link, the page fetches the ciphertext, decrypts in-browser, and offers each file for download.
5. After the configured read count or TTL expires, the worker purges the ciphertext from R2 and the metadata from KV.

Optional: enable **passphrase mode** in Settings. The data key is then wrapped under an argon2id-derived KEK (m=64 MiB, t=3, p=1); the recipient enters the passphrase out-of-band and the link no longer carries the key.

## Features

- **AES-256-GCM** authenticated encryption via WebCrypto.
- **Argon2id passphrase wrapping** (optional second factor), via `argon2-browser` wasm.
- **Burn-after-read** — configurable TTL (1–24h) and download count (1/3/5/10x), enforced server-side.
- **Manual burn** — sender can nuke a share immediately from the Done screen.
- **QR code** for the share link.
- **Three layouts** — centered (default), sidebar (pro), terminal — toggle in the top bar.
- **Three input methods** — drag-and-drop, file picker (⌘+O), paste text (⌘+V), compose textarea.
- **Mobile-responsive** — sidebar collapses, settings stack, top bar trims under 720px.

## Stack

| Layer    | Tech                                      |
| -------- | ----------------------------------------- |
| Frontend | React 18 (CDN, SRI-pinned) + JSX pre-compiled by esbuild |
| Crypto   | WebCrypto (AES-256-GCM) + argon2-browser  |
| Backend  | Cloudflare Worker with [assets] binding   |
| Storage  | R2 (ciphertext) + KV (metadata, TTL)      |
| Deploy   | `wrangler deploy` (manual or via CI)      |

## Local development

```bash
npm install
npm run dev               # builds src/app.jsx → app.js, then runs wrangler on :8787
```

JSX source lives in `src/app.jsx`. `npm run build` produces `app.js` at the repo root, which `Obscura.html` loads via `<script src="/app.js">`. The HTML shell, `_headers` (CSP and friends), `app.js`, and `favicon.svg` are the only files served as static assets. Worker entry is `worker/index.js`.

## Deploy

```bash
npm run deploy            # runs build:min then wrangler deploy
```

Provisioning (one-time, before first deploy):

```bash
npx wrangler kv namespace create META
npx wrangler kv namespace create META --preview
npx wrangler r2 bucket create obscura-blobs
npx wrangler r2 bucket create obscura-blobs-dev
```

Paste the returned IDs into `wrangler.toml`.

## Threat model — what OBSCURA protects against

- **Curious or compromised server operator** — sees ciphertext only.
- **Network attacker on the wire** — TLS protects transit; ciphertext is opaque without the key.
- **Anyone who gets the link after expiry/burn** — KV says it's gone, R2 returns nothing.

## What it does *not* protect against

- A compromised sender or recipient browser (key derived/used there).
- A determined adversary who acquires both the link **and** the passphrase out-of-band.
- Traffic analysis (size of ciphertext, timing of uploads).
- The recipient choosing to share the decrypted plaintext.

## Hardening notes

- All third-party `<script>` tags carry SRI `integrity` hashes; CSP pins `script-src` to `'self'` plus `unpkg.com` and `cdn.jsdelivr.net`. Any drift from the pinned bundle is rejected by the browser.
- `_headers` ships CSP, HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, COOP/CORP, and a restrictive Permissions-Policy from the asset edge.
- `/api/upload` requires a same-origin `Origin` header, sanity-checks the OBS1/OBS2 magic, and enforces minimum ciphertext lengths so nobody can use the bucket as anonymous object storage.
- Auto-generated passphrases come from `crypto.getRandomValues` via a rejection-sampling helper — never `Math.random`. Users wanting more than convenience-grade entropy should type their own passphrase.
- Cloudflare logs request paths and IPs by default. The `/api/d/{id}` URL contains the share id, which means an operator with log access can correlate IPs to shares. If you need stronger anonymity, audit your Cloudflare logging settings before going live.

## Abuse / takedown

Anonymous file hosting attracts misuse. To report illegal content or request takedown, email **abuse@obscr.app** with the share URL. The server keeps no decrypted content, so removal means purging the ciphertext blob — which any sender can also do themselves from the Done screen via the "burn now" action.

## Support

OBSCURA is free, open source, and ad-free. It's hosted on Cloudflare and the bills are paid out of pocket. If it saved you a step or you just like the project, a tip helps keep the lights on:

- **Buy Me a Coffee** → [buymeacoffee.com/dgpugliese](https://buymeacoffee.com/dgpugliese) — one-off tips, leave a note if you want.

Donations are appreciated, never required. Nothing in the app is gated behind a tip. More info at [/support](https://obscr.app/support).

---

## Development note

A zero-knowledge file transfer app built end-to-end with [Claude Code](https://claude.com/claude-code) — design through Claude Design, frontend and Cloudflare Worker backend written collaboratively, infrastructure provisioned via the Cloudflare MCP. AI as a serious engineering partner, not a code-completion toy.
