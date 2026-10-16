import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { browserRequest } from "../browser/runtime.mjs";
import handler from "../netlify/functions/public-data.mjs";
test("hosted records persist in IndexedDB and stale tabs cannot overwrite them", async () => {
  const initial = await (await browserRequest("/api/state")).json();
  initial.state.profile.name = "Synthetic browser test";
  initial.state.stories.push({
    id: "story-1",
    title: "Real proof",
    action: "Built prototype",
    result: "Reduced steps",
  });
  const result = await browserRequest("/api/state", {
    method: "PUT",
    body: JSON.stringify(initial),
  });
  assert.equal(result.status, 200);
  assert.equal(
    (
      await browserRequest("/api/state", {
        method: "PUT",
        body: JSON.stringify(initial),
      })
    ).status,
    409,
  );
  const saved = await (await browserRequest("/api/state")).json();
  assert.equal(saved.state.profile.name, "Synthetic browser test");
  assert.equal(saved.state.stories[0].title, "Real proof");
});
test("hosted research never transmits pasted notes or saved company context", async () => {
  const original = globalThis.fetch;
  let transmitted;
  globalThis.fetch = async (url, opts) => {
    transmitted = JSON.parse(opts.body);
    return Response.json({ sources: [], warnings: [] });
  };
  try {
    const r = await browserRequest("/api/research", {
      body: JSON.stringify({
        company: "Example",
        urls: ["https://example.com"],
        notes: "Private career context",
        description: "Saved notes",
        sourceUrl: "https://example.com",
        news: true,
      }),
    });
    const d = await r.json();
    assert.equal(transmitted.notes, undefined);
    assert.equal(transmitted.description, undefined);
    assert.equal(d.sources.length, 2);
    assert.equal(d.sources[1].text, "Private career context");
  } finally {
    globalThis.fetch = original;
  }
});
test("hosted AI fails clearly before a model is loaded", async () => {
  const r = await browserRequest("/api/structured", {
    body: JSON.stringify({ task: "plan", context: {} }),
  });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /Settings/);
});
test("public cloud service has no workspace, import, deck or AI endpoints", async () => {
  for (const p of ["state", "import", "export/deck", "ai", "structured"]) {
    const r = await handler(new Request("https://newjob.example/api/" + p));
    assert.equal(r.status, 404);
  }
});
test("public cloud service rejects foreign origins", async () => {
  const r = await handler(
    new Request("https://newjob.example/api/companies", {
      headers: { origin: "https://foreign.example" },
    }),
  );
  assert.equal(r.status, 403);
});
