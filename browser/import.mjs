import mammoth from "mammoth/mammoth.browser.js";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf.mjs";
GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
export async function extractResume(file, name) {
  if (file.size > 10_000_000) throw Error("Choose a file smaller than 10 MB.");
  const bytes = await file.arrayBuffer();
  let text = "";
  if (/\.docx$/i.test(name))
    text = (await mammoth.extractRawText({ arrayBuffer: bytes })).value;
  else if (/\.pdf$/i.test(name)) {
    const loading = getDocument({
      data: new Uint8Array(bytes),
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const pdf = await loading.promise;
    try {
      if (pdf.numPages > 35)
        throw Error("Choose a resume with 35 pages or fewer.");
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const c = await page.getTextContent();
        text +=
          c.items.map((i) => i.str + (i.hasEOL ? "\n" : " ")).join("") + "\n";
      }
    } finally {
      await loading.destroy();
    }
  } else if (/\.(txt|md)$/i.test(name)) text = new TextDecoder().decode(bytes);
  else throw Error("Choose PDF, DOCX, TXT or Markdown.");
  if (text.trim().length < 40)
    throw Error(
      "No readable text found. Paste the text from a scanned resume instead.",
    );
  return text.slice(0, 100000);
}
