# Verification record

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
