# Use NewJob

## First run

Install Node.js 22.13 or newer from [nodejs.org](https://nodejs.org/) and [Ollama](https://ollama.com/). Download a model once with `ollama pull qwen2.5:3b`. A model download needs internet and disk space. On the original development computer, Ollama and both Qwen 3B/7B models were already present.

From the project folder, run `npm ci`, then `npm start`. Open **http://127.0.0.1:4317**. On Windows you can instead double-click **Start NewJob.cmd**. The Windows launcher installs missing app dependencies and opens the browser; it does not download a model. Core tools work without Ollama; AI buttons need a running local model.

## A practical first session

1. **Overview → Set up my profile.** Add your target role, skills, real experience and contact details. Changes autosave; wait for “Saved on this device.”
2. **Resume builder.** Import a readable PDF, DOCX, TXT or Markdown resume. Open “Imported source text” and “Review detected sections.” Check before applying: heading detection may miss unusual layouts. Empty detected fields leave existing fields alone. Edit the structured resume, choose Modern/Classic, accent and spacing, then export text or Print / Save as PDF. Scanned image PDFs need OCR elsewhere or pasted text.
3. **Resume check.** Click “Use my resume,” paste a job description, and run the check. Missing keywords are prompts to review your experience, not instructions to invent qualifications. Save the report or ask Tailor for suggestions.
4. **Job board.** Load the public feed, filter and save a role. For roles on other websites, use “Add a job manually.” Click the source link to apply on the external site yourself.
5. **Applications.** Change the stage, add notes and set a follow-up date. This updates your private tracker; it does not submit an application or create a notification.
6. **Target companies / My network.** Keep research and contacts together. Connector can draft an introduction for a contact. Review and send it yourself.
7. **Cover letters.** Enter a company, role, job description and tone. Generate locally, save the draft, then open it in My documents to edit and export.
8. **Interview practice.** Ask Practice to interview you for a role. Answer each question. Ask “Finish the interview and summarize my feedback” when ready, then save the conversation.
9. **Settings & backup.** Export a JSON backup regularly. Restore replaces the current workspace after confirmation. Backups contain your personal information; store them privately.

## Assistant examples

| Assistant | Example request                                                          |
| --------- | ------------------------------------------------------------------------ |
| Guide     | “Plan three useful actions for my search this week.”                     |
| Navigator | “Which roles fit my experience? Explain the gaps.”                       |
| Scout     | “Create search queries for remote product roles using my skills.”        |
| Tailor    | “Improve these bullets for this pasted job description. Keep the facts.” |
| Connector | “Draft a short introduction to this contact using this shared context.”  |
| Pitch     | “Outline five slides proposing an experiment for this company problem.”  |
| Voice     | “Draft three LinkedIn posts from these real lessons.”                    |
| Practice  | “Interview me for Product Manager. Ask one question at a time.”          |
| Advocate  | “Help negotiate this offer using these compensation details.”            |

These are model instructions, not guaranteed capabilities. All assistants can make mistakes. They cannot browse, send messages or operate your accounts. Supplying source facts produces more useful answers than asking for unknown company or market information.

## Troubleshooting

**AI offline:** start Ollama, download a model, then Settings → Check connection. Select a local model. Cloud-tagged models are excluded. Try 3B first on a modest computer; 7B may be slower.

**Generation is slow:** a model's first load can take time. Stop and retry with a shorter prompt or smaller model. Requests time out after four minutes. Only one generation runs at a time.

**Another tab changed this workspace:** export a backup of your current tab, reload, then reconcile your changes. Conflict protection deliberately avoids silently overwriting newer data.

**Job feed unavailable:** retry later or add roles manually. The source can change or go offline. Filters are simple text/category filters, not a complete global job search.

**Printing:** your browser controls the PDF destination and pagination. Use A4 and review the print preview. Printed documents are selectable text, but employer parser compatibility is not certified.

**Moving computers:** export a JSON backup, install NewJob and Ollama on the new computer, then restore. AI models are separate downloads. Existing database files should only be copied when the server is stopped.

**Stop:** press Ctrl+C in the terminal running `npm start`. The Windows launcher runs a hidden server and records its process ID in `data/server.pid`; close the corresponding NewJob Node process in Task Manager. Do not expose the local port to the internet: this single-user app has no authentication.
