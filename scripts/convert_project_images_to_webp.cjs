#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const PROJECT_ROOT = process.cwd();
const TARGET_DIRS = [
  "public/images/home",
  "public/images/products",
  "storage/product-images",
];
const TARGET_FILES = [
  "public/images/branding/vs-o-rybkah-logo.jpg",
];
const MANIFEST_FILES = [
  "data/product-media.generated.json",
  "storage/current-product-media.generated.json",
];
const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function walkImages(directoryPath, result) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      await walkImages(fullPath, result);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (SOURCE_EXTENSIONS.has(extension)) {
      result.push(fullPath);
    }
  }
}

async function collectImageFiles() {
  const results = [];

  for (const relativeDir of TARGET_DIRS) {
    const absoluteDir = path.join(PROJECT_ROOT, relativeDir);

    if (!(await pathExists(absoluteDir))) {
      continue;
    }

    await walkImages(absoluteDir, results);
  }

  for (const relativeFile of TARGET_FILES) {
    const absoluteFile = path.join(PROJECT_ROOT, relativeFile);

    if (await pathExists(absoluteFile)) {
      results.push(absoluteFile);
    }
  }

  return [...new Set(results)].sort();
}

async function convertFileToWebp(sourcePath) {
  const targetPath = sourcePath.replace(/\.(png|jpe?g)$/i, ".webp");

  await sharp(sourcePath)
    .rotate()
    .webp({
      quality: 86,
      effort: 6
    })
    .toFile(targetPath);

  await fs.unlink(sourcePath);

  return {
    sourcePath,
    targetPath
  };
}

function rewriteManifestPaths(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => rewriteManifestPaths(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, rewriteManifestPaths(entry)])
    );
  }

  if (typeof value === "string") {
    return value.replace(/\.(png|jpe?g)(?=$|\?)/gi, ".webp");
  }

  return value;
}

async function updateManifest(manifestRelativePath) {
  const manifestPath = path.join(PROJECT_ROOT, manifestRelativePath);

  if (!(await pathExists(manifestPath))) {
    return false;
  }

  const raw = await fs.readFile(manifestPath, "utf-8");
  const parsed = JSON.parse(raw);
  const nextValue = rewriteManifestPaths(parsed);

  await fs.writeFile(manifestPath, `${JSON.stringify(nextValue, null, 2)}\n`, "utf-8");
  return true;
}

async function main() {
  const imageFiles = await collectImageFiles();

  let convertedCount = 0;

  for (const filePath of imageFiles) {
    await convertFileToWebp(filePath);
    convertedCount += 1;
  }

  let manifestCount = 0;

  for (const manifestPath of MANIFEST_FILES) {
    const updated = await updateManifest(manifestPath);

    if (updated) {
      manifestCount += 1;
    }
  }

  console.log(`Converted ${convertedCount} images to WebP.`);
  console.log(`Updated ${manifestCount} manifest files.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
