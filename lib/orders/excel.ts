import { deflateRawSync } from "node:zlib";

import type { StoredOrder } from "@/types/order";

interface OrderSpreadsheetFile {
  content: Buffer;
  contentType: string;
  filename: string;
}

type CellType = "string" | "number";

interface SheetCell {
  column: number;
  value: string | number;
  type: CellType;
  style: number;
}

interface SheetRow {
  index: number;
  cells: SheetCell[];
}

interface ZipEntry {
  name: string;
  content: Buffer;
}

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function computeCrc32(content: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of content) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(entries: ZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf-8");
    const compressed = deflateRawSync(entry.content);
    const crc = computeCrc32(entry.content);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(entry.content.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(entry.content.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const centralOffset = offset;
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(centralOffset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function formatOrderDate(value: string): string {
  const date = new Date(value);

  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow"
  }).format(date);

  return `${formattedDate} МСК`;
}

function getWorksheetName(orderId: string): string {
  return `Заказ ${orderId}`.slice(0, 31);
}

function getColumnLetter(index: number): string {
  let value = index;
  let result = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }

  return result;
}

function buildInlineStringCell(cell: SheetCell, rowIndex: number): string {
  return `<c r="${getColumnLetter(cell.column)}${rowIndex}" s="${cell.style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(cell.value))}</t></is></c>`;
}

function buildNumberCell(cell: SheetCell, rowIndex: number): string {
  return `<c r="${getColumnLetter(cell.column)}${rowIndex}" s="${cell.style}"><v>${cell.value}</v></c>`;
}

function buildCellXml(cell: SheetCell, rowIndex: number): string {
  return cell.type === "number" ? buildNumberCell(cell, rowIndex) : buildInlineStringCell(cell, rowIndex);
}

function buildRowsXml(rows: SheetRow[]): string {
  return rows
    .map(
      (row) =>
        `<row r="${row.index}">${row.cells
          .sort((left, right) => left.column - right.column)
          .map((cell) => buildCellXml(cell, row.index))
          .join("")}</row>`
    )
    .join("");
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font>
      <sz val="10"/>
      <color rgb="FF1F2937"/>
      <name val="Arial"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="14"/>
      <color rgb="FF1F2937"/>
      <name val="Arial"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="10"/>
      <color rgb="FF1F2937"/>
      <name val="Arial"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="10"/>
      <color rgb="FFFFFFFF"/>
      <name val="Arial"/>
      <family val="2"/>
    </font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF3B82F6"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="4">
    <border>
      <left/><right/><top/><bottom/><diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FFE5E7EB"/></left>
      <right style="thin"><color rgb="FFE5E7EB"/></right>
      <top style="thin"><color rgb="FFE5E7EB"/></top>
      <bottom style="thin"><color rgb="FFE5E7EB"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FFD6E4FF"/></left>
      <right style="thin"><color rgb="FFD6E4FF"/></right>
      <top style="thin"><color rgb="FFD6E4FF"/></top>
      <bottom style="thin"><color rgb="FFD6E4FF"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FF3B82F6"/></left>
      <right style="thin"><color rgb="FF3B82F6"/></right>
      <top style="thin"><color rgb="FF3B82F6"/></top>
      <bottom style="thin"><color rgb="FF3B82F6"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <xf numFmtId="3" fontId="2" fillId="4" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`;
}

function buildWorkbookXml(sheetName: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;
}

function buildWorksheetXml(rows: SheetRow[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView workbookViewId="0"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>
    <col min="1" max="1" width="60" customWidth="1"/>
    <col min="2" max="2" width="12" customWidth="1"/>
    <col min="3" max="3" width="10" customWidth="1"/>
    <col min="4" max="4" width="14" customWidth="1"/>
    <col min="5" max="5" width="18" customWidth="1"/>
  </cols>
  <sheetData>${buildRowsXml(rows)}</sheetData>
</worksheet>`;
}

function buildWorkbookRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function buildRootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function buildContentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
}

function buildSheetRows(order: StoredOrder): SheetRow[] {
  const totalAmount = order.items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  const productRows: SheetRow[] = order.items.map((item, index) => ({
    index: 11 + index,
    cells: [
      { column: 1, value: item.title, type: "string", style: 6 },
      item.price != null
        ? { column: 2, value: item.price, type: "number", style: 7 }
        : { column: 2, value: "", type: "string", style: 6 },
      { column: 3, value: item.quantity, type: "number", style: 7 },
      { column: 4, value: (item.price ?? 0) * item.quantity, type: "number", style: 7 }
    ]
  }));

  return [
    {
      index: 1,
      cells: [{ column: 1, value: "AquaMarket — заказ клиента", type: "string", style: 1 }]
    },
    {
      index: 2,
      cells: [
        { column: 1, value: "Номер заказа", type: "string", style: 2 },
        { column: 2, value: order.id, type: "string", style: 3 }
      ]
    },
    {
      index: 3,
      cells: [
        { column: 1, value: "Дата оформления", type: "string", style: 2 },
        { column: 2, value: formatOrderDate(order.createdAt), type: "string", style: 3 }
      ]
    },
    {
      index: 4,
      cells: [
        { column: 1, value: "ФИО", type: "string", style: 2 },
        { column: 2, value: order.customer.fullName, type: "string", style: 3 }
      ]
    },
    {
      index: 5,
      cells: [
        { column: 1, value: "Телефон", type: "string", style: 2 },
        { column: 2, value: order.customer.phone, type: "string", style: 3 }
      ]
    },
    {
      index: 6,
      cells: [
        { column: 1, value: "Адрес доставки", type: "string", style: 2 },
        { column: 2, value: order.customer.deliveryAddress, type: "string", style: 3 }
      ]
    },
    {
      index: 7,
      cells: [
        { column: 1, value: "Всего единиц", type: "string", style: 2 },
        { column: 2, value: order.totalQuantity, type: "number", style: 4 }
      ]
    },
    {
      index: 8,
      cells: [{ column: 5, value: "Итоговая сумма", type: "string", style: 2 }]
    },
    {
      index: 9,
      cells: [
        { column: 1, value: "Наименование товара", type: "string", style: 5 },
        { column: 2, value: "Цена", type: "string", style: 5 },
        { column: 3, value: "Заказ", type: "string", style: 5 },
        { column: 4, value: "Сумма", type: "string", style: 5 },
        { column: 5, value: totalAmount, type: "number", style: 8 }
      ]
    },
    ...productRows
  ];
}

export function buildOrderSpreadsheet(order: StoredOrder): OrderSpreadsheetFile {
  const sheetName = getWorksheetName(order.id);
  const rows = buildSheetRows(order);

  const content = createZip([
    {
      name: "[Content_Types].xml",
      content: Buffer.from(buildContentTypesXml(), "utf-8")
    },
    {
      name: "_rels/.rels",
      content: Buffer.from(buildRootRelsXml(), "utf-8")
    },
    {
      name: "xl/workbook.xml",
      content: Buffer.from(buildWorkbookXml(sheetName), "utf-8")
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: Buffer.from(buildWorkbookRelsXml(), "utf-8")
    },
    {
      name: "xl/styles.xml",
      content: Buffer.from(buildStylesXml(), "utf-8")
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: Buffer.from(buildWorksheetXml(rows), "utf-8")
    }
  ]);

  return {
    filename: `AquaMarket-order-${order.id}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    content
  };
}
