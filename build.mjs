import { build } from "esbuild";
import { mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const output = path.resolve("dist");
if (output !== path.join(path.dirname(fileURLToPath(import.meta.url)), "dist"))
  throw Error("Run the build from the NewJob project directory.");
await rm(output, { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
let html = await readFile("dist/index.html", "utf8");
html = html.replace('<html lang="en">', '<html lang="en" data-mode="hosted">');
await writeFile("dist/index.html", html);
await build({
  entryPoints: {
    "browser-runtime": "browser/runtime.mjs",
    "browser-worker": "browser/worker.mjs",
    "browser-import": "browser/import.mjs",
    "browser-export": "exports.mjs",
  },
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  external: ["./browser-export.mjs", "./browser-import.mjs"],
  logLevel: "info",
});
await cp(
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "dist/pdf.worker.min.mjs",
);
await writeFile(
  "dist/_headers",
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co https://raw.githubusercontent.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'
`,
);
console.log(
  "Hosted build ready in dist. Personal data and AI remain in the browser.",
);
