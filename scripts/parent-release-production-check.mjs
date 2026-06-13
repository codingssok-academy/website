#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const DEFAULT_BASE = "https://codingssok-parent-app.vercel.app";

function parseArgs(argv) {
  const args = {
    base: process.env.PARENT_PRODUCTION_CHECK_BASE || DEFAULT_BASE,
    name: process.env.PARENT_PRODUCTION_CHECK_NAME || process.env.PARENT_SMOKE_NAME || "",
    pin: process.env.PARENT_PRODUCTION_CHECK_PIN || process.env.PARENT_SMOKE_PIN || "",
    includeUi: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") args.base = argv[++index] || args.base;
    else if (arg === "--name") args.name = argv[++index] || args.name;
    else if (arg === "--pin") args.pin = argv[++index] || args.pin;
    else if (arg === "--include-ui") args.includeUi = true;
    else if (arg === "--help") args.help = true;
  }

  args.base = args.base.replace(/\/+$/, "");
  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm.cmd run check:parent-release-production
  npm.cmd run check:parent-release-production -- --base https://codingssok-parent-app.vercel.app
  npm.cmd run check:parent-release-production -- --name 이다연 --pin 78202 --include-ui

The base smoke check verifies deployed manifests, service worker, parent app entry,
admin API exposure rules, and assetlinks. Pass --name/--pin to also verify live parent auth.
Pass --include-ui to run a real browser check after live parent auth is available.
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  console.log("Parent release production check");
  console.log(`base=${args.base}`);
  console.log(`auth=${args.name && args.pin ? `${args.name} / ${args.pin}` : "not provided"}`);

  run("production parent smoke", bin("npm"), ["run", "smoke:parent", "--", "--base", args.base, "--mode", "production"], {
    env: args.name && args.pin
      ? {
          PARENT_SMOKE_NAME: args.name,
          PARENT_SMOKE_PIN: args.pin,
        }
      : {},
  });

  if (args.includeUi) {
    if (!args.name || !args.pin) {
      console.log("[FAIL] production parent UI: --include-ui requires --name and --pin");
      process.exit(1);
    }
    run("production parent app UI", bin("npm"), [
      "run",
      "check:parent-app-ui",
      "--",
      "--base",
      args.base,
      "--name",
      args.name,
      "--pin",
      args.pin,
    ]);
  }

  console.log("\n[OK] parent release production check complete");
}

main();
