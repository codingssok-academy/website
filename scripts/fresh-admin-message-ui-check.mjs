#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE_URL = (process.env.FRESH_MESSAGE_UI_BASE || "http://127.0.0.1:3011").replace(/\/+$/, "");
const CHROME_PATH = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SUPABASE_URL = "https://opcdcuedhwyuyhzaubpu.supabase.co";
const SUPABASE_AUTH_COOKIE = "sb-opcdcuedhwyuyhzaubpu-auth-token";
const STUDENT_NAME = "가짜화면학생";
const STUDENT_ID = "a0000000-0000-4000-8000-000000000001";
const STUDENT_AUTH_ID = "b1111111-1111-4111-8111-111111111111";
const STUDENT_EMAIL = `student_${STUDENT_ID}@codingssok.local`;
const STUDENT_PASSWORD = "cs_student_a0000000000040008000000000000001_2468";
const ADMIN_NAME = "가짜화면관리자";
const ADMIN_EMAIL = "ui-admin-roundtrip@invalid.local";
const ADMIN_PASSWORD = "UiAdminTest!2468";
const STUDENT_MESSAGE = "가짜 화면 왕복 질문입니다.";
const ADMIN_MESSAGE = "가짜 화면 왕복 답장입니다.";

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function pass(message) {
    console.log(`[OK] ${message}`);
}

async function bodyText(page) {
    return page.locator("body").innerText({ timeout: 10_000 });
}

function findPublishableKey(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            const nested = findPublishableKey(path);
            if (nested) return nested;
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            const match = readFileSync(path, "utf8").match(/sb_publishable_[A-Za-z0-9_-]+/);
            if (match) return match[0];
        }
    }
    return "";
}

function sessionCookieChunks(session) {
    const expiresAt = session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
    const value = `base64-${Buffer.from(JSON.stringify({ ...session, expires_at: expiresAt }), "utf8").toString("base64url")}`;
    if (value.length <= 3180) return [{ name: SUPABASE_AUTH_COOKIE, value }];

    const chunks = [];
    for (let offset = 0, index = 0; offset < value.length; offset += 3180, index += 1) {
        chunks.push({ name: `${SUPABASE_AUTH_COOKIE}.${index}`, value: value.slice(offset, offset + 3180) });
    }
    return chunks;
}

async function verifyLoginPageHydration(page) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /회원가입/ }).click();
    await page.getByText("학부모 인증번호", { exact: false }).first().waitFor({ state: "visible", timeout: 8_000 });
    pass("배포형 로컬 서버에서 로그인 화면 자바스크립트 작동");
}

async function installStudentSession(context, publishableKey) {
    const response = await context.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        headers: { apikey: publishableKey },
        data: { email: STUDENT_EMAIL, password: STUDENT_PASSWORD },
    });
    const session = await response.json();
    assert(response.ok(), `가짜 학생 인증 실패: ${response.status()}`);
    assert(session.access_token && session.refresh_token && session.user?.id === STUDENT_AUTH_ID, "가짜 학생 인증 응답이 올바르지 않습니다.");

    const secure = new URL(BASE_URL).protocol === "https:";
    await context.addCookies(sessionCookieChunks(session).map((cookie) => ({
        ...cookie,
        url: BASE_URL,
        httpOnly: false,
        secure,
        sameSite: "Lax",
        expires: Math.floor(Date.now() / 1000) + 3600,
    })));

    await context.addInitScript((profile) => {
        window.localStorage.setItem("codingssok_user", JSON.stringify(profile));
    }, {
        id: STUDENT_AUTH_ID,
        studentId: STUDENT_ID,
        name: STUDENT_NAME,
        email: STUDENT_EMAIL,
        role: "student",
        school: "가짜테스트초등학교",
        grade: "1학년",
        level: 1,
        xp: 0,
        streak: 0,
        joinedAt: new Date().toISOString(),
    });

    pass("가짜 학생 인증 세션을 시험 Chrome에만 준비");
}

async function sendStudentQuestion(page) {
    await page.goto(`${BASE_URL}/dashboard/learning/dm`, { waitUntil: "networkidle" });
    const adminButton = page.getByRole("button", { name: new RegExp(ADMIN_NAME) });
    await adminButton.waitFor({ state: "visible", timeout: 15_000 });
    await adminButton.click();

    const input = page.getByRole("textbox", { name: "선생님께 보낼 질문" });
    await input.fill(STUDENT_MESSAGE);
    await page.getByRole("button", { name: "질문 보내기" }).click();
    await page.getByText(STUDENT_MESSAGE, { exact: true }).waitFor({ state: "visible", timeout: 12_000 });
    pass("학생 질문 전송 및 화면 표시");
}

async function loginAsAdmin(page) {
    await page.goto(`${BASE_URL}/teacher/login`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname.startsWith("/teacher/admin"), { timeout: 15_000 });
    pass("가짜 관리자 화면 로그인");
}

async function replyAsAdmin(page) {
    await page.goto(`${BASE_URL}/teacher/admin/chat`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "1:1 학생 질문" }).waitFor({ state: "visible", timeout: 15_000 });

    const studentButton = page.getByRole("button", { name: new RegExp(`${STUDENT_NAME} 학생과의 대화`) });
    await studentButton.waitFor({ state: "visible", timeout: 15_000 });
    await studentButton.click();
    await page.getByText(STUDENT_MESSAGE, { exact: true }).waitFor({ state: "visible", timeout: 12_000 });

    const input = page.getByRole("textbox", { name: "학생에게 보낼 답장" });
    await input.fill(ADMIN_MESSAGE);
    await page.getByRole("button", { name: "답장 보내기" }).click();
    await page.getByText(ADMIN_MESSAGE, { exact: true }).waitFor({ state: "visible", timeout: 12_000 });
    pass("관리자 질문 확인 및 답장 전송");
}

async function verifyStudentReply(page) {
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText(ADMIN_MESSAGE, { exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    pass("학생 화면에서 관리자 답장 확인");
}

async function main() {
    assert(existsSync(CHROME_PATH), `Google Chrome을 찾지 못했습니다: ${CHROME_PATH}`);
    const buildDirectory = join(process.cwd(), ".next", "server");
    assert(existsSync(buildDirectory), "먼저 npm run build를 실행해주세요.");
    const publishableKey = findPublishableKey(buildDirectory);
    assert(publishableKey.startsWith("sb_publishable_"), "시험 프로젝트의 공개 연결키를 빌드에서 찾지 못했습니다.");

    const browser = await chromium.launch({
        headless: true,
        executablePath: CHROME_PATH,
    });

    const browserErrors = [];
    try {
        const probeContext = await browser.newContext({ viewport: { width: 430, height: 900 } });
        const probePage = await probeContext.newPage();
        probePage.on("pageerror", (error) => browserErrors.push(`login: ${error.message}`));
        await verifyLoginPageHydration(probePage);
        await probeContext.close();

        const studentContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        await installStudentSession(studentContext, publishableKey);
        const studentPage = await studentContext.newPage();
        studentPage.on("pageerror", (error) => browserErrors.push(`student: ${error.message}`));

        await sendStudentQuestion(studentPage);

        const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const adminPage = await adminContext.newPage();
        adminPage.on("pageerror", (error) => browserErrors.push(`admin: ${error.message}`));

        await loginAsAdmin(adminPage);
        await replyAsAdmin(adminPage);
        await verifyStudentReply(studentPage);

        const studentText = await bodyText(studentPage);
        const adminText = await bodyText(adminPage);
        assert(studentText.includes(ADMIN_NAME), "학생 화면에 가짜 관리자 이름이 보이지 않습니다.");
        assert(adminText.includes(STUDENT_NAME), "관리자 화면에 가짜 학생 이름이 보이지 않습니다.");
        assert(browserErrors.length === 0, `브라우저 오류: ${browserErrors.join(" | ")}`);

        pass("가짜 학생 ↔ 관리자 실제 화면 왕복 검사 완료");
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.log(`[FAIL] ${error.message}`);
    process.exitCode = 1;
});
