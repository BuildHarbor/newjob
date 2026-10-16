export const hosted = document.documentElement.dataset.mode === "hosted";
export async function newjobFetch(url, opts = {}) {
  if (!hosted) return globalThis.fetch(url, opts);
  const { browserRequest } = await import("./browser-runtime.mjs");
  return browserRequest(url, opts);
}
export async function loadBrowserAI(onProgress) {
  const m = await import("./browser-runtime.mjs");
  return m.loadModel(onProgress);
}
