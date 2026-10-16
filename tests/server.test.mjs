import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import JSZip from "jszip";
const root = fileURLToPath(new URL("../", import.meta.url));
let child, dir, base, port;
async function start() {
  child = spawn(process.execPath, ["server.mjs"], {
    cwd: root,
    env: { ...process.env, NEWJOB_PORT: String(port), NEWJOB_DATA_DIR: dir },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stderr.on("data", (c) => (log += c));
  child.stdout.on("data", (c) => (log += c));
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw Error(log);
    try {
      const r = await fetch(base + "/api/state");
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error("Server did not start: " + log);
}
async function stop() {
  if (child && child.exitCode === null) {
    const done = once(child, "exit");
    child.kill();
    await done;
  }
}
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "newjob-test-"));
  port = 20000 + Math.floor(Math.random() * 30000);
  base = "http://127.0.0.1:" + port;
  await start();
});
after(async () => {
  await stop();
  if (
    path.dirname(dir) === path.resolve(tmpdir()) &&
    path.basename(dir).startsWith("newjob-test-")
  )
    await rm(dir, { recursive: true, force: true });
});
const put = (x) =>
  fetch(base + "/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(x),
  });
test("workspace persists through restart and stale tabs cannot overwrite it", async () => {
  const initial = await (await fetch(base + "/api/state")).json();
  initial.state.profile.name = "Synthetic Test";
  assert.equal((await put(initial)).status, 200);
  assert.equal((await put(initial)).status, 409);
  await stop();
  await start();
  const saved = await (await fetch(base + "/api/state")).json();
  assert.equal(saved.state.profile.name, "Synthetic Test");
  assert.equal(saved.revision, initial.revision + 1);
});
test("API rejects foreign origins and cross-site browser reads", async () => {
  assert.equal(
    (
      await fetch(base + "/api/state", {
        headers: { Origin: "https://example.org" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + "/api/state", {
        headers: { "Sec-Fetch-Site": "cross-site" },
      })
    ).status,
    403,
  );
  assert.equal(
    (await fetch(base + "/", { headers: { "Sec-Fetch-Site": "cross-site" } }))
      .status,
    200,
  );
});
test("private files and unsupported methods are not served", async () => {
  for (const url of [
    "/server.mjs",
    "/data/newjob.sqlite",
    "/package.json",
    "/%2e%2e%5cserver.mjs",
  ])
    assert.notEqual((await fetch(base + url)).status, 200);
  assert.equal((await fetch(base + "/", { method: "POST" })).status, 405);
  const r = await fetch(base + "/");
  assert.match(
    r.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
});
test("malformed backup is rejected without changing saved data", async () => {
  const state = await (await fetch(base + "/api/state")).json();
  state.state.companies = [{ id: 'unsafe" onclick="x', name: 5 }];
  assert.equal((await put(state)).status, 400);
  const after = await (await fetch(base + "/api/state")).json();
  assert.equal(after.revision, state.revision);
  assert.equal(after.state.companies.length, 0);
});
const text =
  "Alex Morgan\nSUMMARY\nProduct manager with experience building useful customer tools.\nSKILLS\nSQL and research.\nEXPERIENCE\nLed a team of 12 people.\nEDUCATION\nBachelor degree.";
async function upload(name, bytes) {
  return fetch(base + "/api/import", {
    method: "POST",
    headers: { "X-File-Name": encodeURIComponent(name) },
    body: bytes,
  });
}
test("text imports preserve readable resume content", async () => {
  for (const ext of ["txt", "md"]) {
    const r = await upload("resume." + ext, text);
    assert.equal(r.status, 200);
    assert.equal((await r.json()).text, text);
  }
});
test("DOCX import extracts text locally", async () => {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${text
      .split("\n")
      .map((t) => `<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`)
      .join("")}</w:body></w:document>`,
  );
  const r = await upload(
    "resume.docx",
    await zip.generateAsync({ type: "nodebuffer" }),
  );
  const payload = await r.json();
  assert.equal(r.status, 200, JSON.stringify(payload));
  assert.match(payload.text, /Alex Morgan/);
});
test("PDF import extracts selectable text locally", async () => {
  const stream =
    "BT /F1 12 Tf 40 750 Td (Alex Morgan Product manager with experience building useful customer tools.) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [i, o] of objects.entries()) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => String(o).padStart(10, "0") + " 00000 n \n")
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const r = await upload("resume.pdf", Buffer.from(pdf));
  const payload = await r.json();
  assert.equal(r.status, 200, JSON.stringify(payload));
  assert.match(payload.text, /Alex Morgan/);
});
test("unsupported and unreadable documents fail clearly", async () => {
  assert.equal((await upload("resume.exe", text)).status, 400);
  assert.equal((await upload("empty.txt", "")).status, 422);
});
test("unknown AI assistant is rejected before starting generation", async () => {
  const r = await fetch(base + "/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent: "invalid" }),
  });
  assert.equal(r.status, 400);
});
