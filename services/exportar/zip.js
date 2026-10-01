/* Generador mínimo de archivos ZIP (lo usa el exportador de Excel). Sin dependencias. */
const zlib = require("zlib");

const TABLA = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(buf) { let c = -1; for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; }

function zip(archivos) {
  const locales = [], centrales = [];
  let offset = 0;
  for (const { nombre, datos } of archivos) {
    const contenido = Buffer.isBuffer(datos) ? datos : Buffer.from(datos, "utf8");
    const comprimido = zlib.deflateRawSync(contenido);
    const n = Buffer.from(nombre, "utf8"), crc = crc32(contenido);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(0x0800, 6); l.writeUInt16LE(8, 8);
    l.writeUInt16LE(0, 10); l.writeUInt16LE(0x21, 12); l.writeUInt32LE(crc, 14);
    l.writeUInt32LE(comprimido.length, 18); l.writeUInt32LE(contenido.length, 22); l.writeUInt16LE(n.length, 26); l.writeUInt16LE(0, 28);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt16LE(0, 12); c.writeUInt16LE(0x21, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comprimido.length, 20);
    c.writeUInt32LE(contenido.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(offset, 42);
    locales.push(l, n, comprimido); centrales.push(c, n);
    offset += l.length + n.length + comprimido.length;
  }
  const central = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(archivos.length, 8); fin.writeUInt16LE(archivos.length, 10);
  fin.writeUInt32LE(central.length, 12); fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locales, central, fin]);
}

module.exports = { zip, crc32 };
