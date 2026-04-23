#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Iterable
from zoneinfo import ZoneInfo


ARTICLE_PATTERN = re.compile(r"[\[(]([A-ZА-ЯЁa-zа-яё]{1,4}\s?\d{2,})[\])]\s*$")
DIRECT_ARTICLE_PATTERN = re.compile(r"^[A-ZА-ЯЁa-zа-яё]{1,4}\s?\d{2,}$")
HEIC_EXTENSIONS = {".heic", ".heif"}
SUPPORTED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", *HEIC_EXTENSIONS}
CYRILLIC_TO_LATIN = {
    "А": "a",
    "Б": "b",
    "В": "v",
    "Г": "g",
    "Д": "d",
    "Е": "e",
    "Ё": "e",
    "Ж": "zh",
    "З": "z",
    "И": "i",
    "Й": "y",
    "К": "k",
    "Л": "l",
    "М": "m",
    "Н": "n",
    "О": "o",
    "П": "p",
    "Р": "r",
    "С": "s",
    "Т": "t",
    "У": "u",
    "Ф": "f",
    "Х": "h",
    "Ц": "ts",
    "Ч": "ch",
    "Ш": "sh",
    "Щ": "sch",
    "Ъ": "",
    "Ы": "y",
    "Ь": "",
    "Э": "e",
    "Ю": "yu",
    "Я": "ya",
}


def repair_mojibake(value: str) -> str:
    try:
        repaired = value.encode("cp437").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return value

    return repaired


def normalize_spaces(value: str) -> str:
    return " ".join(value.split())


def normalize_article(value: str) -> str:
    return normalize_spaces(value).upper().replace(" ", "")


def extract_article(value: str) -> str | None:
    repaired_value = repair_mojibake(value)
    cleaned = normalize_spaces(repaired_value).strip()

    if DIRECT_ARTICLE_PATTERN.fullmatch(cleaned):
        return normalize_article(cleaned)

    match = ARTICLE_PATTERN.search(repaired_value)

    if not match:
        return None

    return normalize_article(match.group(1))


def article_to_slug(article: str) -> str:
    result: list[str] = []

    for character in article:
        if character.isdigit():
            result.append(character)
            continue

        result.append(CYRILLIC_TO_LATIN.get(character, character.lower()))

    return "".join(result)


def normalize_display_filename(value: str) -> str:
    cleaned = normalize_spaces(Path(value).name)
    return cleaned or "product-photos.zip"


def natural_sort_key(path: Path) -> list[tuple[int, int | str]]:
    parts = re.split(r"(\d+)", path.name)
    key: list[tuple[int, int | str]] = []

    for part in parts:
        if not part:
            continue

        if part.isdigit():
            key.append((0, int(part)))
        else:
            key.append((1, part.casefold()))

    return key


def iter_image_files(folder: Path) -> Iterable[Path]:
    return sorted(
        (
            item
            for item in folder.iterdir()
            if item.is_file() and item.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
        ),
        key=natural_sort_key,
    )


def convert_heic_to_jpeg(source: Path, destination: Path) -> None:
    node_helper = Path(__file__).with_name("convert_heic_to_jpeg.cjs")

    if shutil.which("node") and node_helper.exists():
        subprocess.run(
            ["node", str(node_helper), str(source), str(destination)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    if shutil.which("sips"):
        subprocess.run(
            ["sips", "-s", "format", "jpeg", str(source), "--out", str(destination)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    if shutil.which("magick"):
        subprocess.run(
            ["magick", str(source), str(destination)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    if shutil.which("convert"):
        subprocess.run(
            ["convert", str(source), str(destination)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    if shutil.which("ffmpeg"):
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(source), str(destination)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    raise RuntimeError(
        f"Photo {source.name} is in HEIC/HEIF, but no converter was found (sips, magick, convert, ffmpeg)."
    )


def resolve_source_root(source_dir: Path) -> Path:
    children = [item for item in source_dir.iterdir() if item.name != "__MACOSX"]

    if len(children) == 1 and children[0].is_dir():
        return children[0]

    return source_dir


def build_manifest(
    source_dir: Path,
    output_dir: Path,
    base_url: str,
    source_display_name: str | None = None,
) -> dict[str, object]:
    articles: dict[str, list[str]] = {}
    normalized_base_url = base_url.rstrip("/")
    source_root = resolve_source_root(source_dir)

    for folder in sorted((item for item in source_root.iterdir() if item.is_dir()), key=lambda item: item.name.casefold()):
        article = extract_article(folder.name)

        if not article:
            continue

        files = list(iter_image_files(folder))

        if not files:
            continue

        article_slug = article_to_slug(article)
        article_output_dir = output_dir / article_slug
        article_output_dir.mkdir(parents=True, exist_ok=True)

        urls: list[str] = []

        for index, file_path in enumerate(files, start=1):
            extension = file_path.suffix.lower() or ".png"

            if extension in HEIC_EXTENSIONS:
                extension = ".jpg"

            output_file = article_output_dir / f"{index}{extension}"

            if file_path.suffix.lower() in HEIC_EXTENSIONS:
                convert_heic_to_jpeg(file_path, output_file)
            else:
                shutil.copy2(file_path, output_file)

            urls.append(f"{normalized_base_url}/{article_slug}/{index}{extension}")

        articles[article] = urls

    photo_count = sum(len(paths) for paths in articles.values())

    return {
        "meta": {
            "sourceFileName": normalize_display_filename(source_display_name or source_dir.name),
            "importedAt": datetime.now(ZoneInfo("Asia/Novosibirsk")).isoformat(timespec="seconds"),
            "articleCount": len(articles),
            "photoCount": photo_count,
        },
        "articles": dict(sorted(articles.items())),
    }


def with_source_directory(source: Path) -> tuple[Path, tempfile.TemporaryDirectory[str] | None]:
    if source.is_dir():
        return source, None

    if source.is_file() and source.suffix.lower() == ".zip":
        temp_dir = tempfile.TemporaryDirectory()

        with zipfile.ZipFile(source) as archive:
            archive.extractall(temp_dir.name)

        return Path(temp_dir.name), temp_dir

    raise SystemExit(f"Source path must be a directory or .zip archive: {source}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import product photos sorted by article.")
    parser.add_argument("source", nargs="?", default="1AquaMarketPhotos", help="Source folder or .zip archive with article photo directories.")
    parser.add_argument(
        "--output-dir",
        default="public/images/products/articles",
        help="Public directory where normalized product photos will be copied.",
    )
    parser.add_argument(
        "--manifest-path",
        default="data/product-media.generated.json",
        help="Where to save the generated photo manifest JSON.",
    )
    parser.add_argument(
        "--base-url",
        default="/images/products/articles",
        help="Public base URL for generated photo links.",
    )
    parser.add_argument(
        "--source-display-name",
        default=None,
        help="Friendly source file name stored in manifest metadata.",
    )
    args = parser.parse_args()

    source_dir = Path(args.source)
    output_dir = Path(args.output_dir)
    manifest_path = Path(args.manifest_path)

    if not source_dir.exists():
        raise SystemExit(f"Source directory not found: {source_dir}")

    if output_dir.exists():
        shutil.rmtree(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    resolved_source_dir, temp_dir = with_source_directory(source_dir)

    try:
        manifest = build_manifest(
            source_dir=resolved_source_dir,
            output_dir=output_dir,
            base_url=args.base_url,
            source_display_name=args.source_display_name or source_dir.name,
        )
    finally:
        if temp_dir is not None:
            temp_dir.cleanup()

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Imported {manifest['meta']['photoCount']} photos for {manifest['meta']['articleCount']} articles.")
    print(f"Manifest saved to {manifest_path}")


if __name__ == "__main__":
    main()
