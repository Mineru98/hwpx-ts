import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HwpxDocument } from "@ubermensch1218/hwpxcore";
import { batchIndexHwpx } from "../src/indexing.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKELETON_PATH = resolve(__dirname, "..", "..", "hwpx-core", "assets", "Skeleton.hwpx");

async function createSampleHwpx(targetPath: string): Promise<void> {
  const skeletonBytes = new Uint8Array(await readFile(SKELETON_PATH));
  const doc = await HwpxDocument.open(skeletonBytes);
  doc.addParagraph("alpha beta gamma");
  doc.addParagraph("delta epsilon");
  const saved = await doc.save();
  await writeFile(targetPath, saved);
}

describe("batch index", () => {
  it("writes JSONL records for an input HWPX file", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "hwpx-index-test-"));
    const inputPath = join(workDir, "sample.hwpx");
    const outputPath = join(workDir, "index.jsonl");
    const statePath = `${outputPath}.state.json`;

    await createSampleHwpx(inputPath);

    const result = await batchIndexHwpx({
      inputPath,
      outputPath,
      format: "jsonl",
      chunkBy: "paragraph",
      maxChars: 16,
      includeEmpty: false,
      failFast: false,
      incremental: false,
      statePath,
    });

    const output = await readFile(outputPath, "utf-8");
    const lines = output.split("\n").filter(Boolean);

    expect(result.ok).toBe(true);
    expect(result.indexedFiles).toBe(1);
    expect(result.failedFiles).toBe(0);
    expect(result.chunkCount).toBe(lines.length);

    const first = JSON.parse(lines[0] ?? "{}") as { relativePath?: string; chunkBy?: string };
    expect(first.relativePath).toBe("sample.hwpx");
    expect(first.chunkBy).toBe("paragraph");
  });

  it("reuses unchanged files when incremental mode is enabled", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "hwpx-index-incremental-"));
    const inputPath = join(workDir, "sample.hwpx");
    const outputPath = join(workDir, "index.jsonl");
    const statePath = `${outputPath}.state.json`;

    await createSampleHwpx(inputPath);

    const first = await batchIndexHwpx({
      inputPath,
      outputPath,
      format: "jsonl",
      chunkBy: "paragraph",
      maxChars: 1200,
      includeEmpty: false,
      failFast: false,
      incremental: true,
      statePath,
    });

    const second = await batchIndexHwpx({
      inputPath,
      outputPath,
      format: "jsonl",
      chunkBy: "paragraph",
      maxChars: 1200,
      includeEmpty: false,
      failFast: false,
      incremental: true,
      statePath,
    });

    expect(first.ok).toBe(true);
    expect(first.indexedFiles).toBe(1);
    expect(first.skippedFiles).toBe(0);

    expect(second.ok).toBe(true);
    expect(second.indexedFiles).toBe(0);
    expect(second.skippedFiles).toBe(1);
    expect(second.failedFiles).toBe(0);
    expect(second.chunkCount).toBe(first.chunkCount);
  });
});
