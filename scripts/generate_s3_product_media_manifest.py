#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


ARTICLE_PATTERN = re.compile(r"[\[(]([A-ZА-ЯЁa-zа-яё]{1,4}\s?\d{2,})[\])]\s*$")
DIRECT_ARTICLE_PATTERN = re.compile(r"^[A-ZА-ЯЁa-zа-яё]{1,4}\s?\d{2,}$")
SUPPORTED_IMAGE_EXTENSIONS = {".webp", ".jpg", ".jpeg", ".png"}
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


def normalize_spaces(value: str) -> str:
    return " ".join(value.split())


def normalize_article(value: str) -> str:
    return normalize_spaces(value).upper().replace(" ", "")


def extract_article(value: str) -> str | None:
    cleaned = normalize_spaces(value).strip()

    if DIRECT_ARTICLE_PATTERN.fullmatch(cleaned):
        return normalize_article(cleaned)

    match = ARTICLE_PATTERN.search(cleaned)

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


def natural_sort_key(path: Path) -> list[tuple[int, int | str]]:
    parts = re.split(r"(\d+)", path.name)
    key: list[tuple[int, int | str]] = []

    for part in parts:
        if not part:
            continue

        key.append((0, int(part)) if part.isdigit() else (1, part.casefold()))

    return key


def iter_image_files(folder: Path) -> list[Path]:
    return sorted(
        (
            item
            for item in folder.iterdir()
            if item.is_file() and item.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
        ),
        key=natural_sort_key,
    )


def build_manifest(source_dir: Path, base_url: str, source_display_name: str) -> dict[str, object]:
    articles: dict[str, list[str]] = {}
    normalized_base_url = base_url.rstrip("/")

    for folder in sorted(
        (item for item in source_dir.iterdir() if item.is_dir()),
        key=lambda item: item.name.casefold(),
    ):
        article = extract_article(folder.name)

        if not article:
            continue

        files = iter_image_files(folder)

        if not files:
            continue

        article_slug = article_to_slug(article)
        articles[article] = [
            f"{normalized_base_url}/{article_slug}/{index}{file_path.suffix.lower()}"
            for index, file_path in enumerate(files, start=1)
        ]

    photo_count = sum(len(paths) for paths in articles.values())

    return {
        "meta": {
            "sourceFileName": source_display_name,
            "importedAt": datetime.now(ZoneInfo("Asia/Novosibirsk")).isoformat(timespec="seconds"),
            "articleCount": len(articles),
            "photoCount": photo_count,
        },
        "articles": dict(sorted(articles.items())),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate product photo manifest with S3/CDN URLs."
    )
    parser.add_argument("source", help="Local folder with article photo directories.")
    parser.add_argument("--base-url", required=True, help="Public S3/CDN base URL for article folders.")
    parser.add_argument(
        "--output",
        default="storage/current-product-media.generated.json",
        help="Where to write the generated JSON manifest.",
    )
    parser.add_argument(
        "--source-display-name",
        default="S3 media library",
        help="Friendly source name saved in manifest metadata.",
    )
    args = parser.parse_args()

    source_dir = Path(args.source)

    if not source_dir.is_dir():
        raise SystemExit(f"Source folder not found: {source_dir}")

    manifest = build_manifest(
        source_dir=source_dir,
        base_url=args.base_url,
        source_display_name=args.source_display_name,
    )
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        f"Generated manifest for {manifest['meta']['photoCount']} photos / "
        f"{manifest['meta']['articleCount']} articles: {output_path}"
    )


if __name__ == "__main__":
    main()
