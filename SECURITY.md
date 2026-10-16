# Security

NewJob is designed for one person on a trusted local computer. It binds only to loopback, rejects foreign origins and unexpected Host headers, blocks cross-site API reads, validates backup records, escapes rendered text and limits request sizes. These measures do not replace authentication for public hosting. Local malware or other privileged processes are outside this boundary.

Do not commit `data/`, personal exports or secrets. Backups contain resumes, contacts and conversations. Protect them like the originals. Only import documents you trust; parser resource exhaustion remains possible even with input limits. Scanned PDFs are not OCR'd.

AI sees supplied profile and workspace context. It has no external execution tools. Outputs can be inaccurate or influenced by hostile pasted text; review them before use. Do not enable remote/cloud models when local privacy is required.

Report vulnerabilities privately through the repository's **Security → Report a vulnerability** option. Do not post personal data or exploit details in public issues. If that option is unavailable, open an issue asking for a private reporting channel without including the vulnerability details.

Dependencies are locked. The Mammoth CLI's legacy `argparse` dependency is overridden to 2.x to remove the vulnerable `sprintf-js` chain; NewJob uses Mammoth's raw-text library API, not its CLI. DOCX extraction is covered by integration tests. PDF.js is updated to 6.x and its current loading-task cleanup API is used. Run `npm audit` for the current advisory state; a clean audit is not a guarantee of security.
