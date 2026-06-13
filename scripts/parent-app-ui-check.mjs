#!/usr/bin/env node

import { existsSync } from "node:fs";
import { chromium } from "playwright";

const DEFAULT_BASE = "http://localhost:3011";
const DEFAULT_NAME = "이다연";
const DEFAULT_PIN = "78202";
const DEFAULT_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const STUDENT_KEY = "codingssok_parent_student";
const VERIFIED_KEY = "codingssok_parent_verified_v2";
const EXPECTED_TABS = ["피드백", "설정"];
const REMOVED_ACTION_LABELS = ["홈", "성장", "어버이날", "데이터 초기화", "인증 초기화", "이름 변경"];
const LEGACY_ROUTES = ["/parent", "/parent/growth", "/parent/parents-day", "/parent/homework"];

function parseArgs(argv) {
  const args = {
    base: process.env.PARENT_APP_UI_BASE || DEFAULT_BASE,
    name: process.env.PARENT_APP_UI_NAME || DEFAULT_NAME,
    pin: process.env.PARENT_APP_UI_PIN || DEFAULT_PIN,
    chromePath: process.env.CHROME_PATH || "",
    headful: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") args.base = argv[++index] || args.base;
    else if (arg === "--name") args.name = argv[++index] || args.name;
    else if (arg === "--pin") args.pin = argv[++index] || args.pin;
    else if (arg === "--chrome") args.chromePath = argv[++index] || args.chromePath;
    else if (arg === "--headful") args.headful = true;
    else if (arg === "--help") args.help = true;
  }

  args.base = args.base.replace(/\/+$/, "");
  if (!args.chromePath) {
    args.chromePath = DEFAULT_CHROME_PATHS.find((candidate) => existsSync(candidate)) || "";
  }
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/parent-app-ui-check.mjs
  node scripts/parent-app-ui-check.mjs --base http://localhost:3011
  node scripts/parent-app-ui-check.mjs --name 이다연 --pin 78202
`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pass(message) {
  console.log(`[OK] ${message}`);
}

async function collectInteractiveLabels(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("a,button,[role='button']"))
      .map((element) => (element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\s+/g, " "))
      .filter(Boolean),
  );
}

async function assertNoRemovedActions(page, contextLabel) {
  const labels = await collectInteractiveLabels(page);
  for (const removed of REMOVED_ACTION_LABELS) {
    assert(!labels.includes(removed), `${contextLabel}: removed action still exists: ${removed}`);
  }
}

async function waitForFeedbackRoute(page) {
  await page.waitForURL((url) => url.pathname === "/parent/feedback", { timeout: 12000 });
}

async function assertFeedbackSectionsVisible(page) {
  await page.waitForFunction(() => document.body.innerText.includes("수업 피드백"), null, { timeout: 15000 });

  async function hasRequiredSections() {
    const text = await page.locator("body").innerText({ timeout: 12000 });
    return text.includes("배운 내용") && text.includes("과제");
  }

  if (await hasRequiredSections()) return;

  const buttons = page.locator("button");
  const count = await buttons.count();
  for (let index = 0; index < count; index += 1) {
    await buttons.nth(index).click({ trial: false }).catch(() => {});
    await page.waitForTimeout(350);
    if (await hasRequiredSections()) return;
  }

  throw new Error("feedback page should visibly render both 배운 내용 and 과제 sections");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  assert(args.chromePath && existsSync(args.chromePath), "Chrome or Edge executable not found. Set CHROME_PATH or pass --chrome.");

  console.log("Parent app UI check");
  console.log(`base=${args.base}`);
  console.log(`student=${args.name}`);
  console.log(`chrome=${args.chromePath}`);

  const browser = await chromium.launch({
    headless: !args.headful,
    executablePath: args.chromePath,
  });

  try {
    const context = await browser.newContext({ viewport: { width: 430, height: 900 } });
    const authResponse = await context.request.post(`${args.base}/api/parent/auth`, {
      data: { name: args.name, pin: args.pin },
    });
    const authBody = await authResponse.text();
    assert(authResponse.ok(), `parent auth failed with status ${authResponse.status()}: ${authBody}`);

    await context.addInitScript(({ studentKey, verifiedKey, studentName }) => {
      window.localStorage.setItem(studentKey, studentName);
      window.localStorage.setItem(verifiedKey, "true");
    }, { studentKey: STUDENT_KEY, verifiedKey: VERIFIED_KEY, studentName: args.name });

    const page = await context.newPage();

    for (const route of LEGACY_ROUTES) {
      await page.goto(`${args.base}${route}`, { waitUntil: "domcontentloaded" });
      await waitForFeedbackRoute(page);
      pass(`${route} redirects to /parent/feedback`);
    }

    await page.waitForLoadState("networkidle");
    const bodyText = await page.locator("body").innerText({ timeout: 12000 });
    assert(bodyText.includes(args.name), "authenticated student name should be visible");

    const labels = await collectInteractiveLabels(page);
    for (const expected of EXPECTED_TABS) {
      assert(labels.includes(expected), `expected bottom tab missing: ${expected}`);
    }
    await assertNoRemovedActions(page, "feedback page");
    await assertFeedbackSectionsVisible(page);
    pass("feedback page keeps only feedback/settings navigation");
    pass("feedback page visibly renders learned-content and homework sections");

    await page.goto(`${args.base}/parent/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await assertNoRemovedActions(page, "settings page");
    const settingsText = await page.locator("body").innerText({ timeout: 12000 });
    assert(settingsText.includes("설정"), "settings page should render");
    assert(settingsText.includes("코딩쏙 학부모 앱"), "settings page should keep app service info");
    pass("settings page has no reset/name-change controls");

    pass("parent app UI check complete");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.log(`[FAIL] ${error.message}`);
  process.exitCode = 1;
});
