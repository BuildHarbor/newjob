# Hosting NewJob

Live site: **https://newjob-career.netlify.app**. Source: **https://github.com/BuildHarbor/newjob**. Published to the owner's Netlify Free account using the CLI. GitHub CI verifies pushes; deployment is currently manual, not automatically connected to Git pushes.

The hosted edition runs personal storage, resume parsing, presentation export and optional WebGPU AI in the browser. Netlify functions fetch public company/job data and selected public research pages. There is no server workspace database, AI endpoint, upload endpoint or paid model secret.

- Build: `npm run build`
- Publish directory: `dist`
- Functions: `netlify/functions`
- Node: 22.13 or newer
- Secrets: none

Import the GitHub repository into Netlify, or deploy with a current Netlify CLI. `netlify.toml` provides settings. To preview locally, run `npm run build` then `netlify dev` on port 4320. Older CLI versions may fail on newer Node releases.

The public-data function is rate limited per IP. Research checks HTTPS, DNS/public IPs, redirects and response sizes. Hosted research reads at most two URLs per request; pasted notes stay in the browser. Feed responses are cacheable.

Use a Free plan and monitor usage. This release does not require paid add-ons, automatic top-ups, payment details or a custom domain. Free-tier exhaustion may pause the site; hosting is not unlimited.

## Data portability

Desktop and hosted workspaces are separate. Export from Settings in one edition and restore into the other. Restoration replaces the destination after confirmation. Backups can contain private career and compensation information.

## Browser AI

WebLLM runs the MLC Qwen2.5 1.5B model in a browser worker. It requires WebGPU, sufficient graphics memory and an initial download. Unsupported devices can still use non-AI tools or the desktop edition with Ollama. Loading a smaller model does not guarantee high-quality advice.

Keep the local desktop server on loopback; it is not the public hosting backend.
