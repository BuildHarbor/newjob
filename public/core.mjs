import { blankExtras, validateExtras } from "./workflow-core.mjs";
export const stages = ["Saved", "Applied", "Interview", "Offer", "Closed"];
export const agents = [
  {
    id: "copilot",
    name: "Guide",
    role: "Your career copilot",
    icon: "spark",
    description: "Turn a big career move into a clear next step.",
    prompt:
      "Be a practical career coach. Use the supplied profile and pipeline. Prioritize three concrete next actions. Ask for missing information. Do not claim to have performed actions.",
  },
  {
    id: "navigator",
    name: "Navigator",
    role: "Career strategy",
    icon: "compass",
    description: "Find the roles that fit your experience and ambitions.",
    prompt:
      "Create a career positioning strategy using only the supplied facts. Include suitable roles, transferable skills, gaps, a two-week action plan and questions. Do not invent salary data or job availability.",
  },
  {
    id: "hunter",
    name: "Scout",
    role: "Job discovery",
    icon: "search",
    description: "Build a focused search and evaluate opportunities.",
    prompt:
      "Help the user define job search queries, target company criteria and assess supplied job descriptions. Do not invent live vacancies or claim to search websites. Point them to the Job board for actual sourced listings.",
  },
  {
    id: "tailor",
    name: "Tailor",
    role: "Resume tailoring",
    icon: "file",
    description: "Make your real experience relevant to the role.",
    prompt:
      "Tailor resume language to the supplied job description without inventing achievements, employers, dates or skills. Produce an improved summary, rewritten bullet suggestions based on supplied facts, and missing evidence questions. Flag missing requirements rather than fabricate.",
  },
  {
    id: "networker",
    name: "Connector",
    role: "Professional networking",
    icon: "users",
    description: "Start thoughtful conversations with the right people.",
    prompt:
      "Draft concise networking messages for the named person and company using only supplied facts. Give a connection note, a follow-up and a respectful next step. Do not invent contacts, emails or personal details. Never claim messages were sent.",
  },
  {
    id: "pitcher",
    name: "Pitch",
    role: "Company pitch",
    icon: "presentation",
    description: "Show a company the problem you could help solve.",
    prompt:
      "Create a five-slide written pitch: company challenge, hypothesis, proposed experiment, success measures, and first 30 days. Separate supplied facts from assumptions. Never invent research, company statistics or customer quotes. Use clear slide headings and concise bullets.",
  },
  {
    id: "influencer",
    name: "Voice",
    role: "LinkedIn content",
    icon: "pen",
    description: "Turn your experience into a useful professional voice.",
    prompt:
      "Create an authentic LinkedIn content plan and draft posts using the supplied real experience. Avoid invented achievements. Write in the user voice, no hype. Include practical post ideas and a weekly cadence. Never claim to publish.",
  },
  {
    id: "interviewer",
    name: "Practice",
    role: "Mock interviews",
    icon: "mic",
    description: "Rehearse, get feedback, and sharpen your story.",
    prompt:
      "Conduct a mock interview for the supplied role. Ask ONE question at a time. After the user answers, give brief constructive feedback on specificity and structure, then ask the next question. Do not answer your own question. When asked to finish, summarize strengths and areas to practice.",
  },
  {
    id: "negotiator",
    name: "Advocate",
    role: "Offer negotiation",
    icon: "handshake",
    description: "Prepare a clear, well-supported counteroffer.",
    prompt:
      "Help prepare an offer negotiation using the user numbers and evidence. Distinguish base salary, variable pay and equity. Draft a respectful counteroffer and responses to pushback. Do not invent market salary data or promise outcomes.",
  },
];
export const blankProfile = () => ({
  name: "",
  email: "",
  phone: "",
  location: "",
  role: "",
  link: "",
  summary: "",
  skills: "",
  experience: "",
  education: "",
  resumeText: "",
});
export const blankState = () => ({
  ...blankExtras(),
  version: 1,
  profile: blankProfile(),
  jobs: [],
  contacts: [],
  companies: [],
  documents: [],
  chats: {},
  settings: { model: "qwen2.5:3b" },
  tasks: [],
});
export function validateState(x) {
  if (!x || typeof x !== "object" || Array.isArray(x) || x.version !== 1)
    throw Error("This is not a NewJob backup.");
  const s = blankState();
  if (!x.profile || typeof x.profile !== "object")
    throw Error("Profile is missing.");
  for (const k of Object.keys(s.profile)) {
    const v = x.profile[k] ?? "";
    if (typeof v !== "string" || v.length > 100000)
      throw Error("Invalid profile field.");
    s.profile[k] = v;
  }
  for (const k of ["jobs", "contacts", "companies", "documents", "tasks"]) {
    if (!Array.isArray(x[k]) || x[k].length > 5000) throw Error("Invalid " + k);
    s[k] = x[k];
  }
  const fields = {
    jobs: [
      "title",
      "company",
      "stage",
      "location",
      "url",
      "followup",
      "notes",
      "sourceId",
      "created",
      "updated",
    ],
    contacts: [
      "name",
      "company",
      "role",
      "url",
      "status",
      "followup",
      "notes",
      "created",
      "updated",
    ],
    companies: [
      "name",
      "industry",
      "location",
      "url",
      "notes",
      "created",
      "updated",
    ],
    documents: ["title", "content", "type", "created", "updated"],
  };
  for (const [k, names] of Object.entries(fields)) {
    const seen = new Set();
    s[k] = s[k].map((r) => {
      if (
        !r ||
        typeof r !== "object" ||
        typeof r.id !== "string" ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(r.id) ||
        seen.has(r.id)
      )
        throw Error("Invalid record.");
      seen.add(r.id);
      const clean = { id: r.id };
      for (const n of names) {
        const v = r[n] ?? "";
        if (typeof v !== "string" || v.length > 100000)
          throw Error("Invalid " + k + " field.");
        if (
          ["created", "updated", "followup"].includes(n) &&
          v &&
          Number.isNaN(Date.parse(v))
        )
          throw Error("Invalid date.");
        clean[n] = v;
      }
      return clean;
    });
  }
  for (const j of s.jobs)
    if (
      !stages.includes(j.stage) ||
      typeof j.title !== "string" ||
      typeof j.company !== "string"
    )
      throw Error("Invalid job.");
  if (x.chats && typeof x.chats === "object" && !Array.isArray(x.chats))
    for (const a of agents) {
      const c = x.chats[a.id];
      if (Array.isArray(c)) {
        s.chats[a.id] = c
          .slice(-100)
          .filter(
            (m) =>
              m &&
              ["user", "assistant"].includes(m.role) &&
              typeof m.content === "string" &&
              m.content.length <= 100000,
          );
      }
    }
  if (
    typeof x.settings?.model === "string" &&
    /^[\w./:-]{1,100}$/.test(x.settings.model)
  )
    s.settings.model = x.settings.model;
  for (const [key, values] of Object.entries({
    resumeStyle: ["modern", "classic"],
    resumeColor: ["green", "navy", "black"],
    resumeSpacing: ["comfortable", "compact"],
  }))
    if (values.includes(x.settings?.[key])) s.settings[key] = x.settings[key];
  Object.assign(s, validateExtras(x));
  return s;
}
export function parseResume(source) {
  const p = blankProfile(),
    lines = String(source)
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  p.resumeText = String(source);
  p.email = String(source).match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || "";
  if (
    lines[0] &&
    lines[0].length < 65 &&
    !/@|\d|resume|curriculum/i.test(lines[0])
  )
    p.name = lines[0];
  const headings = {
    summary: /^(summary|professional summary|profile|objective)\s*:?$/i,
    skills: /^(skills|technical skills|core competencies|technologies)\s*:?$/i,
    experience:
      /^(experience|work experience|professional experience|employment|work history)\s*:?$/i,
    education:
      /^(education|education & certifications|qualifications|certifications)\s*:?$/i,
  };
  let section = "";
  for (const line of lines) {
    const found = Object.entries(headings).find(([, re]) => re.test(line));
    if (found) {
      section = found[0];
      continue;
    }
    if (section) p[section] += (p[section] ? "\n" : "") + line;
  }
  return p;
}
export function resumeText(p) {
  return [
    p.name,
    p.role,
    [p.email, p.phone, p.location, p.link].filter(Boolean).join(" | "),
    p.summary && "SUMMARY\n" + p.summary,
    p.skills && "SKILLS\n" + p.skills,
    p.experience && "EXPERIENCE\n" + p.experience,
    p.education && "EDUCATION\n" + p.education,
  ]
    .filter(Boolean)
    .join("\n\n");
}
const stop = new Set(
  "about above after again also among and are because been being below between both but can candidate candidates company could day each either ensure etc for from full have having into its job jobs join more most must need new not now offer one other our out over per please position preferred provide responsibilities role should skills some such team than that the their them then there these they this those through time under use using very was were what when where which while who will with work working would year years you your".split(
    " ",
  ),
);
export function keywords(text) {
  const words =
    String(text)
      .toLowerCase()
      .match(/[a-z][a-z0-9+#.-]{2,}/g) || [];
  const count = new Map();
  for (const token of words) {
    const w = token.replace(/[.-]+$/, "");
    if (w && !stop.has(w)) count.set(w, (count.get(w) || 0) + 1);
  }
  return [...count]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([w]) => w);
}
export function analyzeResume(text, jd = "") {
  const clean = String(text).trim(),
    words = clean.split(/\s+/).filter(Boolean),
    lower = clean.toLowerCase();
  if (words.length < 20)
    throw Error("Add at least 20 words of resume text to get a useful check.");
  const terms = keywords(jd);
  const found = terms.filter((t) =>
    new RegExp(
      "(^|[^a-z0-9])" +
        t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        "(?=$|[^a-z0-9])",
      "i",
    ).test(clean),
  );
  const checks = [
    {
      label: "Contact email",
      pass: /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(clean),
      tip: "Include a professional email address.",
    },
    {
      label: "Experience section",
      pass: /experience|employment|work history/i.test(clean),
      tip: "Use a recognizable Experience heading.",
    },
    {
      label: "Skills section",
      pass: /skills|technologies|competencies/i.test(clean),
      tip: "Add a clearly labeled Skills section.",
    },
    {
      label: "Education section",
      pass: /education|qualification|university|degree/i.test(clean),
      tip: "Include relevant education or qualifications.",
    },
    {
      label: "Measurable evidence",
      pass: /\d+\s*(%|percent|million|users|customers|hours|projects|people|revenue)|[$₹€£]\s*\d/i.test(
        clean,
      ),
      tip: "Add truthful numbers that show the scale or impact of your work.",
    },
    {
      label: "Action-led wording",
      pass: /\b(led|built|designed|improved|delivered|launched|managed|reduced|increased|developed|created)\b/i.test(
        clean,
      ),
      tip: "Start achievement bullets with specific action verbs.",
    },
    {
      label: "Useful level of detail",
      pass: words.length >= 150 && words.length <= 1000,
      tip: "Aim for approximately 150–1,000 words, adjusted for experience.",
    },
    {
      label: "No placeholder text",
      pass: !/lorem ipsum|\[your|insert here|example@|responsible for everything/i.test(
        clean,
      ),
      tip: "Replace placeholders with your real details.",
    },
  ];
  const structure = Math.round(
    (checks.filter((c) => c.pass).length / checks.length) * 100,
  );
  const match = terms.length
    ? Math.round((found.length / terms.length) * 100)
    : null;
  return {
    score:
      match === null ? structure : Math.round(structure * 0.55 + match * 0.45),
    structure,
    match,
    words: words.length,
    checks,
    found,
    missing: terms.filter((t) => !found.includes(t)),
    terms,
    note: "A transparent text-readiness heuristic, not an employer ATS score or a prediction of hiring outcomes. PDF layout and parsing compatibility are not scored.",
  };
}
export function safeUrl(value) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
