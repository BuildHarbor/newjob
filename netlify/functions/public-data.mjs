import { companyDirectory, researchCompany } from "../../research.mjs";
const json = (x, status = 200, cache = false) =>
  Response.json(x, {
    status,
    headers: {
      "Cache-Control": cache
        ? "public, max-age=3600, s-maxage=21600"
        : "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export default async (req) => {
  const u = new URL(req.url);
  if (req.headers.get("origin") && req.headers.get("origin") !== u.origin)
    return json({ error: "Origin not allowed." }, 403);
  try {
    if (u.pathname === "/api/companies" && req.method === "GET")
      return json(
        {
          ...(await companyDirectory(u.searchParams.get("page"))),
          fetched: Date.now(),
          stale: false,
        },
        200,
        true,
      );
    if (u.pathname === "/api/research" && req.method === "POST") {
      const raw = await req.text();
      if (raw.length > 20000)
        return json({ error: "Use a smaller research request." }, 413);
      const input = JSON.parse(raw);
      return json(
        await researchCompany({
          company: input.company,
          urls: (input.urls || []).slice(0, 2),
          news: !!input.news,
          followLinks: false,
        }),
      );
    }
    if (u.pathname === "/api/jobs" && req.method === "GET") {
      const r = await fetch("https://remotive.com/api/remote-jobs", {
        signal: AbortSignal.timeout(18000),
      });
      if (!r.ok)
        throw Error(
          "The public job feed is unavailable. Please try later or add jobs manually.",
        );
      const d = await r.json();
      return json(
        {
          source: "Remotive",
          fetched: Date.now(),
          stale: false,
          jobs: d.jobs.map((j) => ({
            id: String(j.id),
            title: j.title,
            company: j.company_name,
            location: j.candidate_required_location || "Remote",
            salary: j.salary || "",
            category: j.category,
            url: j.url,
            date: j.publication_date,
            type: j.job_type,
            tags: j.tags || [],
            description: String(j.description || "")
              .replace(/<[^>]*>/g, " ")
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&"),
          })),
        },
        200,
        true,
      );
    }
    return json({ error: "Unknown public endpoint." }, 404);
  } catch (ex) {
    return json({ error: ex.message }, 400);
  }
};
export const config = {
  path: ["/api/companies", "/api/jobs", "/api/research"],
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip"],
    action: "rate_limit",
  },
};
