/*
 * Exportador a PDF sin dependencias: encabezado con escudo, tabla con salto de página y pie numerado.
 * reporte = { titulo, subtitulo, columnas: [{ titulo, ancho (relativo), tipo }], filas: [[...]], resumen: [[etiqueta, valor]] }
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { fechaLarga, hoy } = require("../fechas");

// Anchos de Helvetica (1/1000 de em) para los caracteres 32 a 126.
const ANCHOS = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const BASE = { "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n", "ü": "u", "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", "Ñ": "N", "Ü": "U" };
const WIN = { "–": 0x96, "—": 0x97, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "…": 0x85, "€": 0x80 };

function ancho(texto, tam, negrita) {
  let w = 0;
  for (const ch of String(texto)) {
    const c = (BASE[ch] || ch).charCodeAt(0);
    w += c >= 32 && c <= 126 ? ANCHOS[c - 32] : 556;
  }
  return (w * tam / 1000) * (negrita ? 1.07 : 1);
}

function cadena(texto) {
  const bytes = [];
  for (const ch of String(texto ?? "")) {
    let c = WIN[ch] ?? ch.charCodeAt(0);
    if (c > 255) c = 63;
    if (c === 40 || c === 41 || c === 92) bytes.push(92);
    bytes.push(c);
  }
  return "(" + Buffer.from(bytes).toString("latin1") + ")";
}

function recortar(texto, max, tam, negrita) {
  let t = String(texto ?? "");
  if (ancho(t, tam, negrita) <= max) return t;
  while (t.length > 1 && ancho(t + "…", tam, negrita) > max) t = t.slice(0, -1);
  return t + "…";
}

function infoJpeg(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1], largo = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return { alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7), componentes: buf[i + 9] };
    i += 2 + largo;
  }
  return null;
}

const color = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((v) => v.toFixed(3)).join(" "); };

class DocumentoPDF {
  constructor({ horizontal = false } = {}) {
    this.W = horizontal ? 842 : 595; this.H = horizontal ? 595 : 842; this.M = 36;
    this.paginas = []; this.y = 0;
    const escudo = path.join(__dirname, "..", "..", "public", "img", "escudo.jpg");
    this.logo = fs.existsSync(escudo) ? fs.readFileSync(escudo) : null;
    this.logoInfo = this.logo ? infoJpeg(this.logo) : null;
    this.nuevaPagina();
  }
  get pag() { return this.paginas[this.paginas.length - 1]; }
  nuevaPagina() { this.paginas.push([]); this.y = this.M; }
  op(s) { this.pag.push(s); }
  texto(x, y, t, { tam = 9, negrita = false, col = "#18151A", alinear = "izq", max } = {}) {
    let s = max ? recortar(t, max, tam, negrita) : String(t ?? "");
    let xx = x;
    if (alinear === "der") xx = x - ancho(s, tam, negrita);
    if (alinear === "centro") xx = x - ancho(s, tam, negrita) / 2;
    this.op(`BT /${negrita ? "F2" : "F1"} ${tam} Tf ${color(col)} rg ${xx.toFixed(2)} ${(this.H - y).toFixed(2)} Td ${cadena(s)} Tj ET`);
  }
  rect(x, y, w, h, col) { this.op(`${color(col)} rg ${x.toFixed(2)} ${(this.H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`); }
  linea(x1, y1, x2, y2, col = "#E5DEDF", grosor = 0.6) { this.op(`${color(col)} RG ${grosor} w ${x1} ${(this.H - y1).toFixed(2)} m ${x2} ${(this.H - y2).toFixed(2)} l S`); }

  encabezado(titulo, subtitulo) {
    const M = this.M;
    this.rect(0, 0, this.W, 6, "#D9202E");
    if (this.logoInfo) this.op(`q 40 0 0 40 ${M} ${this.H - M - 44} cm /Im1 Do Q`);
    const x = this.logoInfo ? M + 50 : M;
    this.texto(x, M + 14, "CLUB ATLÉTICO RELÁMPAGO", { tam: 8, negrita: true, col: "#D9202E" });
    this.texto(x, M + 30, titulo, { tam: 16, negrita: true });
    if (subtitulo) this.texto(x, M + 43, subtitulo, { tam: 9, col: "#6B6367", max: this.W - x - M });
    this.y = M + 60;
  }

  resumen(pares) {
    if (!pares || !pares.length) return;
    const M = this.M, w = (this.W - 2 * M) / Math.min(pares.length, 4);
    pares.forEach(([etq, val], i) => {
      const fila = Math.floor(i / 4), col = i % 4, x = M + col * w, y = this.y + fila * 38;
      this.rect(x + 2, y, w - 4, 32, "#F4F0F0");
      this.texto(x + 10, y + 12, String(etq).toUpperCase(), { tam: 6.5, negrita: true, col: "#7B7377", max: w - 20 });
      this.texto(x + 10, y + 26, val, { tam: 11, negrita: true, max: w - 20 });
    });
    this.y += Math.ceil(pares.length / 4) * 38 + 8;
  }

  tabla(columnas, filas) {
    const M = this.M, total = this.W - 2 * M;
    const suma = columnas.reduce((t, c) => t + (c.ancho || 1), 0);
    const anchos = columnas.map((c) => ((c.ancho || 1) / suma) * total);
    const altoFila = 16, limite = this.H - M - 24;
    const cabecera = () => {
      this.rect(M, this.y, total, 18, "#D9202E");
      let x = M;
      columnas.forEach((c, i) => {
        const der = c.tipo === "numero" || c.tipo === "pesos";
        this.texto(der ? x + anchos[i] - 5 : x + 5, this.y + 12, c.titulo, { tam: 7.5, negrita: true, col: "#FFFFFF", alinear: der ? "der" : "izq", max: anchos[i] - 10 });
        x += anchos[i];
      });
      this.y += 18;
    };
    cabecera();
    if (!filas.length) { this.texto(M + 5, this.y + 14, "Sin datos para mostrar.", { col: "#7B7377" }); this.y += 20; return; }
    filas.forEach((f, k) => {
      if (this.y + altoFila > limite) { this.nuevaPagina(); this.y = this.M + 10; cabecera(); }
      if (k % 2) this.rect(M, this.y, total, altoFila, "#F7F4F4");
      let x = M;
      f.forEach((v, i) => {
        const c = columnas[i], der = c.tipo === "numero" || c.tipo === "pesos";
        let s = v;
        if (c.tipo === "pesos" && typeof v === "number") s = "$U " + Math.round(v).toLocaleString("es-UY");
        this.texto(der ? x + anchos[i] - 5 : x + 5, this.y + 11, s ?? "", { tam: 8, alinear: der ? "der" : "izq", max: anchos[i] - 10 });
        x += anchos[i];
      });
      this.y += altoFila;
    });
    this.linea(M, this.y, M + total, this.y, "#D8D0D1");
  }

  generar() {
    const objs = [];
    const add = (s) => { objs.push(s); return objs.length; };
    const catalogo = add(null), paginasId = add(null);
    const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    let img = null;
    if (this.logoInfo) {
      const cs = this.logoInfo.componentes === 1 ? "/DeviceGray" : this.logoInfo.componentes === 4 ? "/DeviceCMYK" : "/DeviceRGB";
      img = add({ dict: `<< /Type /XObject /Subtype /Image /Width ${this.logoInfo.ancho} /Height ${this.logoInfo.alto} /ColorSpace ${cs} /BitsPerComponent 8 /Filter /DCTDecode /Length ${this.logo.length} >>`, stream: this.logo });
    }
    const recursos = `<< /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >>${img ? ` /XObject << /Im1 ${img} 0 R >>` : ""} >>`;
    const n = this.paginas.length, ids = [];
    this.paginas.forEach((ops, i) => {
      const pie = [];
      const yPie = this.H - 20;
      pie.push(`BT /F1 7 Tf ${color("#7B7377")} rg ${this.M} ${(this.H - yPie).toFixed(2)} Td ${cadena(`Club Atlético Relámpago · generado el ${fechaLarga(hoy())}`)} Tj ET`);
      const t = `Página ${i + 1} de ${n}`;
      pie.push(`BT /F1 7 Tf ${color("#7B7377")} rg ${(this.W - this.M - ancho(t, 7)).toFixed(2)} ${(this.H - yPie).toFixed(2)} Td ${cadena(t)} Tj ET`);
      const contenido = zlib.deflateSync(Buffer.from([...ops, ...pie].join("\n"), "latin1"));
      const c = add({ dict: `<< /Length ${contenido.length} /Filter /FlateDecode >>`, stream: contenido });
      ids.push(add(`<< /Type /Page /Parent ${paginasId} 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources ${recursos} /Contents ${c} 0 R >>`));
    });
    objs[catalogo - 1] = `<< /Type /Catalog /Pages ${paginasId} 0 R >>`;
    objs[paginasId - 1] = `<< /Type /Pages /Kids [${ids.map((i) => `${i} 0 R`).join(" ")}] /Count ${ids.length} >>`;
    const partes = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
    let offset = partes[0].length;
    const offsets = [];
    objs.forEach((o, i) => {
      offsets.push(offset);
      let b;
      if (typeof o === "string") b = Buffer.from(`${i + 1} 0 obj\n${o}\nendobj\n`, "latin1");
      else b = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n${o.dict}\nstream\n`, "latin1"), o.stream, Buffer.from("\nendstream\nendobj\n", "latin1")]);
      partes.push(b); offset += b.length;
    });
    const xref = [`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`, ...offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)].join("");
    partes.push(Buffer.from(`${xref}trailer\n<< /Size ${objs.length + 1} /Root ${catalogo} 0 R >>\nstartxref\n${offset}\n%%EOF\n`, "latin1"));
    return Buffer.concat(partes);
  }
}

function generarPdf(reporte) {
  const horizontal = reporte.horizontal ?? reporte.columnas.length > 6;
  const doc = new DocumentoPDF({ horizontal });
  doc.encabezado(reporte.titulo, reporte.subtitulo);
  doc.resumen(reporte.resumen);
  doc.tabla(reporte.columnas, reporte.filas);
  return doc.generar();
}

module.exports = { generarPdf };
