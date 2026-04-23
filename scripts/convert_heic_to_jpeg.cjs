#!/usr/bin/env node

const fs = require("node:fs/promises");
const convert = require("heic-convert");

async function main() {
  const [, , inputPath, outputPath] = process.argv;

  if (!inputPath || !outputPath) {
    throw new Error("Usage: convert_heic_to_jpeg.cjs <input.heic> <output.jpg>");
  }

  const inputBuffer = await fs.readFile(inputPath);
  const outputBuffer = await convert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 0.9
  });

  await fs.writeFile(outputPath, Buffer.from(outputBuffer));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
