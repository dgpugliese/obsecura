# Privacy & Logs Policy

**Last updated:** 2026-05-05

OBSCURA is a zero-knowledge file-transfer service. The point of this document is to be specific about what that means in practice — what we store, what we *can't* store, what our infrastructure provider stores on our behalf, and how long any of it lasts.

If something here is wrong or out of date, that's a bug. Open an issue at <https://github.com/dgpugliese/Obsecura/issues> or email **security@obscr.app**.

---

## What OBSCURA stores

### What the application code stores

- **Ciphertext.** Stored in Cloudflare R2, keyed by a random 16-hex-character ID. Opaque to the server.
- **Per-share metadata.** Stored in Cloudflare KV. Each record contains:
  - `expiresAt` — unix milliseconds, set from the sender's TTL choice
  - `downloads` — remaining download count
  - `size` — ciphertext size in bytes
  - `createdAt` — unix milliseconds
- **Aggregate counters** (added 2026-05-05). Daily totals of shares created, burned, expired, and exhausted. Stored in KV under `stat:YYYY-MM-DD:<event>` keys with a 90-day TTL. **No per-share data, no IPs, no identifiers.** These power the public [transparency report](https://obscr.app/transparency.html).

### What the application code does **not** store

- **Plaintext.** Never reaches the server. Encryption happens in the sender's browser via WebCrypto.
- **Encryption keys.** Live in the URL fragment (`#k=…`), which browsers do not send to servers. In passphrase mode the data key is wrapped under an argon2id-derived KEK and the passphrase is shared out-of-band — the server never sees either.
- **Sender or recipient identity.** No accounts, no email, no phone, no cookies, no localStorage tied to identity.
- **Application access logs.** The Worker does not write access log lines for `/api/upload`, `/api/d/{id}` GET/HEAD/DELETE.
- **Filenames or content metadata in the clear.** Filenames, sizes-per-file, and MIME types are encrypted along with the file bytes; the server only sees total ciphertext size.

---

## What Cloudflare stores on our behalf

We are a Cloudflare Workers + R2 + KV deployment. Cloudflare logs traffic at the edge as part of operating the platform. We don't control these logs but we do try to be transparent about them.

By default — i.e., what we have configured today — Cloudflare retains:

- **HTTP request analytics** (aggregated): request counts, response codes, bytes, country-level geography. Visible to the account owner via the Cloudflare dashboard. Retention is per Cloudflare's standard analytics policy (rolling 30 days for the free dashboard, longer for paid plans).
- **Per-request log entries** (raw): include client IP, requested path (which contains the share ID for `/api/d/{id}` requests), user-agent, response code, timestamp. These are accessible to the account owner via Cloudflare Logs / Logpush **if Logpush is enabled.** Logpush is **not** enabled for `obscr.app` as of this document's date.
- **Security events** (WAF, bot scoring, rate limit triggers): retained per Cloudflare's policy.

What this means in practice:

- A Cloudflare account administrator (currently: David Pugliese, the operator) **could** correlate IPs to share IDs by querying Cloudflare's edge logs within Cloudflare's retention window, even though the application itself does not log this.
- Cloudflare staff can access logs under their internal access-control and legal-process policies. See <https://www.cloudflare.com/privacypolicy/>.
- Compelled disclosure (subpoena, court order) directed at Cloudflare can expose IP↔share-ID correlations within the retention window. The server still cannot disclose plaintext, because it doesn't have plaintext.

If you need stronger anonymity than this, route through Tor or a VPN before uploading or downloading.

---

## Retention

| Data | Where | Retention |
|---|---|---|
| Ciphertext | R2 | Until the share is downloaded the configured number of times, manually burned, or its TTL elapses. Hourly cron sweeps orphans. Maximum TTL is 7 days. |
| Per-share metadata | KV | Same lifecycle as the ciphertext, plus a small grace period. KV's `expirationTtl` reaps abandoned records automatically. |
| Aggregate daily counters | KV | 90 days, then auto-reaped. |
| Cloudflare HTTP analytics | Cloudflare | Per Cloudflare's policy (rolling, dashboard-visible window). |
| Cloudflare raw request logs | Cloudflare (Logpush) | **Not currently enabled.** If enabled in the future, this document will be updated with the destination and retention. |

---

## Who can see what

- **The operator** (David Pugliese, via the Cloudflare account): can see ciphertext bytes (opaque), KV metadata, aggregate counters, and Cloudflare-side analytics/logs as described above. Cannot see plaintext. Cannot see encryption keys.
- **Cloudflare**: as their privacy policy describes.
- **Anyone with the share link (and passphrase, if used)**: can decrypt the file until it expires or burns.
- **The public**: can see the [transparency report](https://obscr.app/transparency.html) and [status page](https://obscr.app/status.html). Both are aggregate-only.

---

## Abuse reports

Email **abuse@obscr.app** with the share URL and a brief description. We do not store decrypted content, so abuse handling consists of purging the ciphertext blob (which any sender can also do themselves from the Done screen via "burn now") and counting the report in the public transparency log.

We log received and actioned counts, not report contents.

---

## Changes to this policy

Material changes are committed to this file in the public repository. The `Last updated` header at the top reflects the current revision. Past revisions are visible in `git log PRIVACY.md`.
