import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  analyzeResume,
  blankState,
  validateState,
  safeUrl,
  keywords,
  resumeText,
  parseResume,
} from "../public/core.mjs";
const resume =
  "Alex Example\nalex@example.org\nSUMMARY\nProduct leader who built analytics platforms.\nEXPERIENCE\nLed a team of 12 people and increased activation by 25 percent. Designed a roadmap and delivered experiments.\nSKILLS\nSQL, Python, stakeholder management, product strategy.\nEDUCATION\nBachelor degree.";
const alternativeHeadingsResume = readFileSync(
  new URL("./fixtures/alternative-headings-resume.txt", import.meta.url),
  "utf8",
);
test("resume comparison detects real matches and missing terms", () => {
  const r = analyzeResume(resume, "SQL Python Kubernetes leadership roadmap");
  assert(r.found.includes("sql"));
  assert(r.found.includes("python"));
  assert(r.missing.includes("kubernetes"));
  assert.equal(r.match, 60);
  assert(r.score >= 0 && r.score <= 100);
});
test("keyword matching handles punctuation without substring false positives", () => {
  const r = analyzeResume(resume, "Java Kubernetes");
  assert(!r.found.includes("java"));
  assert(r.missing.includes("java"));
});
test("short resume is rejected rather than assigned misleading score", () =>
  assert.throws(() => analyzeResume("hello world"), /20 words/));

test("sentence punctuation does not create missing keywords", () => {
  const r = analyzeResume(resume, "SQL. Experience.");
  assert.deepEqual(r.missing, []);
  assert.equal(r.match, 100);
});
test("without a description only content checks contribute", () => {
  const r = analyzeResume(resume);
  assert.equal(r.match, null);
  assert.equal(r.score, r.structure);
});
test("backup validates version, record IDs and application stages", () => {
  assert.deepEqual(validateState(blankState()), blankState());
  assert.throws(() => validateState({ version: 99 }));
  const s = blankState();
  s.jobs.push({
    id: "x",
    title: "Role",
    company: "Company",
    stage: "nonsense",
  });
  assert.throws(() => validateState(s), /Invalid job/);
});
test("unsafe external links are rejected", () => {
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("data:text/html,test"), "");
  assert.equal(safeUrl("https://example.org"), "https://example.org/");
});
test("resume output keeps user facts and omits blank sections", () => {
  const s = blankState();
  s.profile.name = "Sam";
  s.profile.skills = "SQL";
  const t = resumeText(s.profile);
  assert(t.includes("SKILLS\nSQL"));
  assert(!t.includes("EXPERIENCE"));
});
test("import review detects sections without inventing facts", () => {
  const p = parseResume(resume);
  assert.equal(p.name, "Alex Example");
  assert.equal(p.email, "alex@example.org");
  assert(p.skills.includes("SQL"));
  assert(p.experience.includes("25 percent"));
  assert.equal(p.role, "");
  assert.equal(p.resumeText, resume);
});
test("import review handles alternative headings and preserves unclassified source", () => {
  const p = parseResume(alternativeHeadingsResume);
  assert.equal(p.name, "Morgan Rivers");
  assert.match(p.summary, /Operations analyst/);
  assert.match(p.education, /Certified Data Practitioner/);
  assert.equal(p.resumeText, alternativeHeadingsResume);
  assert.match(p.resumeText, /Selected Projects\nTransit Access Dashboard/);
});
test("backups reject duplicate IDs, broken dates and wrong field types", () => {
  for (const records of [
    [{ id: "x", name: 8 }],
    [{ id: "x", name: "A", created: "bad date" }],
    [{ id: "x" }, { id: "x" }],
  ]) {
    const s = blankState();
    s.companies = records;
    assert.throws(() => validateState(s));
  }
});
