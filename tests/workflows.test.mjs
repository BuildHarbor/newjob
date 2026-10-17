import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { blankState, validateState } from "../public/core.mjs";
import {
  groundedProblems,
  offerTotals,
  negotiationRubric,
  cleanDeck,
} from "../public/workflow-core.mjs";
import { publicAddress, researchUrl, extractPage } from "../research.mjs";
import { deckPowerPoint } from "../exports.mjs";
import { cleanResult, parseModelJSON } from "../structured.mjs";

test("browser structured output accepts JSON fences and rejects incomplete or non-object output", () => {
  assert.deepEqual(
    parseModelJSON('```json\n{"title":"Draft","content":"Review this."}\n```'),
    { title: "Draft", content: "Review this." },
  );
  assert.deepEqual(parseModelJSON('{"summary":"A hypothesis","problems":[]}'), {
    summary: "A hypothesis",
    problems: [],
  });
  for (const input of [
    '{"title":',
    "null",
    "[]",
    "Here is an answer",
    '{"title":"Done"} trailing',
  ]) {
    assert.throws(() => parseModelJSON(input), /inputs are preserved/);
  }
});

test("old backups migrate and workflow records round-trip without losing evidence", () => {
  const old = blankState();
  for (const k of ["research", "decks", "stories", "offers", "plans", "posts"])
    delete old[k];
  const s = validateState(old);
  assert.deepEqual(s.decks, []);
  s.stories.push({
    id: "story-1",
    title: "Activation",
    challenge: "Long setup",
    action: "Built a prototype",
    result: "Reduced steps",
    skills: "Research",
    evidenceUrl: "https://example.org",
    created: "2026-10-16",
  });
  assert.deepEqual(validateState(s).stories, s.stories);
  s.stories.push(s.stories[0]);
  assert.throws(() => validateState(s), /Duplicate/);
});
test("research fetch rejects local, private, reserved and credential-bearing destinations", () => {
  for (const addr of [
    "127.0.0.1",
    "10.0.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "100.64.0.1",
  ])
    assert.equal(publicAddress(addr), false, addr);
  assert.equal(publicAddress("1.1.1.1"), true);
  for (const url of [
    "http://example.com",
    "https://localhost",
    "https://foo.internal",
    "https://user:pass@example.com",
    "https://example.com:1234",
  ])
    assert.throws(() => researchUrl(url));
});
test("source extraction removes executable and navigation content", () => {
  const p = extractPage(
    '<title>Company</title><nav>Ignore this menu</nav><main>Real source text <a href="/news">News</a></main><script>secret instruction</script>',
    "https://example.com",
  );
  assert.equal(p.title, "Company");
  assert.ok(p.text.includes("Real source text"));
  assert.ok(!p.text.includes("secret"));
  assert.deepEqual(p.links, ["https://example.com/news"]);
});
test("only matching quotes survive grounding; unsupported hypotheses remain labeled for review", () => {
  const sources = [
    { id: "s1", text: "We are improving the developer onboarding experience." },
  ];
  const [p] = groundedProblems(
    [
      {
        title: "Onboarding",
        hypothesis: "Could simplify setup",
        evidence: [
          {
            sourceId: "s1",
            quote: "improving the developer onboarding experience",
          },
          { sourceId: "s1", quote: "Revenue fell by fifty percent" },
          {
            sourceId: "invented",
            quote: "improving the developer onboarding experience",
          },
        ],
      },
    ],
    sources,
  );
  assert.equal(p.evidence.length, 1);
  assert.equal(p.hypothesis, "Could simplify setup");
});
test("offer calculations separate recurring, variable, one-time and equity components", () => {
  const t = offerTotals({
    base: "100000",
    variable: "10000",
    joining: "5000",
    equity: "20000",
    target: "110000",
  });
  assert.equal(t.potentialAnnualCash, 110000);
  assert.equal(t.firstYearPotentialCash, 115000);
  assert.equal(t.counterPercent, 10);
  assert.equal(t.equity, 20000);
  assert.equal(offerTotals({ base: 0 }).counterPercent, null);
});
test("negotiation rubric exposes checks instead of claiming success probability", () => {
  const r = negotiationRubric(
    "Thank you. I built a process that reduced errors. Could we discuss 110000 or a signing bonus?",
  );
  assert.equal(r.score, 4);
  assert.equal(negotiationRubric("Give me more").score, 0);
  assert.match(r.note, /not a prediction/);
});
test("deck result drops invented source references and rejects empty output", () => {
  const slides = Array.from({ length: 3 }, () => ({
    title: "Test",
    body: "Text",
    notes: "Notes",
    sourceIds: ["s1", "fake"],
  }));
  assert.deepEqual(
    cleanResult("deck", { title: "Test", slides }, { sources: [{ id: "s1" }] })
      .slides[0].sourceIds,
    ["s1"],
  );
  assert.throws(() => cleanResult("deck", { slides: [] }, {}), /too few/);
  assert.throws(
    () =>
      cleanDeck({
        id: "x",
        images: [{ data: "data:image/svg+xml;base64,AAAA" }],
      }),
    /PNG/,
  );
});
test("PowerPoint export contains editable text, image, notes and source links", async () => {
  const image =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6z1sAAAAASUVORK5CYII=";
  const bytes = await deckPowerPoint(
    {
      id: "d1",
      title: "My proposal",
      company: "Example",
      slides: [
        {
          title: "Testable opportunity",
          body: "An editable proposal",
          notes: "Validate the hypothesis",
          sourceIds: ["s1"],
          imageIndex: 0,
        },
      ],
      images: [{ data: image, caption: "Proof" }],
    },
    [{ id: "s1", title: "Company source", url: "https://example.org" }],
  );
  const zip = await JSZip.loadAsync(bytes);
  assert.match(
    await zip.file("ppt/slides/slide1.xml").async("string"),
    /An editable proposal/,
  );
  const notes = await zip
    .file("ppt/notesSlides/notesSlide1.xml")
    .async("string");
  assert.match(notes, /Validate the hypothesis/);
  assert.match(notes, /https:\/\/example.org/);
  assert.ok(
    Object.keys(zip.files).some(
      (p) => p.startsWith("ppt/media/") && !zip.files[p].dir,
    ),
  );
});
