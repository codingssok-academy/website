#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const DEFAULT_BASE = "http://localhost:3011";
const DEFAULT_NAME = "이다연";
const DEFAULT_PIN = "78202";

function parseArgs(argv) {
  const args = {
    base: process.env.PARENT_LOCAL_CHECK_BASE || DEFAULT_BASE,
    name: process.env.PARENT_LOCAL_CHECK_NAME || DEFAULT_NAME,
    pin: process.env.PARENT_LOCAL_CHECK_PIN || DEFAULT_PIN,
    skipBuild: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") args.base = argv[++index] || args.base;
    else if (arg === "--name") args.name = argv[++index] || args.name;
    else if (arg === "--pin") args.pin = argv[++index] || args.pin;
    else if (arg === "--skip-build") args.skipBuild = true;
    else if (arg === "--help") args.help = true;
  }

  args.base = args.base.replace(/\/+$/, "");
  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm.cmd run check:parent-release-local
  npm.cmd run check:parent-release-local -- --base http://localhost:3011
  npm.cmd run check:parent-release-local -- --skip-build

This expects the local web server to be running at the selected base URL.
`);
}

function bin(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

function run(label, command, args, options = {}) {
  console.log(`\n== ${label} ==`);
  const spawnCommand = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : command;
  const spawnArgs = process.platform === "win32" ? ["/d", "/s", "/c", command, ...args] : args;
  const result = spawnSync(spawnCommand, spawnArgs, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: { ...process.env, ...(options.env || {}) },
    shell: false,
  });

  if (result.error) {
    console.log(`[FAIL] ${label}: ${result.error.message}`);
    process.exit(result.status || 1);
  }

  if (result.status !== 0) {
    console.log(`[FAIL] ${label}: exit ${result.status}`);
    process.exit(result.status || 1);
  }

  console.log(`[OK] ${label}`);
}

async function assertLocalServer(base) {
  console.log(`\n== local server check ==`);
  try {
    const response = await fetch(`${base}/parent/feedback`);
    if (!response.ok) {
      throw new Error(`/parent/feedback status ${response.status}`);
    }
  } catch (error) {
    console.log(`[FAIL] local server check: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`Start the local server first, then rerun this command. Expected base: ${base}`);
    process.exit(1);
  }
  console.log(`[OK] local server reachable at ${base}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  console.log("Parent release local check");
  console.log(`base=${args.base}`);
  console.log(`student=${args.name}`);

  await assertLocalServer(args.base);

  run("eslint parent release files", bin("npx"), [
    "eslint",
    "scripts/parent-admin-ui-check.mjs",
    "scripts/parent-app-ui-check.mjs",
    "scripts/parent-release-audit.mjs",
    "scripts/parent-smoke-check.mjs",
    "src/app/teacher/admin/page.tsx",
    "src/components/sections/Curriculum.tsx",
    "src/components/sections/Pricing.tsx",
    "src/lib/__tests__/parent-code-reference.test.ts",
  ]);

  run("parent auth/code tests", bin("npx"), [
    "vitest",
    "run",
    "src/lib/__tests__/parent-code-reference.test.ts",
    "src/lib/__tests__/parent-code-rows.test.ts",
    "src/lib/__tests__/parent-client-auth.test.ts",
    "src/lib/__tests__/parent-auth.test.ts",
    "src/lib/__tests__/parent-session.test.ts",
  ]);

  run("TypeScript", bin("npx"), ["tsc", "--noEmit", "--pretty", "false"]);

  if (!args.skipBuild) {
    run("Next build", bin("npm"), ["run", "build"]);
  }

  run("AAB/TWA release audit", bin("npm"), ["run", "audit:parent-release"]);
  run("parent app UI", bin("npm"), ["run", "check:parent-app-ui", "--", "--base", args.base, "--name", args.name, "--pin", args.pin]);
  run("parent admin UI", bin("npm"), ["run", "check:parent-admin-ui", "--", "--base", args.base]);
  run("parent local smoke", bin("npm"), ["run", "smoke:parent", "--", "--base", args.base, "--mode", "local"], {
    env: {
      PARENT_SMOKE_NAME: args.name,
      PARENT_SMOKE_PIN: args.pin,
    },
  });

  console.log("\n[OK] parent release local check complete");
}

main().catch((error) => {
  console.log(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
