/**
 * GitHub star prompt utility.
 * Shows a one-time prompt asking the user to star the repo.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createInterface } from "readline";

const STAR_STATE_DIR = join(homedir(), ".hwpx-ts");
const STAR_STATE_FILE = join(STAR_STATE_DIR, ".star-prompted");
const REPO_URL = "https://github.com/ubermensch1218/hwpx-ts";

function hasBeenPrompted(): boolean {
  try {
    return existsSync(STAR_STATE_FILE);
  } catch {
    return false;
  }
}

function markPrompted(): void {
  try {
    if (!existsSync(STAR_STATE_DIR)) {
      mkdirSync(STAR_STATE_DIR, { recursive: true });
    }
    writeFileSync(STAR_STATE_FILE, new Date().toISOString(), "utf-8");
  } catch {
    // Silent fail — non-critical
  }
}

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function openUrl(url: string): Promise<void> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    const platform = process.platform;
    if (platform === "darwin") {
      await execAsync(`open "${url}"`);
    } else if (platform === "win32") {
      await execAsync(`start "" "${url}"`);
    } else {
      await execAsync(`xdg-open "${url}"`);
    }
  } catch {
    // If open fails, user can still copy the URL from the output
  }
}

/**
 * Prompt the user to star the GitHub repo (once only).
 * Call this after a successful CLI operation.
 */
export async function promptStar(): Promise<void> {
  // Only prompt in interactive terminals, and only once
  if (!process.stdin.isTTY || hasBeenPrompted()) {
    return;
  }

  console.log(`\n  If hwpx-ts has been useful, a GitHub star helps others discover it!`);
  console.log(`  ${REPO_URL}\n`);

  const answer = await ask("  Open GitHub to star? (y/N) ");

  if (answer === "y" || answer === "yes") {
    await openUrl(REPO_URL);
    console.log("  Thanks for the support!\n");
  }

  // Mark as prompted regardless of answer — don't nag
  markPrompted();
}
