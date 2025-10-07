#!/usr/bin/env node
import { spawn } from "node:child_process";
import process from "node:process";

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });

const main = async () => {
  await run("pnpm", ["exec", "playwright", "install", "chromium"]);

  if (process.platform === "linux") {
    await run("pnpm", ["exec", "playwright", "install-deps", "chromium"]);
    return;
  }

  console.log(
    "Skipping Playwright system dependency installation on non-Linux platforms.",
  );
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
