#!/usr/bin/env node

const DEFAULT_BASE = "http://localhost:3011";
const EXPECTED_ANDROID_PACKAGE = "com.codingssok.parent";
const EXPECTED_ANDROID_SHA256 = "6D:BE:EC:91:00:CE:04:ED:47:66:BF:56:39:A5:32:45:A0:26:C7:2F:83:F3:2C:37:30:E7:2C:20:A7:E4:7F:DC";

function parseArgs(argv) {
  const args = {
    base: process.env.PARENT_SMOKE_BASE || DEFAULT_BASE,
    mode: process.env.PARENT_SMOKE_MODE || "local",
    name: process.env.PARENT_SMOKE_NAME || "",
    pin: process.env.PARENT_SMOKE_PIN || "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") args.base = argv[++index] || args.base;
    else if (arg === "--mode") args.mode = argv[++index] || args.mode;
    else if (arg === "--name") args.name = argv[++index] || args.name;
    else if (arg === "--pin") args.pin = argv[++index] || args.pin;
    else if (arg === "--help") args.help = true;
  }

  args.base = args.base.replace(/\/+$/, "");
  if (!["local", "production"].includes(args.mode)) {
    throw new Error("--mode must be local or production");
  }
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/parent-smoke-check.mjs
  node scripts/parent-smoke-check.mjs --base http://localhost:3011 --mode local
  node scripts/parent-smoke-check.mjs --base https://codingssok-parent-app.vercel.app --mode production

Optional authenticated check:
  PARENT_SMOKE_NAME="student name" PARENT_SMOKE_PIN="12345" node scripts/parent-smoke-check.mjs
`);
}

function withCacheBust(path) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}__parent_smoke=${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function withNoCacheHeaders(init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("cache-control")) headers.set("cache-control", "no-cache");
  if (!headers.has("pragma")) headers.set("pragma", "no-cache");
  return { ...init, cache: "no-store", headers };
}

async function readText(base, path, init = {}) {
  const method = String(init.method || "GET").toUpperCase();
  const requestPath = method === "GET" ? withCacheBust(path) : path;
  const response = await fetch(`${base}${requestPath}`, withNoCacheHeaders(init));
  const text = await response.text();
  return { response, text };
}

async function readJson(base, path, init) {
  const { response, text } = await readText(base, path, init);
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${path} did not return JSON. status=${response.status}`);
  }
  return { response, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pass(message) {
  console.log(`[OK] ${message}`);
}

function skip(message) {
  console.log(`[SKIP] ${message}`);
}

async function runCheck(label, task) {
  try {
    await task();
    return true;
  } catch (error) {
    console.log(`[FAIL] ${label}: ${error.message}`);
    return false;
  }
}

async function checkParentManifest(base) {
  const { response, json } = await readJson(base, "/manifest-parent.json");
  assert(response.ok, `manifest-parent.json status ${response.status}`);
  assert(json.start_url === "/parent/feedback", "manifest start_url must be /parent/feedback");
  assert(json.scope === "/parent", "manifest scope must be /parent");
  assert(String(json.description || "").includes("피드백"), "manifest description should mention feedback");
  pass("parent manifest uses /parent/feedback");
}

async function checkParentServiceWorker(base) {
  const { response, text } = await readText(base, "/parent-sw.js");
  assert(response.ok, `parent-sw.js status ${response.status}`);
  assert(text.includes("codingssok-parent-v3"), "parent service worker cache should be v3");
  assert(text.includes("/parent/feedback"), "parent service worker should precache /parent/feedback");
  assert(text.includes('url: "/parent/feedback"'), "parent service worker notification default should open /parent/feedback");
  assert(!text.includes('"/parent",'), "parent service worker must not precache legacy /parent root");
  assert(!text.includes('caches.match("/parent")'), "parent service worker must not fall back to legacy /parent root");
  assert(!text.includes("/parent/growth"), "parent service worker must not precache growth tab");
  assert(!text.includes("/parent/parents-day"), "parent service worker must not precache parents-day tab");
  assert(!text.includes("/parent/homework"), "parent service worker must not precache homework tab");
  pass("parent service worker cache routes are safe");
}

async function checkParentEntry(base) {
  const { response, text } = await readText(base, "/parent/feedback");
  assert(response.ok, `/parent/feedback status ${response.status}`);
  assert(
    text.includes("학부모") || text.includes("parent") || text.includes("Parent"),
    "/parent/feedback should return the parent app shell",
  );
  pass("parent feedback entry responds");
}

async function checkAssetLinks(base, mode) {
  if (mode !== "production") {
    skip("assetlinks check: production mode only");
    return;
  }

  const { response, json } = await readJson(base, "/.well-known/assetlinks.json");
  assert(response.ok, `assetlinks.json status ${response.status}`);
  assert(Array.isArray(json), "assetlinks.json must be an array");
  const twaEntry = json.find((entry) =>
    entry?.target?.namespace === "android_app" &&
    entry?.target?.package_name === EXPECTED_ANDROID_PACKAGE &&
    Array.isArray(entry?.target?.sha256_cert_fingerprints) &&
    entry.target.sha256_cert_fingerprints.includes(EXPECTED_ANDROID_SHA256)
  );
  assert(Boolean(twaEntry), "assetlinks must include the parent app package and SHA256 fingerprint");
  pass("production assetlinks trusts the Play Store parent app package");
}

async function checkTeacherParentCodes(base, mode) {
  const { response, json } = await readJson(base, "/api/teacher/parent-codes");

  if (mode === "local") {
    assert(response.status === 200, `local parent-codes status ${response.status}`);
    assert(json.success === true, "local parent-codes success must be true");
    assert(json.canMutate === false, "local parent-codes without service key must be read-only");
    assert(Array.isArray(json.rows), "local parent-codes rows must be an array");
    assert(json.rows.length === 38, `local parent-codes should expose 38 reference rows, got ${json.rows.length}`);
    assert(json.rows.some((row) => row.name === "이다연" && row.code === "78202"), "local reference row for 이다연 missing");
    assert(!json.rows.some((row) => row.name === "김시율"), "removed student 김시율 must not appear");
    pass("local parent code reference list is aligned");
    return;
  }

  assert(
    [401, 403, 503].includes(response.status),
    `production parent-codes must not expose rows without admin auth, got status ${response.status}`,
  );
  pass("production parent code API is not publicly exposed");
}

async function checkOptionalParentAuth(base, name, pin) {
  if (!name || !pin) {
    console.log("[SKIP] parent auth check: set PARENT_SMOKE_NAME and PARENT_SMOKE_PIN to enable it");
    return;
  }

  const auth = await readJson(base, "/api/parent/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, pin }),
  });
  assert(auth.response.ok, `parent auth failed with status ${auth.response.status}: ${JSON.stringify(auth.json)}`);
  assert(auth.json.success === true, "parent auth success must be true");

  const setCookie = auth.response.headers.get("set-cookie") || "";
  assert(setCookie.includes("codingssok_parent_session="), "parent auth must set session cookie");

  const sessionCookie = setCookie.split(";")[0];
  const lookup = await readJson(base, `/api/parent/lookup?name=${encodeURIComponent(name)}`, {
    headers: { cookie: sessionCookie },
  });
  assert(lookup.response.ok, `parent lookup failed with status ${lookup.response.status}: ${JSON.stringify(lookup.json)}`);
  assert(lookup.json.found === true, "parent lookup should find feedback for authenticated student");
  assert(Array.isArray(lookup.json.feedbacks), "parent lookup feedbacks must be an array");
  assert(lookup.json.feedbacks.length > 0, "parent lookup should return at least one feedback row");
  assert(
    lookup.json.feedbacks.some((feedback) => typeof feedback.contentLearned === "string" && feedback.contentLearned.trim()),
    "parent lookup should include at least one feedback with contentLearned",
  );
  assert(
    lookup.json.feedbacks.some((feedback) => typeof feedback.homework === "string" && feedback.homework.trim()),
    "parent lookup should include at least one feedback with homework",
  );
  pass(`authenticated parent lookup works for ${name}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  console.log(`Parent smoke check`);
  console.log(`base=${args.base}`);
  console.log(`mode=${args.mode}`);

  const results = [];
  results.push(await runCheck("parent manifest", () => checkParentManifest(args.base)));
  results.push(await runCheck("parent service worker", () => checkParentServiceWorker(args.base)));
  results.push(await runCheck("parent feedback entry", () => checkParentEntry(args.base)));
  results.push(await runCheck("teacher parent code API", () => checkTeacherParentCodes(args.base, args.mode)));
  results.push(await runCheck("assetlinks", () => checkAssetLinks(args.base, args.mode)));
  results.push(await runCheck("optional parent auth", () => checkOptionalParentAuth(args.base, args.name, args.pin)));

  const failed = results.filter((ok) => !ok).length;
  if (failed > 0) {
    console.log(`[FAIL] parent smoke check complete with ${failed} failure(s)`);
    process.exitCode = 1;
    return;
  }

  console.log("[OK] parent smoke check complete");
}

main().catch((error) => {
  console.error(`[FAIL] ${error.message}`);
  process.exitCode = 1;
});
