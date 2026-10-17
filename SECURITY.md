# Security

NewJob has two storage modes. The desktop edition is designed for one person on a trusted computer: its server binds only to loopback, rejects foreign origins and unexpected Host headers, validates backup records, escapes rendered text and limits request sizes. Do not expose that server publicly. Local malware or other privileged processes are outside this boundary.

The Netlify edition stores private workspace records in browser IndexedDB and runs optional AI in a WebGPU worker. There is no hosted workspace API or cloud account. Anyone with access to the same browser profile can access its workspace. Export a backup before clearing site storage. The Netlify function only retrieves public company/job data and selected public research URLs; pasted private notes are merged locally. Public URLs and company/news queries, plus ordinary connection metadata, reach hosting and source providers. Only research public URLs, without secrets in their paths or query strings.

The public-source reader validates DNS addresses and redirects, blocks private/reserved destinations, pins the validated address, and limits response size and duration. Hosted functions additionally restrict origins and request rates. These are defense-in-depth measures, not a promise that third-party content or AI output is trustworthy.

Do not commit `data/`, personal exports or secrets. Backups contain resumes, contacts and conversations. Protect them like the originals. Only import documents you trust; parser resource exhaustion remains possible even with input limits. Scanned PDFs are not OCR'd.

AI sees supplied profile and workspace context. It has no external execution tools. Outputs can be inaccurate or influenced by hostile pasted text; review them before use. Do not enable remote/cloud models when local privacy is required.

Report vulnerabilities privately through the repository's **Security → Report a vulnerability** option. Do not post personal data or exploit details in public issues. If that option is unavailable, open an issue asking for a private reporting channel without including the vulnerability details.

Dependencies are locked. The Mammoth CLI's legacy `argparse` dependency is overridden to 2.x to remove the vulnerable `sprintf-js` chain; NewJob uses Mammoth's raw-text library API, not its CLI. DOCX extraction is covered by integration tests. PDF.js is updated to 6.x and its current loading-task cleanup API is used. Run `npm audit` for the current advisory state; a clean audit is not a guarantee of security.
