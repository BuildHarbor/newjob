# Feature audit — 1.1

Current coverage reviewed 16 October 2026. NewJob follows observable trial patterns with its own branding and backend; inaccessible signed-in screens are not pixel-verified.

| Area          | Current implementation                                                                              | Remaining boundary                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Companies     | Public directory, target cards, saved job/contact counts                                            | Provider coverage varies; not a complete company/job database                                   |
| Research      | Public pages, news headlines, pasted evidence, AI problem hypotheses with matching quotes           | A matching quote does not certify a business problem                                            |
| Pitcher       | Connected Win Deck builder, career stories, images/captions, editable slides/notes, PowerPoint/HTML | Text model uses captions, not image understanding                                               |
| Negotiator    | Five lessons/quizzes, offer comparison, four-round practice, AI feedback, checklist and reports     | No live salary bands or outcome predictions                                                     |
| Career memory | Reusable Challenge–Action–Result stories                                                            | User verifies achievements                                                                      |
| Navigator     | Profile-aware role directions and 14-day roadmap                                                    | Model advice, not verified market intelligence                                                  |
| Influencer    | Story-based post drafts, editing, dates and copying                                                 | No automatic publishing or notifications                                                        |
| Hosting       | Browser IndexedDB and private WebGPU AI; public-data functions                                      | No account sync; hardware and free-plan limits apply                                            |
| Other tools   | Resume import/editor, keyword checks, cover letters, jobs, tracker, contacts and text interviews    | No OCR, private contact database, automatic applications, human coaching or voice/video scoring |

The blue interface adds opportunity tabs, company cards, a right copilot and responsive tool navigation. Recruitment contacts and archived jobs have dedicated views. Both hosted and desktop editions support portable backups.

## Historical 1.0 audit

The following records the original 15 October baseline. Its missing research, deck generation and hosting capabilities were superseded by the 1.1 coverage above.

**NewJob is a working local alternative, not a complete NxtJob replica.** Five advertised product categories and nine assistant roles have counterparts. Their depth and automation differ. Marketing descriptions do not establish how NxtJob's private backend works.

Reviewed 15 October 2026 against public product pages and the trial preview. “Implemented” below means the described NewJob behavior, not equivalence to the source product.

## Products

| Product                                                   | NewJob implementation                                                                                                                                                       | Remaining difference                                                                                                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Resume builder](https://nxtjob.ai/resume-builder)        | Editable profile; PDF/DOCX/TXT/MD text import; detected-section review; two templates; three accents; two spacing choices; local AI suggestions; TXT and browser PDF export | No drag-and-drop sections, two-column layouts, rich DOCX export or employer parser certification. Heading detection is deterministic and needs review.    |
| [ATS checker](https://nxtjob.ai/ats-resume-checker)       | Eight transparent content checks; keyword hits and gaps against a pasted job description; saved report; tailoring assistant                                                 | Heuristic text readiness only. No proprietary ATS integration or PDF layout analysis; no hiring prediction.                                               |
| [Cover letters](https://nxtjob.ai/cover-letter-generator) | Local model drafts from profile and role, three tones, editable saved documents, copy/text/PDF output                                                                       | Requires a downloaded Ollama model. Output quality varies and claims need review.                                                                         |
| [Job tracker](https://nxtjob.ai/job-tracker)              | Manual and Remotive job saves; five stages; follow-up dates; notes; contacts; company shortlist; dashboard counts                                                           | No Chrome extension, automatic daily job matches, Boolean query parser, weekly reports, notifications or calendar sync. Dates are visible reminders only. |
| [Mock interviews](https://nxtjob.ai/mock-interview)       | Text conversation with one question at a time, answer feedback, concluding assessment, conversation export                                                                  | No microphone/video capture, speech pace or filler analysis, posture/eye-contact analysis, or calibrated assessment scorecard.                            |

## Nine assistant roles

The [main website](https://nxtjob.ai/) advertises these roles. NewJob implements local conversational assistance, with no external execution tools.

| Advertised role | NewJob                 | Available                                                          | Not implemented                                              |
| --------------- | ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Nova            | Guide                  | Next-step coaching using profile and pipeline                      | Parallel orchestration or autonomous account actions         |
| Navigator       | Navigator              | Positioning, suitable roles and plans                              | Verified market intelligence                                 |
| Hunter          | Scout + Job board      | Search-query help, supplied-role analysis, sourced remote listings | Career-site crawling, hidden vacancies, autonomous discovery |
| Tailor          | Tailor                 | Resume rewrites using supplied experience                          | Guaranteed ATS outcomes                                      |
| Networker       | Connector + My network | Contact tracking and message drafts                                | Decision-maker discovery, email enrichment or sending        |
| Pitcher         | Pitch                  | Written slide outlines and experiment proposals                    | Live company research or slide-file generation               |
| Influencer      | Voice                  | LinkedIn post drafts and content plans                             | Scheduling or publishing                                     |
| Interviewer     | Practice               | Text rehearsal and feedback                                        | Voice/video evaluation                                       |
| Negotiator      | Advocate               | Counteroffer drafting and roleplay using supplied numbers          | Live salary bands or verified compensation benchmarks        |

## Other observed surfaces

The [trial preview](https://trial.nxtjob.ai/) exposed jobs, saved jobs, target companies, recruitment agencies, network and archived jobs. NewJob has companies and contacts; Closed is its archive-like application stage. It has **no recruitment-agency directory**. Coaching, bootcamps, success-story videos, editorial blogs and paid services are not recreated.

There is no cloud account, cross-device sync or hosted multi-user deployment. Local storage, backups, AI and document processing are deliberately used to keep this version free of recurring API charges.

## Roadmap

Potential contributions, not shipped promises: structured interview scorecards, additional accessible resume layouts, opt-in calendar exports, job-feed matching with explainable criteria, and a browser save extension. Voice/video evaluation and autonomous outreach need separate privacy and product design work.
