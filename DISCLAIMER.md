# DISCLAIMER

OBSCURA is a personal project distributed under the [MIT License](LICENSE) on an **AS-IS** basis. Read this before using it for anything that matters.

## No warranty, no audit

- The software is provided **AS IS, WITHOUT WARRANTY OF ANY KIND**, express or implied. The MIT License governs liability — see [LICENSE](LICENSE).
- The cryptography choices (AES-256-GCM via WebCrypto, Argon2id via `argon2-browser`) use standard, peer-reviewed primitives, but **the integration has not been independently security-audited**. There is no third-party penetration test, formal verification, or certification covering this codebase.
- Bugs, regressions, and configuration drift are possible. Read the source, pin a known-good commit, or run your own deployment if the threat model warrants it.

## Not for regulated, classified, or high-risk data

OBSCURA is **not appropriate** for:

- **Protected health information (PHI)** under HIPAA — there is no Business Associate Agreement, no audit logging of access, no covered-entity-grade controls.
- **Cardholder data (PAN/CVV)** under PCI DSS — out of scope.
- **Criminal-justice information (CJI)** under CJIS — out of scope.
- **Classified information** under any government classification scheme — out of scope.
- **Export-controlled cryptographic material** if your jurisdiction restricts export of strong crypto.
- Any context where regulatory, contractual, or fiduciary obligations require a formally audited or certified system.

If your data falls in any of those buckets, use a vendor that holds the appropriate compliance attestations and contracts.

## User responsibilities

- **Passphrase strength.** In passphrase mode, the security of the share is bounded by the entropy of the passphrase you choose. Argon2id slows attackers down but cannot rescue a guessable phrase.
- **Link & passphrase distribution.** OBSCURA does not deliver the share link or passphrase to the recipient — you do. If you send both over the same untrusted channel (e.g., one email containing both), you have negated the design. Use distinct channels.
- **Recipient device trust.** Decryption happens in the recipient's browser. A compromised recipient device sees the plaintext.
- **No key recovery.** Lose the URL fragment (`#k=…`) or the passphrase and the ciphertext is **unrecoverable**. There is no reset, no backup, no support path. This is a feature.

## Service availability

- The hosted instance at <https://obscr.app> is operated as a personal project. It carries **no SLA** and may be unavailable, throttled, modified, or shut down at any time without notice.
- Files are ephemeral by design — the service will purge ciphertext on TTL expiry, on read-count exhaustion, or on manual burn. Do not use OBSCURA as durable storage.
- For uptime guarantees, deploy your own instance — see [README.md](README.md) for instructions.

## Logs & compelled disclosure

OBSCURA does not log plaintext, identities, or keys. **However**, the Cloudflare edge logs requests as part of operating the platform — see [PRIVACY.md](PRIVACY.md) for specifics. A Cloudflare account administrator or a compelled disclosure (subpoena, court order) directed at Cloudflare can correlate IP addresses to share IDs within Cloudflare's retention window.

The server cannot disclose plaintext, because it does not have plaintext. It *can* disclose that a share existed and the IP that uploaded or fetched it. If you need stronger anonymity than this, route through Tor or a trusted VPN.

## Abuse, takedown, and security reports

- **Abuse / takedown:** email <abuse@obscr.app> with the share URL. The server holds no decrypted content; takedown means purging the ciphertext blob.
- **Security vulnerabilities:** email <security@obscr.app>. Please give a reasonable window before public disclosure.

## Acceptance

By using OBSCURA — the hosted instance at obscr.app, the source in this repository, or any derivative — you accept this disclaimer and the terms of the MIT License. If you do not accept these terms, do not use OBSCURA.
