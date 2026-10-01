/*
 * Exportador a Excel (.xlsx) sin dependencias.
 * reporte = { titulo, subtitulo, columnas: [{ titulo, ancho, tipo: "texto"|"numero"|"pesos" }], filas: [[...]] }
 */
const { zip } = require("./zip");

const x = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
const letra = (n) => { let s = ""; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';

function celda(ref, valor, estilo, tipo) {
  if (valor === null || valor === undefined || valor === "") return `<c r="${ref}" s="${estilo}"/>`;
  if ((tipo === "numero" || tipo === "pesos") && typeof valor === "number") return `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`;
  return `<c r="${ref}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${x(valor)}</t></is></c>`;
}

function hoja(r) {
  const filasXml = [];
  filasXml.push(`<row r="1">${celda("A1", r.titulo, 3)}</row>`);
  if (r.subtitulo) filasXml.push(`<row r="2">${celda("A2", r.subtitulo, 0)}</row>`);
  const cab = 4;
  filasXml.push(`<row r="${cab}">${r.columnas.map((c, i) => celda(letra(i) + cab, c.titulo, 1)).join("")}</row>`);
  r.filas.forEach((f, k) => {
    const n = cab + 1 + k;
    filasXml.push(`<row r="${n}">${f.map((v, i) => { const t = r.columnas[i].tipo; return celda(letra(i) + n, v, t === "pesos" ? 2 : t === "numero" ? 4 : 0, t); }).join("")}</row>`);
  });
  const cols = r.columnas.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.ancho || 16}" customWidth="1"/>`).join("");
  const ult = letra(r.columnas.length - 1);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet ${NS}><sheetViews><sheetView workbookViewId="0"><pane ySplit="${cab}" topLeftCell="A${cab + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${filasXml.join("")}</sheetData>${r.filas.length ? `<autoFilter ref="A${cab}:${ult}${cab + r.filas.length}"/>` : ""}</worksheet>`;
}

function generarXlsx(reporte) {
  const nombreHoja = x(String(reporte.hoja || reporte.titulo).replace(/[\[\]:*?/\\]/g, " ").slice(0, 31));
  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet ${NS}><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;$U&quot; #,##0"/></numFmts>
<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9202E"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  return zip([
    { nombre: "[Content_Types].xml", datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
    { nombre: "_rels/.rels", datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { nombre: "xl/workbook.xml", datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook ${NS} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${nombreHoja}" sheetId="1" r:id="rId1"/></sheets>${reporte.filas.length ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${nombreHoja.replace(/'/g, "''")}'!$A$4:$${letra(reporte.columnas.length - 1)}$${4 + reporte.filas.length}</definedName></definedNames>` : ""}</workbook>` },
    { nombre: "xl/_rels/workbook.xml.rels", datos: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { nombre: "xl/styles.xml", datos: estilos },
    { nombre: "xl/worksheets/sheet1.xml", datos: hoja(reporte) },
  ]);
}

module.exports = { generarXlsx };
