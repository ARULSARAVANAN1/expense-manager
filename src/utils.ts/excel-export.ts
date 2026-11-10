import { strToU8, zipSync } from "fflate";

type ExcelCell = string | number;

interface ExcelSheet {
  name: string;
  rows: ExcelCell[][];
  columnWidths: number[];
  dateColumns?: number[];
  dateTimeColumns?: number[];
  currencyColumns?: number[];
  currencyRows?: number[];
}

function columnName(index: number): string {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function escapeXml(value: string): string {
  const validXml = Array.from(value).filter((character) => {
    const code = character.charCodeAt(0);
    return code === 0x09 || code === 0x0a || code === 0x0d || code >= 0x20;
  }).join("");
  return validXml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function worksheetXml(sheet: ExcelSheet): string {
  const { rows, columnWidths, dateColumns = [], dateTimeColumns = [], currencyColumns = [], currencyRows = [] } = sheet;
  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
      const alternate = rowIndex > 0 && rowIndex % 2 === 0;
      let style = rowIndex === 0 ? 1 : alternate ? 2 : 0;
      let cellValue = value;
      if (rowIndex > 0 && (dateColumns.includes(columnIndex) || dateTimeColumns.includes(columnIndex)) && typeof value === "string" && value) {
        const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
        if (!Number.isNaN(date.getTime())) {
          cellValue = date.getTime() / 86400000 + 25569;
          style = dateTimeColumns.includes(columnIndex) && value.length > 10 ? 8 + (alternate ? 0 : -1) : 6 + (alternate ? 0 : -1);
        }
      }
      if (rowIndex > 0 && (currencyColumns.includes(columnIndex) || currencyRows.includes(rowIndex))) {
        style = 3 + (alternate ? 1 : 0);
      }
      if (typeof cellValue === "number" && Number.isFinite(cellValue)) {
        return `<c r="${reference}" s="${style}"><v>${cellValue}</v></c>`;
      }
      if (rowIndex > 0) style = alternate ? 2 : 0;
      return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(cellValue))}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}" ht="${rowIndex === 0 ? 26 : 22}" customHeight="1">${cells}</row>`;
  }).join("");
  const columns = columnWidths.map((width, index) =>
    `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
  ).join("");
  const lastColumn = columnName(Math.max(0, ...rows.map((row) => row.length)) - 1);
  const lastRow = Math.max(1, rows.length);
  const filters = rows.length > 1 ? `<autoFilter ref="A1:${lastColumn}${lastRow}"/>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${columns}</cols><sheetData>${sheetRows}</sheetData>${filters}</worksheet>`;
}

export function createExcelWorkbook(sheets: ExcelSheet[]): Uint8Array {
  const workbookSheets = sheets.map((sheet, index) =>
    `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
  ).join("");
  const sheetOverrides = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  const sheetRelationships = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");
  const stylesRelationshipId = sheets.length + 1;
  const styleRelationship = `<Relationship Id="rId${stylesRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="&quot;₹&quot;#,##0.00"/>
    <numFmt numFmtId="165" formatCode="dd-mmm-yyyy"/>
    <numFmt numFmtId="166" formatCode="dd-mmm-yyyy hh:mm"/>
  </numFmts>
  <fonts count="2">
    <font><color rgb="FF000000"/><sz val="11"/><name val="Calibri"/></font>
    <font><b/><color rgb="FF000000"/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF5B9BD5"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left/><right/><top/><bottom style="thin"><color rgb="FFE2E8F0"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="1" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="166" fontId="0" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"><alignment horizontal="left" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheetOverrides}</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRelationships}${styleRelationship}</Relationships>`),
    "xl/styles.xml": strToU8(styles),
  };

  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = strToU8(worksheetXml(sheet));
  });

  return zipSync(files, { level: 6 });
}
