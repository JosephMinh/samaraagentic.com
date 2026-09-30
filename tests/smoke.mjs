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
let readme;

try {
  pages = Object.fromEntries(await Promise.all(requiredPages.map(async (page) => [page, await readFile(path.join(root, page), 'utf8')])));
  readme = await readFile(path.join(root, 'README.md'), 'utf8');
} catch (error) {
  assert.fail(`Static-site artifacts cannot be read: ${error.message}`);
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
assert.match(readme, /limited technical Gmail read and send capability/i, 'README does not characterize the active grant as read-only only');
assert.match(readme, /does not\s+authorize actual or production sends;\s+sending\s+remains limited to separately\s+authorized tasks/i, 'README distinguishes technical capability from task-specific send authority');
assert.match(pages['index.html'], /Limited Gmail access is active/i, 'homepage does not characterize the active grant as read-only only');
assert.match(pages['index.html'], /one personal account has active Gmail read-only, Gmail send, and identity authorization, with a local token/i, 'homepage states the active five-scope authorization and token');
assert.match(pages['index.html'], /separately task-authorized selected-message inspections occurred/i, 'homepage states the bounded selected-message inspections');
assert.match(pages['index.html'], /selected headers and relevant text.*external OpenAI Codex model provider for those limited tasks/i, 'homepage limits external AI processing to the selected inspection tasks');
assert.match(pages['index.html'], /there is no general AI-processing authorization/i, 'homepage denies general AI-processing authorization');
assert.doesNotMatch(pages['index.html'], /Nothing is connected|No Gmail permission grant or token exists|No Gmail messages, headers, or attachments have been fetched/i, 'homepage rejects obsolete inactive-access claims');
assert.match(pages['index.html'], /active Google permissions are exactly.*gmail\.readonly.*gmail\.send.*openid.*email.*userinfo\.email/i, 'homepage states the exact five active scopes');
assert.match(pages['index.html'], /Gmail read-only scope can technically view all messages, settings, and attachments in the account/i, 'homepage describes account-wide read capability');
assert.match(pages['index.html'], /Gmail send scope can technically send email as the account/i, 'homepage describes account-wide technical send capability');
assert.match(pages['index.html'], /does not include Gmail modify, compose, or full-mail scopes/i, 'homepage excludes ungranted Gmail scopes');
assert.match(pages['index.html'], /first bounded self-only test stopped before account binding and before any send; zero test messages and zero replies were sent/i, 'homepage preserves the first test’s zero-send outcome');
assert.match(pages['index.html'], /Self-only testing was attempted\. The first bounded self-only test stopped before account binding and before any send; zero test messages and zero replies were sent\. One synthetic self-addressed test message is visible in Gmail; the test then stopped\. No automated replies or additional seed messages were sent\. Inbox delivery, threading, and latency remain unverified/i, 'homepage states the bounded self-only test outcomes');
assert.match(pages['index.html'], /Real-offer, Crous, third-party, or ongoing automatic sending, mailbox mutation, provider-side reply drafts, and unrestricted monitoring remain unauthorized/i, 'homepage preserves the production and third-party sending boundary');
assert.match(pages['index.html'], /No current monitoring is enabled/i, 'homepage states that monitoring is not active');
assert.match(pages['index.html'], /bounded read-only synthetic-subject detection trial ran and is now stopped/i, 'homepage states the completed bounded trial without private details');
assert.ok(pages['privacy.html'].includes(googleScopeGuide), 'privacy page links to Google scope guidance');
assert.ok(pages['privacy.html'].includes(googleRevocationHelp), 'privacy page links to Google revocation help');
assert.match(pages['privacy.html'], /Limited Gmail access is active/i, 'privacy page does not characterize the active grant as read-only only');
assert.match(pages['privacy.html'], /active Gmail read-only, Gmail send, and identity authorization, with a local token/i, 'privacy page states the active five-scope authorization and token');
assert.match(pages['privacy.html'], /separately task-authorized selected-message inspections occurred/i, 'privacy page states the bounded selected-message inspections');
assert.match(pages['privacy.html'], /selected headers and relevant text.*external OpenAI Codex model provider for those limited tasks/i, 'privacy page limits external AI processing to the selected inspection tasks');
assert.match(pages['privacy.html'], /bounded read-only synthetic-subject detection trial ran and is now stopped/i, 'privacy page states the completed bounded trial without private details');
assert.match(pages['privacy.html'], /No current monitoring is enabled/i, 'privacy page states that monitoring is not active');
assert.match(pages['privacy.html'], /first bounded self-only test stopped before account binding and before any send; zero test messages and zero replies were sent/i, 'privacy page preserves the first test’s zero-send outcome');
assert.match(pages['privacy.html'], /Self-only testing was attempted\. The first bounded self-only test stopped before account binding and before any send; zero test messages and zero replies were sent\. One synthetic self-addressed test message is visible in Gmail; the test then stopped\. No automated replies or additional seed messages were sent\. Inbox delivery, threading, and latency remain unverified/i, 'privacy page states the bounded self-only test outcomes');
assert.match(pages['privacy.html'], /gmail\.readonly.*gmail\.send.*openid.*email.*userinfo\.email/is, 'privacy page states the exact five active scopes');
assert.match(pages['privacy.html'], /Gmail read-only scope can technically view all messages, settings, and attachments in the account/i, 'privacy page describes account-wide read capability');
assert.match(pages['privacy.html'], /Gmail send scope can technically send email as the account/i, 'privacy page describes account-wide technical send capability');
assert.match(pages['privacy.html'], /does not include Gmail modify, compose, or full-mail scopes/i, 'privacy page excludes ungranted Gmail scopes');
assert.match(pages['privacy.html'], /completed authorized uses are limited to separately task-authorized selected-message inspections, processing selected headers and relevant text through the external OpenAI Codex model provider for those limited tasks, and the separate bounded detection-only trial/i, 'privacy page distinguishes the completed inspection tasks and trial');
assert.doesNotMatch(pages['privacy.html'], /No Gmail grant or token exists, and no mail has been fetched|There is no current grant or local token to revoke or remove/i, 'privacy page rejects obsolete inactive-access claims');
assert.match(pages['privacy.html'], /general future AI use.*not finalized/i, 'privacy page preserves unresolved future AI handling');
assert.match(pages['privacy.html'], /Gmail send capability is not blanket authority/i, 'privacy page distinguishes technical send capability from authority');
assert.match(pages['privacy.html'], /Real-offer, Crous, third-party, or ongoing automatic sending, mailbox mutation, and provider-side reply drafts remain unauthorized/i, 'privacy page preserves the production, third-party, and no-provider-draft boundary');
assert.match(pages['index.html'], /Storage, retention, deletion, backups, logs, and token security have not been finalized/i, 'homepage preserves unresolved data-handling matters');
assert.match(pages['privacy.html'], /stored, how long it would be retained, how deletion would work, or how backups and logs would be handled/i, 'privacy page preserves unresolved data-handling matters');
assert.match(pages['privacy.html'], /does not settle token storage, unlock, security, or rotation details/i, 'privacy page preserves unresolved token security');
assert.match(readme, /first bounded self-only\s+test stopped before account\s+binding and before any send; zero test messages and\s+zero replies were sent/i, 'README preserves the first test’s zero-send outcome');
assert.match(readme, /Self-only testing was attempted\. The first bounded self-only\s+test stopped before account\s+binding and before any send; zero test messages and\s+zero replies were sent\. One synthetic self-addressed test message is visible in\s+Gmail; the test then stopped\. No automated replies or additional seed messages\s+were sent\. Inbox delivery, threading, and latency remain unverified/i, 'README states the bounded self-only test outcomes');
for (const [page, html] of Object.entries(pages)) {
  assert.doesNotMatch(html, /Setup is not active/i, `${page} rejects the obsolete inactive-setup claim`);
  assert.doesNotMatch(html, /attachments were opened/i, `${page} makes no unsupported attachment claim`);
  assert.doesNotMatch(html, /may read and summarize|extract action items/i, `${page} makes no standing summarization claim`);
  assert.doesNotMatch(html, /self-only synthetic test[^<]*has not started/i, `${page} rejects the obsolete self-only-test status`);
  assert.doesNotMatch(html, /No email has been sent/i, `${page} makes no blanket current zero-send claim`);
}

console.log(`Static smoke checks passed for ${requiredPages.join(', ')}.`);
