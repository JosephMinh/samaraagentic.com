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

const pageResults = await Promise.allSettled(requiredPages.map(async (page) => [page, await readFile(path.join(root, page), 'utf8')]));
for (const [index, result] of pageResults.entries()) {
  if (result.status === 'rejected') {
    const detail = result.reason instanceof Error ? result.reason.message : String(result.reason);
    assert.fail(`Static-site artifact cannot be read: ${requiredPages[index]}: ${detail}`);
  }
}
const pages = Object.fromEntries(pageResults.map((result) => result.value));
const readme = await readFile(path.join(root, 'README.md'), 'utf8');

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
assert.match(readme, /limited technical Gmail read and send capability/i, 'README states the technical read and send capabilities');
assert.match(readme, /ongoing self-only reply service for qualifying mail sent by\s+that same account/i, 'README limits the active service to self-only mail');
assert.match(readme, /not general, Crous, or third-party sending authority/i, 'README excludes broader send authority');
assert.match(readme, /separately task-authorized selected-message inspections and external processing\s+of selected headers and relevant text are historical, limited tasks/i, 'README preserves the limited historical inspection tasks');
assert.match(readme, /bounded self-only tests established finite self-only reply proof; a separate\s+bounded detection-only trial is stopped/i, 'README distinguishes finite self-only proof from the stopped detection trial');
assert.match(readme, /only Node core modules and no package manager, dependency\s+manifest, network access, or hosted service/i, 'README records the dependency-free testing fit');
assert.match(pages['index.html'], /Limited Gmail access is active/i, 'homepage does not characterize the active grant as read-only only');
assert.match(pages['index.html'], /one personal account has active Gmail read-only, Gmail send, and identity authorization, with a local token/i, 'homepage states the active five-scope authorization and token');
assert.match(pages['index.html'], /separately task-authorized selected-message inspections occurred/i, 'homepage states the limited selected-message inspections');
assert.match(pages['index.html'], /selected headers and relevant text.*external OpenAI Codex model provider for those limited tasks/i, 'homepage limits external AI processing to the historical inspection tasks');
assert.match(pages['index.html'], /there is no general AI-processing authorization/i, 'homepage denies general AI-processing authorization');
assert.doesNotMatch(pages['index.html'], /Nothing is connected|No Gmail permission grant or token exists|No Gmail messages, headers, or attachments have been fetched/i, 'homepage rejects obsolete inactive-access claims');
assert.match(pages['index.html'], /active Google permissions are exactly.*gmail\.readonly.*gmail\.send.*openid.*email.*userinfo\.email/i, 'homepage states the exact five active scopes');
assert.match(pages['index.html'], /Gmail read-only scope can technically view all messages, settings, and attachments in the account/i, 'homepage describes account-wide read capability');
assert.match(pages['index.html'], /Gmail send scope can technically send email as the account/i, 'homepage describes account-wide technical send capability');
assert.match(pages['index.html'], /does not include Gmail modify, compose, or full-mail scopes/i, 'homepage excludes ungranted Gmail scopes');
assert.match(pages['index.html'], /limited ongoing reply service is active only for qualifying mail sent by that same account/i, 'homepage states the active self-only service');
assert.match(pages['index.html'], /Earlier bounded self-only tests established finite self-only reply proof; earlier failures are historical and do not describe the current service/i, 'homepage preserves finite self-only proof and the historical status of failures');
assert.match(pages['index.html'], /A separate bounded detection-only trial is stopped/i, 'homepage distinguishes the stopped detection trial from the current service');
assert.match(pages['index.html'], /technical capability, not blanket authority/i, 'homepage distinguishes the technical send capability from authorization');
assert.match(pages['index.html'], /Sending to Crous or any third party, mailbox changes, provider-side reply drafts, and unrestricted monitoring are not authorized/i, 'homepage preserves the production, third-party, and no-provider-draft boundary');
assert.match(pages['index.html'], /does not promise future delivery, coverage, response time, or quota availability/i, 'homepage avoids operational guarantees');
assert.doesNotMatch(pages['index.html'], /No current monitoring is enabled|trial ran and is now stopped|no active dispatch or retry/i, 'homepage rejects obsolete inactive-service claims');
assert.ok(pages['privacy.html'].includes(googleScopeGuide), 'privacy page links to Google scope guidance');
assert.ok(pages['privacy.html'].includes(googleRevocationHelp), 'privacy page links to Google revocation help');
assert.match(pages['privacy.html'], /Limited Gmail access is active/i, 'privacy page does not characterize the active grant as read-only only');
assert.match(pages['privacy.html'], /active Gmail read-only, Gmail send, and identity authorization, with a local token/i, 'privacy page states the active five-scope authorization and token');
assert.match(pages['privacy.html'], /separately task-authorized selected-message inspections occurred/i, 'privacy page states the limited selected-message inspections');
assert.match(pages['privacy.html'], /selected headers and relevant text.*external OpenAI Codex model provider for those limited tasks/i, 'privacy page limits external AI processing to the historical inspection tasks');
assert.match(pages['privacy.html'], /limited ongoing reply service is active only for qualifying mail sent by that same account/i, 'privacy page states the active self-only service');
assert.match(pages['privacy.html'], /Earlier bounded self-only tests established finite self-only reply proof; earlier failures are historical and do not describe the current service/i, 'privacy page preserves finite self-only proof and the historical status of failures');
assert.match(pages['privacy.html'], /A separate bounded detection-only trial is stopped/i, 'privacy page distinguishes the stopped detection trial from the current service');
assert.match(pages['privacy.html'], /gmail\.readonly.*gmail\.send.*openid.*email.*userinfo\.email/is, 'privacy page states the exact five active scopes');
assert.match(pages['privacy.html'], /Gmail read-only scope can technically view all messages, settings, and attachments in the account/i, 'privacy page describes account-wide read capability');
assert.match(pages['privacy.html'], /Gmail send scope can technically send email as the account/i, 'privacy page describes account-wide technical send capability');
assert.match(pages['privacy.html'], /does not include Gmail modify, compose, or full-mail scopes/i, 'privacy page excludes ungranted Gmail scopes');
assert.match(pages['privacy.html'], /active authorization is limited to the ongoing self-only reply service for qualifying mail sent by that same account/i, 'privacy page limits the active authorization to self-only mail');
assert.match(pages['privacy.html'], /Historical authorized uses include separately task-authorized selected-message inspections.*separate bounded detection-only trial that is stopped.*bounded self-only tests that established finite self-only reply proof/is, 'privacy page accurately includes the limited historical authorized categories');
assert.doesNotMatch(pages['privacy.html'], /No Gmail grant or token exists, and no mail has been fetched|There is no current grant or local token to revoke or remove/i, 'privacy page rejects obsolete inactive-access claims');
assert.match(pages['privacy.html'], /general future AI use.*not finalized/i, 'privacy page preserves unresolved future AI handling');
assert.match(pages['privacy.html'], /Gmail send capability is not blanket authority/i, 'privacy page distinguishes technical send capability from authority');
assert.match(pages['privacy.html'], /sending to Crous or any third party, mailbox mutation, provider-side reply drafts, and unrestricted monitoring remain unauthorized/i, 'privacy page preserves the production, third-party, and no-provider-draft boundary');
assert.match(pages['privacy.html'], /does not promise future delivery, coverage, response time, or quota availability/i, 'privacy page avoids operational guarantees');
assert.doesNotMatch(pages['privacy.html'], /No current monitoring is enabled|trial ran and is now stopped|no active dispatch or retry/i, 'privacy page rejects obsolete inactive-service claims');
assert.match(pages['index.html'], /Storage, retention, deletion, backups, logs, and token security have not been finalized/i, 'homepage preserves unresolved data-handling matters');
assert.match(pages['privacy.html'], /stored, how long it would be retained, how deletion would work, or how backups and logs would be handled/i, 'privacy page preserves unresolved data-handling matters');
assert.match(pages['privacy.html'], /does not settle token storage, unlock, security, or rotation details/i, 'privacy page preserves unresolved token security');
for (const [page, html] of Object.entries(pages)) {
  assert.doesNotMatch(html, /Setup is not active/i, `${page} rejects the obsolete inactive-setup claim`);
  assert.doesNotMatch(html, /attachments were opened/i, `${page} makes no unsupported attachment claim`);
  assert.doesNotMatch(html, /may read and summarize|extract action items/i, `${page} makes no standing summarization claim`);
  assert.doesNotMatch(html, /self-only synthetic test[^<]*has not started/i, `${page} rejects the obsolete self-only-test status`);
  assert.doesNotMatch(html, /No email has been sent/i, `${page} makes no blanket current zero-send claim`);
}

console.log(`Static smoke checks passed for ${requiredPages.join(', ')}.`);
