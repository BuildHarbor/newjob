# Contributing

NewJob aims to make useful career tools available without a paid API or cloud account. Keep that constraint visible in proposals.

1. Open an issue for a significant change so the workflow and scope can be discussed.
2. Fork, install with `npm ci`, and run `npm start`.
3. Use fictional resumes, companies and contacts. Never commit personal backups, database files, API keys or model weights.
4. Keep inputs labeled, keyboard paths usable, reduced-motion support intact and narrow screens functional.
5. Run `npm test` and `npm run check`. Add meaningful tests for changed behavior, especially data loss, import handling and scoring.
6. Include a screenshot for visible changes and explain limitations. Never claim ATS certification, hiring outcomes or market facts without evidence.

Tests create their own temporary databases. For manual development, set `NEWJOB_DATA_DIR` to a separate folder so you do not change your personal workspace.

Pull requests should describe the user problem, resulting behavior and relevant validation. Avoid unrelated rewrites. Be respectful and specific in discussions; critique ideas and code, not people. Maintainers may remove harassment, spam or personal data.

Good starting areas: import fixtures with unusual headings, keyboard accessibility, clearer error messages, additional resume print layouts and localization planning. The roadmap is in [FEATURES.md](FEATURES.md).
