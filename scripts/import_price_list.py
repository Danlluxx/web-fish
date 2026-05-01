#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import OrderedDict
from datetime import datetime
from pathlib import Path, PurePosixPath
from zoneinfo import ZoneInfo


NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

CATEGORY_STYLE_IDS = {"4", "8", "9", "13", "15", "16", "17", "18", "20"}
SUBCATEGORY_STYLE_IDS = {"6", "10", "11"}

TRANSLIT_MAP = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "j",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "c",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
}

CATEGORY_DESCRIPTIONS = {
    "Рыбы": "Каталог аквариумных рыб с делением по видам и группам для быстрого поиска нужной позиции.",
    "Амфибии": "Каталог аквариумных амфибий.",
    "Беспозвоночные": "Крабы, креветки, раки и улитки.",
    "Растения": "Каталог аквариумных растений."
}

TOP_LEVEL_CATEGORY_TITLES = set(CATEGORY_DESCRIPTIONS.keys())


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def transliterate(value: str) -> str:
    result: list[str] = []
    for char in value.lower():
        result.append(TRANSLIT_MAP.get(char, char))
    return "".join(result)


def slugify(value: str) -> str:
    value = transliterate(value)
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-") or "item"


def extract_title_and_sheet(zip_file: zipfile.ZipFile) -> tuple[str, ET.Element]:
    rels = ET.fromstring(zip_file.read("xl/_rels/workbook.xml.rels"))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("pkgrel:Relationship", NS)
    }
    workbook = ET.fromstring(zip_file.read("xl/workbook.xml"))
    sheet = workbook.find("main:sheets", NS)[0]
    target = rel_map[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
    workbook_path = PurePosixPath("xl/workbook.xml")

    if target.startswith("/"):
        resolved_target = PurePosixPath(target.lstrip("/"))
    else:
        resolved_target = workbook_path.parent / target

    return sheet.attrib["name"], ET.fromstring(zip_file.read(str(resolved_target)))


def load_shared_strings(zip_file: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zip_file.namelist():
        return []

    root = ET.fromstring(zip_file.read("xl/sharedStrings.xml"))
    shared_strings: list[str] = []
    for item in root.findall("main:si", NS):
        shared_strings.append("".join(text.text or "" for text in item.iterfind(".//main:t", NS)))
    return shared_strings


def get_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value_node = cell.find("main:v", NS)

    if cell_type == "inlineStr":
        return "".join(text.text or "" for text in cell.iterfind(".//main:t", NS))

    if value_node is None:
        return ""

    value = value_node.text or ""
    if cell_type == "s":
        index = int(value)
        return shared_strings[index] if index < len(shared_strings) else value

    return value


def category_description(title: str) -> str:
    return CATEGORY_DESCRIPTIONS.get(
        title,
        f"Раздел «{title}» в каталоге AquaMarket с компактной навигацией и быстрым переходом к карточкам товаров.",
    )


def subcategory_description(title: str, category: str) -> str:
    if title == category:
        return f"Позиции раздела «{category}», сгруппированные в отдельную подборку для удобного просмотра."
    return f"Подкатегория «{title}» внутри раздела «{category}» с сохранением названий из Excel-прайса."


def build_tags(title: str, category: str, subcategory: str) -> list[str]:
    tags = OrderedDict()
    tags[subcategory] = True

    size_match = re.search(r"\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*см", title, re.IGNORECASE)
    if size_match:
        tags[normalize_spaces(size_match.group(0))] = True

    for marker in re.findall(r"\[([^\]]+)\]", title):
        tags[normalize_spaces(marker)] = True

    if subcategory != category:
        tags[category] = True

    return list(tags.keys())[:4]


def build_keywords(title: str, category: str, subcategory: str) -> list[str]:
    keywords = OrderedDict()
    for value in [category, subcategory, "AquaMarket", "аквариум", "каталог", "прайс-лист"]:
        keywords[value] = True

    for marker in re.findall(r"\[([^\]]+)\]", title):
        keywords[normalize_spaces(marker)] = True

    size_match = re.search(r"\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*см", title, re.IGNORECASE)
    if size_match:
        keywords[normalize_spaces(size_match.group(0))] = True

    first_words = title.split()[:3]
    if first_words:
        keywords[" ".join(first_words)] = True

    return list(keywords.keys())


def build_summary(title: str, category: str, subcategory: str) -> str:
    return f"Позиция «{title}» в разделе «{category}» и подкатегории «{subcategory}»."


def build_description(title: str, category: str, subcategory: str) -> str:
    return (
        f"Позиция «{title}» относится к категории «{category}» "
        f"и подкатегории «{subcategory}». "
        "Название совпадает с названием в прайс-листе."
    )


def parse_price(value: str) -> int | None:
    normalized = normalize_spaces(value).replace(" ", "").replace(",", ".")

    if not normalized:
        return None

    try:
        numeric = float(normalized)
    except ValueError:
        return None

    return int(round(numeric))


def extract_article(title: str) -> str | None:
    matches = re.findall(r"[\[(]([A-ZА-ЯЁ]{1,4}\s?\d{2,})[\])]", title)

    if not matches:
        return None

    return normalize_spaces(matches[-1])


def normalize_display_filename(value: str) -> str:
    cleaned = normalize_spaces(Path(value).name)
    return cleaned or "price-list.xlsx"


def parse_catalog(source: Path, source_display_name: str | None = None) -> dict:
    with zipfile.ZipFile(source) as zip_file:
        shared_strings = load_shared_strings(zip_file)
        _, sheet_root = extract_title_and_sheet(zip_file)

        rows = sheet_root.findall(".//main:sheetData/main:row", NS)
        current_category: str | None = None
        current_subcategory: str | None = None
        catalog_title = source.stem
        sections: OrderedDict[str, OrderedDict[str, object]] = OrderedDict()
        products: list[dict] = []
        slug_counts: dict[str, int] = {}

        for row in rows:
            row_number = int(row.attrib["r"])
            cells = row.findall("main:c", NS)
            values = [normalize_spaces(get_cell_value(cell, shared_strings)) for cell in cells]

            while len(values) < 5:
                values.append("")

            first, second, third, *_ = values[:5]
            style = cells[0].attrib.get("s") if cells else None
            nonempty = [value for value in values if value]

            if row_number == 1 and first:
                catalog_title = first
                continue

            if row_number <= 2 or not nonempty:
                continue

            if len(nonempty) == 1:
                is_known_top_level_category = first in TOP_LEVEL_CATEGORY_TITLES
                is_legacy_category_row = style in CATEGORY_STYLE_IDS and first and current_category is None

                if is_known_top_level_category or is_legacy_category_row:
                    current_category = first
                    current_subcategory = None
                    sections.setdefault(
                        current_category,
                        OrderedDict(
                            title=current_category,
                            slug=slugify(current_category),
                            description=category_description(current_category),
                            subcategories=OrderedDict(),
                        ),
                    )
                elif first and current_category:
                    current_subcategory = first
                    section = sections.setdefault(
                        current_category,
                        OrderedDict(
                            title=current_category,
                            slug=slugify(current_category),
                            description=category_description(current_category),
                            subcategories=OrderedDict(),
                        ),
                    )
                    subcategories = section["subcategories"]
                    assert isinstance(subcategories, OrderedDict)
                    subcategories.setdefault(
                        current_subcategory,
                        OrderedDict(
                            title=current_subcategory,
                            slug=slugify(current_subcategory),
                            description=subcategory_description(current_subcategory, current_category),
                        ),
                    )
                continue

            if not second:
                continue

            category = current_category or first or "Каталог"
            subcategory = first or current_subcategory or category

            section = sections.setdefault(
                category,
                OrderedDict(
                    title=category,
                    slug=slugify(category),
                    description=category_description(category),
                    subcategories=OrderedDict(),
                ),
            )
            subcategories = section["subcategories"]
            assert isinstance(subcategories, OrderedDict)
            subcategories.setdefault(
                subcategory,
                OrderedDict(
                    title=subcategory,
                    slug=slugify(subcategory),
                    description=subcategory_description(subcategory, category),
                ),
            )

            section_slug = str(section["slug"])
            subcategory_slug = str(subcategories[subcategory]["slug"])
            article = extract_article(second)
            base_slug_parts = [section_slug]
            if subcategory != category:
                base_slug_parts.append(subcategory_slug)
            base_slug_parts.append(slugify(second))
            base_slug = "-".join(part for part in base_slug_parts if part)
            slug_counts[base_slug] = slug_counts.get(base_slug, 0) + 1
            slug = base_slug if slug_counts[base_slug] == 1 else f"{base_slug}-{slug_counts[base_slug]}"

            product_id = f"product-{len(products) + 1:04d}"
            products.append(
                {
                    "id": product_id,
                    "slug": slug,
                    "title": second,
                    "article": article,
                    "price": parse_price(third),
                    "category": category,
                    "categorySlug": section_slug,
                    "subcategory": subcategory,
                    "subcategorySlug": subcategory_slug,
                    "summary": build_summary(second, category, subcategory),
                    "description": build_description(second, category, subcategory),
                    "tags": build_tags(second, category, subcategory),
                    "keywords": build_keywords(second, category, subcategory)
                    + ([article] if article else []),
                    "updatedAt": datetime.now().date().isoformat(),
                }
            )

        serialized_sections = []
        for section in sections.values():
            subcategories = section["subcategories"]
            assert isinstance(subcategories, OrderedDict)
            serialized_sections.append(
                {
                    "title": section["title"],
                    "slug": section["slug"],
                    "description": section["description"],
                    "subcategories": list(subcategories.values()),
                }
            )

        return {
            "meta": {
                "catalogTitle": catalog_title,
                "sourceFileName": normalize_display_filename(source_display_name or source.name),
                "importedAt": datetime.now(ZoneInfo("Asia/Novosibirsk")).isoformat(timespec="seconds"),
                "productCount": len(products),
            },
            "sections": serialized_sections,
            "products": products,
        }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert an AquaMarket Excel price list into site-ready catalog JSON."
    )
    parser.add_argument("source", help="Path to the source .xlsx file")
    parser.add_argument(
        "--source-display-name",
        default=None,
        help="Original file name to keep in catalog metadata for UI display",
    )
    parser.add_argument(
        "--output",
        default="data/catalog.generated.json",
        help="Path to the generated JSON file inside the project",
    )
    parser.add_argument(
        "--copy-price-list-to",
        default="public/files/current-price.xlsx",
        help="Optional path to copy the original price list for public download",
    )
    args = parser.parse_args()

    source = Path(args.source).expanduser().resolve()
    if not source.exists():
        print(f"Source file not found: {source}", file=sys.stderr)
        return 1

    catalog = parse_catalog(source, args.source_display_name)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    if args.copy_price_list_to:
        copy_target = Path(args.copy_price_list_to)
        copy_target.parent.mkdir(parents=True, exist_ok=True)
        if source.resolve() != copy_target.resolve():
            shutil.copy2(source, copy_target)

    print(
        f"Imported {catalog['meta']['productCount']} products from {source.name} -> {output_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
