import pptxgen from "pptxgenjs";
import { imageSize } from "image-size";
import { cleanDeck } from "./public/workflow-core.mjs";
export async function deckPowerPoint(
  input,
  sources = [],
  outputType = "nodebuffer",
) {
  const deck = cleanDeck(input);
  if (!deck.slides.length) throw Error("Add at least one slide.");
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "NewJob";
  pptx.subject = "Company-specific career proposal";
  pptx.title = deck.title;
  pptx.company = "NewJob";
  pptx.lang = "en-US";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: "en-US",
  };
  for (const [i, s] of deck.slides.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: i === 0 ? "111B3B" : "FFFFFF" };
    const ink = i === 0 ? "FFFFFF" : "182236";
    slide.addText("NewJob  /  " + deck.company, {
      x: 0.55,
      y: 0.35,
      w: 11.8,
      h: 0.3,
      fontSize: 11,
      color: i === 0 ? "BDCCEF" : "64748B",
    });
    slide.addText(s.title, {
      x: 0.55,
      y: 1.05,
      w: 12.15,
      h: 1.2,
      fontSize: i === 0 ? 34 : 28,
      bold: true,
      color: ink,
      breakLine: false,
      fit: "shrink",
    });
    const im = deck.images[s.imageIndex];
    const bullets = s.body.split("\n").filter(Boolean).slice(0, 8);
    slide.addText(bullets.join("\n\n"), {
      x: 0.65,
      y: 2.5,
      w: im ? 7.0 : 11.7,
      h: 3.45,
      fontSize: 18,
      color: ink,
      fit: "shrink",
      breakLine: false,
      margin: 0,
      valign: "top",
    });
    if (im) {
      const bytes = Uint8Array.from(atob(im.data.split(",")[1]), (c) =>
        c.charCodeAt(0),
      );
      const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
        (v, i) => bytes[i] === v,
      );
      if (!png && !(bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255))
        throw Error("Image content does not match PNG/JPG.");
      const dimensions = imageSize(bytes);
      const scale = Math.min(4.5 / dimensions.width, 2.9 / dimensions.height);
      const width = dimensions.width * scale,
        height = dimensions.height * scale;
      slide.addImage({
        data: im.data,
        x: 8.1 + (4.5 - width) / 2,
        y: 2.45 + (2.9 - height) / 2,
        w: width,
        h: height,
      });
      slide.addText(im.caption, {
        x: 8.1,
        y: 5.5,
        w: 4.5,
        h: 0.5,
        fontSize: 10,
        color: i === 0 ? "BDCCEF" : "64748B",
        fit: "shrink",
      });
    }
    const refs = s.sourceIds
      .map((id) => sources.find((x) => x.id === id))
      .filter(Boolean);
    slide.addText(
      refs
        .map((x) => x.title)
        .join(" · ")
        .slice(0, 280),
      {
        x: 0.65,
        y: 6.55,
        w: 11.5,
        h: 0.35,
        fontSize: 9,
        color: i === 0 ? "BDCCEF" : "64748B",
        fit: "shrink",
      },
    );
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: 12.1,
      y: 6.55,
      w: 0.55,
      h: 0.3,
      fontSize: 11,
      color: "64748B",
      align: "right",
    });
    slide.addNotes(
      [s.notes, ...refs.map((x) => x.title + " " + x.url)].join("\n\n"),
    );
  }
  return pptx.write({ outputType });
}
