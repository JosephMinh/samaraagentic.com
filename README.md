# Samara Agentic information site

A small, static information and privacy site for a one-person Gmail assistant
with limited technical Gmail read and send capability. That capability does not
authorize actual or production sends; sending remains limited to separately
authorized tasks. Self-only testing was attempted. The first bounded self-only
test stopped before account binding and before any send; zero test messages and
zero replies were sent. In a second bounded self-only attempt, one synthetic
self-addressed test message is visible in Gmail; that test then stopped. No
automated replies or additional seed messages were sent. Inbox delivery,
threading, and latency remain unverified. It has no build step, runtime
dependencies, login, or OAuth flow.

## Check and preview locally

Run the deterministic smoke checks with a current Node.js runtime:

```sh
node tests/smoke.mjs
```

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
