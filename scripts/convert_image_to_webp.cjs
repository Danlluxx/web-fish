#!/usr/bin/env node

const sharp = require("sharp");
const path = require("node:path");

async function main() {
  const [, , inputPath, outputPath, qualityArg] = process.argv;

  if (!inputPath || !outputPath) {
    throw new Error("Usage: convert_image_to_webp.cjs <input> <output.webp> [quality]");
  }

  const quality = Number.parseInt(qualityArg ?? "86", 10);
  const normalizedQuality = Number.isFinite(quality) ? Math.min(100, Math.max(1, quality)) : 86;

  if (path.extname(outputPath).toLowerCase() !== ".webp") {
    throw new Error("Output path must use .webp extension.");
  }

  await sharp(inputPath)
    .rotate()
    .webp({
      quality: normalizedQuality,
      effort: 6
    })
    .toFile(outputPath);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
