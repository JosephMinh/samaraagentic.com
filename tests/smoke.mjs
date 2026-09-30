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

let pages;
try {
  pages = Object.fromEntries(await Promise.all(requiredPages.map(async (page) => [page, await readFile(path.join(root, page), 'utf8')])));
} catch (error) {
  throw new Error('Unable to load the static-site artifacts.', { cause: error });
}

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
assert.match(pages['index.html'], /separately task-authorized selected-message inspections occurred/i, 'homepage states the bounded selected-message inspections');
assert.match(pages['index.html'], /selected headers and relevant text.*external OpenAI Codex model provider for those limited tasks/i, 'homepage limits external AI processing to the selected inspection tasks');
assert.match(pages['index.html'], /there is no general AI-processing authorization/i, 'homepage denies general AI-processing authorization');
assert.doesNotMatch(pages['index.html'], /Nothing is connected|No Gmail permission grant or token exists|No Gmail messages, headers, or attachments have been fetched/i, 'homepage rejects obsolete inactive-access claims');
assert.match(pages['index.html'], /all messages, settings, and attachments/i, 'homepage describes full read-only scope capability');
assert.match(pages['index.html'], /does not permit sending mail or changing mail/i, 'homepage states the read-only boundary');
assert.match(pages['index.html'], /bounded read-only synthetic-subject detection trial ran and is now stopped/i, 'homepage states the completed bounded trial without private details');
assert.match(pages['index.html'], /monitoring beyond the completed bounded trial, or any automatic response, would require separate, explicit authorization/i, 'homepage preserves the post-trial automation boundary');
assert.ok(pages['privacy.html'].includes(googleScopeGuide), 'privacy page links to Google scope guidance');
assert.ok(pages['privacy.html'].includes(googleRevocationHelp), 'privacy page links to Google revocation help');
assert.match(pages['privacy.html'], /active Gmail read-only and identity authorization, with a local token/i, 'privacy page states the active limited authorization and token');
assert.match(pages['privacy.html'], /separately task-authorized selected-message inspections occurred/i, 'privacy page states the bounded selected-message inspections');
assert.match(pages['privacy.html'], /selected headers and relevant text.*external OpenAI Codex model provider for those limited tasks/i, 'privacy page limits external AI processing to the selected inspection tasks');
assert.match(pages['privacy.html'], /bounded read-only synthetic-subject detection trial ran and is now stopped/i, 'privacy page states the completed bounded trial without private details');
assert.match(pages['privacy.html'], /completed authorized uses are limited to separately task-authorized selected-message inspections, processing selected headers and relevant text through the external OpenAI Codex model provider for those limited tasks, and the separate bounded detection-only trial/i, 'privacy page distinguishes the completed inspection tasks and trial');
assert.doesNotMatch(pages['privacy.html'], /No Gmail grant or token exists, and no mail has been fetched|There is no current grant or local token to revoke or remove/i, 'privacy page rejects obsolete inactive-access claims');
assert.match(pages['privacy.html'], /general future AI use.*not finalized/i, 'privacy page preserves unresolved future AI handling');
assert.match(pages['privacy.html'], /Sending and provider-side reply drafts are not authorized/i, 'privacy page preserves the no-send and no-provider-draft boundary');
assert.match(pages['index.html'], /Sending, mailbox changes, provider-side reply drafts, and unrestricted monitoring are not authorized/i, 'homepage preserves the unauthorized-action boundary');
assert.match(pages['index.html'], /Storage, retention, deletion, backups, logs, and token security have not been finalized/i, 'homepage preserves unresolved data-handling matters');
assert.match(pages['privacy.html'], /stored, how long it would be retained, how deletion would work, or how backups and logs would be handled/i, 'privacy page preserves unresolved data-handling matters');
assert.match(pages['privacy.html'], /does not settle token storage, unlock, security, or rotation details/i, 'privacy page preserves unresolved token security');
for (const [page, html] of Object.entries(pages)) {
  assert.doesNotMatch(html, /Setup is not active/i, `${page} rejects the obsolete inactive-setup claim`);
  assert.doesNotMatch(html, /attachments were opened/i, `${page} makes no unsupported attachment claim`);
  assert.doesNotMatch(html, /may read and summarize|extract action items/i, `${page} makes no standing summarization claim`);
}

console.log(`Static smoke checks passed for ${requiredPages.join(', ')}.`);
