# Samara Agentic information site

A small, static information and privacy site for a one-person Gmail assistant
with limited technical Gmail read and send capability. That capability does not
authorize actual or production sends; sending remains limited to separately
authorized tasks. Historical attempt 1 stopped before account binding and
before any send; zero test messages and zero replies were sent. Historical
attempt 2 sent one synthetic seed, later reconciled as sent and inbox mail with
exact-self routing and selected-header predicates, and had zero replies. On
October 1, 2026, one fresh bounded self-only functional test sent and inspected
three synthetic seeds. Two self-only replies were accepted, each on its
corresponding seed thread; an automatic-response decoy received no reply. The
test ended at its reply cap with no active dispatch or retry. This is bounded
functional self-only proof only, not general or real Crous coverage. Independent
post-send inbox delivery for every new message, a complete MIME audit, an
independently expected original thread, and guaranteed receive-to-reply latency
remain unverified; recorded local elapsed time is not Gmail latency. It has no
build step, runtime dependencies, login, or OAuth flow.

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
