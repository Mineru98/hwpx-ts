/**
 * `hwpxtool init` — Quick-start project setup.
 * Installs hwpxcore, optionally configures MCP, and creates a starter example.
 */

import { execSync } from "child_process";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import { configureGlobalMcp } from "./mcp-config.js";
import { promptStar } from "./star.js";

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function detectPackageManager(): "pnpm" | "npm" | "yarn" | "bun" {
  if (existsSync("pnpm-lock.yaml")) return "pnpm";
  if (existsSync("bun.lockb") || existsSync("bun.lock")) return "bun";
  if (existsSync("yarn.lock")) return "yarn";
  return "npm";
}

const EXAMPLE_TS = `import { HwpxDocument, loadSkeletonHwpx } from "@ubermensch1218/hwpxcore";

async function main() {
  // Create a new HWPX document from the built-in template
  const doc = await HwpxDocument.open(loadSkeletonHwpx());

  // Add some content
  doc.addParagraph("Hello, HWPX!");
  doc.addParagraph("This document was created with hwpx-ts.");

  // Save
  const bytes = await doc.saveToBuffer();
  console.log(\`Created HWPX document: \${bytes.length} bytes\`);

  // To save to a file (Node.js):
  // await doc.saveToPath("./output.hwpx");

  doc.close();
}

main().catch(console.error);
`;

export interface InitOptions {
  skipInstall?: boolean;
  skipMcp?: boolean;
  skipExample?: boolean;
  yes?: boolean;
}

export async function handleInit(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  console.log("hwpx-ts project setup\n");

  // 1. Install hwpxcore
  if (!options.skipInstall) {
    const pm = detectPackageManager();
    const installCmd = pm === "yarn" ? "yarn add" : `${pm} install`;
    const fullCmd = `${installCmd} @ubermensch1218/hwpxcore`;

    let doInstall = true;
    if (!options.yes) {
      const answer = await ask(`Install @ubermensch1218/hwpxcore with ${pm}? (Y/n) `);
      doInstall = answer !== "n" && answer !== "no";
    }

    if (doInstall) {
      console.log(`\nRunning: ${fullCmd}`);
      try {
        execSync(fullCmd, { stdio: "inherit", cwd });
        console.log("Installed successfully.\n");
      } catch {
        console.error("Installation failed. You can install manually later.\n");
      }
    }
  }

  // 2. Configure MCP for Claude Code
  if (!options.skipMcp) {
    let doMcp = true;
    if (!options.yes) {
      const answer = await ask("Configure HWPX MCP server for Claude Code? (Y/n) ");
      doMcp = answer !== "n" && answer !== "no";
    }

    if (doMcp) {
      try {
        configureGlobalMcp();
      } catch {
        console.error("MCP configuration failed. Run `hwpxtool mcp-config` to retry.\n");
      }
    }
  }

  // 3. Create example file
  if (!options.skipExample) {
    const examplePath = join(cwd, "hwpx-example.ts");

    let doExample = true;
    if (!options.yes) {
      const answer = await ask("Create starter example file (hwpx-example.ts)? (Y/n) ");
      doExample = answer !== "n" && answer !== "no";
    }

    if (doExample) {
      if (existsSync(examplePath)) {
        console.log("hwpx-example.ts already exists, skipping.\n");
      } else {
        writeFileSync(examplePath, EXAMPLE_TS, "utf-8");
        console.log("Created hwpx-example.ts\n");
      }
    }
  }

  console.log("Setup complete! Get started:\n");
  console.log("  import { HwpxDocument } from '@ubermensch1218/hwpxcore';\n");

  // 4. Star prompt
  await promptStar();
}
