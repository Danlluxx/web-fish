#!/usr/bin/env node

const fs = require("node:fs/promises");
const sharp = require("sharp");
const path = require("node:path");
const convertHeic = require("heic-convert");

const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);

async function main() {
  const [, , inputPath, outputPath, qualityArg] = process.argv;

  if (!inputPath || !outputPath) {
    throw new Error("Usage: convert_image_to_webp.cjs <input> <output.webp> [quality]");
  }

  const quality = Number.parseInt(qualityArg ?? "86", 10);
  const normalizedQuality = Number.isFinite(quality) ? Math.min(100, Math.max(1, quality)) : 86;
  const inputExtension = path.extname(inputPath).toLowerCase();

  if (path.extname(outputPath).toLowerCase() !== ".webp") {
    throw new Error("Output path must use .webp extension.");
  }

  let sharpInput = inputPath;

  if (HEIC_EXTENSIONS.has(inputExtension)) {
    const inputBuffer = await fs.readFile(inputPath);
    const jpegBuffer = await convertHeic({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.9
    });

    sharpInput = Buffer.from(jpegBuffer);
  }

  await sharp(sharpInput)
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
