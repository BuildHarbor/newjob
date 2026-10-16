// Shared, deliberately small schemas for durable workflow records.
const str = (v = "", max = 20000) => {
  if (typeof v !== "string" || v.length > max)
    throw Error("Invalid workflow text.");
  return v;
};
const id = (v) => {
  if (typeof v !== "string" || !/^[\w-]{1,100}$/.test(v))
    throw Error("Invalid workflow ID.");
  return v;
};
const arr = (v, fn, max = 100) => {
  if (!Array.isArray(v) || v.length > max)
    throw Error("Invalid workflow collection.");
  return v.map(fn);
};
const texts = (v = []) => arr(v, (x) => str(x, 2000), 30);
const fields = (x, names) =>
  Object.fromEntries(names.map((n) => [n, str(x[n] ?? "")]));
export const blankExtras = () => ({
  research: [],
  decks: [],
  stories: [],
  offers: [],
  plans: [],
  posts: [],
});
export function cleanSource(x) {
  return {
    id: id(x.id),
    ...fields(x, ["title", "url", "text", "kind", "retrieved"]),
  };
}
export function cleanProblem(x) {
  return {
    id: id(x.id),
    ...fields(x, ["title", "hypothesis", "impact", "experiment", "metric"]),
    evidence: arr(
      x.evidence || [],
      (e) => ({ sourceId: id(e.sourceId), quote: str(e.quote, 800) }),
      8,
    ),
  };
}
export function cleanDeck(x) {
  return {
    id: id(x.id),
    ...fields(x, [
      "title",
      "companyId",
      "company",
      "role",
      "audience",
      "created",
      "updated",
      "researchId",
    ]),
    slides: arr(
      x.slides || [],
      (s) => ({
        ...fields(s, ["title", "body", "notes"]),
        sourceIds: texts(s.sourceIds),
        imageIndex:
          Number.isInteger(s.imageIndex) &&
          s.imageIndex >= 0 &&
          s.imageIndex < 4
            ? s.imageIndex
            : -1,
      }),
      15,
    ),
    images: arr(
      x.images || [],
      (im) => {
        if (
          !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(im.data) ||
          im.data.length > 420000
        )
          throw Error("Use a PNG or JPG image under 300 KB.");
        return { data: im.data, caption: str(im.caption, 500) };
      },
      4,
    ),
  };
}
export function validateExtras(x) {
  const out = blankExtras();
  const schemas = {
    research: (r) => ({
      id: id(r.id),
      ...fields(r, ["companyId", "company", "created", "summary"]),
      sources: arr(r.sources || [], cleanSource, 20),
      problems: arr(r.problems || [], cleanProblem, 8),
      warnings: texts(r.warnings),
    }),
    decks: cleanDeck,
    stories: (r) => ({
      id: id(r.id),
      ...fields(r, [
        "title",
        "challenge",
        "action",
        "result",
        "skills",
        "evidenceUrl",
        "created",
      ]),
    }),
    offers: (r) => ({
      id: id(r.id),
      ...fields(r, [
        "company",
        "role",
        "currency",
        "base",
        "variable",
        "joining",
        "equity",
        "target",
        "minimum",
        "alternatives",
        "evidence",
        "benefits",
        "created",
      ]),
      rounds: arr(
        r.rounds || [],
        (q) => ({
          ...fields(q, ["question", "answer", "feedback", "reply"]),
          score: Number.isFinite(q.score)
            ? Math.min(4, Math.max(0, q.score))
            : 0,
        }),
        12,
      ),
    }),
    plans: (r) => ({
      id: id(r.id),
      ...fields(r, ["title", "content", "created"]),
    }),
    posts: (r) => ({
      id: id(r.id),
      ...fields(r, ["title", "content", "date", "status", "created"]),
    }),
  };
  for (const [key, fn] of Object.entries(schemas)) {
    out[key] = arr(x[key] || [], fn, 500);
    const seen = new Set();
    for (const r of out[key]) {
      if (seen.has(r.id)) throw Error("Duplicate workflow ID.");
      seen.add(r.id);
    }
  }
  return out;
}
export function groundedProblems(problems, sources) {
  const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return problems.slice(0, 5).map((p, i) => ({
    ...cleanProblem({ ...p, id: p.id || "problem-" + (i + 1) }),
    evidence: (p.evidence || [])
      .filter((e) => {
        const s = sources.find((s) => s.id === e.sourceId);
        return (
          s && e.quote?.length >= 12 && norm(s.text).includes(norm(e.quote))
        );
      })
      .map((e) => ({ sourceId: e.sourceId, quote: e.quote.slice(0, 800) })),
  }));
}
export function offerTotals(offer) {
  const n = (k) => Math.max(0, Number(offer[k]) || 0);
  const base = n("base"),
    variable = n("variable"),
    joining = n("joining"),
    target = n("target");
  return {
    base,
    variable,
    joining,
    equity: n("equity"),
    potentialAnnualCash: base + variable,
    firstYearPotentialCash: base + variable + joining,
    counterIncrease: target - base,
    counterPercent: base ? ((target - base) / base) * 100 : null,
  };
}
export function negotiationRubric(answer) {
  const s = String(answer);
  const checks = [
    {
      label: "Specific ask",
      pass: /\d/.test(s),
      tip: "Name the compensation or term you are requesting.",
    },
    {
      label: "Evidence of value",
      pass: /\b(led|built|delivered|improved|reduced|increased|impact|experience|results|research)\b/i.test(
        s,
      ),
      tip: "Connect your request to a concrete, truthful result.",
    },
    {
      label: "Collaborative wording",
      pass: /\b(thank|excited|appreciate|together|discuss|consider|possible|could|would)\b/i.test(
        s,
      ),
      tip: "Acknowledge the offer and invite a discussion.",
    },
    {
      label: "Options beyond base",
      pass: /\b(bonus|equity|review|flexib|benefit|leave|remote|title|scope|alternative|signing)\w*/i.test(
        s,
      ),
      tip: "Explore another term if base pay is constrained.",
    },
  ];
  return {
    score: checks.filter((c) => c.pass).length,
    checks,
    note: "Transparent wording checklist, not a prediction of negotiation success.",
  };
}
export const negotiationLessons = [
  {
    title: "Understand the whole offer",
    text: "Separate annual base, target variable pay, one-time joining bonus and equity. Ask when each component is earned or paid. A headline package is not guaranteed cash.",
    question:
      "Which amount normally recurs each year without a performance condition?",
    choices: ["Annual base salary", "Joining bonus", "Unvested equity"],
    answer: 0,
    why: "Base is recurring pay. Bonuses may be conditional or one-time; equity has vesting and valuation risk.",
  },
  {
    title: "Set your range and alternatives",
    text: "Write down a target, a private minimum and what you would do without this offer. Use comparable roles, location and scope when researching pay. Keep your minimum private.",
    question: "What should determine your walk-away point?",
    choices: [
      "Your alternatives and priorities",
      "The largest number you can find online",
      "A fixed percentage for every role",
    ],
    answer: 0,
    why: "A useful minimum reflects your situation and realistic alternatives, not a universal salary rule.",
  },
  {
    title: "Make a supported counter",
    text: "Thank the employer, show enthusiasm, give a clear ask and support it with relevant evidence. Avoid inventing another offer or turning the conversation into a threat.",
    question: "Which counter is most constructive?",
    choices: [
      "I am excited; given this scope and evidence, could we discuss this range?",
      "Pay more or I walk",
      "I deserve more because I want it",
    ],
    answer: 0,
    why: "A clear request with evidence gives the other person something concrete to consider.",
  },
  {
    title: "Respond to a constraint",
    text: "If base is fixed, explore a signing bonus, review date, role scope, flexibility or development support. Ask which terms are adjustable and consider the whole package.",
    question: "The manager says the base budget is fixed. What next?",
    choices: [
      "Ask which other terms or review dates are flexible",
      "Assume no term can change",
      "Invent a competing offer",
    ],
    answer: 0,
    why: "Explore the constraint and other interests without misrepresenting your circumstances.",
  },
  {
    title: "Close carefully",
    text: "Ask for the final package and conditions in writing. Review start date, bonus conditions, vesting, probation and responsibilities. Take reasonable time to assess the complete offer.",
    question: "Before accepting, what should you confirm?",
    choices: [
      "Written terms and conditions",
      "Only the verbal headline number",
      "Only the job title",
    ],
    answer: 0,
    why: "Written terms let you check the whole offer before making a commitment.",
  },
];
export const negotiationQuestions = [
  "We are pleased to offer you this package. What would you like to discuss?",
  "Your requested base is above our current budget. Why should we consider it?",
  "This is our final base offer. Is there another way to make the package work?",
  "What would you need clarified before making your decision?",
];
