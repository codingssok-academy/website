#!/usr/bin/env node

import { existsSync } from "node:fs";
import { chromium } from "playwright";

const DEFAULT_BASE = "http://localhost:3011";
const DEFAULT_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function parseArgs(argv) {
  const args = {
    base: process.env.PARENT_ADMIN_UI_BASE || DEFAULT_BASE,
    chromePath: process.env.CHROME_PATH || "",
    headful: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") args.base = argv[++index] || args.base;
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
  node scripts/parent-admin-ui-check.mjs
  node scripts/parent-admin-ui-check.mjs --base http://localhost:3011
  node scripts/parent-admin-ui-check.mjs --chrome "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pass(message) {
  console.log(`[OK] ${message}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  assert(args.chromePath && existsSync(args.chromePath), "Chrome or Edge executable not found. Set CHROME_PATH or pass --chrome.");

  console.log("Parent admin UI check");
  console.log(`base=${args.base}`);
  console.log(`chrome=${args.chromePath}`);

  const browser = await chromium.launch({
    headless: !args.headful,
    executablePath: args.chromePath,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${args.base}/teacher/admin`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".code-admin", { timeout: 30000 });
    await page.waitForTimeout(1500);

    const result = await page.evaluate(() => {
      const root = document.querySelector(".code-admin");
      const text = root?.textContent || "";
      const rows = Array.from(root?.querySelectorAll("tbody tr") || []);
      const buttons = Array.from(root?.querySelectorAll("button") || []);
      const buttonLabels = buttons.map((button) => button.textContent?.trim().replace(/\s+/g, " ") || "").filter(Boolean);
      const referenceRows = rows.filter((row) => row.textContent?.includes("기준표 · 활성화 필요"));
      const referenceCopyStates = referenceRows.map((row) => {
        const copyButton = Array.from(row.querySelectorAll("button")).find((button) => button.textContent?.trim() === "복사");
        return Boolean(copyButton?.disabled);
      });
      const disabledControlLabels = buttons
        .filter((button) => button.disabled)
        .map((button) => button.textContent?.trim().replace(/\s+/g, " ") || "")
        .filter(Boolean);

      return {
        text,
        rowCount: rows.length,
        buttonLabels,
        disabledControlLabels,
        referenceRowCount: referenceRows.length,
        referenceCopyStates,
        hasTitle: text.includes("학부모 코드 관리"),
        hasIssuePanel: text.includes("새 학생 코드 발급"),
        hasSiblingPanel: text.includes("형제/자매 묶기"),
        hasSeedButton: text.includes("기준표 전체 활성화"),
        hasIdayeon: text.includes("이다연"),
        hasHanSiblings: text.includes("한보윤") && text.includes("한보리"),
        hasRemovedKimSiyul: text.includes("김시율"),
        hasReferenceWarning: text.includes("기준표 상태의 코드는 아직 앱 인증에 적용된 코드가 아닙니다") ||
          text.includes("로컬 환경에 SUPABASE_SERVICE_ROLE_KEY가 없어 기준표 목록만 표시합니다"),
      };
    });

    assert(result.hasTitle, "admin title missing");
    assert(result.hasIssuePanel, "code issue panel missing");
    assert(result.hasSiblingPanel, "sibling group panel missing");
    assert(result.hasSeedButton, "seed baseline button missing");
    for (const label of ["코드 발급", "같은 번호로 묶기", "기준표 전체 활성화", "복사", "재발급", "삭제"]) {
      assert(result.buttonLabels.includes(label), `admin action button missing: ${label}`);
    }
    for (const label of ["코드 발급", "같은 번호로 묶기", "기준표 전체 활성화", "복사", "재발급", "삭제"]) {
      assert(result.disabledControlLabels.includes(label), `read-only local mode should disable: ${label}`);
    }
    assert(result.hasIdayeon, "current roster student 이다연 missing");
    assert(result.hasHanSiblings, "sibling students 한보윤/한보리 missing");
    assert(!result.hasRemovedKimSiyul, "removed student 김시율 must not appear");
    assert(result.referenceRowCount === 0 || result.hasReferenceWarning, "reference-only rows need an activation warning");
    assert(
      result.referenceCopyStates.every(Boolean),
      "copy buttons for reference-only rows must be disabled",
    );

    pass(`admin roster rendered (${result.rowCount} rows)`);
    if (result.referenceRowCount > 0) {
      pass(`reference-only rows require activation and have disabled copy buttons (${result.referenceRowCount} rows)`);
    } else {
      pass("no reference-only rows found");
    }
    pass("parent admin UI check complete");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.log(`[FAIL] ${error.message}`);
  process.exitCode = 1;
});
