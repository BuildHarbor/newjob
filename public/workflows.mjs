import { newjobFetch as fetch, hosted } from "./transport.mjs";
import { safeUrl } from "./core.mjs";
import {
  negotiationLessons,
  negotiationQuestions,
  offerTotals,
  negotiationRubric,
} from "./workflow-core.mjs";

export function createWorkflows(a) {
  const {
    esc: e,
    icon,
    head,
    save,
    render,
    go,
    toast,
    api,
    download,
    printContent,
  } = a;
  const S = () => a.state(),
    uid = () => crypto.randomUUID(),
    now = () => new Date().toISOString();
  const b = (label, action, id = "", kind = "secondary") =>
    `<button type="button" class="btn ${kind}" data-wf="${action}" data-id="${e(id)}" ${busy ? "disabled" : ""}>${label}</button>`;
  const input = (label, name, value = "", type = "text", required = false) =>
    `<label>${label}<input name="${name}" type="${type}" value="${e(value)}" ${required ? "required" : ""} ${type === "number" ? 'min="0" step="any"' : ""}></label>`;
  const area = (label, name, value = "", rows = 4) =>
    `<label class="full">${label}<textarea name="${name}" rows="${rows}">${e(value)}</textarea></label>`;
  const select = (label, name, options, value) =>
    `<label>${label}<select name="${name}">${options.map(([id, t]) => `<option value="${e(id)}" ${id === value ? "selected" : ""}>${e(t)}</option>`).join("")}</select></label>`;
  const href = (url, label) =>
    safeUrl(url)
      ? `<a href="${e(safeUrl(url))}" target="_blank" rel="noopener noreferrer" class="text-link">${e(label)} ↗</a>`
      : `<span>${e(label)}</span>`;
  const notice = (t) => `<div class="notice">${t}</div>`;
  window.addEventListener("newjob-ai-progress", (event) => {
    const el = document.querySelector(".wf-progress > span:not(.spinner)");
    if (el) el.textContent = event.detail;
  });
  let directory = [],
    directoryPage = -1,
    directoryPages = 1,
    directoryDate = "",
    query = "",
    view = "saved",
    busy = "",
    stage = 0,
    cancel = null,
    error = "",
    activeOffer = "",
    lesson = 0,
    lessonResult = "",
    pitchDraft = {},
    researchDraft = {},
    postDraft = {},
    planDraft = {},
    answerDrafts = {};
  const done = () => {
    busy = "";
    cancel = null;
    render();
  };
  const run = async (label, fn) => {
    if (busy) return;
    busy = label;
    error = "";
    render();
    try {
      await fn();
    } catch (ex) {
      error =
        ex.name === "AbortError"
          ? "Stopped. Your saved work is safe."
          : ex.message;
      toast(error, true);
    } finally {
      done();
    }
  };
  async function ai(task, context) {
    cancel = new AbortController();
    render();
    const timer = setTimeout(() => cancel?.abort(), 300000);
    try {
      return await api("/api/structured", {
        method: "POST",
        signal: cancel.signal,
        body: JSON.stringify({ task, context, model: S().settings.model }),
      });
    } finally {
      clearTimeout(timer);
    }
  }
  const progress = () =>
    busy
      ? `<div class="wf-progress" role="status" aria-live="polite"><span class="spinner"></span><strong>${e(busy)}</strong><span>Working locally where AI is used. You can keep browsing.</span>${cancel ? '<button class="btn secondary small" data-wf="cancel">Stop</button>' : ""}</div>`
      : "";
  const message = () =>
    error ? `<div class="notice error" role="alert">${e(error)}</div>` : "";
  function companies() {
    const saved = S().companies;
    const list = (view === "discover" ? directory : saved).filter((c) =>
      [c.name, c.location, c.industry, c.notes]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
    const skills = (S().profile.skills || "")
      .toLowerCase()
      .split(/[,;\n]+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 2);
    return (
      head(
        "Target Companies",
        "Find companies worth your attention. Build a business case for the ones you choose.",
        `<button class="btn primary" data-action="add-company">+ Add company</button>`,
      ) +
      `<div class="wf-toolbar"><div class="segmented">${b("My targets · " + saved.length, "company-view", "saved", view === "saved" ? "primary" : "secondary")}${b("Discover companies", "company-view", "discover", view === "discover" ? "primary" : "secondary")}</div><label class="search-label">Search ${view === "discover" ? "loaded companies" : "my targets"}<input id="company-search" value="${e(query)}" placeholder="Name, location or industry"></label></div>` +
      (view === "discover"
        ? `<p class="small muted">Directory from ${href("https://www.themuse.com/companies", "The Muse")}. ${directoryDate ? "Fetched " + e(directoryDate) + ". " : ""}Coverage varies by region; these are company profiles, not verified vacancies. ${directory.length} loaded.</p>`
        : "") +
      `<div class="company-grid">${
        list
          .map((c) => {
            const isSaved = saved.some(
              (s) => s.id === c.id || s.name === c.name,
            );
            const matches = skills
              .filter((s) =>
                (c.notes + " " + c.industry).toLowerCase().includes(s),
              )
              .slice(0, 3);
            return `<article class="company-card"><div class="row between"><div class="company-logo">${e(c.name.slice(0, 2).toUpperCase())}</div><span class="target-status">${isSaved ? "✓ Targeted" : "○"}</span></div><h2>${e(c.name)}</h2><p class="small muted">${e(c.location || "Location not listed")}</p><div class="row wrap"><span class="pill">${e(c.industry || "Company")}</span>${c.size ? `<span class="pill">${e(c.size)}</span>` : ""}</div>${matches.length ? `<p class="match-reason">Matches your skills: ${e(matches.join(", "))}</p>` : ""}<p class="company-description">${e((c.notes || "Add context about what interests you here.").slice(0, 210))}</p><div class="row wrap small muted"><span>${S().jobs.filter((j) => j.company.toLowerCase() === c.name.toLowerCase() && j.stage !== "Closed").length} saved jobs</span><span>${S().contacts.filter((j) => j.company.toLowerCase() === c.name.toLowerCase()).length} connections</span></div><div class="company-actions">${isSaved ? `<a class="btn primary small" href="#company-${e(saved.find((s) => s.id === c.id || s.name === c.name).id)}">Research & pitch →</a>` : b("Add to targets", "target", c.id, "primary small")}${href(c.url, "Company profile")}</div></article>`;
          })
          .join("") ||
        `<div class="empty"><h3>${view === "discover" ? "Discover your next target" : "Your company shortlist starts here"}</h3><p>${view === "discover" ? "Load the free directory, then filter by company, location or industry." : "Discover companies or add any company you want to research."}</p>${b(view === "discover" ? "Load companies" : "Discover companies", view === "discover" ? "load-companies" : "company-view", "discover", "primary")}</div>`
      }</div>` +
      (view === "discover" &&
      directory.length &&
      directoryPage + 1 < directoryPages
        ? `<div class="form-actions">${b("Load more companies", "load-companies")}</div>`
        : "")
    );
  }
  function company(id) {
    const c = S().companies.find((c) => c.id === id);
    if (!c)
      return notice(
        'Company not found. <a href="#companies">Back to targets</a>',
      );
    const r = S()
      .research.filter((r) => r.companyId === id)
      .at(-1);
    const d = researchDraft[id] || {
      urls: c.url,
      notes: "",
      news: true,
      followLinks: true,
    };
    return (
      head(
        e(c.name),
        "Research → problem hypothesis → your evidence → Win Deck",
        `<a class="btn secondary" href="#companies">All targets</a><button class="btn secondary" data-edit-company="${e(id)}">Edit company</button>`,
      ) +
      `<div class="workflow-steps"><span class="active">1 · Gather evidence</span><span>2 · Find problems</span><span>3 · Build your pitch</span></div><section class="panel"><h2>Research this company</h2><p class="muted small">Read public pages and recent news headlines. Add job descriptions, reviews or report excerpts you have permission to use. Only company research queries and URLs go to external sources. ${hosted ? "Hosted research reads the first two URLs; paste other excerpts below." : ""}</p><form id="wf-research" data-id="${e(id)}"><div class="form-grid">${area("Public source URLs (one per line, up to 4)", "urls", d.urls, 3)}${area("Your evidence: job posts, reviews, earnings or other notes", "notes", d.notes, 4)}<label class="check-label"><input type="checkbox" name="news" ${d.news ? "checked" : ""}> Include recent news headlines</label><label class="check-label"><input type="checkbox" name="followLinks" ${d.followLinks ? "checked" : ""} ${hosted ? "disabled" : ""}> Read related public pages ${hosted ? "(desktop only)" : ""}</label></div><div class="form-actions"><button class="btn primary" ${busy ? "disabled" : ""}>Gather sources & identify problems</button>${b("Gather sources only", "sources-only", id)}</div></form></section>` +
      (r
        ? `<section class="panel"><div class="section-head"><h2>Problems to investigate</h2><span class="pill">${e(new Date(r.created).toLocaleDateString())}</span></div><p class="muted">${e(r.summary || "Sources saved. Add a problem hypothesis below, or rerun with local AI.")}</p>${notice("These are proposed problems, not established facts about the company. Quotes are checked against the saved text; a matching quote does not prove the hypothesis.")}<div class="problem-grid">${r.problems
            .map(
              (p, i) =>
                `<article class="problem-card"><span class="eyebrow">Hypothesis ${i + 1}</span><h3>${e(p.title)}</h3><p>${e(p.hypothesis)}</p><p><strong>Potential impact</strong><br>${e(p.impact)}</p><p><strong>Test it</strong><br>${e(p.experiment)}</p><p><strong>Measure</strong><br>${e(p.metric)}</p><div class="evidence">${
                  p.evidence.length
                    ? p.evidence
                        .map((ev) => {
                          const s = r.sources.find((s) => s.id === ev.sourceId);
                          return `<blockquote>“${e(ev.quote)}”</blockquote><p class="small">${href(s?.url, s?.title || ev.sourceId)}</p>`;
                        })
                        .join("")
                    : '<span class="small">No matching source quote. Validate this assumption first.</span>'
                }</div>${b("Build a Win Deck →", "pitch-problem", r.id + ":" + p.id, "primary")}</article>`,
            )
            .join(
              "",
            )}</div><details><summary>Add your own problem hypothesis</summary><form id="wf-problem" data-id="${e(r.id)}"><div class="form-grid">${input("Problem title", "title", "", "text", true)}${input("Success measure", "metric", "", "text", true)}${area("Hypothesis to validate", "hypothesis")}${area("Why it could matter", "impact")}${area("Small experiment", "experiment")}</div><button class="btn primary">Add hypothesis</button></form></details></section><section class="panel"><h2>Research sources · ${r.sources.length}</h2><div class="source-tabs">Public pages · News · Job posts · Reviews · Earnings · Your notes</div>${r.warnings.map((w) => notice(e(w))).join("")}${r.sources.map((s) => `<details class="source"><summary>${e(s.title)} <span class="pill">${e(s.kind)}</span></summary><p>${href(s.url, "Open original source")}</p><p class="small muted">Saved ${e(new Date(s.retrieved).toLocaleString())}</p><pre class="source-text">${e(s.text)}</pre></details>`).join("") || "<p>No sources could be read. Paste a relevant excerpt and try again.</p>"}</section>`
        : "")
    );
  }
  function pitcher() {
    const d = pitchDraft;
    return (
      head(
        "Pitcher · Your Win Deck",
        "Turn a company opportunity into a credible proposal, with your real career evidence.",
      ) +
      `<section class="panel"><div class="workflow-steps"><span>1 · Career highlights</span><span>2 · Images & content</span><span>3 · Story & visuals</span><span>4 · Your Win Deck</span></div><form id="wf-pitch"><div class="form-grid">${select("Target company", "companyId", [["", "Choose a target company"], ...S().companies.map((c) => [c.id, c.name])], d.companyId || "")}${select("Saved job (optional)", "jobId", [["", "No specific job"], ...S().jobs.map((j) => [j.id, j.company + " — " + j.title])], d.jobId || "")}${input("Target role", "role", d.role || S().profile.role)}${input("Audience", "audience", d.audience || "Hiring manager")}${select(
        "Company research",
        "researchId",
        [
          ["", "Use my own hypothesis"],
          ...S()
            .research.filter((r) => !d.companyId || r.companyId === d.companyId)
            .map((r) => [
              r.id,
              r.company + " · " + new Date(r.created).toLocaleDateString(),
            ]),
        ],
        d.researchId || "",
      )}${area("Problem to investigate", "problem", d.problem || "")}${area("Your proposed approach and tone", "instructions", d.instructions || "")}${area("Career highlights to use (or add reusable stories in Career evidence)", "highlights", d.highlights || "")}</div><label>Supporting images (PNG/JPG, up to 4; 300 KB each)<input type="file" id="pitch-images" accept="image/png,image/jpeg" multiple></label><div class="image-inputs">${(d.images || []).map((im, i) => `<div><img src="${im.data}" alt="Supporting visual ${i + 1}"><label>Caption and context<input data-image-caption="${i}" value="${e(im.caption)}"></label>${b("Remove", "remove-image", String(i), "secondary small")}</div>`).join("")}</div><p class="small muted">Only your supplied achievements are used. Images stay on this device and are embedded in exports; the text model uses their captions.</p><div class="form-actions"><button class="btn primary" ${busy ? "disabled" : ""}>Build my Win Deck</button>${b("Start with an editable outline", "starter-deck")}${b("Add career evidence", "go", "stories")}</div></form></section>` +
      (busy.startsWith("Building")
        ? `<section class="deck-building"><div class="build-mark">${icon("presentation")}</div><h2>Building your Win Deck…</h2><p>Turning your experience and research into a useful conversation.</p>${["Collecting your career highlights", "Preparing your images & content", "Building your story & visuals", "Saving your Win Deck"].map((x, i) => `<div class="build-step ${i === stage ? "current" : ""}"><span>${i < stage ? "✓" : i === stage ? "◌" : "○"}</span>${x}<small>0${i + 1}</small></div>`).join("")}</section>`
        : "") +
      `<section class="panel"><h2>Your Win Decks</h2>${
        S().decks.length
          ? S()
              .decks.slice()
              .reverse()
              .map(
                (d) =>
                  `<a class="tool-link" href="#deck-${e(d.id)}"><div class="tool-icon">${icon("presentation")}</div><div class="grow"><h3>${e(d.title)}</h3><p>${e(d.company)} · ${d.slides.length} slides · ${e(new Date(d.created).toLocaleDateString())}</p></div>${icon("arrow")}</a>`,
              )
              .join("")
          : '<p class="muted">Your saved decks will appear here.</p>'
      }</section>`
    );
  }
  function deck(id) {
    const d = S().decks.find((d) => d.id === id);
    if (!d)
      return notice('Deck not found. <a href="#pitcher">Back to Pitcher</a>');
    const r = S().research.find((r) => r.id === d.researchId);
    return (
      head(
        e(d.title),
        "Edit every slide, keep the sources, and make the proposal your own.",
        `<a class="btn secondary" href="#pitcher">All decks</a>${b("PowerPoint", "export-pptx", id, "primary")}${b("Print / PDF", "print-deck", id)}${b("HTML", "export-html", id)}`,
      ) +
      `<div class="notice">Review the proposal before sharing. Validate assumptions, confirm every achievement, and remove private information. The exported PowerPoint remains editable.</div><label class="deck-title">Deck title<input data-deck="${id}" data-field="title" value="${e(d.title)}"></label><div class="deck-editor">${d.slides
        .map(
          (s, i) =>
            `<section class="slide-editor"><div class="slide-preview ${i === 0 ? "cover-slide" : ""}"><div class="slide-brand">NewJob / ${e(d.company)}</div><h2>${e(s.title)}</h2><div class="slide-layout"><p>${e(s.body)}</p>${d.images[s.imageIndex] ? `<figure><img src="${d.images[s.imageIndex].data}" alt="${e(d.images[s.imageIndex].caption)}"><figcaption>${e(d.images[s.imageIndex].caption)}</figcaption></figure>` : ""}</div><span class="slide-number">${i + 1} / ${d.slides.length}</span></div><details><summary>Edit slide ${i + 1} · text, visual and speaker notes</summary><div class="stack"><label>Slide title<input data-deck="${id}" data-slide="${i}" data-field="title" value="${e(s.title)}"></label><label>Slide content<textarea rows="6" data-deck="${id}" data-slide="${i}" data-field="body">${e(s.body)}</textarea></label><label>Speaker notes<textarea rows="3" data-deck="${id}" data-slide="${i}" data-field="notes">${e(s.notes)}</textarea></label><label>Visual<select data-deck="${id}" data-slide="${i}" data-field="imageIndex"><option value="-1">No image</option>${d.images.map((im, j) => `<option value="${j}" ${s.imageIndex === j ? "selected" : ""}>${e(im.caption || "Image " + (j + 1))}</option>`).join("")}</select></label><p class="small">Sources: ${
              s.sourceIds
                .map((id) => {
                  const src = r?.sources.find((s) => s.id === id);
                  return href(src?.url, src?.title || id);
                })
                .join(" · ") || "No cited source"
            }</p>${b("Refresh preview", "refresh")}</div></details></section>`,
        )
        .join("")}</div>`
    );
  }
  function stories() {
    return (
      head(
        "Career evidence",
        "Build a reusable Challenge → Action → Result library for resumes, interviews and pitches.",
      ) +
      `<section class="panel"><form id="wf-story"><div class="form-grid">${input("Story title", "title", "", "text", true)}${input("Skills demonstrated", "skills")}${area("Challenge / context", "challenge")}${area("What you personally did", "action")}${area("Result (include real numbers when available)", "result")}${input("Evidence link (optional)", "evidenceUrl", "", "url")}</div><div class="form-actions"><button class="btn primary">Save career story</button></div></form></section><div class="company-grid">${S()
        .stories.map(
          (s) =>
            `<article class="panel"><h2>${e(s.title)}</h2><p><strong>Challenge</strong><br>${e(s.challenge)}</p><p><strong>Action</strong><br>${e(s.action)}</p><p><strong>Result</strong><br>${e(s.result)}</p><span class="pill">${e(s.skills)}</span><p>${href(s.evidenceUrl, "Evidence")}</p><details><summary>Edit this story</summary><form id="wf-story-edit-${s.id}" data-story-id="${s.id}">${input("Title", "title", s.title)}${area("Challenge", "challenge", s.challenge)}${area("Action", "action", s.action)}${area("Result", "result", s.result)}${input("Skills", "skills", s.skills)}${input("Evidence URL", "evidenceUrl", s.evidenceUrl, "url")}<button class="btn primary">Save changes</button></form></details>${b("Delete story", "delete-story", s.id, "danger small")}</article>`,
        )
        .join("")}</div>`
    );
  }
  function negotiator() {
    const offers = S().offers;
    const o = offers.find((o) => o.id === activeOffer) || offers.at(-1);
    const l = negotiationLessons[lesson];
    const t = o && offerTotals(o);
    return (
      head(
        "Negotiator · Prepare for the conversation",
        "Learn the principles, compare the full offer, then practice handling real pushback.",
      ) +
      `<section class="panel"><div class="section-head"><h2>Learn to negotiate</h2><span class="pill">Lesson ${lesson + 1} of ${negotiationLessons.length}</span></div><div class="lesson-tabs">${negotiationLessons.map((l, i) => b(String(i + 1), "lesson", String(i), i === lesson ? "primary small" : "secondary small")).join("")}</div><h3>${e(l.title)}</h3><p>${e(l.text)}</p><fieldset class="quiz"><legend>${e(l.question)}</legend>${l.choices.map((c, i) => b(c, "quiz", String(i), "secondary")).join("")}</fieldset>${lessonResult ? notice(e(lessonResult)) : ""}<p class="small muted">Further reading: ${href("https://www.pon.harvard.edu/tag/salary-negotiation/", "Harvard Program on Negotiation")}</p></section>` +
      `<section class="panel"><h2>Offer worksheet</h2><p class="small muted">Use annual amounts in one currency. Variable pay is not guaranteed; equity is shown separately. No market salary estimates are invented.</p><form id="wf-offer"><div class="form-grid">${input("Company", "company", "", "text", true)}${input("Role", "role", S().profile.role)}${input("Currency (e.g. INR / USD)", "currency", "INR", "text", true)}${input("Annual base", "base", "", "number", true)}${input("Annual target variable pay", "variable", "0", "number")}${input("One-time joining bonus", "joining", "0", "number")}${input("Annual equity estimate (optional)", "equity", "0", "number")}${input("Target annual base", "target", "", "number", true)}${input("Private minimum annual base", "minimum", "", "number")}${area("Your alternatives if this does not work out", "alternatives")}${area("Evidence supporting your ask", "evidence")}${area("Benefits, flexibility and conditions to clarify", "benefits")}</div><div class="form-actions"><button class="btn primary">Save offer & practice</button></div></form></section>` +
      (offers.length
        ? `<section class="panel"><h2>Compare your offers</h2><div class="table-wrap"><table><thead><tr><th>Company</th><th>Currency</th><th>Annual base</th><th>Potential annual cash</th><th>First-year potential cash</th><th>Equity estimate</th><th></th></tr></thead><tbody>${offers
            .map((o) => {
              const t = offerTotals(o);
              return `<tr><td>${e(o.company)}</td><td>${e(o.currency)}</td><td>${t.base.toLocaleString()}</td><td>${t.potentialAnnualCash.toLocaleString()}</td><td>${t.firstYearPotentialCash.toLocaleString()}</td><td>${t.equity.toLocaleString()}</td><td>${b("Practice", "choose-offer", o.id, "secondary small")}</td></tr>`;
            })
            .join(
              "",
            )}</tbody></table></div><p class="small muted">Do not compare currencies directly. First-year cash includes the one-time bonus; neither cash total includes equity. Check payout conditions.</p></section>`
        : "") +
      (o
        ? `<section class="panel negotiation-room"><div class="section-head"><div><span class="eyebrow">Practice session</span><h2>Negotiate your offer — ${e(o.company)}</h2></div><span class="pill">${Math.min(o.rounds.length + 1, 4)} / 4 rounds</span></div><div class="offer-summary"><strong>${e(o.currency)} ${t.base.toLocaleString()} base → ${t.counterIncrease >= 0 ? "+" : ""}${t.counterIncrease.toLocaleString()} requested</strong><span>Target ${Number(o.target).toLocaleString()} · ${t.counterPercent === null ? "Set a base to compare" : t.counterPercent.toFixed(1) + "% change"}</span></div>${o.rounds.map((r, i) => `<article class="practice-round"><span class="eyebrow">Round ${i + 1}</span><h3>${e(r.question)}</h3><p class="candidate-answer">${e(r.answer)}</p><p><strong>Coach feedback</strong><br>${e(r.feedback)}</p>${r.reply ? `<p><strong>Manager response (simulation)</strong><br>${e(r.reply)}</p>` : ""}<span class="pill">${r.score}/4 wording checks</span></article>`).join("")}${o.rounds.length < 4 ? `<div class="manager-prompt"><div class="tool-icon">${icon("mic")}</div><h3>${e(negotiationQuestions[o.rounds.length])}</h3>${b("Read prompt aloud", "speak", o.id, "secondary small")}</div><form id="wf-answer" data-id="${o.id}">${area("Your response", "answer", answerDrafts[o.id] || "", 5)}<p class="small muted">Rehearse aloud, then type or use your device’s dictation. Local AI gives a manager reply; the free wording checklist works without AI.</p><div class="form-actions"><button class="btn primary" ${busy ? "disabled" : ""}>Get AI feedback & continue</button>${b("Use wording checklist", "rubric-answer", o.id)}</div></form>` : `<div class="notice"><strong>Practice complete.</strong> Review which answers gave a specific ask, evidence, collaborative wording and another option. These checks assess wording, not your probability of securing an offer.</div>${b("Download practice report", "offer-report", o.id, "primary")}${b("Start a fresh practice", "reset-offer", o.id)}`}<details><summary>Edit offer details</summary><form id="wf-offer-edit" data-id="${o.id}"><div class="form-grid">${["company", "role", "currency", "base", "variable", "joining", "equity", "target", "minimum", "alternatives", "evidence", "benefits"].map((k) => input(k[0].toUpperCase() + k.slice(1), k, o[k], ["base", "variable", "joining", "equity", "target", "minimum"].includes(k) ? "number" : "text")).join("")}</div><button class="btn primary">Save details</button></form></details></section>`
        : "")
    );
  }
  function roadmap() {
    return (
      head(
        "Your career roadmap",
        "Choose a direction and turn it into specific actions over the next two weeks.",
      ) +
      `<section class="panel"><form id="wf-plan">${area("What do you want from your next role? Constraints, interests and priorities", "priorities", planDraft.priorities || "")}<p class="muted small">Uses your career profile and saved evidence. Complete your profile for a useful plan.</p><button class="btn primary" ${busy ? "disabled" : ""}>Build my 14-day plan</button></form></section>${S()
        .plans.slice()
        .reverse()
        .map(
          (p) =>
            `<section class="panel"><h2>${e(p.title)}</h2><pre class="source-text">${e(p.content)}</pre>${b("Download plan", "plan-download", p.id)}</section>`,
        )
        .join("")}`
    );
  }
  function posts() {
    return (
      head(
        "Your professional voice",
        "Draft useful posts from your real experience. Plan publication dates and publish when ready.",
      ) +
      `<section class="panel"><form id="wf-post"><div class="form-grid">${select("Career story", "storyId", [["", "Choose a story"], ...S().stories.map((s) => [s.id, s.title])], postDraft.storyId || "")}${input("Topic or lesson", "topic", postDraft.topic || "")}${input("Voice", "voice", postDraft.voice || "Clear, thoughtful and practical")}${input("Planned date", "date", postDraft.date || "", "date")}</div><div class="form-actions"><button class="btn primary" ${busy ? "disabled" : ""}>Draft a post</button>${b("Create blank draft", "blank-post")}</div></form></section><div class="company-grid">${S()
        .posts.slice()
        .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))
        .map(
          (p) =>
            `<article class="panel"><form id="wf-post-edit-${p.id}" data-post-id="${p.id}">${input("Title", "title", p.title)}${area("Post", "content", p.content, 9)}${input("Planned date", "date", p.date, "date")}${select(
              "Status",
              "status",
              [
                ["Draft", "Draft"],
                ["Ready", "Ready"],
                ["Published", "Published"],
              ],
              p.status,
            )}<div class="form-actions"><button class="btn primary small">Save draft</button>${b("Copy", "copy-post", p.id, "secondary small")}${b("Delete", "delete-post", p.id, "danger small")}</div></form></article>`,
        )
        .join("")}</div>`
    );
  }
  function agencies() {
    return (
      head(
        "Recruitment agencies",
        "Keep recruiters and search firms in your network, with a clear follow-up date.",
      ) +
      notice(
        "Add an agency contact with its public profile and your notes. NewJob does not invent recruiter identities or private email addresses.",
      ) +
      `<section class="panel"><h2>Your recruitment contacts</h2><p class="muted">Use “Recruiter” or “Agency” in the contact role to include it here.</p><button class="btn primary" data-action="add-contact">+ Add recruiter</button>${S()
        .contacts.filter((c) =>
          /recruit|agency|talent|search firm/i.test(c.role),
        )
        .map(
          (c) =>
            `<a href="#network" class="tool-link"><strong>${e(c.name)}</strong><span>${e(c.company)} · ${e(c.status)}</span></a>`,
        )
        .join("")}</section>`
    );
  }
  function archived() {
    return (
      head(
        "Archived Jobs",
        "Closed opportunities stay available for reflection and future conversations.",
      ) +
      `<section class="panel">${
        S()
          .jobs.filter((j) => j.stage === "Closed")
          .map(
            (j) =>
              `<div class="tool-link"><div class="grow"><h3>${e(j.title)}</h3><p>${e(j.company)}</p></div>${b("Reopen", "reopen", j.id, "secondary small")}</div>`,
          )
          .join("") ||
        '<p class="muted">No archived opportunities yet. Set an application to Closed in My Jobs to archive it.</p>'
      }</section>`
    );
  }
  function page(route) {
    let content;
    if (route === "companies") content = companies();
    else if (route.startsWith("company-")) content = company(route.slice(8));
    else if (route === "pitcher") content = pitcher();
    else if (route.startsWith("deck-")) content = deck(route.slice(5));
    else if (route === "stories") content = stories();
    else if (route === "negotiator") content = negotiator();
    else if (route === "roadmap") content = roadmap();
    else if (route === "posts") content = posts();
    else if (route === "agencies") content = agencies();
    else if (route === "archived") content = archived();
    else return null;
    return message() + progress() + content;
  }
  async function gather(id, analyze) {
    const c = S().companies.find((c) => c.id === id);
    const d = researchDraft[id] || {
      urls: c.url,
      news: true,
      followLinks: true,
    };
    await run("Reading company sources…", async () => {
      const result = await api("/api/research", {
        method: "POST",
        body: JSON.stringify({
          company: c.name,
          urls: (d.urls || "")
            .split(/\n/)
            .map((s) => s.trim())
            .filter(Boolean),
          notes: d.notes || "",
          description: c.notes,
          sourceUrl: c.url,
          news: !!d.news,
          followLinks: !!d.followLinks,
        }),
      });
      const r = {
        id: uid(),
        companyId: id,
        company: c.name,
        created: now(),
        summary: "",
        problems: [],
        ...result,
      };
      S().research.push(r);
      save();
      if (!r.sources.length)
        throw Error(
          "No readable sources found. Add an excerpt or another public page.",
        );
      if (analyze) {
        busy = "Identifying evidence-backed hypotheses…";
        render();
        const out = await ai("research", {
          company: c.name,
          profile: { role: S().profile.role, skills: S().profile.skills },
          sources: r.sources.map((s) => ({
            ...s,
            text: s.text.slice(0, 4500),
          })),
        });
        Object.assign(r, out);
        save();
      }
      toast("Research saved. Review the sources before choosing a hypothesis.");
    });
  }
  function pitchContext() {
    const d = pitchDraft,
      c = S().companies.find((c) => c.id === d.companyId);
    if (!c) throw Error("Choose a target company first.");
    const job = S().jobs.find((j) => j.id === d.jobId);
    if (job && job.company.toLowerCase() !== c.name.toLowerCase())
      throw Error("Choose a job at the selected company.");
    const r = S().research.find((r) => r.id === d.researchId);
    if (r && r.companyId !== c.id)
      throw Error("Choose research for the selected company.");
    return {
      company: c.name,
      companyId: c.id,
      role: d.role || job?.title || S().profile.role,
      audience: d.audience || "Hiring manager",
      problem: d.problem || "",
      instructions: d.instructions || "",
      highlights: d.highlights || "",
      profile: S().profile,
      stories: S().stories.slice(-8),
      job: job || null,
      sources: (r?.sources || []).map((s) => ({
        ...s,
        text: s.text.slice(0, 2500),
      })),
      images: (d.images || []).map((im) => ({ caption: im.caption })),
      researchId: r?.id || "",
    };
  }
  async function buildDeck(starter = false) {
    await run("Building your Win Deck…", async () => {
      stage = 0;
      render();
      const ctx = pitchContext();
      if (!ctx.problem.trim())
        throw Error(
          "Describe a problem hypothesis, or choose one from company research.",
        );
      stage = 1;
      render();
      const images = structuredClone(pitchDraft.images || []);
      stage = 2;
      render();
      const result = starter
        ? {
            title: "A proposal for " + ctx.company,
            slides: [
              {
                title: "An opportunity to explore",
                body: ctx.problem,
                notes:
                  "This is a hypothesis to validate, not a confirmed company problem.",
              },
              {
                title: "What the evidence tells us",
                body:
                  ctx.sources
                    .map((s) => s.title)
                    .slice(0, 4)
                    .join("\n") || "Add verified company evidence.",
                notes:
                  "Review the original sources and explain what remains uncertain.",
                sourceIds: ctx.sources.slice(0, 4).map((s) => s.id),
              },
              {
                title: "A small, testable solution",
                body:
                  ctx.instructions ||
                  "Describe a small experiment, owner, timescale and success measure.",
                notes: "State proposed targets as proposals.",
              },
              {
                title: "Why I can help",
                body:
                  ctx.highlights ||
                  ctx.stories
                    .map((s) => s.action + " → " + s.result)
                    .join("\n") ||
                  "Add your real career evidence.",
                notes: "Use only achievements you can substantiate.",
              },
              {
                title: "The first 30 days",
                body: "Week 1: validate the problem with the team.\nWeek 2: agree on one experiment.\nWeek 3: run the smallest useful test.\nWeek 4: review results and decide the next step.",
                notes: "Adapt to the company and available resources.",
              },
              {
                title: "Let’s discuss the opportunity",
                body: "What would make this proposal useful for your team?\nWhich assumptions should I test first?",
                notes: "Invite feedback and a concrete next conversation.",
              },
            ],
          }
        : await ai("deck", ctx);
      stage = 3;
      render();
      const deck = {
        id: uid(),
        title: result.title,
        companyId: ctx.companyId,
        company: ctx.company,
        role: ctx.role,
        audience: ctx.audience,
        researchId: ctx.researchId,
        created: now(),
        updated: now(),
        images,
        slides: result.slides.map((s, i) => ({
          ...s,
          notes: s.notes || "",
          sourceIds: s.sourceIds || [],
          imageIndex:
            s.imageIndex ?? (i > 0 && i <= images.length ? i - 1 : -1),
        })),
      };
      S().decks.push(deck);
      save();
      go("deck-" + deck.id);
      toast(
        starter
          ? "Editable outline saved. Complete and verify the slides."
          : "Win Deck saved. Review and edit it before sharing.",
      );
    });
  }
  async function answer(id, useAI) {
    const f = document.querySelector("#wf-answer"),
      answer = String(new FormData(f).get("answer") || "").trim();
    if (answer.length < 15)
      return toast("Give a response with at least 15 characters.", true);
    const o = S().offers.find((o) => o.id === id);
    if (o.rounds.length >= 4) return;
    await run(
      useAI
        ? "Your negotiation coach is reviewing…"
        : "Checking your response…",
      async () => {
        const question = negotiationQuestions[o.rounds.length],
          rubric = negotiationRubric(answer);
        let feedback = rubric.checks
            .map((c) => (c.pass ? "✓ " : "Try: ") + (c.pass ? c.label : c.tip))
            .join("\n"),
          reply = "";
        if (useAI) {
          const out = await ai("negotiation", { offer: o, question, answer });
          feedback = out.feedback + "\n\n" + feedback;
          reply = out.reply;
        }
        answerDrafts[id] = "";
        o.rounds.push({
          question,
          answer,
          feedback,
          reply,
          score: rubric.score,
        });
        save();
      },
    );
  }
  function htmlDeck(d) {
    return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(d.title)}</title><style>body{font:20px system-ui;background:#edf1f7;color:#182236;margin:0}section{box-sizing:border-box;max-width:1100px;min-height:600px;background:white;padding:60px;margin:30px auto;break-after:page}h1{font-size:40px}p{white-space:pre-wrap;line-height:1.6}img{max-width:45%;max-height:280px}small{color:#59657c}@media print{body{background:white}section{margin:0;min-height:0;height:95vh}}</style>${d.slides
      .map((s, i) => {
        const r = S().research.find((r) => r.id === d.researchId);
        return `<section><small>NewJob / ${e(d.company)} / ${i + 1}</small><h1>${e(s.title)}</h1><p>${e(s.body)}</p>${d.images[s.imageIndex] ? `<img src="${d.images[s.imageIndex].data}" alt="${e(d.images[s.imageIndex].caption)}"><p><small>${e(d.images[s.imageIndex].caption)}</small></p>` : ""}<p><small>${s.sourceIds
          .map((id) => {
            const src = r?.sources.find((x) => x.id === id);
            return href(src?.url, src?.title || id);
          })
          .join(" · ")}</small></p></section>`;
      })
      .join("")}</html>`;
  }
  document.addEventListener("input", (ev) => {
    const el = ev.target,
      f = el.closest("form");
    if (el.id === "company-search") {
      query = el.value;
      const pos = el.selectionStart;
      render();
      const fresh = document.querySelector("#company-search");
      fresh?.focus();
      fresh?.setSelectionRange(pos, pos);
      return;
    }
    if (el.dataset.deck) {
      const d = S().decks.find((d) => d.id === el.dataset.deck);
      const s =
        el.dataset.slide !== undefined ? d.slides[Number(el.dataset.slide)] : d;
      s[el.dataset.field] =
        el.dataset.field === "imageIndex" ? Number(el.value) : el.value;
      d.updated = now();
      save();
      return;
    }
    if (el.dataset.imageCaption !== undefined) {
      pitchDraft.images[Number(el.dataset.imageCaption)].caption = el.value;
      return;
    }
    if (!f?.id.startsWith("wf-")) return;
    const data = Object.fromEntries(new FormData(f));
    if (f.id === "wf-pitch") Object.assign(pitchDraft, data);
    if (f.id === "wf-research")
      researchDraft[f.dataset.id] = {
        ...data,
        news: f.elements.news.checked,
        followLinks: f.elements.followLinks.checked,
      };
    if (f.id === "wf-plan") planDraft = data;
    if (f.id === "wf-post") postDraft = data;
    if (f.id === "wf-answer") answerDrafts[f.dataset.id] = data.answer;
  });
  document.addEventListener("change", async (ev) => {
    const el = ev.target;
    if (el.id === "pitch-images") {
      try {
        const files = [...el.files];
        if (files.length + (pitchDraft.images || []).length > 4)
          throw Error("Use at most four images.");
        const images = [];
        for (const f of files) {
          if (!["image/png", "image/jpeg"].includes(f.type) || f.size > 300000)
            throw Error("Choose PNG/JPG images under 300 KB each.");
          const data = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(f);
          });
          images.push({ data, caption: f.name.replace(/\.[^.]+$/, "") });
        }
        pitchDraft.images = [...(pitchDraft.images || []), ...images];
        render();
      } catch (ex) {
        toast(ex.message, true);
      }
    }
    if (el.name === "companyId" && el.closest("#wf-pitch")) {
      pitchDraft.researchId = "";
      pitchDraft.jobId = "";
      pitchDraft.problem = "";
      render();
    }
  });
  document.addEventListener("submit", async (ev) => {
    const f = ev.target;
    if (!f.id.startsWith("wf-")) return;
    ev.preventDefault();
    if (busy) return toast("Please wait for the current task.", true);
    const d = Object.fromEntries(new FormData(f));
    try {
      if (f.id === "wf-research") {
        researchDraft[f.dataset.id] = {
          ...d,
          news: f.elements.news.checked,
          followLinks: f.elements.followLinks.checked,
        };
        await gather(f.dataset.id, true);
      } else if (f.id === "wf-pitch") {
        Object.assign(pitchDraft, d);
        await buildDeck();
      } else if (f.id === "wf-problem") {
        const r = S().research.find((r) => r.id === f.dataset.id);
        if (r.problems.length >= 8)
          throw Error("Keep up to eight hypotheses per research note.");
        r.problems.push({ id: uid(), ...d, evidence: [] });
        save();
        render();
      } else if (f.id === "wf-story") {
        S().stories.push({ id: uid(), created: now(), ...d });
        save();
        render();
        toast("Career evidence saved.");
      } else if (f.dataset.storyId) {
        Object.assign(
          S().stories.find((s) => s.id === f.dataset.storyId),
          d,
        );
        save();
        toast("Story updated.");
      } else if (f.id === "wf-offer") {
        const o = { id: uid(), created: now(), rounds: [], ...d };
        S().offers.push(o);
        activeOffer = o.id;
        save();
        render();
        document
          .querySelector(".negotiation-room")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (f.id === "wf-offer-edit") {
        Object.assign(
          S().offers.find((o) => o.id === f.dataset.id),
          d,
        );
        save();
        render();
      } else if (f.id === "wf-answer") await answer(f.dataset.id, true);
      else if (f.id === "wf-plan")
        await run("Building your career roadmap…", async () => {
          const out = await ai("plan", {
            profile: S().profile,
            stories: S().stories,
            priorities: d.priorities,
          });
          S().plans.push({ id: uid(), created: now(), ...out });
          save();
        });
      else if (f.id === "wf-post")
        await run("Drafting from your experience…", async () => {
          const story = S().stories.find((s) => s.id === d.storyId);
          if (!story) throw Error("Choose a career story first.");
          const out = await ai("post", {
            story,
            topic: d.topic,
            voice: d.voice,
          });
          S().posts.push({
            id: uid(),
            created: now(),
            date: d.date,
            status: "Draft",
            ...out,
          });
          save();
        });
      else if (f.dataset.postId) {
        Object.assign(
          S().posts.find((p) => p.id === f.dataset.postId),
          d,
        );
        save();
        toast("Draft saved.");
      }
    } catch (ex) {
      toast(ex.message, true);
    }
  });
  document.addEventListener("click", async (ev) => {
    const el = ev.target.closest("[data-wf]");
    if (!el) return;
    const id = el.dataset.id,
      act = el.dataset.wf;
    try {
      if (act === "cancel") {
        cancel?.abort();
        return;
      }
      if (busy) return;
      if (act === "go") go(id);
      else if (act === "refresh") render();
      else if (act === "company-view") {
        view = id;
        query = "";
        render();
      } else if (act === "load-companies")
        await run("Loading company directory…", async () => {
          const result = await api(
            "/api/companies?page=" + (directoryPage + 1),
          );
          directory.push(
            ...result.companies.filter(
              (c) => !directory.some((d) => d.id === c.id),
            ),
          );
          directoryPage = result.page;
          directoryPages = result.pageCount;
          directoryDate = new Date(result.fetched).toLocaleDateString();
          view = "discover";
          if (result.stale)
            toast(
              "Showing cached directory; provider is temporarily unavailable.",
            );
        });
      else if (act === "target") {
        const c = directory.find((c) => c.id === id);
        if (!S().companies.some((s) => s.id === c.id || s.name === c.name)) {
          S().companies.push({ ...c, created: now() });
          save();
        }
        render();
        toast("Added to target companies.");
      } else if (act === "sources-only") await gather(id, false);
      else if (act === "pitch-problem") {
        const [rid, pid] = id.split(":"),
          r = S().research.find((r) => r.id === rid),
          p = r.problems.find((p) => p.id === pid);
        pitchDraft = {
          companyId: r.companyId,
          researchId: rid,
          problem:
            p.title + "\n" + p.hypothesis + "\nPotential impact: " + p.impact,
          instructions: p.experiment + "\nMeasure: " + p.metric,
        };
        go("pitcher");
      } else if (act === "starter-deck") await buildDeck(true);
      else if (act === "remove-image") {
        pitchDraft.images.splice(Number(id), 1);
        render();
      } else if (act === "export-pptx")
        await run("Preparing editable PowerPoint…", async () => {
          const deck = S().decks.find((d) => d.id === id),
            r = S().research.find((r) => r.id === deck.researchId);
          const res = await fetch("/api/export/deck", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deck, sources: r?.sources || [] }),
          });
          if (!res.ok) throw Error((await res.json()).error);
          download(
            "NewJob-Win-Deck.pptx",
            await res.blob(),
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          );
          toast("PowerPoint downloaded.");
        });
      else if (act === "export-html")
        download(
          "NewJob-Win-Deck.html",
          htmlDeck(S().decks.find((d) => d.id === id)),
          "text/html",
        );
      else if (act === "print-deck") {
        const d = S().decks.find((d) => d.id === id);
        printContent(
          d.slides
            .map(
              (s) =>
                `<section class="print-slide"><h1>${e(s.title)}</h1><p style="white-space:pre-wrap">${e(s.body)}</p>${d.images[s.imageIndex] ? `<img style="max-width:60%;max-height:300px" src="${d.images[s.imageIndex].data}" alt="${e(d.images[s.imageIndex].caption)}">` : ""}<p class="small">NewJob / ${e(d.company)}</p></section>`,
            )
            .join(""),
        );
      } else if (act === "delete-story") {
        S().stories = S().stories.filter((s) => s.id !== id);
        save();
        render();
      } else if (act === "lesson") {
        lesson = Number(id);
        lessonResult = "";
        render();
      } else if (act === "quiz") {
        const l = negotiationLessons[lesson];
        lessonResult =
          (Number(id) === l.answer ? "Correct. " : "Try again. ") + l.why;
        render();
      } else if (act === "choose-offer") {
        activeOffer = id;
        render();
        document
          .querySelector(".negotiation-room")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (act === "rubric-answer") await answer(id, false);
      else if (act === "reset-offer") {
        const o = S().offers.find((o) => o.id === id);
        const copy = {
          ...structuredClone(o),
          id: uid(),
          created: now(),
          rounds: [],
        };
        S().offers.push(copy);
        activeOffer = copy.id;
        save();
        render();
      } else if (act === "speak") {
        const o = S().offers.find((o) => o.id === id);
        const local = speechSynthesis
          .getVoices()
          .find((v) => v.localService && v.lang.startsWith("en"));
        if (!local)
          throw Error(
            "No local English voice is available. Read the prompt on screen.",
          );
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(
          negotiationQuestions[o.rounds.length],
        );
        u.voice = local;
        speechSynthesis.speak(u);
      } else if (act === "offer-report") {
        const o = S().offers.find((o) => o.id === id);
        download(
          "NewJob-negotiation-practice.txt",
          o.company +
            " — " +
            o.role +
            "\nPractice only; wording checks are not outcome predictions.\n\n" +
            o.rounds
              .map(
                (r, i) =>
                  "Round " +
                  (i + 1) +
                  "\n" +
                  r.question +
                  "\n\nYour answer: " +
                  r.answer +
                  "\n\nFeedback: " +
                  r.feedback +
                  "\nManager: " +
                  r.reply +
                  "\nChecks: " +
                  r.score +
                  "/4",
              )
              .join("\n\n"),
        );
      } else if (act === "plan-download") {
        const p = S().plans.find((p) => p.id === id);
        download("NewJob-roadmap.txt", p.title + "\n\n" + p.content);
      } else if (act === "blank-post") {
        S().posts.push({
          id: uid(),
          title: postDraft.topic || "New draft",
          content: "",
          date: postDraft.date || "",
          status: "Draft",
          created: now(),
        });
        save();
        render();
      } else if (act === "copy-post") {
        await navigator.clipboard.writeText(
          S().posts.find((p) => p.id === id).content,
        );
        toast("Copied. Review before publishing.");
      } else if (act === "delete-post") {
        S().posts = S().posts.filter((p) => p.id !== id);
        save();
        render();
      } else if (act === "reopen") {
        S().jobs.find((j) => j.id === id).stage = "Saved";
        save();
        render();
      }
    } catch (ex) {
      toast(ex.message, true);
    }
  });
  return { page };
}
