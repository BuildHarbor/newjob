# Research and provenance

## Expansion — 16 October 2026

Inspected the [trial](https://trial.nxtjob.ai/) company cards, copilot, problem-research step, four-stage Win Deck progress and negotiation introduction. The full app redirected to the trial; inaccessible signed-in screens remain unverified. The supplied screenshot informed generation progress.

Reviewed official [Pitcher](https://nxtjob.ai/pitcher), [Negotiator](https://nxtjob.ai/negotiator), [Navigator](https://nxtjob.ai/navigator), [Interviewer](https://nxtjob.ai/interviewer), [Networker](https://nxtjob.ai/networker), [Nova](https://nxtjob.ai/nova) and [pricing](https://nxtjob.ai/pricing) descriptions.

Company discovery uses [The Muse API](https://www.themuse.com/developers/api/v2), attributed in the UI. Research reads selected HTTPS pages and optional Google News RSS headlines. Negotiation teaching uses general principles from [Harvard’s Program on Negotiation](https://www.pon.harvard.edu/tag/salary-negotiation/). Hosted inference follows [WebLLM documentation](https://webllm.mlc.ai/docs/user/basic_usage.html); [Netlify Functions](https://docs.netlify.com/build/functions/api/) serve public data only.

## Initial investigation

NewJob uses original branding, interface code and backend code. It is not affiliated with NxtJob. No proprietary NxtJob JavaScript, images, private account data, prompts or datasets are distributed here.

The investigation used public descriptions at [NxtJob](https://nxtjob.ai/), its five linked tool pages, the [trial preview](https://trial.nxtjob.ai/), and publicly shipped frontend artifacts from its marketing and application sites. The trial is a guided preview, not proof of access to all signed-in workflows. See [the feature audit](FEATURES.md) for the limits.

[REA](https://github.com/morluto/rea) v6.5.0 was installed from its published npm package and used for static JavaScript analysis. Evidence identifier: `ev_353ed94a7c74c5731ceb4b131d26ef3acd9bb72b7b0f3158ce33e4211b5d2339`. The graph contained 790 nodes and 2,013 edges. This is derived static evidence from shipped artifacts, not runtime or backend proof. Analysis limits mean the graph is incomplete; dynamic code and obfuscation may remain unresolved. Raw captures and the large evidence artifact are intentionally outside this source repository.

Observed public routes included resume generation, ATS checking, jobs, dashboard, career/navigation and authentication surfaces. Routes establish frontend entry points, not feature correctness. We did not obtain NxtJob's server implementation, proprietary matching models or data access rights.

NewJob's runtime does not depend on REA. It uses [Ollama's local chat API](https://docs.ollama.com/api/chat), SQLite and local document parsers. Public job results use the [Remotive API](https://github.com/remotive-com/remote-jobs-api), with attribution, source links and a six-hour cache. Its free listings are delayed by 24 hours.
