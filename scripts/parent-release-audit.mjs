#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

const EXPECTED = {
  packageId: "com.codingssok.parent",
  host: "codingssok-parent-app.vercel.app",
  startUrl: "/parent/feedback",
  fullLaunchUrl: "https://codingssok-parent-app.vercel.app/parent/feedback",
  parentScope: "/parent",
  versionCode: 15,
  versionName: "1.0.15",
  aabName: "app-release-bundle-v1.0.15-code15-parent-feedback-20260612.aab",
  aabSha256: "A660F1CE6E58998C7BFC1672E1E4B4AB9021A75624D80884E12A4F4F08714AC7",
  signingSha256: "6D:BE:EC:91:00:CE:04:ED:47:66:BF:56:39:A5:32:45:A0:26:C7:2F:83:F3:2C:37:30:E7:2C:20:A7:E4:7F:DC",
};

function parseArgs(argv) {
  const args = {
    parentApp: process.env.PARENT_APP_DIR || path.resolve(repoRoot, "..", "parent-app"),
    aab: process.env.PARENT_AAB_PATH || "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--parent-app") args.parentApp = argv[++index] || args.parentApp;
    else if (arg === "--aab") args.aab = argv[++index] || args.aab;
    else if (arg === "--help") args.help = true;
  }

  args.parentApp = path.resolve(args.parentApp);
  if (!args.aab) args.aab = path.join(args.parentApp, EXPECTED.aabName);
  args.aab = path.resolve(args.aab);
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/parent-release-audit.mjs
  node scripts/parent-release-audit.mjs --parent-app ../parent-app
  node scripts/parent-release-audit.mjs --aab ../parent-app/${EXPECTED.aabName}
`);
}

function pass(message) {
  console.log(`[OK] ${message}`);
}

function fail(message) {
  console.log(`[FAIL] ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readUtf8(filePath) {
  return readFile(filePath, "utf8");
}

async function readJson(filePath) {
  return JSON.parse(await readUtf8(filePath));
}

async function sha256(filePath) {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

async function runCheck(label, task) {
  try {
    await task();
    pass(label);
    return true;
  } catch (error) {
    fail(`${label}: ${error.message}`);
    return false;
  }
}

function contains(text, pattern, message) {
  assert(text.includes(pattern), message || `missing ${pattern}`);
}

function notContains(text, pattern, message) {
  assert(!text.includes(pattern), message || `unexpected ${pattern}`);
}

async function checkWebManifest(fileName) {
  const manifestPath = path.join(repoRoot, "public", fileName);
  const manifest = await readJson(manifestPath);
  assert(manifest.start_url === EXPECTED.startUrl, `${fileName} start_url must be ${EXPECTED.startUrl}`);
  assert(manifest.scope === EXPECTED.parentScope, `${fileName} scope must be ${EXPECTED.parentScope}`);
  assert(String(manifest.description || "").includes("피드백"), `${fileName} description should mention feedback`);
}

async function checkParentServiceWorker() {
  const text = await readUtf8(path.join(repoRoot, "public", "parent-sw.js"));
  contains(text, "codingssok-parent-v3", "parent service worker cache must be v3");
  contains(text, EXPECTED.startUrl, `parent service worker must include ${EXPECTED.startUrl}`);
  contains(text, "/parent/settings", "parent service worker must include /parent/settings");
  contains(text, `url: "${EXPECTED.startUrl}"`, `parent notification default URL must be ${EXPECTED.startUrl}`);
  notContains(text, '"/parent",', "parent service worker must not precache legacy /parent root");
  notContains(text, 'caches.match("/parent")', "parent service worker must not fall back to legacy /parent root");
  notContains(text, "/parent/growth", "parent service worker must not cache /parent/growth");
  notContains(text, "/parent/parents-day", "parent service worker must not cache /parent/parents-day");
  notContains(text, "/parent/homework", "parent service worker must not cache /parent/homework");
}

async function checkWebSourceLinks() {
  const adminText = await readUtf8(path.join(repoRoot, "src", "app", "teacher", "admin", "page.tsx"));
  const feedbackRouteText = await readUtf8(path.join(repoRoot, "src", "app", "api", "teacher", "feedback", "route.ts"));
  const parentNotFoundText = await readUtf8(path.join(repoRoot, "src", "app", "parent", "not-found.tsx"));
  const sitemapText = await readUtf8(path.join(repoRoot, "src", "app", "sitemap.ts"));

  contains(adminText, "https://www.codingssok.com/parent/feedback", "teacher admin guide must copy parent feedback URL");
  notContains(adminText, '"접속 주소: https://www.codingssok.com/parent",', "teacher admin guide must not copy legacy /parent URL");

  contains(feedbackRouteText, "url: '/parent/feedback'", "teacher feedback push URL must open parent feedback");
  notContains(feedbackRouteText, "url: '/parent',", "teacher feedback push URL must not open legacy /parent root");

  contains(parentNotFoundText, 'href="/parent/feedback"', "parent not-found return link must open parent feedback");
  notContains(parentNotFoundText, 'href="/parent"', "parent not-found return link must not open legacy /parent root");

  contains(sitemapText, "`${baseUrl}/parent/feedback`", "sitemap must point to parent feedback");
  notContains(sitemapText, "`${baseUrl}/parent`,", "sitemap must not point to legacy /parent root");
}

async function checkTwaManifest(parentApp) {
  const manifest = await readJson(path.join(parentApp, "twa-manifest.json"));
  assert(manifest.packageId === EXPECTED.packageId, "twa packageId mismatch");
  assert(manifest.host === EXPECTED.host, "twa host mismatch");
  assert(manifest.startUrl === EXPECTED.startUrl, "twa startUrl mismatch");
  assert(manifest.appVersionCode === EXPECTED.versionCode, "twa appVersionCode mismatch");
  assert(manifest.appVersionName === EXPECTED.versionName, "twa appVersionName mismatch");
  assert(manifest.webManifestUrl === `https://${EXPECTED.host}/manifest-parent.json`, "twa webManifestUrl mismatch");
  assert(manifest.fullScopeUrl === `https://${EXPECTED.host}${EXPECTED.parentScope}`, "twa fullScopeUrl mismatch");
}

async function checkGradle(parentApp) {
  const text = await readUtf8(path.join(parentApp, "app", "build.gradle"));
  contains(text, `applicationId: '${EXPECTED.packageId}'`, "Gradle TWA applicationId mismatch");
  contains(text, `hostName: '${EXPECTED.host}'`, "Gradle hostName mismatch");
  contains(text, `launchUrl: '${EXPECTED.startUrl}'`, "Gradle launchUrl mismatch");
  contains(text, `applicationId "${EXPECTED.packageId}"`, "Gradle defaultConfig applicationId mismatch");
  contains(text, `versionCode ${EXPECTED.versionCode}`, "Gradle versionCode mismatch");
  contains(text, `versionName "${EXPECTED.versionName}"`, "Gradle versionName mismatch");
}

async function checkGeneratedResources(parentApp) {
  const filePath = path.join(parentApp, "app", "build", "generated", "res", "resValues", "release", "values", "gradleResValues.xml");
  assert(existsSync(filePath), "generated release resources missing; run parent app bundle build");
  const text = await readUtf8(filePath);
  contains(text, `<string name="hostName" translatable="false">${EXPECTED.host}</string>`, "generated hostName mismatch");
  contains(text, `<string name="launchUrl" translatable="false">${EXPECTED.fullLaunchUrl}</string>`, "generated launchUrl mismatch");
}

async function checkAabHash(aabPath) {
  assert(existsSync(aabPath), `AAB file missing: ${aabPath}`);
  const actualHash = await sha256(aabPath);
  assert(actualHash === EXPECTED.aabSha256, `AAB SHA256 mismatch: ${actualHash}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  console.log("Parent release audit");
  console.log(`repo=${repoRoot}`);
  console.log(`parentApp=${args.parentApp}`);
  console.log(`aab=${args.aab}`);
  console.log(`expectedSigningSha256=${EXPECTED.signingSha256}`);

  const results = [];
  results.push(await runCheck("public/manifest-parent.json uses parent feedback start URL", () => checkWebManifest("manifest-parent.json")));
  results.push(await runCheck("public/parent-manifest.json uses parent feedback start URL", () => checkWebManifest("parent-manifest.json")));
  results.push(await runCheck("parent service worker routes are safe", checkParentServiceWorker));
  results.push(await runCheck("web source links open parent feedback", checkWebSourceLinks));
  results.push(await runCheck("TWA manifest points to parent feedback host", () => checkTwaManifest(args.parentApp)));
  results.push(await runCheck("Gradle release config points to parent feedback host", () => checkGradle(args.parentApp)));
  results.push(await runCheck("generated Android resources contain parent feedback launch URL", () => checkGeneratedResources(args.parentApp)));
  results.push(await runCheck("AAB upload file hash matches expected release", () => checkAabHash(args.aab)));

  const failed = results.filter((ok) => !ok).length;
  if (failed > 0) {
    console.log(`[FAIL] parent release audit complete with ${failed} failure(s)`);
    process.exitCode = 1;
    return;
  }

  console.log("[OK] parent release audit complete");
}

main().catch((error) => {
  fail(error.message);
  process.exitCode = 1;
});
