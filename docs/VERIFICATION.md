# Verification record

## Version 1.1 release checks — 16–17 October 2026

The expanded release adds company discovery/research, problem hypotheses, career stories, Win Decks, offer lessons and practice, roadmaps and post planning. The layout now uses a blue opportunity navigation bar, career tool rail, company cards and contextual copilot.

- **33 automated tests pass**, including browser IndexedDB persistence and stale-tab protection, private-note isolation, public endpoint boundaries, source URL protection, exact-quote grounding, offer calculations, malformed AI output and editable PowerPoint contents.
- Syntax, formatting, hosted build and dependency audit pass; zero known dependency vulnerabilities at verification time. The initial main-branch GitHub CI passed on Windows/Ubuntu and Node 22/24.
- The Netlify service returned **20 company profiles**, **15 job listings**, and a readable GitLab company source with no fetch warnings. Counts reflect the feed at test time.
- Browser checks covered company discovery, manually saving a target, fetching sources, adding a labeled hypothesis, transferring it into Pitcher, and creating a six-slide editable outline with supplied fictional evidence.
- The browser downloaded PowerPoint and HTML exports. The downloaded PowerPoint was opened as a ZIP and verified to contain six slides and editable text. A page reload retained the saved deck.
- Negotiation lesson feedback, annual/first-year/equity separation, counteroffer percentage and all four practice rounds with wording feedback worked with fictional compensation figures. The practice report downloaded successfully.
- Six expanded routes (negotiation, Pitcher, companies, stories, roadmaps and posts) were checked at a 390 × 844 viewport with no horizontal page overflow. Desktop and mobile controls remained usable.
- Browser AI downloaded and loaded Qwen2.5 1.5B, then completed a short streamed copilot response. Initial structured requests exposed a WebLLM grammar-matcher initialization error. The release removes that failing mode, requests JSON in the prompt and validates the returned object. A live post-generation request then completed and saved an editable draft from the supplied fictional story. Stopping a subsequent request immediately restored usable controls and displayed the model-reload instruction while retaining the saved draft.
- Browser generation was slow on the test computer. The post-generation and cancellation checks passed after the fix; longer AI research/deck tasks were not individually rerun end to end after that shared runtime change. Source collection, manual hypotheses, editable deck creation/export and negotiation without AI were verified separately. Small-model outputs still need review.

Production: [newjob-career.netlify.app](https://newjob-career.netlify.app). [GitHub CI](https://github.com/BuildHarbor/newjob/actions/workflows/ci.yml) is authoritative for the latest commit. Personal browser records are not part of the repository or deployment.

## Earlier baseline checks (version 1.0)

Verified 15 October 2026 on Windows with Node 26.3, a Chromium browser and local Ollama `qwen2.5:3b`. Tests used a separate database and fictional records. The personal workspace was not populated with demo data.

## Automated tests

`npm test`: **19 passing tests**. Coverage includes keyword hits and misses, punctuation, unsafe URLs, short-text rejection, explicit score behavior without a job description, import section detection, malformed backup fields/IDs/dates, persistence across a server restart, revision conflicts, cross-origin requests, private-file exclusion, HTTP methods, and TXT/MD/DOCX/PDF imports.

`npm run check`: syntax and formatting passed. `npm audit`: **zero known dependency vulnerabilities** at verification time. An audit only reflects published advisories at that time.

The GitHub Actions workflow runs these checks on Windows and Ubuntu with Node 22 and 24. Its current badge and run logs are authoritative for remote CI results.

## Browser workflows exercised

| Workflow                             | Observed result                                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Profile creation, editing and reload | Saved fictional details returned after reload                                                                                          |
| Resume editor and styling            | Live preview updated; template, accent and spacing persisted                                                                           |
| Import and review                    | TXT selected in browser; detected sections reviewed and applied without losing unrelated profile fields                                |
| Resume export                        | Downloaded TXT contained the expected fictional name and experience                                                                    |
| Resume comparison                    | Matched SQL and product skills; identified missing Kubernetes; punctuation issue fixed with a regression test                          |
| Applications                         | Created a role with link, notes and follow-up date; moved Saved → Interview                                                            |
| Companies and contacts               | Created a company and associated contact; records persisted                                                                            |
| Cover letters and library            | Real local AI draft generated, saved, reopened and renamed                                                                             |
| Job feed                             | Remotive returned 15 listings at test time; text filtering and saving a result worked                                                  |
| Backup/restore                       | Downloaded backup, changed the profile, restored through confirmation, and verified the original profile after reload                  |
| Interview practice                   | Real question, user answer and subsequent feedback displayed; conversation saved                                                       |
| Responsive UI                        | Desktop 1440 × 1000 and phone 390 × 844 checked; 13 main routes had no horizontal page overflow at phone width; menu navigation worked |
| Browser errors                       | No console errors observed in the exercised flows                                                                                      |
| Windows launcher                     | Started the app and opened its local URL successfully                                                                                  |

## Local AI smoke test

All nine assistant routes returned completed, non-empty streamed responses using `qwen2.5:3b`. Short requests took approximately **5.3–13.7 seconds** on the test computer. This is an operational smoke test, not a quality benchmark or latency guarantee.

The small model occasionally gives generic or repetitive advice. A cover-letter test picked up an unrelated application's role title; the cover-letter context was narrowed to the supplied profile and request. Every draft still needs review. Text interview feedback is not calibrated or a hiring assessment.

## Limits of this verification

- Native **Print / Save as PDF** could not be completed through the in-app browser's print dialog automation. The text export passed; PDF import passed; native PDF output remains a manual check in Chrome/Edge. Review pagination before sharing a printed resume.
- OCR, unusual/malformed documents, very large workspaces, long-running use and every local model are not comprehensively tested.
- External feed uptime and listing accuracy are outside NewJob's control.
- Offline AI behavior is shown through connection status and errors; all model families and hardware configurations have not been tested.
- This audit does **not** establish full parity with NxtJob. See [FEATURES.md](../FEATURES.md) for every advertised product category, assistant role and known gap.

Screenshots in `docs/images/` show synthetic demonstration records, not a user's career information.
