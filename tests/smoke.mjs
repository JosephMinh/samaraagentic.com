#!/usr/bin/env node

/**
 * Deterministic checks for the emitted static-site contract. The HTML files
 * are the product artifacts, so these assertions exercise their publicly
 * served structure, copy, and navigation without requiring a browser or a
 * network connection.
 */
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredPages = ['index.html', 'privacy.html'];
const googleScopeGuide = 'https://developers.google.com/workspace/gmail/api/auth/scopes';
const googleRevocationHelp = 'https://support.google.com/accounts/answer/3466521';

async function exists(relativePath) {
  try {
    return (await stat(path.join(root, relativePath))).isFile();
  } catch {
    return false;
  }
}

function hrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)].map((match) => match[1]);
}

function checkAccessibilityBaseline(page, html) {
  assert.match(html, /^<!doctype html>/i, `${page} declares HTML5`);
  assert.match(html, /<html\b[^>]*\blang="en"/i, `${page} declares its language`);
  assert.match(html, /<meta\b[^>]*\bname="viewport"/i, `${page} has a viewport declaration`);
  assert.match(html, /<a\b[^>]*href="#main-content"[^>]*>Skip to main content<\/a>/i, `${page} has a skip link`);
  assert.match(html, /<nav\b[^>]*aria-label="Primary navigation"/i, `${page} has labelled navigation`);
  assert.match(html, /<main\b[^>]*id="main-content"/i, `${page} has a main landmark`);
  assert.match(html, /<h1\b[^>]*>/i, `${page} has a primary heading`);
}

function checkNoInteractiveAccess(page, html) {
  assert.doesNotMatch(html, /<(?:form|script|iframe)\b/i, `${page} has no forms, scripts, or embedded frames`);
  assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|navigator\.sendBeacon)\s*\(/i, `${page} has no network client`);
  assert.doesNotMatch(html, /\bmailto:/i, `${page} does not expose a public email address`);
  assert.doesNotMatch(html, /[\w.+-]+@[\w-]+\.[\w.-]+/, `${page} does not publish an email address`);
  assert.doesNotMatch(html, /passphrase|encrypt/i, `${page} makes no passphrase or encryption claim`);
}

const pages = Object.fromEntries(await Promise.all(requiredPages.map(async (page) => [page, await readFile(path.join(root, page), 'utf8')])));

for (const [page, html] of Object.entries(pages)) {
  checkAccessibilityBaseline(page, html);
  checkNoInteractiveAccess(page, html);

  for (const href of hrefs(html)) {
    if (href.startsWith('#')) continue;
    if (href.startsWith('https://')) {
      assert.doesNotThrow(() => new URL(href), `${page} has a valid external URL: ${href}`);
      continue;
    }
    assert.ok(await exists(href.split('#')[0]), `${page} links to an existing local file: ${href}`);
  }
}

assert.ok(await exists('styles.css'), 'shared stylesheet exists');
assert.match(pages['index.html'], /one personal account has active Gmail read-only and identity authorization, with a local token/i, 'homepage states the active limited authorization and token');
assert.match(pages['index.html'], /one specifically approved exchange was inspected/i, 'homepage states the limited inspected exchange');
assert.match(pages['index.html'], /external OpenAI Codex model provider for that one task/i, 'homepage limits external AI processing to the approved task');
assert.match(pages['index.html'], /there is no general AI-processing authorization/i, 'homepage denies general AI-processing authorization');
assert.doesNotMatch(pages['index.html'], /Nothing is connected|No Gmail permission grant or token exists|No Gmail messages, headers, or attachments have been fetched/i, 'homepage rejects obsolete inactive-access claims');
assert.match(pages['index.html'], /all messages, settings, and attachments/i, 'homepage describes full read-only scope capability');
assert.match(pages['index.html'], /does not permit sending mail or changing mail/i, 'homepage states the read-only boundary');
assert.match(pages['index.html'], /Historical attempt 1 stopped before identity binding with zero sends/i, 'homepage preserves the first historical failure');
assert.match(pages['index.html'], /Historical attempt 2 sent one synthetic seed.*exact-self routing.*zero replies/i, 'homepage preserves the reconciled second historical attempt');
assert.match(pages['index.html'], /one fresh bounded self-only functional test sent and inspected three synthetic seeds/i, 'homepage states the bounded third test without private details');
assert.match(pages['index.html'], /Two self-only replies were accepted, each on its corresponding seed thread; an automatic-response decoy received no reply/i, 'homepage states the bounded third-test outcome');
assert.match(pages['index.html'], /Real-recipient, Crous, and third-party sends remain unauthorized/i, 'homepage preserves the real-recipient boundary');
assert.ok(pages['privacy.html'].includes(googleScopeGuide), 'privacy page links to Google scope guidance');
assert.ok(pages['privacy.html'].includes(googleRevocationHelp), 'privacy page links to Google revocation help');
assert.match(pages['privacy.html'], /active Gmail read-only and identity authorization, with a local token/i, 'privacy page states the active limited authorization and token');
assert.match(pages['privacy.html'], /selected excerpts were processed by the assistant’s external OpenAI Codex model provider for that one task/i, 'privacy page states the one approved external AI task');
assert.match(pages['privacy.html'], /Historical attempt 1 stopped before identity binding with zero sends/i, 'privacy page preserves the first historical failure');
assert.match(pages['privacy.html'], /Historical attempt 2 sent one synthetic seed.*exact-self routing.*zero replies/i, 'privacy page preserves the reconciled second historical attempt');
assert.match(pages['privacy.html'], /one fresh bounded self-only functional test sent and inspected three synthetic seeds/i, 'privacy page states the bounded third test without private details');
assert.match(pages['privacy.html'], /Two self-only replies were accepted, each on its corresponding seed thread; an automatic-response decoy received no reply/i, 'privacy page states the bounded third-test outcome');
assert.match(pages['privacy.html'], /functional self-only proof only.*does not establish general or real Crous coverage/i, 'privacy page preserves the limits of the bounded proof');
assert.doesNotMatch(pages['privacy.html'], /No Gmail grant or token exists, and no mail has been fetched|There is no current grant or local token to revoke or remove/i, 'privacy page rejects obsolete inactive-access claims');
assert.match(pages['privacy.html'], /general future AI use.*not finalized/i, 'privacy page preserves unresolved future AI handling');
assert.match(pages['privacy.html'], /No ongoing sending, provider-side reply drafts, or unrestricted monitoring is authorized/i, 'privacy page preserves the no-send and no-provider-draft boundary');
assert.match(pages['index.html'], /No ongoing sending, mailbox changes, provider-side reply drafts, or unrestricted monitoring is authorized/i, 'homepage preserves the unauthorized-action boundary');
assert.match(pages['index.html'], /Storage, retention, deletion, backups, logs, and token security have not been finalized/i, 'homepage preserves unresolved data-handling matters');
assert.match(pages['privacy.html'], /stored, how long it would be retained, how deletion would work, or how backups and logs would be handled/i, 'privacy page preserves unresolved data-handling matters');
assert.match(pages['privacy.html'], /does not settle token storage, unlock, security, or rotation details/i, 'privacy page preserves unresolved token security');
for (const [page, html] of Object.entries(pages)) {
  assert.doesNotMatch(html, /Setup is not active/i, `${page} rejects the obsolete inactive-setup claim`);
  assert.doesNotMatch(html, /attachments were opened/i, `${page} makes no unsupported attachment claim`);
  assert.doesNotMatch(html, /may read and summarize|extract action items/i, `${page} makes no standing summarization claim`);
}

console.log(`Static smoke checks passed for ${requiredPages.join(', ')}.`);
