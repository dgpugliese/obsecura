# OBSCURA

> **Zero-knowledge ephemeral file transfer.** Encrypt in the browser, ship the ciphertext, burn the link.

🔗 **Live:** [obscr.app](https://obscr.app) &nbsp;·&nbsp; 📊 [transparency](https://obscr.app/transparency) &nbsp;·&nbsp; 🟢 [status](https://obscr.app/status) &nbsp;·&nbsp; 🔒 [privacy](https://obscr.app/privacy)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deployed on Cloudflare](https://img.shields.io/badge/edge-Cloudflare%20Workers-f38020)](https://workers.cloudflare.com/)
[![Built with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-d97757)](https://claude.com/claude-code)

OBSCURA encrypts your files in the browser with **AES-256-GCM** before they leave the page. The server only ever sees ciphertext — keys live in the URL fragment (which browsers never send to servers) or are wrapped under an Argon2id-derived passphrase you share out of band. Shares self-destruct after a configurable TTL or download count.

> ⚠ **Use it for what it's good at, not what it isn't.** OBSCURA is provided **AS IS** under [MIT](LICENSE), has **not been independently security-audited**, and is **not appropriate for regulated data** (HIPAA / PCI / CJIS / classified). No SLA, no key recovery, no warranty. See [DISCLAIMER.md](DISCLAIMER.md) and [PRIVACY.md](PRIVACY.md) before trusting it with anything that matters.

---

## How it works

```
sender browser                  cloudflare worker                  recipient browser
──────────────                  ─────────────────                  ─────────────────
files → AES-256-GCM  ─────►  ciphertext stored in R2  ─────►  fetch ciphertext
key stays in #fragment          metadata in KV (TTL)              decrypt with #key
                                  ↓ (after TTL / N reads)
                                purge R2 + KV
```

1. Drop files (or paste text) onto the page.
2. The browser generates a random 256-bit key, packs the files, and runs **AES-256-GCM** locally.
3. Ciphertext is uploaded to a Cloudflare Worker; the key stays in the URL fragment (`#k=…`).
4. The recipient opens the link, the page fetches the ciphertext, decrypts in-browser, and offers downloads.
5. After the configured read count or TTL, the worker purges R2 and KV.

**Passphrase mode** (optional, in Settings): the data key is wrapped under an **Argon2id**-derived KEK (m=64 MiB, t=3, p=1). The link no longer carries the key; the recipient enters the passphrase you share separately.

## Features

- 🔐 **AES-256-GCM** authenticated encryption (WebCrypto)
- 🔑 **Argon2id passphrase wrapping** — optional second factor, browser-native wasm
- 🔥 **Burn-after-read** — TTL (1–24h) and download count (1/3/5/10×), enforced server-side
- 💣 **Manual burn** — sender can nuke a share instantly from the Done screen
- 📱 **QR code** for fast mobile handoff
- 🎨 **Three layouts** — centered, sidebar, terminal
- ⌨️ **Three inputs** — drag-and-drop, file picker (⌘+O), paste (⌘+V), compose textarea
- 📐 **Mobile-responsive** down to 360px

## Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React 18 via CDN (SRI-pinned) · JSX pre-compiled by esbuild |
| Crypto   | WebCrypto · `argon2-browser` (wasm) |
| Backend  | Cloudflare Worker (`worker/index.js`) with `[assets]` binding |
| Storage  | R2 (ciphertext) · KV (metadata + aggregate counters) |
| Deploy   | `wrangler deploy` |

## Quick start

```bash
npm install
npm run dev      # builds src/app.jsx → app.js, runs wrangler on :8787
```

JSX source is in [`src/app.jsx`](src/app.jsx). `npm run build` produces [`app.js`](app.js) at the repo root, loaded by [`Obscura.html`](Obscura.html). Static assets ([`Obscura.html`](Obscura.html), [`_headers`](_headers), `app.js`, [`favicon.svg`](favicon.svg)) are served via the `[assets]` binding; everything else is the worker.

### Deploy

```bash
npm run deploy   # runs build:min then wrangler deploy
```

First-time provisioning:

```bash
npx wrangler kv namespace create META
npx wrangler kv namespace create META --preview
npx wrangler r2 bucket create obscura-blobs
npx wrangler r2 bucket create obscura-blobs-dev
```

Paste the returned IDs into [`wrangler.toml`](wrangler.toml).

## Threat model

**Protects against:**

- A curious or compromised server operator — sees opaque ciphertext only.
- A network attacker on the wire — TLS in transit; ciphertext is meaningless without the key.
- Anyone who fishes the link out *after* expiry or burn — KV says gone, R2 returns nothing.

**Does *not* protect against:**

- A compromised sender or recipient browser (the key is used there).
- An adversary who acquires both the link **and** the passphrase out of band.
- Traffic analysis — ciphertext size and upload timing are observable.
- A recipient choosing to re-share the decrypted plaintext.

### Hardening notes

- Every third-party `<script>` carries an SRI `integrity` hash; CSP pins `script-src` to `'self'`, `unpkg.com`, and `cdn.jsdelivr.net`. Any drift from the pinned bundle is rejected by the browser.
- [`_headers`](_headers) ships CSP, HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, COOP/CORP, and a restrictive Permissions-Policy from the asset edge.
- `/api/upload` requires a same-origin `Origin` header, sanity-checks the OBS1/OBS2 magic, and enforces minimum ciphertext lengths — the bucket can't be used as anonymous object storage.
- Auto-generated passphrases come from `crypto.getRandomValues` via rejection sampling. Never `Math.random`. Roll your own passphrase if you want more than convenience-grade entropy.
- Cloudflare logs request paths and IPs by default. `/api/d/{id}` contains the share ID, so an operator with log access *could* correlate IPs to shares. The full data policy is in [PRIVACY.md](PRIVACY.md). For stronger anonymity, route through Tor or a VPN.

## Abuse / takedown

Anonymous file hosting attracts misuse. Report illegal content to **[abuse@obscr.app](mailto:abuse@obscr.app)** with the share URL. The server has no decrypted content, so removal = purging the ciphertext blob (which any sender can also do themselves via "burn now" on the Done screen). Aggregate report counts are published on the [transparency page](https://obscr.app/transparency).

## Support

OBSCURA is free, open source, and ad-free. It's hosted on Cloudflare and the bills are paid out of pocket. If it saved you a step or you just like the project, tips help keep the lights on.

<a href="https://www.buymeacoffee.com/dgpugliese" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" width="210"></a>

Donations are always optional and nothing in the app is gated behind a tip. More at [obscr.app/support](https://obscr.app/support).

---

<sub>Built end-to-end with [Claude Code](https://claude.com/claude-code) — design via Claude Design, frontend + Cloudflare Worker written collaboratively, infrastructure provisioned through the Cloudflare MCP. AI as a serious engineering partner, not a code-completion toy.</sub>
