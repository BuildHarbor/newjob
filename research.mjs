import https from "node:https";
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { load } from "cheerio";
export function publicAddress(address) {
  try {
    let ip = ipaddr.parse(address);
    if (ip.kind() === "ipv6" && ip.isIPv4MappedAddress())
      ip = ip.toIPv4Address();
    return ip.range() === "unicast";
  } catch {
    return false;
  }
}
export function researchUrl(raw) {
  const u = new URL(raw);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    (u.port && u.port !== "443") ||
    !u.hostname.includes(".") ||
    /\.(local|localhost|internal|test|invalid)$/i.test(u.hostname)
  )
    throw Error("Use a public HTTPS source URL.");
  u.hash = "";
  return u;
}
// Pin the resolved public IP for each request, including redirects, to prevent DNS rebinding.
export async function readPublic(raw, redirects = 0) {
  const u = researchUrl(raw);
  const addresses = await lookup(u.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    throw Error("Private network sources are not allowed.");
  const chosen = addresses[0];
  const response = await new Promise((resolve, reject) => {
    const req = https.get(
      u,
      {
        headers: {
          "User-Agent": "NewJobResearch/1.0 (personal career research)",
          Accept: "text/html,application/rss+xml,application/xml,text/plain",
        },
        lookup: (_h, opts, cb) =>
          opts.all
            ? cb(null, [chosen])
            : cb(null, chosen.address, chosen.family),
      },
      (res) => {
        const chunks = [];
        let n = 0;
        res.on("data", (chunk) => {
          n += chunk.length;
          if (n > 2_000_000) {
            res.destroy(Error("Source exceeds 2 MB."));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: Buffer.concat(chunks).toString("utf8"),
            url: u.href,
          }),
        );
        res.on("error", reject);
      },
    );
    req.setTimeout(12000, () => req.destroy(Error("Source timed out.")));
    req.on("error", reject);
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirects >= 3) throw Error("Too many source redirects.");
    return readPublic(
      new URL(response.headers.location, u).href,
      redirects + 1,
    );
  }
  if (response.status !== 200)
    throw Error("Source returned HTTP " + response.status);
  return response;
}
export function extractPage(html, url) {
  const $ = load(html);
  $("script,style,nav,footer,header,form,noscript,svg").remove();
  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    new URL(url).hostname;
  const text =
    $("main").text().trim() || $("article").text().trim() || $("body").text();
  const links = $("a[href]")
    .toArray()
    .map((a) => {
      try {
        return new URL($(a).attr("href"), url).href;
      } catch {
        return "";
      }
    })
    .filter(
      (x) =>
        x.startsWith(new URL(url).origin) &&
        /about|news|investor|blog|career/i.test(x),
    );
  return {
    title: title.slice(0, 250),
    text: text.replace(/\s+/g, " ").trim().slice(0, 14000),
    links: [...new Set(links)].slice(0, 8),
  };
}
export async function researchCompany(input) {
  const name = String(input.company || "")
    .trim()
    .slice(0, 120);
  if (!name) throw Error("Choose a company first.");
  const urls = [...new Set((input.urls || []).filter(Boolean))].slice(0, 4);
  const sources = [],
    warnings = [];
  const add = (x) =>
    sources.push({
      id: "source-" + (sources.length + 1),
      retrieved: new Date().toISOString(),
      ...x,
    });
  if (input.description?.trim())
    add({
      title: name + " — saved company context",
      url: String(input.sourceUrl || ""),
      text: String(input.description).slice(0, 14000),
      kind: "Saved context",
    });
  for (const raw of urls) {
    try {
      const result = await readPublic(raw);
      if (!/html|text|xml/.test(result.headers["content-type"] || ""))
        throw Error("Use an HTML page; paste excerpts from PDF reports.");
      const page = extractPage(result.text, result.url);
      if (page.text.length < 80) throw Error("No useful public text found.");
      add({ ...page, url: result.url, kind: "Public page" });
      if (input.followLinks && sources.length < 5) {
        for (const linked of page.links.slice(0, 2)) {
          if (urls.includes(linked)) continue;
          try {
            const extra = await readPublic(linked);
            const parsed = extractPage(extra.text, extra.url);
            if (parsed.text.length > 100)
              add({ ...parsed, url: extra.url, kind: "Related page" });
          } catch {}
        }
      }
    } catch (e) {
      warnings.push(String(raw).slice(0, 200) + ": " + e.message);
    }
  }
  if (input.news) {
    try {
      const url =
        "https://news.google.com/rss/search?q=" +
        encodeURIComponent('"' + name + '"') +
        "&hl=en-US&gl=US&ceid=US:en";
      const result = await readPublic(url);
      const $ = load(result.text, { xmlMode: true });
      $("item")
        .slice(0, 5)
        .each((_, el) => {
          const item = $(el);
          add({
            title: item.find("title").text().slice(0, 250),
            text:
              item.find("title").text() +
              " Published: " +
              item.find("pubDate").text(),
            url: item.find("link").text(),
            kind: "News headline — open original to verify",
          });
        });
    } catch (e) {
      warnings.push("News: " + e.message);
    }
  }
  if (input.notes?.trim())
    add({
      title: "Your research notes",
      url: "",
      text: String(input.notes).slice(0, 14000),
      kind: "User supplied — verify independently",
    });
  return {
    sources: sources.slice(0, 15).map(({ links, ...s }) => s),
    warnings,
    company: name,
  };
}
export async function companyDirectory(page = 0) {
  const p = Math.max(0, Math.min(99, Number(page) || 0));
  const r = await fetch(
    "https://www.themuse.com/api/public/companies?page=" + p,
    { signal: AbortSignal.timeout(18000) },
  );
  if (!r.ok)
    throw Error(
      "Company directory unavailable. Add a company manually or try later.",
    );
  const data = await r.json();
  return {
    page: p,
    pageCount: data.page_count,
    source: "The Muse",
    companies: (data.results || []).map((c) => ({
      id: "muse-" + c.id,
      name: c.name,
      location: (c.locations || []).map((x) => x.name).join(" · "),
      industry: (c.industries || []).map((x) => x.name).join(", "),
      notes: String(c.description || "")
        .replace(/<[^>]+>/g, " ")
        .slice(0, 4000),
      url: c.refs?.landing_page || "",
      jobsUrl: c.refs?.jobs_page || "",
      size: c.size?.name || "",
    })),
  };
}
