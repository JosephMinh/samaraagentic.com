# Samara Agentic information site

A small, static information and privacy site for a one-person Gmail assistant
with limited technical Gmail read and send capability. The authorized send use
is limited to an ongoing self-only reply service for qualifying mail sent by
that same account; it is not general, Crous, or third-party sending authority.
Separately task-authorized selected-message inspections and external processing
of selected headers and relevant text are historical, limited tasks. Earlier
bounded self-only tests established finite self-only reply proof; a separate
bounded detection-only trial is stopped.
The service does not promise future delivery, coverage, response time, or quota
availability. It has no build step, runtime dependencies, login, or OAuth flow.

## Check and preview locally

Run the deterministic smoke checks with a current Node.js runtime:

```sh
node tests/smoke.mjs
```

The test uses only Node core modules and no package manager, dependency
manifest, network access, or hosted service. Node.js is free, open-source
software under its [MIT license](https://github.com/nodejs/node/blob/main/LICENSE)
and is the maintained runtime already used by this repository’s existing
workflow. The static HTML/CSS artifacts and this dependency-free check are
already accessible in the development environment, so no additional testing,
site, or deployment tooling is needed for this site.

Preview the files with any static file server. For example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. The homepage is `index.html`; the separate
privacy and access statement is `privacy.html`.

## Hosting

Serve the repository’s HTML and CSS files as static assets; no build output is
needed. Hosting, domain, DNS, OAuth setup, and deployment configuration are
deliberately outside this repository and require separate authorization.

## Copy and scope

Read [AGENTS.md](AGENTS.md) before changing public copy. In particular, do not
replace unresolved privacy or OAuth details with assurances that have not been
approved.
