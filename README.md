# OBSCURA

**Zero-knowledge ephemeral file transfer.** Files are encrypted in your browser with AES-256-GCM before they ever leave the page. The server stores ciphertext only — keys never touch the wire — and the share link self-destructs after a configurable read count or TTL.

→ **Live:** https://obscura.the-it-visionary.workers.dev

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
| Frontend | React 18 + Babel via CDN, single HTML file |
| Crypto   | WebCrypto (AES-256-GCM) + argon2-browser  |
| Backend  | Cloudflare Worker with [assets] binding   |
| Storage  | R2 (ciphertext) + KV (metadata, TTL)      |
| Deploy   | `wrangler deploy` (manual or via CI)      |

## Local development

```bash
npx wrangler dev          # serves frontend + worker on :8787
```

The frontend is a single self-contained `Obscura.html` — no build step. Edits to the file hot-reload via wrangler. The worker entry is `worker/index.js`.

## Deploy

```bash
npx wrangler deploy
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

---

## Development note

Built with [Claude Code](https://claude.com/claude-code) as a vehicle for AI-assisted product engineering — design handoff via Claude Design, frontend and backend in a single working session, real provisioning via the Cloudflare MCP. The architecture and code are real; the speed of getting there is the demo.
