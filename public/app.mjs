import { newjobFetch as fetch, hosted, loadBrowserAI } from "./transport.mjs";
import {
  agents,
  blankState,
  blankProfile,
  validateState,
  stages,
  resumeText,
  analyzeResume,
  safeUrl,
  parseResume,
} from "./core.mjs";
import { createWorkflows } from "./workflows.mjs";
const $ = (s, root = document) => root.querySelector(s),
  $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  arrow: "M5 12h14m-5-5 5 5-5 5",
  chevron: "m9 5 7 7-7 7",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  file: "M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h8",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  briefcase: "M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 12v3h4v-3",
  users:
    "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-3a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75",
  building: "M4 22V3h12v19M16 9h4v13M2 22h20M8 7h4M8 11h4M8 15h4M9 22v-3h2v3",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  plus: "M12 5v14M5 12h14",
  settings:
    "m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  upload: "M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4",
  pen: "m15 4 5 5M3 21l5-1L21 7l-5-5L3 15z",
  mic: "M9 3v9a3 3 0 0 0 6 0V3a3 3 0 0 0-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8",
  compass: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM16 8l-3 5-5 3 3-5z",
  presentation: "M3 3h18v13H3zM12 16v5M8 21h8M7 11l3-4 4 3 3-3",
  handshake:
    "m2 11 4-6 5 1 3-1 8 6-4 7-4 3-8-6ZM6 5l5 4 4-2M10 8l-2 3 3 2 3-2 5 5",
  mail: "M3 5h18v14H3zM3 5l9 7 9-7",
  book: "M3 3h7l2 2 2-2h7v17h-7l-2 2-2-2H3zM12 5v17",
  shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6zM8 12l3 3 5-6",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2",
  external: "M14 3h7v7M21 3l-12 12M10 3H3v18h18v-7",
  trash: "M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  menu: "M3 6h18M3 12h18M3 18h18",
  pin: "M19 9c0 6-7 13-7 13S5 15 5 9a7 7 0 1 1 14 0ZM15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  save: "M3 3h15l3 3v15H3zM7 3v6h10V3M7 21v-7h10v7",
  copy: "M8 8h13v13H8zM16 8V3H3v13h5",
  target:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  alert: "M12 3 2 21h20ZM12 9v5M12 17v1",
  heart: "M20 4c-3-2-6 0-8 3-2-3-5-5-8-3-5 4 1 11 8 17 7-6 13-13 8-17",
  sun: "M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
};
const icon = (name, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.spark}"/></svg>`;
const brand = () =>
  `<a class="brand" href="#home" aria-label="NewJob home"><img src="/favicon.svg" alt="">New<em>Job</em></a>`;
const btn = (text, action, kind = "primary", ic = "") =>
  `<button class="btn ${kind}" data-action="${action}">${ic ? icon(ic) : ""}${text}</button>`;
const link = (text, route, kind = "secondary", ic = "") =>
  `<a class="btn ${kind}" href="#${route}">${ic ? icon(ic) : ""}${text}</a>`;
const fmtDate = (d) =>
  d && !Number.isNaN(Date.parse(d))
    ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(
        new Date(d),
      )
    : "";
const field = (
  label,
  name,
  value = "",
  type = "text",
  placeholder = "",
  full = false,
) =>
  `<label class="${full ? "full" : ""}">${label}<input name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${["title", "company", "name"].includes(name) ? "required" : ""}></label>`;
const area = (label, name, value = "", placeholder = "", rows = 5) =>
  `<label class="full">${label}<textarea name="${name}" rows="${rows}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`;
const empty = (title, desc, action = "", ic = "file") =>
  `<div class="empty">${icon(ic)}<h3>${title}</h3><p>${desc}</p>${action}</div>`;
let state = blankState(),
  revision = 0,
  status = { models: [], aiReady: false },
  route = location.hash.slice(1) || "home",
  saveTimer,
  saveChain = Promise.resolve(),
  saveFailed = false,
  pendingSaves = 0,
  toastTimer;
window.addEventListener("newjob-ai-reset", () => {
  status = {
    ...status,
    aiReady: false,
    models: [],
    aiError: "Load browser AI in Settings to continue.",
  };
  render();
});
let jobFeed = null,
  jobLoading = false,
  jobError = "",
  jobQuery = "",
  jobLocation = "",
  jobCategory = "",
  jobLimit = 30,
  atsReport = null,
  atsText = "",
  atsJD = "",
  resumeStyle = "modern",
  activeStream = null,
  coverOutput = "",
  coverDraft = { company: "", role: "", description: "", tone: "Professional" },
  currentInterviewType = "Behavioral";
const app = $("#app"),
  dialog = $("#dialog");
const workflows = createWorkflows({
  state: () => state,
  esc,
  icon,
  head,
  save,
  render,
  go,
  toast,
  api,
  download,
  printContent,
});
function toast(text, error = false) {
  $("#toast").textContent = text;
  $("#toast").className = "show" + (error ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").className = ""), 4500);
}
async function api(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const x = await r.json();
  if (!r.ok) throw Error(x.error || "Request failed.");
  return x;
}
function save() {
  clearTimeout(saveTimer);
  setSaveLabel("Saving…");
  saveTimer = setTimeout(() => flushSave(), 450);
}
function setSaveLabel(text, error = false) {
  const e = $("#save-state");
  if (e) {
    e.textContent = text;
    e.className = "status-label" + (error ? " error" : "");
  }
}
function flushSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  const snapshot = structuredClone(state);
  pendingSaves++;
  saveChain = saveChain.then(async () => {
    if (saveFailed) {
      pendingSaves--;
      return;
    }
    try {
      const r = await api("/api/state", {
        method: "PUT",
        body: JSON.stringify({ state: snapshot, revision }),
      });
      revision = r.revision;
      setSaveLabel("Saved on this device");
    } catch (e) {
      saveFailed = true;
      setSaveLabel("Save failed — export backup", true);
      toast(e.message, true);
    } finally {
      pendingSaves--;
    }
  });
  return saveChain;
}
function go(r) {
  location.hash = r;
}
function head(title, desc, actions = "") {
  return `<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div>${actions ? `<div class="row">${actions}</div>` : ""}</div>`;
}
const navGroups = [
  [
    "Workspace",
    [
      ["overview", "Overview", "grid"],
      ["jobs", "Job board", "search"],
      ["tracker", "Applications", "briefcase"],
      ["companies", "Target companies", "building"],
      ["network", "My network", "users"],
    ],
  ],
  [
    "Your toolkit",
    [
      ["resume", "Resume builder", "file"],
      ["ats", "Resume check", "shield"],
      ["cover", "Cover letters", "mail"],
      ["agents", "AI assistants", "spark"],
      ["agent-interviewer", "Interview practice", "mic"],
      ["library", "My documents", "book"],
    ],
  ],
];
function shell(content, title) {
  const initial = (state.profile.name || "You")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const primary = [
    ["jobs", "Job Board"],
    ["tracker", "My Jobs"],
    ["companies", "Target Companies"],
    ["agencies", "Recruitment Agencies"],
    ["network", "My Network"],
    ["archived", "Archived Jobs"],
  ];
  const toolkit = [
    ["overview", "Overview", "grid"],
    ["roadmap", "Career roadmap", "compass"],
    ["profile", "My profile", "users"],
    ["resume", "Resume builder", "file"],
    ["ats", "Resume check", "shield"],
    ["cover", "Cover letters", "mail"],
    ["stories", "Career evidence", "book"],
    ["pitcher", "Pitcher · Win Deck", "presentation"],
    ["agent-interviewer", "Interview practice", "mic"],
    ["negotiator", "Offer negotiation", "handshake"],
    ["posts", "Content planner", "pen"],
    ["agents", "AI assistants", "spark"],
    ["library", "My documents", "book"],
  ];
  const prompts =
    route === "companies" || route.startsWith("company-")
      ? [
          ["pitcher", "Build a company pitch"],
          ["stories", "Add proof of my work"],
          ["agent-hunter", "Refine my target criteria"],
        ]
      : [
          ["roadmap", "Plan my next two weeks"],
          ["negotiator", "Prepare for an offer"],
          ["agent-copilot", "Talk through my next step"],
        ];
  const due =
    state.jobs.filter(
      (j) =>
        j.followup &&
        j.followup <= new Date().toISOString().slice(0, 10) &&
        j.stage !== "Closed",
    ).length +
    state.contacts.filter(
      (c) => c.followup && c.followup <= new Date().toISOString().slice(0, 10),
    ).length;
  return `<div class="newjob-app"><header class="app-header">${brand()}<span class="free-tag">Free · private workspace</span><div class="top-actions"><span id="save-state" class="status-label">Saved on this device</span><a href="#settings" class="pill ${status.aiReady ? "green" : "amber"}"><span class="dot"></span>${status.aiReady ? (hosted ? "Browser AI ready" : "Local AI ready") : "Set up AI"}</a><a href="#profile" class="avatar" aria-label="Edit your profile">${esc(initial)}</a></div></header><nav class="opportunity-nav" aria-label="Opportunities">${primary.map(([id, label]) => `<a href="#${id}" class="${route === id || (id === "companies" && route.startsWith("company-")) ? "active" : ""}">${label}</a>`).join("")}</nav><div class="app-body"><aside class="tool-nav" aria-label="Career tools"><span class="eyebrow">YOUR WORKSPACE</span>${toolkit.map(([id, label, ic]) => `<a class="nav-item ${route === id ? "active" : ""}" href="#${id}" ${route === id ? 'aria-current="page"' : ""}>${icon(ic)}<span>${label}</span></a>`).join("")}<a class="nav-item" href="#settings">${icon("settings")}<span>Settings & backup</span></a></aside><main id="main" tabindex="-1" class="workspace">${content}</main><aside class="copilot-panel"><div class="copilot-heading"><div class="copilot-mark">${icon("spark")}</div><div><strong>Guide</strong><span>Your NewJob copilot</span></div><span class="dot green"></span></div><div class="copilot-body"><p class="copilot-message">${state.profile.name ? "Hi " + esc(state.profile.name.split(" ")[0]) + ". " : ""}Let's make your next step count. Research a company, show how you can help, and prepare for the conversation.</p><span class="eyebrow">A GOOD NEXT STEP</span>${prompts.map(([r, t]) => `<a href="#${r}" class="copilot-prompt">${t}${icon("arrow")}</a>`).join("")}<div class="copilot-progress"><strong>Your search, in motion</strong><div><span>${state.companies.length}</span> target companies</div><div><span>${state.decks.length}</span> Win Decks</div><div><span>${due}</span> follow-ups due</div>${due ? '<a class="text-link" href="#tracker">Review follow-ups →</a>' : '<p class="small muted">A thoughtful next action beats a success score.</p>'}</div></div><a class="copilot-compose" href="#agent-copilot">Ask your copilot… ${icon("arrow")}</a></aside></div></div>`;
}
function landing() {
  return `<div class="landing"><header>${brand()}<nav><a href="#home-tools" data-scroll="home-tools">The toolkit</a><a href="#home-agents" data-scroll="home-agents">AI assistants</a><a href="#home-privacy" data-scroll="home-privacy">Your privacy</a>${link("Open workspace", "overview", "primary", "arrow")}</nav></header><main id="main" tabindex="-1"><section class="landing-hero"><div><span class="pill green"><span class="dot"></span>Your career. Your pace.</span><h1>A clearer path to<br>your <em>next role.</em></h1><p class="lead">Bring your resume, job search, and interview preparation together. Make your next move with a little more clarity.</p><div class="row wrap">${link("Build your next chapter", "overview", "primary", "arrow")}${link("Explore the assistants", "agents", "secondary")}</div><p class="fine">No subscription. No credit card. Runs on your computer.</p></div><div class="hero-visual"><div class="mini-window"><div class="mini-window-header"><span class="window-dot"></span><span class="window-dot"></span><span class="window-dot"></span><span style="margin-left:auto">Your NewJob workspace</span></div><div class="mini-window-main"><div class="row between"><span class="pill green">One step at a time</span>${icon("sun")}</div><h3 style="margin-top:20px">Good things start<br>with a clear plan.</h3><div class="mini-stage"><div class="tool-icon">${icon("compass")}</div><div><strong>Find your direction</strong><span>Turn your experience into a strategy</span></div></div><div class="mini-stage"><div class="tool-icon">${icon("file")}</div><div><strong>Tell your story</strong><span>A thoughtful resume for the right role</span></div></div><div class="mini-stage"><div class="tool-icon">${icon("mic")}</div><div><strong>Show up ready</strong><span>Practice the conversation that matters</span></div></div></div></div><div class="visual-caption">${icon("shield")} Private by design. Powered by local AI.</div></div></section><div class="landing-strip"><span>${icon("file")} Resume to offer, in one place</span><span>${icon("spark")} Nine focused AI assistants</span><span>${icon("shield")} Your work stays on your device</span></div><section class="landing-section landing-tools" id="home-tools"><div><h2>Less scattered.<br>More prepared.</h2><p class="muted">A useful home for every part of your search. Start with one tool, then bring the rest together when you need them.</p>${link("Take a look around", "overview", "secondary", "arrow")}</div><div>${[
    [
      "resume",
      "file",
      "A resume that tells your story",
      "Build, edit, import and export a clean, readable resume.",
    ],
    [
      "ats",
      "shield",
      "A more thoughtful application",
      "Compare your resume with a job description and see what is missing.",
    ],
    [
      "tracker",
      "briefcase",
      "Every opportunity, organized",
      "Keep roles, contacts, notes and follow-up dates in one place.",
    ],
    [
      "agent-interviewer",
      "mic",
      "Practice before it counts",
      "Rehearse role-specific questions with a local AI interviewer.",
    ],
  ]
    .map(
      ([r, i, t, d]) =>
        `<a class="landing-tool-row" href="#${r}"><div class="tool-icon">${icon(i)}</div><div class="grow"><h3>${t}</h3><p>${d}</p></div>${icon("arrow")}</a>`,
    )
    .join(
      "",
    )}</div></section><section class="landing-section" id="home-agents"><div class="row between wrap"><div><h2>A little expertise.<br>At every step.</h2><p class="muted">Nine assistants with a clear purpose, powered by an AI model on your own computer.</p></div>${link("Meet your assistants", "agents", "secondary", "arrow")}</div><div class="landing-agent-list">${agents.map((a) => `<a href="#agent-${a.id}" class="landing-agent">${icon(a.icon)}${a.name}<span class="muted">· ${a.role}</span></a>`).join("")}</div></section><section class="landing-section" id="home-privacy"><div class="privacy-section"><div>${icon("shield")}<h2 style="margin-top:20px">Your next move<br>is your business.</h2><p>Resumes, notes and conversations stay on your device. The hosted app uses browser AI; the desktop version uses Ollama. Neither requires a paid API key.</p></div><div><details open><summary>Is NewJob really free?</summary><p>The app and local models have no subscription or per-request API fees. You use your own computer, storage and electricity. Job listings require an internet connection.</p></details><details><summary>Does my resume leave my computer?</summary><p>Resume import, checking and AI assistance run on your device. Company directory, public research sources, news and job-feed requests use external websites. NewJob does not upload your resume to them.</p></details><details><summary>Is this affiliated with NxtJob?</summary><p>No. NewJob is an independent implementation inspired by publicly observable career-tool workflows, with NewJob branding and an independent local backend.</p></details><details><summary>What can the AI access?</summary><p>Only the profile, workspace context and text you submit. The company research tool reads the public sources you choose. Assistants cannot access accounts, send messages or apply for jobs.</p></details></div></div></section></main><footer>${brand()}<span>Your next chapter, thoughtfully prepared.</span><a href="#settings">Local setup & backup ${icon("arrow")}</a></footer></div>`;
}
function overview() {
  const p = state.profile,
    active = state.jobs.filter((j) => j.stage !== "Closed"),
    interviews = state.jobs.filter((j) => j.stage === "Interview"),
    done = [
      !!p.name && !!p.role,
      !!(p.experience || p.resumeText),
      !!state.jobs.length,
    ];
  const welcome = p.name
    ? "Welcome back, " + esc(p.name.split(" ")[0]) + "."
    : "Your next chapter starts here.";
  return (
    head(
      welcome,
      "A little focus today. A stronger next move tomorrow.",
      link("Add an opportunity", "tracker", "secondary", "plus"),
    ) +
    `<section class="welcome"><div><div class="row" style="margin-bottom:14px"><span class="pill" style="background:white;color:var(--primary)">${done.filter(Boolean).length} of 3 foundations ready</span></div><h2>${p.role ? "Make room for your next " + esc(p.role) + " role." : "Give your job search a clear direction."}</h2><p>${p.role ? "Your workspace brings the preparation, people and opportunities together. Choose your next useful step." : "Start with your profile. Your assistants will use your real experience to give you more relevant help."}</p>${link(p.role ? "Plan my next step" : "Set up my profile", p.role ? "agent-copilot" : "profile", "primary", "arrow")}</div><div class="welcome-mark">${icon("compass")}</div></section><div class="stats">${[
      ["Active applications", active.length, "briefcase"],
      ["Interviews", interviews.length, "mic"],
      ["Saved documents", state.documents.length, "file"],
      ["Connections", state.contacts.length, "users"],
    ]
      .map(
        ([t, n, i]) =>
          `<div class="stat"><div class="stat-top"><span class="stat-label">${t}</span>${icon(i)}</div><div class="stat-value">${n.toString().padStart(2, "0")}</div></div>`,
      )
      .join(
        "",
      )}</div><div class="workspace-columns"><div class="stack"><section class="panel"><div class="section-head"><h2>Your next steps</h2><span class="small muted">Keep it simple</span></div>${[
      [
        "Build your career profile",
        "Give your assistants the context that matters.",
        "profile",
      ],
      [
        "Prepare your resume",
        "Bring your experience into a clean, readable format.",
        "resume",
      ],
      [
        "Save your first opportunity",
        "Start tracking the roles you actually want.",
        "jobs",
      ],
    ]
      .map(
        ([t, d, r], i) =>
          `<a class="task-row" href="#${r}"><span class="step ${done[i] ? "done" : ""}">${done[i] ? icon("check") : i + 1}</span><div class="grow"><h3>${t}</h3><p>${d}</p></div>${icon("arrow")}</a>`,
      )
      .join(
        "",
      )}</section><section class="panel"><div class="section-head"><h2>On your radar</h2><a class="text-link small" href="#tracker">View all ${icon("arrow")}</a></div>${
      active.length
        ? active
            .slice(-3)
            .reverse()
            .map(
              (j) =>
                `<div class="tool-link"><div class="company-logo">${esc(j.company.slice(0, 2).toUpperCase())}</div><div class="grow"><h3>${esc(j.title)}</h3><p>${esc(j.company)}${j.followup ? " · Follow up " + fmtDate(j.followup) : ""}</p></div><span class="pill green">${esc(j.stage)}</span></div>`,
            )
            .join("")
        : empty(
            "A good opportunity deserves a place.",
            "Save a role from the job board or add one you found elsewhere.",
            btn("Add a job", "add-job", "secondary small", "plus"),
            "briefcase",
          )
    }</section></div><div class="stack"><section class="panel"><div class="section-head"><h2>Make your next move</h2>${icon("spark")}</div>${[
      [
        "ats",
        "shield",
        "Check your resume",
        "Spot missing keywords and strengthen your content.",
      ],
      [
        "cover",
        "mail",
        "Write a cover letter",
        "Connect your experience to a specific opportunity.",
      ],
      [
        "agent-interviewer",
        "mic",
        "Practice an interview",
        "Find the words before you need them.",
      ],
      [
        "agent-networker",
        "users",
        "Start a conversation",
        "Draft a thoughtful, personal introduction.",
      ],
    ]
      .map(
        ([r, i, t, d]) =>
          `<a class="tool-link" href="#${r}"><span class="tool-icon">${icon(i)}</span><div class="grow"><h3>${t}</h3><p>${d}</p></div>${icon("chevron")}</a>`,
      )
      .join(
        "",
      )}</section><section class="panel soft"><div class="row" style="margin-bottom:12px">${icon("shield")}<strong>Built around your privacy</strong></div><p class="small muted">Your workspace is saved locally. Download a backup to keep an extra copy of your progress.</p>${btn("Export my workspace", "backup", "secondary small", "download")}</section></div></div>`
  );
}
function profile() {
  const p = state.profile;
  return (
    head(
      "Your career profile",
      "A little context makes every assistant more useful.",
    ) +
    `<div class="editor-layout"><section class="panel"><form id="profile-form"><div class="form-grid">${field("Full name", "name", p.name, "text", "Your name")}${field("Target role", "role", p.role, "text", "e.g. Product Manager")}${field("Email", "email", p.email, "email", "you@example.com")}${field("Phone", "phone", p.phone, "tel", "Optional")}${field("Location", "location", p.location, "text", "City, country or remote")}${field("Professional link", "link", p.link, "url", "https://linkedin.com/in/…")}${area("Professional summary", "summary", p.summary, "What do you do, and what would you like to do next?", 4)}${area("Skills", "skills", p.skills, "Separate your skills with commas.", 3)}${area("Experience", "experience", p.experience, "Role · Company · Dates\nYour responsibilities and real achievements.", 7)}${area("Education & certifications", "education", p.education, "Qualification · Institution · Year", 3)}</div><div class="form-actions"><button class="btn primary" type="submit">${icon("save")}Save profile</button>${link("Build my resume", "resume", "secondary")}</div></form></section><aside class="stack"><section class="panel soft"><h3>A useful profile is a truthful one.</h3><p class="muted">Include the scope of your work, specific skills, and outcomes you can explain. The assistants will use this context without inventing credentials.</p><div class="divider"></div><h4>Already have a resume?</h4><p class="small muted">Import it in Resume builder. You can then use local AI to suggest structured profile fields for your review.</p>${link("Import a resume", "resume", "secondary", "upload")}</section></aside></div>`
  );
}
function paper() {
  const p = state.profile;
  return `<article class="resume-paper ${state.settings.resumeStyle || resumeStyle} resume-${state.settings.resumeColor || "green"} resume-${state.settings.resumeSpacing || "comfortable"}"><h1>${esc(p.name || "Your name")}</h1><div class="resume-role">${esc(p.role || "Your professional title")}</div><div class="resume-contact">${[p.email, p.phone, p.location, p.link].filter(Boolean).map(esc).join(" · ") || "Your contact details"}</div>${[
    ["Summary", p.summary],
    ["Skills", p.skills],
    ["Experience", p.experience],
    ["Education & certifications", p.education],
  ]
    .map(([t, v]) =>
      v ? `<h2>${t}</h2><div class="resume-section">${esc(v)}</div>` : "",
    )
    .join(
      "",
    )}${!p.summary && !p.experience ? '<div class="muted" style="padding-top:50px">Your resume preview will take shape as you fill in the fields.</div>' : ""}</article>`;
}
function resume() {
  const p = state.profile;
  return (
    head(
      "Tell your story. Clearly.",
      "Build a readable resume. Keep every claim grounded in your experience.",
      btn("Download text", "resume-text", "secondary", "download") +
        btn("Print / save PDF", "print-resume", "primary", "file"),
    ) +
    `<div class="editor-layout"><section><div class="upload"><label for="resume-import">${icon("upload")}Import your existing resume<input id="resume-import" type="file" accept=".pdf,.docx,.txt,.md"></label><div class="field-help">PDF, DOCX or TXT · up to 10 MB · processed on your computer</div></div><div class="panel"><div class="section-head"><h2>Your resume</h2><a href="#profile" class="text-link small">Full profile ${icon("arrow")}</a></div><div class="form-grid">${field("Full name", "name", p.name)}${field("Professional title", "role", p.role)}${field("Email", "email", p.email, "email")}${field("Location", "location", p.location)}${area("Summary", "summary", p.summary, "A brief introduction to your strengths.", 4)}${area("Skills", "skills", p.skills, "e.g. Product strategy, SQL, stakeholder management", 3)}${area("Experience", "experience", p.experience, "Role · Company · Dates\nA clear bullet for each achievement.", 8)}${area("Education", "education", p.education, "Qualifications, institutions and dates.", 3)}</div><div class="form-actions">${btn("Get tailoring help", "tailor-resume", "secondary", "spark")}${link("Check this resume", "ats", "ghost")}</div></div>${p.resumeText ? `<details style="margin-top:18px"><summary>Imported source text</summary><textarea id="imported-text" rows="10" style="margin-top:12px" aria-label="Imported resume text">${esc(p.resumeText)}</textarea><div class="form-actions">${btn("Review detected sections", "review-import", "primary small", "file")}${btn("Help structure this text", "structure-resume", "secondary small", "spark")}</div><p class="field-help">Imported text is preserved here. Review and copy relevant content into the editor; your existing structured resume is never overwritten automatically.</p></details>` : ""}</section><aside class="resume-stage"><div class="paper-caption"><span>Live preview · A4</span><select id="resume-style" style="width:auto;font-size:11px;padding:3px 8px" aria-label="Resume style"><option value="modern" ${(state.settings.resumeStyle || resumeStyle) === "modern" ? "selected" : ""}>Modern</option><option value="classic" ${(state.settings.resumeStyle || resumeStyle) === "classic" ? "selected" : ""}>Classic</option></select></div><div class="form-grid resume-controls"><label>Accent<select id="resume-color">${["green", "navy", "black"].map((v) => `<option value="${v}" ${(state.settings.resumeColor || "green") === v ? "selected" : ""}>${v[0].toUpperCase() + v.slice(1)}</option>`).join("")}</select></label><label>Spacing<select id="resume-spacing">${["comfortable", "compact"].map((v) => `<option value="${v}" ${(state.settings.resumeSpacing || "comfortable") === v ? "selected" : ""}>${v[0].toUpperCase() + v.slice(1)}</option>`).join("")}</select></label></div><div id="resume-preview">${paper()}</div><p class="field-help" style="text-align:center;margin:12px 0 0">Simple headings. Selectable text. Your real experience.</p></aside></div>`
  );
}
function ats() {
  return (
    head(
      "Give your resume a closer look.",
      "Check your content and compare it with the role you want.",
    ) +
    `<div class="editor-layout"><section class="panel"><div class="section-head"><h2>Your resume & the role</h2>${btn("Use my resume", "ats-use", "ghost small")}</div><form id="ats-form"><label>Resume text<textarea id="ats-text" rows="13" required placeholder="Paste your resume text here…">${esc(atsText)}</textarea></label><div style="height:18px"></div><label>Job description <span class="muted">(optional)</span><textarea id="ats-jd" rows="8" placeholder="Paste a job description to compare relevant keywords…">${esc(atsJD)}</textarea></label><div class="form-actions"><button class="btn primary" type="submit">${icon("shield")}Check my resume</button><span class="small muted">Free · no AI required</span></div></form></section><section id="ats-results">${atsReport ? atsResult() : `<div class="panel">${empty("Useful feedback, without the guesswork.", "Get a transparent content checklist, keyword comparison and concrete suggestions.", "", "shield")}<div class="notice">This checks text readiness. It does not reproduce any employer’s ATS, score PDF layouts, or predict interview invitations.</div></div>`}</section></div>`
  );
}
function atsResult() {
  const r = atsReport;
  return `<div class="panel"><div class="score-wrap"><div class="score-ring" style="--score:${r.score}"><div class="score-inner"><strong>${r.score}</strong><span>out of 100</span></div></div><div><h3>Text readiness</h3><p class="small muted">${r.words} words · ${r.checks.filter((c) => c.pass).length} of ${r.checks.length} checks passed</p><span class="pill ${r.score >= 75 ? "green" : "amber"}">${r.score >= 75 ? "A solid foundation" : "Room to strengthen"}</span></div></div>${r.checks.map((c) => `<div class="check-row ${c.pass ? "" : "fail"}">${icon(c.pass ? "check" : "alert")}<div><strong class="small">${c.label}</strong>${!c.pass ? `<p>${c.tip}</p>` : ""}</div></div>`).join("")}${r.match !== null ? `<div class="divider"></div><h3>Keyword coverage · ${r.match}%</h3><p class="small muted">${r.found.length} of ${r.terms.length} extracted terms found. Add only skills or experience you actually have.</p><h4>Present</h4><div class="tokens">${r.found.map((w) => `<span>${esc(w)}</span>`).join("") || "<span>None yet</span>"}</div><h4 style="margin-top:20px">Not found</h4><div class="tokens missing">${r.missing.map((w) => `<span>${esc(w)}</span>`).join("") || "<span>All extracted terms are present</span>"}</div>` : ""}<div class="divider"></div><details><summary>How this score works</summary><p>${esc(r.note)} ${r.match === null ? "Score = passed content checks ÷ 8." : "Score = 55% content checks + 45% keyword coverage. Keywords are the 40 most frequent non-stopwords in the supplied description."}</p></details><div class="form-actions">${btn("Save report", "save-ats", "secondary small", "save")}${btn("Ask Tailor for help", "ats-tailor", "ghost small", "spark")}</div></div>`;
}
async function loadJobs() {
  if (jobFeed || jobLoading) return;
  jobLoading = true;
  jobError = "";
  updateJobList();
  try {
    jobFeed = await api("/api/jobs");
  } catch (e) {
    jobError = e.message;
  } finally {
    jobLoading = false;
    if (route === "jobs") render();
  }
}
function jobs() {
  const categories = jobFeed
    ? [...new Set(jobFeed.jobs.map((j) => j.category))].sort()
    : [];
  return (
    head(
      "Find your next possibility.",
      "Explore remote roles, then keep the ones worth pursuing.",
      btn("Add a job manually", "add-job", "secondary", "plus"),
    ) +
    `<div class="notice" style="margin-bottom:20px">Listings from <a href="https://remotive.com" target="_blank" rel="noopener noreferrer" class="text-link">Remotive ${icon("external")}</a> · The free feed is delayed by 24 hours and cached for 6 hours.${jobFeed ? ` Last fetched ${new Date(jobFeed.fetched).toLocaleString()}.` : ""} ${jobFeed?.stale ? "Showing the last saved feed while the source is unavailable." : ""}</div><div class="toolbar"><div class="search">${icon("search")}<input id="job-query" value="${esc(jobQuery)}" placeholder="Role, skill or company…" aria-label="Search jobs"></div><input id="job-location" value="${esc(jobLocation)}" placeholder="Location or Worldwide" aria-label="Filter job location" style="max-width:220px"><select id="job-category" aria-label="Job category"><option value="">All categories</option>${categories.map((c) => `<option ${c === jobCategory ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div><div id="job-results">${jobList()}</div><div class="panel soft" style="margin-top:24px"><h3>Looking beyond the remote feed?</h3><p class="small muted">Open a job board with your target role. Save an opportunity here using “Add a job manually.”</p><div class="row wrap">${[
      ["LinkedIn", "https://www.linkedin.com/jobs/search/?keywords="],
      ["Indeed", "https://www.indeed.com/jobs?q="],
      ["Naukri", "https://www.naukri.com/"],
      ["Wellfound", "https://wellfound.com/jobs"],
    ]
      .map(
        ([n, u]) =>
          `<a class="btn secondary small" target="_blank" rel="noopener noreferrer" href="${u + (u.endsWith("=") ? encodeURIComponent(state.profile.role) : "")}">${n}${icon("external")}</a>`,
      )
      .join("")}</div></div>`
  );
}
function filteredJobs() {
  return (jobFeed?.jobs || []).filter(
    (j) =>
      (j.title + " " + j.company + " " + j.description + " " + j.tags.join(" "))
        .toLowerCase()
        .includes(jobQuery.toLowerCase()) &&
      (!jobLocation ||
        (j.location + " remote")
          .toLowerCase()
          .includes(jobLocation.toLowerCase())) &&
      (!jobCategory || j.category === jobCategory),
  );
}
function jobList() {
  if (jobLoading)
    return `<div class="panel"><p class="muted">Loading the free job feed…</p><div class="loading-line"></div></div>`;
  if (jobError)
    return `<div class="notice error">${esc(jobError)}</div><div class="form-actions">${btn("Try again", "retry-jobs", "secondary")}</div>`;
  if (!jobFeed)
    return empty(
      "Discover remote opportunities.",
      "Load the free public feed to start exploring.",
      btn("Load job feed", "load-jobs", "primary", "search"),
      "search",
    );
  const jobs = filteredJobs();
  return `<div class="row between" style="margin-bottom:16px"><span class="small muted">${jobs.length} matching opportunities</span><span class="small muted">Source: Remotive</span></div><div class="job-list">${
    jobs
      .slice(0, jobLimit)
      .map((j) => {
        const saved = state.jobs.some((s) => s.sourceId === "remotive-" + j.id);
        return `<article class="job-card"><div class="company-logo">${esc(j.company.slice(0, 2).toUpperCase())}</div><div class="grow"><h3>${esc(j.title)}</h3><span class="small">${esc(j.company)}</span><div class="job-meta"><span>${icon("pin")}${esc(j.location)}</span>${j.salary ? `<span>${esc(j.salary)}</span>` : ""}<span>${esc(j.category)}</span></div><div class="row wrap"><span class="pill">${esc((j.type || "Remote").replaceAll("_", " "))}</span><span class="small muted">Posted ${fmtDate(j.date)}</span></div></div><div class="job-actions"><button class="btn secondary small" data-save-job="${esc(j.id)}" ${saved ? "disabled" : ""}>${icon(saved ? "check" : "plus")}${saved ? "Saved" : "Save job"}</button><button class="btn ghost small" data-job-detail="${esc(j.id)}">View role ${icon("arrow")}</button></div></article>`;
      })
      .join("") ||
    empty(
      "No roles match those filters.",
      "Try a broader role, remove the location filter, or explore another job board.",
      "",
      "search",
    )
  }</div>${jobs.length > jobLimit ? `<div class="form-actions" style="justify-content:center">${btn("Show 30 more", "more-jobs", "secondary")}</div>` : ""}`;
}
function updateJobList() {
  const el = $("#job-results");
  if (el) el.innerHTML = jobList();
}
function tracker() {
  return (
    head(
      "Every opportunity. One place.",
      "Move roles through your pipeline and keep the next step in sight.",
      btn("Add opportunity", "add-job", "primary", "plus"),
    ) +
    `<div class="kanban">${stages
      .map((s, i) => {
        const jobs = state.jobs.filter((j) => j.stage === s);
        return `<section class="kanban-column"><div class="kanban-head"><span class="dot" style="color:${["var(--muted)", "var(--blue)", "var(--primary)", "oklch(.6 .13 75)", "var(--muted)"][i]}"></span>${s}<span class="count">${jobs.length}</span></div>${jobs.map((j) => `<article class="pipeline-card"><div class="row between"><span class="small muted">${esc(j.company)}</span><button class="icon-btn" data-edit-job="${esc(j.id)}" aria-label="Edit ${esc(j.title)}">${icon("pen")}</button></div><h3>${esc(j.title)}</h3><p>${esc(j.location || "Location not set")}</p>${j.followup ? `<span class="pill ${j.followup < new Date().toLocaleDateString("en-CA") ? "amber" : ""}">${icon("clock")} ${fmtDate(j.followup)}</span>` : ""}<label class="field-help">Stage<select data-stage="${esc(j.id)}" aria-label="Stage for ${esc(j.title)}">${stages.map((x) => `<option ${x === s ? "selected" : ""}>${x}</option>`).join("")}</select></label></article>`).join("") || '<p class="small muted" style="text-align:center;padding:30px 5px">' + (s === "Saved" ? "Save a role to get started." : "No roles here yet.") + "</p>"}</section>`;
      })
      .join(
        "",
      )}</div><div class="notice">Your pipeline is private. Changing a stage does not submit an application or contact a company.</div>`
  );
}
function companies() {
  return (
    head(
      "Choose where you want to go.",
      "Keep a thoughtful shortlist of companies worth your attention.",
      btn("Add company", "add-company", "primary", "plus"),
    ) +
    `<div class="panel">${state.companies.length ? `<div class="table-wrap"><table><thead><tr><th>Company</th><th>Focus / location</th><th>Saved jobs</th><th>Connections</th><th></th></tr></thead><tbody>${state.companies.map((c) => `<tr><td><div class="row"><span class="company-logo">${esc(c.name.slice(0, 2).toUpperCase())}</span><div><strong>${esc(c.name)}</strong>${safeUrl(c.url) ? `<br><a class="small text-link" href="${esc(safeUrl(c.url))}" target="_blank" rel="noopener noreferrer">Website ${icon("external")}</a>` : ""}</div></div></td><td>${esc(c.location || "—")}<div class="small muted">${esc(c.industry || "")}</div></td><td>${state.jobs.filter((j) => j.company.toLowerCase() === c.name.toLowerCase()).length}</td><td>${state.contacts.filter((j) => j.company?.toLowerCase() === c.name.toLowerCase()).length}</td><td><button class="icon-btn" data-edit-company="${c.id}" aria-label="Edit ${esc(c.name)}">${icon("pen")}</button></td></tr>`).join("")}</tbody></table></div>` : empty("A shortlist with intention.", "Add companies you would like to work with. Keep your research, opportunities and contacts connected.", btn("Add your first company", "add-company", "primary", "plus"), "building")}</div><div class="form-actions">${link("Build a company pitch", "agent-pitcher", "secondary", "presentation")}${link("Get targeting advice", "agent-navigator", "ghost", "compass")}</div>`
  );
}
function network() {
  return (
    head(
      "Good opportunities start with people.",
      "Keep track of conversations and make your follow-ups thoughtful.",
      btn("Add connection", "add-contact", "primary", "plus"),
    ) +
    `<div class="panel">${state.contacts.length ? `<div class="table-wrap"><table><thead><tr><th>Person</th><th>Company / role</th><th>Status</th><th>Follow-up</th><th></th></tr></thead><tbody>${state.contacts.map((c) => `<tr><td><strong>${esc(c.name)}</strong>${c.url && safeUrl(c.url) ? `<br><a class="small text-link" target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(c.url))}">Profile ${icon("external")}</a>` : ""}</td><td>${esc(c.company || "—")}<div class="small muted">${esc(c.role || "")}</div></td><td><span class="pill ${c.status === "Connected" ? "green" : ""}">${esc(c.status || "To contact")}</span></td><td>${c.followup ? fmtDate(c.followup) : "—"}</td><td><button class="icon-btn" data-draft-contact="${c.id}" aria-label="Draft message for ${esc(c.name)}">${icon("mail")}</button><button class="icon-btn" data-edit-contact="${c.id}" aria-label="Edit ${esc(c.name)}">${icon("pen")}</button></td></tr>`).join("")}</tbody></table></div>` : empty("Make the first conversation count.", "Add a person you want to reach out to. Connector can help draft a personal introduction.", btn("Add your first connection", "add-contact", "primary", "plus"), "users")}</div><div class="notice" style="margin-top:22px">NewJob helps you organize contacts and draft messages. It does not harvest contact details or send messages on your behalf.</div>`
  );
}
function assistants() {
  return (
    head(
      "Meet your career team.",
      "Nine focused assistants. One private workspace.",
      `<a href="#settings" class="pill ${status.aiReady ? "green" : "amber"}"><span class="dot"></span>${status.aiReady ? "Running locally with " + esc(state.settings.model) : "Start Ollama to connect"}</a>`,
    ) +
    `<div class="agent-grid">${agents.map((a, i) => `<a href="#agent-${a.id}" class="agent-card ${i === 0 ? "featured" : ""}"><div class="row between"><span class="tool-icon" ${i === 0 ? 'style="background:white"' : ""}>${icon(a.icon)}</span><span class="pill">${i === 0 ? "Start here" : "Local AI"}</span></div><h3>${a.name}</h3><div class="role">${a.role}</div><p>${a.description}</p><span class="go">Start a conversation ${icon("arrow")}</span></a>`).join("")}</div>`
  );
}
const prompts = {
  copilot: [
    "Help me plan my job search for this week.",
    "What should I work on next?",
    "Help me tell a clearer career story.",
  ],
  navigator: [
    "Suggest target roles based on my profile.",
    "Create a two-week job search plan.",
    "Which skills should I develop next?",
  ],
  hunter: [
    "Build a focused job-search query for my target role.",
    "Help me evaluate a job description.",
    "What should I look for in my next company?",
  ],
  tailor: [
    "Suggest a stronger summary using only my real experience.",
    "Improve my resume bullets without adding facts.",
    "Help tailor my resume to a job description.",
  ],
  networker: [
    "Draft a short LinkedIn connection message.",
    "Write a respectful follow-up after a week.",
    "Help me ask for an informational conversation.",
  ],
  pitcher: [
    "Help me outline a five-slide company pitch.",
    "Turn my experience into a 30-day value plan.",
    "Help me validate a company problem before pitching.",
  ],
  influencer: [
    "Plan three LinkedIn posts from my experience.",
    "Draft a useful post about a lesson I learned.",
    "Help me improve my LinkedIn headline.",
  ],
  interviewer: [
    "Start a behavioral interview for my target role. Ask one question at a time.",
    "Help me practice my introduction.",
    "Finish the interview and summarize my feedback.",
  ],
  negotiator: [
    "Help me prepare a respectful counteroffer.",
    "What should I clarify before accepting an offer?",
    "Practice a salary conversation with me.",
  ],
};
function markdown(s) {
  return esc(s)
    .replace(/^###? (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/^[-*] (.+)$/gm, "• $1")
    .replace(/\n/g, "<br>");
}
function chatMessages(id) {
  const messages = state.chats[id] || [];
  const a = agents.find((a) => a.id === id);
  return messages.length
    ? messages
        .map(
          (m, i) =>
            `<div class="message ${m.role}"><div class="message-icon">${icon(m.role === "user" ? "users" : a.icon)}</div><div class="message-body"><div class="message-label">${m.role === "user" ? "You" : a.name}</div><div id="message-${i}">${markdown(m.content)}</div></div></div>`,
        )
        .join("")
    : `<div class="empty"><div class="tool-icon" style="margin:0 auto 15px">${icon(a.icon)}</div><h3>${a.description}</h3><p>Use a suggested prompt or tell ${a.name} what you’re working on. Your profile gives the conversation a useful starting point.</p></div>`;
}
function agentPage(id) {
  const a = agents.find((a) => a.id === id);
  if (!a) return assistants();
  const history = state.chats[id] || [];
  return (
    head(
      a.name + " · " + a.role,
      a.description,
      btn("Save conversation", "save-chat", "secondary small", "save") +
        btn("New conversation", "clear-chat", "ghost small"),
    ) +
    `<div class="chat-layout"><section class="chat-main"><div class="messages" id="messages">${chatMessages(id)}</div><form class="composer" id="chat-form"><label class="sr-label" for="chat-prompt">Your message</label><textarea id="chat-prompt" required maxlength="18000" placeholder="${id === "interviewer" ? "Tell Practice the role and interview type you want to rehearse…" : "What would you like to work on?"}" ${activeStream ? "disabled" : ""}></textarea><div class="composer-footer"><small class="muted">${status.aiReady ? "Private · " + esc(state.settings.model) : "Local AI is offline. Open Settings to connect."}</small><div class="row">${activeStream ? btn("Stop", "stop-ai", "secondary small") : ""}<button class="btn primary" type="submit" ${activeStream || !status.aiReady ? "disabled" : ""}>${icon("arrow")}${id === "interviewer" && history.length ? "Send answer" : "Send message"}</button></div></div></form></section><aside class="chat-aside"><h3>A place to start</h3>${prompts[id].map((p, i) => `<button class="quick-prompt" data-prompt="${id}:${i}" ${activeStream ? "disabled" : ""}>${esc(p)} ${icon("arrow")}</button>`).join("")}<div class="notice"><strong>Grounded in your profile</strong><p class="small" style="margin:8px 0">${state.profile.role ? esc(state.profile.role) : "Add your role and experience for more relevant help."}</p><a href="#profile" class="text-link small">Edit your profile ${icon("arrow")}</a><div class="divider"></div>Local models can make mistakes. Review suggestions before using them. No actions are taken outside this app.</div></aside></div>`
  );
}
function cover() {
  return (
    head(
      "Make the introduction personal.",
      "A considered letter that connects your experience to the role.",
    ) +
    `<div class="editor-layout"><section class="panel"><form id="cover-form"><div class="form-grid">${field("Company", "company", coverDraft.company, "text", "Company name")}${field("Role", "role", coverDraft.role || state.profile.role, "text", "Role title")}${area("Job description", "description", coverDraft.description, "Paste the key requirements and what interests you about the role.", 10)}<label class="full">Tone<select name="tone">${["Professional", "Warm and direct", "Concise"].map((x) => `<option ${x === coverDraft.tone ? "selected" : ""}>${x}</option>`).join("")}</select></label></div><div class="form-actions"><button class="btn primary" type="submit" ${activeStream || !status.aiReady ? "disabled" : ""}>${icon("spark")}Draft with local AI</button>${activeStream ? btn("Stop", "stop-ai", "secondary") : ""}</div><p class="field-help">Uses your profile. Review every claim before sending.</p></form></section><section class="panel"><div class="section-head"><h2>Your draft</h2><span class="pill green">Private</span></div><div id="cover-output" class="output">${esc(coverOutput) || '<span class="muted">Your letter will appear here. Add the role details and generate a first draft.</span>'}</div><div class="form-actions">${btn("Save letter", "save-cover", "secondary small", "save")}${btn("Copy", "copy-cover", "ghost small", "copy")}${btn("Print / PDF", "print-cover", "ghost small", "file")}</div></section></div>`
  );
}
function library() {
  return (
    head(
      "Your work, ready when you need it.",
      "Saved letters, reports, conversations and plans.",
      btn("New document", "new-doc", "secondary", "plus"),
    ) +
    `<div class="panel">${
      state.documents.length
        ? state.documents
            .slice()
            .reverse()
            .map(
              (d) =>
                `<div class="document-row"><div class="tool-icon">${icon(d.type === "Cover letter" ? "mail" : "file")}</div><div class="grow"><h3>${esc(d.title)}</h3><p>${esc(d.type)} · ${fmtDate(d.updated || d.created)}</p></div><button class="btn secondary small" data-doc="${esc(d.id)}">Open ${icon("arrow")}</button></div>`,
            )
            .join("")
        : empty(
            "Good work is worth keeping.",
            "Save a resume report, letter or assistant conversation. Everything stays editable and exportable.",
            "",
            "book",
          )
    }</div>`
  );
}
function hostedSettings() {
  return (
    head(
      "Your browser workspace",
      "Private by default. Free tools, with optional AI on your own device.",
    ) +
    `<div class="grid2"><section class="panel"><h2>Free browser AI</h2><p>Load a small language model to use the assistants, research analysis, Win Deck generation and practice feedback. Your prompts stay on this device.</p><p class="small muted">Requires WebGPU, recent Chrome or Edge, and about 1 GB of downloads plus working memory. The first load can take several minutes. Models are cached by this browser; loading them again is faster. Use the desktop version with Ollama if your device is unsupported.</p><button class="btn primary" id="browser-ai-load" ${status.aiReady ? "disabled" : ""}>${status.aiReady ? "Browser AI ready" : "Load free AI model"}</button><p id="browser-ai-progress" role="status" aria-live="polite" style="margin-top:16px"></p><p class="small muted">Downloaded from MLC’s public model repository. No subscription, API key or server inference charge.</p></section><section class="panel"><h2>Your data stays in this browser</h2><p>Profile, applications, research, images, decks and conversations are stored in this browser’s local database. There is no account or cloud sync. Clearing site data removes your workspace.</p><div class="form-actions">${btn("Export backup", "backup", "primary", "download")}<label class="btn secondary">Restore backup<input type="file" id="backup-import" accept=".json" hidden></label></div><p class="small muted">Use backups to move between browsers or the desktop app. Keep a copy before clearing browser storage.</p></section><section class="panel"><h2>What uses the internet?</h2><p class="small">Public company and job directories, source URLs and news queries use the hosted public-data service. Your pasted notes, resume, offer figures, decks and AI prompts are processed on your device. Hosting and model downloads still expose ordinary connection metadata to their providers.</p><p class="small muted">Hosting uses a free plan with usage limits. If a feed is temporarily unavailable, you can add jobs and companies manually.</p></section><section class="panel"><h2>Prefer the desktop version?</h2><p>Use larger local Ollama models and a local SQLite database. Both editions use the same portable backup format.</p><a class="btn secondary" href="https://github.com/Pratikrishi97/newjob" target="_blank" rel="noopener">Get NewJob on GitHub ↗</a></section></div>`
  );
}
document.addEventListener("click", async (e) => {
  if (e.target.id !== "browser-ai-load") return;
  const button = e.target;
  button.disabled = true;
  try {
    await loadBrowserAI((text) => {
      const p = $("#browser-ai-progress");
      if (p) p.textContent = text;
    });
    await checkStatus();
    render();
    toast("Browser AI ready.");
  } catch (ex) {
    const p = $("#browser-ai-progress");
    if (p) p.textContent = ex.message;
    button.disabled = false;
    toast(ex.message, true);
  }
});
function settings() {
  if (hosted) return hostedSettings();
  return (
    head(
      "Make this workspace yours.",
      "Local AI, local storage, and an easy way to keep a backup.",
    ) +
    `<div class="grid2"><section class="panel"><div class="row" style="margin-bottom:18px"><div class="tool-icon">${icon("spark")}</div><h2 style="margin:0;font-size:20px">Local AI</h2></div><p class="small muted">NewJob talks only to Ollama on this computer. Cloud-tagged models are excluded. No paid API keys are used.</p><label>Downloaded model<select id="model-select">${status.models.map((m) => `<option value="${esc(m.name)}" ${m.name === state.settings.model ? "selected" : ""}>${esc(m.name)} · ${(m.size / 1e9).toFixed(1)} GB</option>`).join("") || "<option>No models available</option>"}</select></label><p class="field-help">The 3B model uses less memory and is usually faster. The 7B model may give better writing with a longer wait.</p><div class="form-actions">${btn("Check connection", "check-ai", "secondary", "spark")}<span class="pill ${status.aiReady ? "green" : "amber"}">${status.aiReady ? "Connected" : "Offline"}</span></div>${!status.aiReady ? '<div class="notice" style="margin-top:20px">Open Ollama on this computer, then check the connection. To install a local model, run <code>ollama pull qwen2.5:3b</code>. This is a one-time model download.</div>' : ""}</section><section class="panel"><div class="row" style="margin-bottom:18px"><div class="tool-icon">${icon("shield")}</div><h2 style="margin:0;font-size:20px">Your data</h2></div><p class="small muted">Your profile, applications, contacts and conversations are saved in a local database in the app’s data folder. Keep an exported copy before changing computers.</p><div class="form-actions">${btn("Export backup", "backup", "primary", "download")}<label class="btn secondary">${icon("upload")}Restore backup<input type="file" id="backup-import" accept=".json" hidden></label></div><div class="divider"></div><div class="small-stat"><div><strong>${state.jobs.length}</strong><span>Applications</span></div><div><strong>${state.contacts.length}</strong><span>Contacts</span></div><div><strong>${state.documents.length}</strong><span>Documents</span></div></div></section><section class="panel"><h3>What “free” means here</h3><p class="small muted">There are no subscriptions or per-message fees in this app. Local inference uses your own hardware and electricity. The public job feed and external links need internet access.</p><p class="small muted">NewJob is for personal use on this computer. It has no cloud sync, paid job databases, automated outreach, job applications, or verified salary-market feeds.</p></section><section class="panel"><h3>About this implementation</h3><p class="small muted">An independent NewJob implementation based on public NxtJob feature descriptions, its shipped frontend artifacts and its trial preview. It does not contain NxtJob’s private server code or proprietary datasets.</p>${link("Back to NewJob", "home", "secondary small", "arrow")}</section></div>`
  );
}
function render() {
  const titles = {
    overview: "Overview",
    profile: "Career profile",
    resume: "Resume builder",
    ats: "Resume check",
    cover: "Cover letters",
    jobs: "Job board",
    tracker: "Applications",
    companies: "Target companies",
    network: "My network",
    agents: "AI assistants",
    library: "My documents",
    settings: "Settings",
  };
  if (route === "home") {
    app.innerHTML = landing();
    return;
  }
  let content;
  const workflow = workflows.page(route);
  if (workflow !== null) {
    app.innerHTML = shell(
      workflow,
      route.startsWith("company-")
        ? "Company research"
        : route.startsWith("deck-")
          ? "Win Deck"
          : route.charAt(0).toUpperCase() + route.slice(1),
    );
  } else if (route.startsWith("agent-")) {
    const a = agents.find((a) => a.id === route.slice(6));
    content = agentPage(a?.id || "copilot");
    app.innerHTML = shell(content, a?.name || "AI assistants");
  } else {
    const routes = {
      overview,
      profile,
      resume,
      ats,
      cover,
      jobs,
      tracker,
      companies,
      network,
      agents: assistants,
      library,
      settings,
    };
    const fn = routes[route] || overview;
    app.innerHTML = shell(fn(), titles[route] || "Overview");
  }
  if (saveFailed) setSaveLabel("Save failed — export backup", true);
  else if (saveTimer || pendingSaves) setSaveLabel("Saving…");
  document.title =
    (titles[route] ||
      agents.find((a) => "agent-" + a.id === route)?.name ||
      "Workspace") + " · NewJob";
  if (route.startsWith("agent-")) scrollMessages();
}
function scrollMessages() {
  const m = $("#messages");
  if (m) m.scrollTop = m.scrollHeight;
}
function modal(title, body, footer = "") {
  dialog.innerHTML = `<div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-action="close-dialog" aria-label="Close dialog">${icon("close")}</button></div>${body}${footer}`;
  dialog.showModal();
}
function closeModal() {
  dialog.close();
}
function jobForm(id = "") {
  const j = state.jobs.find((j) => j.id === id) || {};
  modal(
    id ? "Edit opportunity" : "Add an opportunity",
    `<form id="job-form" data-id="${esc(id)}"><div class="form-grid">${field("Job title", "title", j.title)}${field("Company", "company", j.company)}${field("Location", "location", j.location)}${field("Job link", "url", j.url, "url", "https://…")}<label>Stage<select name="stage">${stages.map((s) => `<option ${j.stage === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>${field("Follow-up date", "followup", j.followup, "date")}${area("Notes / job description", "notes", j.notes, "What makes this role interesting? What is your next step?", 5)}</div><div class="modal-foot">${id ? `<button type="button" class="btn danger" data-delete-job="${id}">Delete</button>` : ""}<button type="button" class="btn secondary" data-action="close-dialog">Cancel</button><button class="btn primary" type="submit">Save opportunity</button></div></form>`,
  );
}
function contactForm(id = "") {
  const c = state.contacts.find((c) => c.id === id) || {};
  modal(
    id ? "Edit connection" : "Add a connection",
    `<form id="contact-form" data-id="${id}"><div class="form-grid">${field("Name", "name", c.name)}${field("Company", "company", c.company)}${field("Role", "role", c.role)}${field("Profile link", "url", c.url, "url", "https://…")}<label>Status<select name="status">${["To contact", "Reached out", "Connected", "Following up"].map((s) => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>${field("Follow-up date", "followup", c.followup, "date")}${area("Notes", "notes", c.notes, "Your shared interests or context for reaching out.", 4)}</div><div class="modal-foot">${id ? `<button type="button" class="btn danger" data-delete-contact="${id}">Delete</button>` : ""}<button type="button" class="btn secondary" data-action="close-dialog">Cancel</button><button class="btn primary" type="submit">Save connection</button></div></form>`,
  );
}
function companyForm(id = "") {
  const c = state.companies.find((c) => c.id === id) || {};
  modal(
    id ? "Edit company" : "Add a target company",
    `<form id="company-form" data-id="${id}"><div class="form-grid">${field("Company name", "name", c.name)}${field("Industry / focus", "industry", c.industry)}${field("Location", "location", c.location)}${field("Company website", "url", c.url, "url", "https://…")}${area("Research notes", "notes", c.notes, "Why this company? What do you know, and what would you like to learn?", 6)}</div><div class="modal-foot">${id ? `<button type="button" class="btn danger" data-delete-company="${id}">Delete</button>` : ""}<button type="button" class="btn secondary" data-action="close-dialog">Cancel</button><button class="btn primary" type="submit">Save company</button></div></form>`,
  );
}
function confirmAction(title, description, action) {
  modal(
    title,
    `<p class="muted">${description}</p><div class="modal-foot"><button class="btn secondary" data-action="close-dialog">Cancel</button><button class="btn danger" id="confirm-button">${title}</button></div>`,
  );
  $("#confirm-button").onclick = () => {
    closeModal();
    action();
  };
}
function documentModal(id) {
  const d = state.documents.find((d) => d.id === id);
  if (!d) return;
  modal(
    "Your document",
    `<form id="doc-form" data-id="${id}"><label>Title<input name="title" required value="${esc(d.title)}"></label><label style="margin-top:16px">Content<textarea name="content" rows="15" required>${esc(d.content)}</textarea></label><div class="modal-foot" style="flex-wrap:wrap"><button type="button" class="btn danger small" data-delete-doc="${id}">Delete</button><button type="button" class="btn secondary small" data-download-doc="${id}">${icon("download")}Text</button><button type="button" class="btn secondary small" data-print-doc="${id}">Print / PDF</button><button class="btn primary small" type="submit">Save changes</button></div></form>`,
  );
}
function saveDocument(title, content, type = "Document") {
  if (!String(content).trim())
    return toast("There is nothing to save yet.", true);
  const d = {
    id: crypto.randomUUID(),
    title,
    content,
    type,
    created: new Date().toISOString(),
  };
  state.documents.push(d);
  save();
  toast("Saved to My documents.");
  return d;
}
function download(name, text, type = "text/plain") {
  const a = document.createElement("a"),
    url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function printContent(html) {
  $("#print-zone").innerHTML = html;
  window.print();
}
function context() {
  return JSON.stringify({
    profile: state.profile,
    applications: state.jobs
      .slice(-10)
      .map(({ title, company, stage, notes }) => ({
        title,
        company,
        stage,
        notes: String(notes || "").slice(0, 1200),
      })),
    targetCompanies: state.companies
      .map(({ name, industry, notes }) => ({ name, industry, notes }))
      .slice(0, 15),
  });
}
async function streamAI(agent, messages, onText, providedContext = context()) {
  if (activeStream) throw Error("An assistant is already working.");
  const ctrl = new AbortController();
  activeStream = ctrl;
  let text = "";
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent,
        model: state.settings.model,
        context: providedContext,
        messages,
      }),
      signal: ctrl.signal,
    });
    if (!response.ok) {
      const r = await response.json();
      throw Error(r.error || "Local AI request failed.");
    }
    const reader = response.body.getReader(),
      decoder = new TextDecoder();
    let pending = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split("\n");
      pending = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const part = JSON.parse(line);
        if (part.error) throw Error(part.error);
        if (part.message?.content) {
          text += part.message.content;
          onText(text);
        }
      }
    }
    if (pending.trim()) {
      const part = JSON.parse(pending);
      if (part.error) throw Error(part.error);
      if (part.message?.content) {
        text += part.message.content;
        onText(text);
      }
    }
    if (!text.trim())
      throw Error("The model returned an empty response. Try again.");
    return text;
  } finally {
    activeStream = null;
  }
}
async function sendChat(prompt) {
  const id = route.slice(6);
  if (!agents.some((a) => a.id === id) || !prompt.trim()) return;
  if (!status.aiReady)
    return toast("Open Settings and enable AI for this device.", true);
  const messages = (state.chats[id] ??= []);
  messages.push({ role: "user", content: prompt.trim() });
  const requestMessages = messages.slice(-12);
  messages.push({ role: "assistant", content: "" });
  const index = messages.length - 1;
  render();
  $("#chat-prompt")?.setAttribute("disabled", "");
  $("#chat-form button[type=submit]")?.setAttribute("disabled", "");
  let error = false;
  try {
    const promise = streamAI(id, requestMessages, (text) => {
      messages[index].content = text;
      const el = $("#message-" + index);
      if (el && route === "agent-" + id) {
        el.innerHTML = markdown(text);
        scrollMessages();
      }
    });
    render();
    await promise;
  } catch (e) {
    error = true;
    messages[index].content +=
      (messages[index].content ? "\n\n" : "") +
      (e.name === "AbortError"
        ? "[Stopped by you.]"
        : "[Generation failed: " + e.message + "]");
    toast(
      e.name === "AbortError" ? "Generation stopped." : e.message,
      e.name !== "AbortError",
    );
  } finally {
    save();
    if (route === "agent-" + id) render();
  }
}
function startPrompt(id, prompt) {
  go("agent-" + id);
  setTimeout(() => {
    const input = $("#chat-prompt");
    if (input) {
      input.value = prompt;
      input.focus();
    }
  }, 50);
}
async function checkStatus() {
  try {
    status = await api("/api/status");
    if (
      status.models.length &&
      !status.models.some((m) => m.name === state.settings.model)
    ) {
      state.settings.model =
        status.models.find((m) => m.name === "qwen2.5:3b")?.name ||
        status.models[0].name;
      save();
    }
  } catch {
    status = { models: [], aiReady: false };
  }
  return status;
}
async function importResume(file) {
  if (!file) return;
  if (file.size > 10_000_000)
    return toast("Choose a file smaller than 10 MB.", true);
  toast("Reading your resume locally…");
  try {
    const r = await fetch("/api/import", {
      method: "POST",
      headers: { "X-File-Name": encodeURIComponent(file.name) },
      body: file,
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error);
    state.profile.resumeText = data.text;
    atsText = data.text;
    save();
    render();
    toast("Resume imported. Original text is available below the editor.");
  } catch (e) {
    toast(e.message, true);
  }
}
async function generateCover(form) {
  coverDraft = Object.fromEntries(new FormData(form));
  if (
    !state.profile.experience &&
    !state.profile.resumeText &&
    !state.profile.summary
  )
    return toast("Add your experience to your profile first.", true);
  const prompt = `Write a ${coverDraft.tone.toLowerCase()} cover letter for ${coverDraft.role} at ${coverDraft.company}. Use only my actual profile facts. Do not invent achievements. Use the exact role title and company given in this request. Keep it around 250 words. No preamble. Job description: ${coverDraft.description}`;
  coverOutput = "";
  try {
    const promise = streamAI(
      "tailor",
      [{ role: "user", content: prompt }],
      (t) => {
        coverOutput = t;
        if ($("#cover-output")) $("#cover-output").textContent = t;
      },
      JSON.stringify({ profile: state.profile }),
    );
    render();
    await promise;
    toast("Draft ready. Review it before using.");
  } catch (e) {
    if (e.name === "AbortError") coverOutput += "\n\n[Generation stopped.]";
    toast(e.name === "AbortError" ? "Generation stopped." : e.message, true);
  } finally {
    if (route === "cover") render();
  }
}
document.addEventListener("submit", async (e) => {
  const f = e.target;
  if (!(f instanceof HTMLFormElement)) return;
  e.preventDefault();
  try {
    const values = Object.fromEntries(new FormData(f));
    if (f.id === "import-review-form") {
      for (const [k, v] of Object.entries(values))
        if (v.trim()) state.profile[k] = v;
      save();
      closeModal();
      render();
      toast("Reviewed sections applied. Empty fields kept unchanged.");
    }
    if (f.id === "profile-form") {
      Object.assign(state.profile, values);
      save();
      toast("Profile saved.");
      render();
    }
    if (f.id === "ats-form") {
      atsText = $("#ats-text").value;
      atsJD = $("#ats-jd").value;
      atsReport = analyzeResume(atsText, atsJD);
      $("#ats-results").innerHTML = atsResult();
    }
    if (f.id === "chat-form") {
      await sendChat($("#chat-prompt").value);
    }
    if (f.id === "cover-form") {
      await generateCover(f);
    }
    const collections = {
      "job-form": "jobs",
      "contact-form": "contacts",
      "company-form": "companies",
    };
    if (collections[f.id]) {
      const list = state[collections[f.id]],
        id = f.dataset.id;
      if (values.url && !safeUrl(values.url))
        throw Error("Use a valid HTTP or HTTPS link.");
      if (id) {
        Object.assign(
          list.find((x) => x.id === id),
          values,
          { updated: new Date().toISOString() },
        );
      } else
        list.push({
          ...values,
          id: crypto.randomUUID(),
          created: new Date().toISOString(),
        });
      save();
      closeModal();
      render();
      toast("Saved to your workspace.");
    }
    if (f.id === "doc-form") {
      const d = state.documents.find((d) => d.id === f.dataset.id);
      Object.assign(d, values, { updated: new Date().toISOString() });
      save();
      closeModal();
      render();
      toast("Document updated.");
    }
  } catch (e) {
    toast(e.message, true);
  }
});
document.addEventListener("input", (e) => {
  const el = e.target;
  if (
    (route === "resume" || route === "profile") &&
    el.name &&
    Object.hasOwn(state.profile, el.name) &&
    !el.closest("dialog")
  ) {
    state.profile[el.name] = el.value;
    if ($("#resume-preview")) $("#resume-preview").innerHTML = paper();
    save();
  }
  if (el.id === "imported-text") {
    state.profile.resumeText = el.value;
    save();
  }
  if (el.id === "ats-text") atsText = el.value;
  if (el.id === "ats-jd") atsJD = el.value;
  if (el.id === "job-query") {
    jobQuery = el.value;
    jobLimit = 30;
    updateJobList();
  }
  if (el.id === "job-location") {
    jobLocation = el.value;
    jobLimit = 30;
    updateJobList();
  }
});
document.addEventListener("change", async (e) => {
  const el = e.target;
  if (el.id === "resume-import") await importResume(el.files[0]);
  if (["resume-style", "resume-color", "resume-spacing"].includes(el.id)) {
    state.settings[
      {
        "resume-style": "resumeStyle",
        "resume-color": "resumeColor",
        "resume-spacing": "resumeSpacing",
      }[el.id]
    ] = el.value;
    $("#resume-preview").innerHTML = paper();
    save();
  }
  if (el.id === "job-category") {
    jobCategory = el.value;
    jobLimit = 30;
    updateJobList();
  }
  if (el.dataset.stage) {
    const job = state.jobs.find((j) => j.id === el.dataset.stage);
    job.stage = el.value;
    job.updated = new Date().toISOString();
    save();
    render();
    toast("Moved to " + job.stage + ".");
  }
  if (el.id === "model-select") {
    state.settings.model = el.value;
    save();
    toast("Local model selected.");
  }
  if (el.id === "backup-import" && el.files[0]) {
    try {
      const file = el.files[0];
      if (file.size > 16_000_000)
        throw Error("Backup exceeds the 16 MB limit.");
      const imported = validateState(JSON.parse(await file.text()));
      confirmAction(
        "Restore backup",
        "This replaces your current workspace. Export a backup first if you want to keep it.",
        () => {
          state = imported;
          save();
          render();
          toast("Backup restored.");
        },
      );
    } catch (e) {
      toast(e.message, true);
    }
  }
});
document.addEventListener("click", async (e) => {
  const el = e.target.closest("button,a,[data-action]");
  if (!el) return;
  if (el.classList.contains("skip")) {
    e.preventDefault();
    $("#main")?.focus();
    return;
  }
  try {
    if (el.dataset.scroll) {
      e.preventDefault();
      $("#" + el.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (el.dataset.editJob !== undefined) return jobForm(el.dataset.editJob);
    if (el.dataset.editContact !== undefined)
      return contactForm(el.dataset.editContact);
    if (el.dataset.editCompany !== undefined)
      return companyForm(el.dataset.editCompany);
    for (const [key, collection, label] of [
      ["deleteJob", "jobs", "opportunity"],
      ["deleteContact", "contacts", "connection"],
      ["deleteCompany", "companies", "company"],
      ["deleteDoc", "documents", "document"],
    ])
      if (el.dataset[key]) {
        const id = el.dataset[key];
        closeModal();
        confirmAction(
          "Delete " + label,
          "Remove this " + label + " from your local workspace?",
          () => {
            state[collection] = state[collection].filter((x) => x.id !== id);
            save();
            render();
            toast("Removed.");
          },
        );
        return;
      }
    if (el.dataset.saveJob) {
      const j = jobFeed.jobs.find((j) => j.id === el.dataset.saveJob);
      if (state.jobs.some((s) => s.sourceId === "remotive-" + j.id)) return;
      state.jobs.push({
        id: crypto.randomUUID(),
        sourceId: "remotive-" + j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        url: safeUrl(j.url),
        stage: "Saved",
        notes: j.description,
        created: new Date().toISOString(),
      });
      save();
      updateJobList();
      toast("Saved to Applications.");
      return;
    }
    if (el.dataset.jobDetail) {
      const j = jobFeed.jobs.find((j) => j.id === el.dataset.jobDetail);
      modal(
        esc(j.title),
        `<p class="muted">${esc(j.company)} · ${esc(j.location)}</p><div class="modal-details prose small">${esc(j.description)}</div><div class="modal-foot"><button class="btn secondary" data-save-job="${j.id}">${icon("plus")}Save job</button><a class="btn primary" target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(j.url))}">View on Remotive ${icon("external")}</a></div>`,
      );
      return;
    }
    if (el.dataset.prompt) {
      const [id, i] = el.dataset.prompt.split(":");
      const p = $("#chat-prompt");
      p.value = prompts[id][Number(i)];
      p.focus();
      return;
    }
    if (el.dataset.draftContact) {
      const c = state.contacts.find((c) => c.id === el.dataset.draftContact);
      startPrompt(
        "networker",
        `Draft a concise networking message to ${c.name}, ${c.role || "a professional"} at ${c.company}. Context: ${c.notes || "I would like to learn more about their work."}`,
      );
      return;
    }
    if (el.dataset.doc) return documentModal(el.dataset.doc);
    if (el.dataset.downloadDoc) {
      const f = $("#doc-form");
      download(f.elements.title.value + ".txt", f.elements.content.value);
      return;
    }
    if (el.dataset.printDoc) {
      const f = $("#doc-form");
      printContent(
        `<h1>${esc(f.elements.title.value)}</h1><div class="prose">${esc(f.elements.content.value)}</div>`,
      );
      return;
    }
    const a = el.dataset.action;
    if (!a) return;
    if (a === "menu") {
      $("#nav").classList.add("open");
      $("#overlay").classList.add("show");
    }
    if (a === "close-nav") {
      $("#nav").classList.remove("open");
      $("#overlay").classList.remove("show");
    }
    if (a === "close-dialog") closeModal();
    if (a === "add-job") jobForm();
    if (a === "add-contact") contactForm();
    if (a === "add-company") companyForm();
    if (a === "resume-text")
      download(
        (state.profile.name || "NewJob") + "-resume.txt",
        resumeText(state.profile),
      );
    if (a === "print-resume") printContent(paper());
    if (a === "tailor-resume")
      startPrompt(
        "tailor",
        "Help me improve my resume using only my real experience. Ask me for the target job description if needed.",
      );
    if (a === "review-import") {
      const parsed = parseResume(state.profile.resumeText);
      modal(
        "Review imported sections",
        `<p class="small muted">Detected from headings in your file. Check the text before applying. Only non-empty fields replace your profile.</p><form id="import-review-form"><div class="form-grid">${field("Full name", "name", parsed.name)}${field("Email", "email", parsed.email, "email")}${["summary", "skills", "experience", "education"].map((k) => area(k[0].toUpperCase() + k.slice(1), k, parsed[k], "Not detected — leave blank to keep existing content", 4)).join("")}</div><div class="modal-foot"><button type="button" class="btn secondary" data-action="close-dialog">Cancel</button><button class="btn primary" type="submit">Apply reviewed sections</button></div></form>`,
      );
    }
    if (a === "structure-resume")
      startPrompt(
        "tailor",
        "Organize my imported resume text into clearly labeled Summary, Skills, Experience and Education sections. Preserve the facts exactly. Do not invent details. Imported text:\n" +
          state.profile.resumeText.slice(0, 15000),
      );
    if (a === "ats-use") {
      atsText =
        state.profile.experience || state.profile.summary
          ? resumeText(state.profile)
          : state.profile.resumeText || resumeText(state.profile);
      $("#ats-text").value = atsText;
      toast("Resume text added.");
    }
    if (a === "save-ats" && atsReport)
      saveDocument(
        "Resume check · " + new Date().toLocaleDateString(),
        JSON.stringify(atsReport, null, 2),
        "Resume report",
      );
    if (a === "ats-tailor")
      startPrompt(
        "tailor",
        "Help me improve this resume for this job. Do not add unsupported claims.\nResume:\n" +
          atsText.slice(0, 10000) +
          "\nJob:\n" +
          atsJD.slice(0, 6000),
      );
    if (a === "load-jobs") await loadJobs();
    if (a === "retry-jobs") {
      jobFeed = null;
      await loadJobs();
    }
    if (a === "more-jobs") {
      jobLimit += 30;
      updateJobList();
    }
    if (a === "backup")
      download(
        "NewJob-backup-" + new Date().toISOString().slice(0, 10) + ".json",
        JSON.stringify(state, null, 2),
        "application/json",
      );
    if (a === "check-ai") {
      el.disabled = true;
      el.textContent = "Checking…";
      await checkStatus();
      render();
      toast(
        status.aiReady
          ? "Local AI is connected."
          : "Open Ollama, then try again.",
        !status.aiReady,
      );
    }
    if (a === "stop-ai") activeStream?.abort();
    if (a === "save-chat") {
      const id = route.slice(6);
      const messages = state.chats[id] || [];
      saveDocument(
        (agents.find((a) => a.id === id)?.name || "Assistant") +
          " conversation",
        messages
          .map(
            (m) =>
              (m.role === "user" ? "You" : "Assistant") + ":\n" + m.content,
          )
          .join("\n\n"),
        "Conversation",
      );
    }
    if (a === "clear-chat") {
      if (activeStream) return toast("Stop the current response first.");
      const id = route.slice(6);
      if (!state.chats[id]?.length) return;
      confirmAction(
        "Start new conversation",
        "The current chat will be cleared. Save it to My documents if you want to keep a copy.",
        () => {
          state.chats[id] = [];
          save();
          render();
        },
      );
    }
    if (a === "save-cover")
      saveDocument(
        "Cover letter · " + (coverDraft.company || "Draft"),
        coverOutput,
        "Cover letter",
      );
    if (a === "copy-cover") {
      if (!coverOutput.trim()) return toast("Generate a draft first.");
      await navigator.clipboard.writeText(coverOutput);
      toast("Copied to clipboard.");
    }
    if (a === "print-cover") {
      if (!coverOutput.trim()) return toast("Generate a draft first.");
      printContent(`<div class="prose">${esc(coverOutput)}</div>`);
    }
    if (a === "new-doc") {
      const d = saveDocument(
        "Untitled document",
        "Start writing here…",
        "Document",
      );
      documentModal(d.id);
    }
  } catch (err) {
    toast(err.message, true);
  }
});
window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1) || "home";
  if (next.startsWith("home-")) {
    go("home");
    return;
  }
  if (route === "profile") {
    const f = $("#profile-form");
    if (f) {
      Object.assign(state.profile, Object.fromEntries(new FormData(f)));
      save();
    }
  }
  route = next;
  render();
  window.scrollTo(0, 0);
});
window.addEventListener("beforeunload", (e) => {
  if (saveTimer || pendingSaves || activeStream || saveFailed) {
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && saveTimer) flushSave();
});
try {
  const initial = await api("/api/state");
  state = validateState(initial.state);
  revision = initial.revision;
  render();
  await checkStatus();
  render();
} catch (e) {
  app.innerHTML = `<main class="workspace">${head("Your workspace could not open.", "Make sure the NewJob server is running.")}<div class="notice error">${esc(e.message)}</div><p style="margin-top:20px">Open <strong>Start NewJob.cmd</strong> in the app folder, then reload this page.</p></main>`;
}
