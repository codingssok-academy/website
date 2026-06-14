#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BASE = "https://codingssok.com";
const REQUIRED_CONFIRM_FLAG = "--i-understand-production-mutation";
const PIN_COURSE = "parent-pin";

function parseArgs(argv) {
  const args = {
    base: process.env.PARENT_E2E_BASE || DEFAULT_BASE,
    envFile: process.env.PARENT_E2E_ENV_FILE || ".env.local",
    execute: false,
    confirmed: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") args.base = argv[++index] || args.base;
    else if (arg === "--env-file") args.envFile = argv[++index] || args.envFile;
    else if (arg === "--execute") args.execute = true;
    else if (arg === REQUIRED_CONFIRM_FLAG) args.confirmed = true;
    else if (arg === "--help") args.help = true;
  }

  args.base = args.base.replace(/\/+$/, "");
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/parent-production-e2e.mjs
  node scripts/parent-production-e2e.mjs --base https://codingssok.com

Execute production mutation test:
  node scripts/parent-production-e2e.mjs --execute ${REQUIRED_CONFIRM_FLAG}

What execute mode does:
  1. Create a temporary Supabase Auth admin user and admin profile.
  2. Call production teacher parent-code API to issue a temporary student code.
  3. Verify parent auth/session works immediately.
  4. Reissue the code and verify the old session/PIN is rejected.
  5. Verify the new PIN works.
  6. Delete the code and verify the deleted PIN is rejected.
  7. Verify student account management API lists accounts.
  8. Delete all temporary Auth/Profile/Student/Progress rows in finally cleanup.

Default mode is dry-run and does not mutate production.
`);
}

function loadEnv(filePath) {
  let text = "";
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    return false;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const splitAt = trimmed.indexOf("=");
    if (splitAt < 0) continue;
    const key = trimmed.slice(0, splitAt).trim();
    let value = trimmed.slice(splitAt + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
  return true;
}

function getConfig(envFile) {
  loadEnv(resolve(process.cwd(), envFile));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { supabaseUrl, anonKey, serviceRoleKey };
}

function hasUsableServiceRoleKey(value) {
  return typeof value === "string" && value.length > 40 && value.split(".").length >= 3;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function base64Url(input) {
  return Buffer.from(input, "utf8").toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function readJson(url, init = {}) {
  const response = await fetch(url, init);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text for diagnostics
  }
  return {
    status: response.status,
    ok: response.ok,
    json,
    text,
    setCookie: response.headers.get("set-cookie") || "",
  };
}

function makeAdminCookie(supabaseUrl, session) {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  const cookieValue = `base64-${base64Url(JSON.stringify(session))}`;
  return `${storageKey}=${encodeURIComponent(cookieValue)}`;
}

function safeStatus(label, result) {
  return `${label}: status=${result.status} success=${Boolean(result.json?.success)}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const config = getConfig(args.envFile);
  const hasEnv = Boolean(config.supabaseUrl && config.anonKey && hasUsableServiceRoleKey(config.serviceRoleKey));

  console.log("Parent production E2E");
  console.log(`base=${args.base}`);
  console.log(`mode=${args.execute ? "execute" : "dry-run"}`);
  console.log(`env=${hasEnv ? "present" : "missing"}`);

  if (!args.execute) {
    console.log("[DRY-RUN] No production data will be changed.");
    console.log(`[DRY-RUN] To execute: node scripts/parent-production-e2e.mjs --execute ${REQUIRED_CONFIRM_FLAG}`);
    assert(args.base.startsWith("https://"), "Base URL must be https.");
    if (!hasEnv) {
      console.log("[DRY-RUN] Supabase service role is not available locally; execute mode will require it.");
    }
    console.log("[OK] dry-run passed");
    return;
  }

  assert(args.confirmed, `Refusing to mutate production without ${REQUIRED_CONFIRM_FLAG}`);
  assert(args.base === DEFAULT_BASE || args.base === "https://www.codingssok.com", "Execute mode is restricted to the production domain.");
  assert(hasEnv, "Supabase env is missing.");

  const suffix = crypto.randomBytes(4).toString("hex");
  const adminEmail = `codex-parent-e2e-${suffix}@codingssok.test`;
  const adminPassword = `Codex-${crypto.randomBytes(18).toString("base64url")}1!`;
  const studentName = `CodexE2E${suffix}`;
  const firstPin = String(10000 + crypto.randomInt(80000));
  let secondPin = "";
  let adminUserId = "";
  let studentId = "";
  let parentSessionCookie = "";

  const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const publicClient = createClient(config.supabaseUrl, config.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const created = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { purpose: "parent-production-e2e" },
    });
    if (created.error) throw created.error;
    adminUserId = created.data.user.id;

    const profile = await admin
      .from("profiles")
      .upsert(
        {
          id: adminUserId,
          email: adminEmail,
          role: "admin",
          name: "CodexParentE2EAdmin",
          display_name: "CodexParentE2EAdmin",
        },
        { onConflict: "id" },
      );
    if (profile.error) throw profile.error;

    const signed = await publicClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (signed.error || !signed.data.session) throw signed.error || new Error("temporary admin sign-in failed");
    const adminCookie = makeAdminCookie(config.supabaseUrl, signed.data.session);
    const adminHeaders = { "content-type": "application/json", cookie: adminCookie };

    const issue = await readJson(`${args.base}/api/teacher/parent-codes`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ name: studentName, pin: firstPin, className: "codex-e2e" }),
    });
    assert(issue.status === 200 && issue.json?.success === true, safeStatus("issue", issue));

    const afterIssue = await admin.from("students").select("id,pin,status").eq("name", studentName).maybeSingle();
    if (afterIssue.error) throw afterIssue.error;
    assert(afterIssue.data?.pin === firstPin, "issued PIN was not stored in students.pin");
    studentId = afterIssue.data.id;

    const parentAuth = await readJson(`${args.base}/api/parent/auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: studentName, pin: firstPin, studentName, parentPin: firstPin }),
    });
    assert(parentAuth.status === 200 && parentAuth.json?.success === true, safeStatus("parent auth after issue", parentAuth));
    parentSessionCookie = parentAuth.setCookie;
    assert(parentSessionCookie.includes("codingssok_parent_session"), "parent auth did not set parent session cookie");

    const validSession = await readJson(`${args.base}/api/parent/session?name=${encodeURIComponent(studentName)}`, {
      headers: { cookie: parentSessionCookie },
    });
    assert(validSession.status === 200 && validSession.json?.success === true, safeStatus("parent session after issue", validSession));

    const reissue = await readJson(`${args.base}/api/teacher/parent-codes`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({ name: studentName }),
    });
    assert(reissue.status === 200 && reissue.json?.success === true, safeStatus("reissue", reissue));

    const afterReissue = await admin.from("students").select("id,pin,status").eq("name", studentName).maybeSingle();
    if (afterReissue.error) throw afterReissue.error;
    secondPin = afterReissue.data?.pin || "";
    assert(/^\d{5}$/.test(secondPin) && secondPin !== firstPin, "PIN was not reissued");

    const staleSession = await readJson(`${args.base}/api/parent/session?name=${encodeURIComponent(studentName)}`, {
      headers: { cookie: parentSessionCookie },
    });
    assert([401, 403].includes(staleSession.status), `stale parent session still accepted: ${staleSession.status}`);

    const oldPin = await readJson(`${args.base}/api/parent/auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: studentName, pin: firstPin, studentName, parentPin: firstPin }),
    });
    assert(oldPin.status === 401, `old PIN still accepted after reissue: ${oldPin.status}`);

    const newPin = await readJson(`${args.base}/api/parent/auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: studentName, pin: secondPin, studentName, parentPin: secondPin }),
    });
    assert(newPin.status === 200 && newPin.json?.success === true, safeStatus("new PIN auth after reissue", newPin));

    const studentAccounts = await readJson(`${args.base}/api/teacher/student-accounts`, {
      headers: { cookie: adminCookie },
    });
    assert(studentAccounts.status === 200 && studentAccounts.json?.success === true && Array.isArray(studentAccounts.json.students), safeStatus("student accounts list", studentAccounts));

    const remove = await readJson(`${args.base}/api/teacher/parent-codes`, {
      method: "DELETE",
      headers: adminHeaders,
      body: JSON.stringify({ name: studentName }),
    });
    assert(remove.status === 200 && remove.json?.success === true, safeStatus("delete code", remove));

    const afterDelete = await admin.from("students").select("id,pin,status").eq("name", studentName).maybeSingle();
    if (afterDelete.error) throw afterDelete.error;
    assert(!afterDelete.data || !afterDelete.data.pin, "PIN still exists after delete");

    const deletedPin = await readJson(`${args.base}/api/parent/auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: studentName, pin: secondPin, studentName, parentPin: secondPin }),
    });
    assert(deletedPin.status === 401, `deleted PIN still accepted: ${deletedPin.status}`);

    console.log(JSON.stringify({
      ok: true,
      checks: [
        "temporary admin can access production teacher API",
        "parent code issue is immediately usable by parent portal",
        "parent session is valid while code is current",
        "reissue changes the code",
        "old session and old code are rejected after reissue",
        "new code is immediately usable",
        "student account management API is reachable",
        "deleted code is rejected by parent portal",
      ],
    }, null, 2));
  } finally {
    if (studentName) {
      try {
        if (studentId) await admin.from("study_progress").delete().eq("course_id", PIN_COURSE).eq("user_id", studentId);
      } catch {
        // Continue cleanup.
      }
      try {
        await admin.from("students").delete().eq("name", studentName);
      } catch {
        // Continue cleanup.
      }
    }
    if (adminUserId) {
      try {
        await admin.from("profiles").delete().eq("id", adminUserId);
      } catch {
        // Continue cleanup.
      }
      try {
        await admin.auth.admin.deleteUser(adminUserId);
      } catch {
        // Final cleanup best effort.
      }
    }
  }
}

main().catch((error) => {
  console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
