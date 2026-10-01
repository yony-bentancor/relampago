/*
 * Subida de archivos (fotos de cédula, carné de salud, comprobantes, fotos de productos).
 * Usa busboy. Los documentos personales se guardan en uploads/privado (solo se ven con permiso);
 * las fotos públicas (productos, galería) en uploads/publico.
 *
 * Uso: router.post("/ruta", subida({ privado: true }), controlador)
 *      En el controlador: req.body (campos) y req.archivos.nombreDelCampo = { archivo, nombreOriginal, tipo, tamanio, url }
 */
const Busboy = require("busboy");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const config = require("../config");

const PERMITIDOS = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf" };

module.exports = function subida({ privado = true, soloImagenes = false } = {}) {
  return (req, res, next) => {
    if (!req.is("multipart/form-data")) return next();
    const carpeta = privado ? config.carpetaPrivada : config.carpetaPublica;
    fs.mkdirSync(carpeta, { recursive: true });
    req.body = {}; req.archivos = {};
    const errores = [];
    const escrituras = [];
    let bb;
    try { bb = Busboy({ headers: req.headers, limits: { fileSize: config.tamanioMaximoArchivo, files: 6, fields: 60 } }); }
    catch (e) { return next(e); }
    bb.on("field", (nombre, valor) => {
      if (nombre.endsWith("[]")) (req.body[nombre.slice(0, -2)] ||= []).push(valor);
      else if (req.body[nombre] !== undefined) req.body[nombre] = [].concat(req.body[nombre], valor);
      else req.body[nombre] = valor;
    });
    bb.on("file", (campo, stream, info) => {
      const ext = PERMITIDOS[info.mimeType];
      if (!info.filename) { stream.resume(); return; }
      if (!ext || (soloImagenes && info.mimeType === "application/pdf")) { errores.push(`El archivo "${info.filename}" no es una imagen${soloImagenes ? "" : " ni un PDF"}.`); stream.resume(); return; }
      const archivo = crypto.randomBytes(12).toString("hex") + ext;
      const destino = path.join(carpeta, archivo);
      const salida = fs.createWriteStream(destino);
      let tamanio = 0;
      stream.on("data", (d) => { tamanio += d.length; });
      stream.on("limit", () => { errores.push(`"${info.filename}" supera los ${Math.round(config.tamanioMaximoArchivo / 1048576)} MB.`); });
      escrituras.push(new Promise((ok) => salida.on("close", ok)));
      stream.pipe(salida);
      stream.on("end", () => {
        if (stream.truncated) { fs.rm(destino, () => {}); return; }
        req.archivos[campo] = { archivo, nombreOriginal: info.filename, tipo: info.mimeType, tamanio, url: privado ? `/archivos/${archivo}` : `/subidas/${archivo}` };
      });
    });
    bb.on("close", async () => {
      await Promise.all(escrituras);
      req.erroresSubida = errores;
      next();
    });
    bb.on("error", next);
    req.pipe(bb);
  };
};
