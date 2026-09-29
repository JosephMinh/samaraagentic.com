# Contributor guide

This repository is a deliberately small, dependency-free static information
site. Keep it that way unless a task explicitly requires otherwise.

## Public-copy contract

- Treat the approved factual brief supplied with the task as the source of
  truth for Gmail, OAuth, privacy, and status claims.
- State what is proposed, inactive, or unresolved plainly. Do not turn design
  intentions into assurances about storage, deletion, token security,
  encryption, local processing, or third-party processing.
- Do not add private contact details, email addresses, credentials, tokens,
  internal paths, or operational records to public files.
- The site is informational only: do not add analytics, forms, cookies,
  tracking, OAuth/login flows, API calls, mailbox access, polling, sending, or
  deployment configuration unless explicitly authorized in a future task.

## Working conventions

- Use semantic HTML and plain CSS; there is no build step or runtime
  dependency.
- Keep `tests/smoke.mjs` passing with `node tests/smoke.mjs` after changing
  public pages. It checks the rendered-file contract, internal links, and a
  small accessibility baseline without network access.
- Preserve the separate `privacy.html` page and the Google scope and
  revocation references.
