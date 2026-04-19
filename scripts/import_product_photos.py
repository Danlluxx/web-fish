#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path
from typing import Iterable


ARTICLE_PATTERN = re.compile(r"[\[(]([A-ZА-ЯЁa-zа-яё]{1,4}\s?\d{2,})[\])]\s*$")
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
    match = ARTICLE_PATTERN.search(value)

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

        if part.isdigit():
            key.append((0, int(part)))
        else:
            key.append((1, part.casefold()))

    return key


def iter_image_files(folder: Path) -> Iterable[Path]:
    return sorted(
        (item for item in folder.iterdir() if item.is_file() and item.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}),
        key=natural_sort_key,
    )


def build_manifest(source_dir: Path, output_dir: Path) -> dict[str, dict[str, list[str]]]:
    articles: dict[str, list[str]] = {}

    for folder in sorted((item for item in source_dir.iterdir() if item.is_dir()), key=lambda item: item.name.casefold()):
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
            output_file = article_output_dir / f"{index}{extension}"
            shutil.copy2(file_path, output_file)
            urls.append(f"/images/products/articles/{article_slug}/{index}{extension}")

        articles[article] = urls

    return {"articles": dict(sorted(articles.items()))}


def main() -> None:
    parser = argparse.ArgumentParser(description="Import product photos sorted by article.")
    parser.add_argument("source", nargs="?", default="1AquaMarketPhotos", help="Source folder with article photo directories.")
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

    manifest = build_manifest(source_dir=source_dir, output_dir=output_dir)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Imported {sum(len(paths) for paths in manifest['articles'].values())} photos for {len(manifest['articles'])} articles.")
    print(f"Manifest saved to {manifest_path}")


if __name__ == "__main__":
    main()
