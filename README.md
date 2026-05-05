OBSCURA | Secure Ephemeral Transfer
Zero-Knowledge Architecture • Client-Side Encryption • Ephemeral Storage
OBSCURA is a "best-of-breed" security utility designed to solve the problem of sharing sensitive files without trusting the intermediary infrastructure. By utilizing the browser's native Web Crypto API, files are encrypted locally before they are ever transmitted, ensuring that the server admin (and even the developer) has zero visibility into the content.
3. Key Technical Features
Use this section to highlight your architectural choices.
•	Zero-Knowledge Security: Decryption keys are generated in the browser and stored in the URL fragment (#). Because fragments are never sent to the server, the host remains "blind" to the data.
•	AES-256-GCM Encryption: Leverages industry-standard authenticated encryption for both confidentiality and integrity.
•	Burn-After-Reading: Configurable Time-To-Live (TTL) and single-download limits enforced via automated backend cleanup.
•	Minimalist Stack: Built with a focus on low-overhead and high-performance delivery.

Development Note: This project was developed using a "Vibe Coding" methodology—leveraging AI-assisted architecture and development to rapidly prototype and deploy professional-grade cryptographic solutions. It serves as a proof-of-concept for modern, AI-augmented software engineering.
