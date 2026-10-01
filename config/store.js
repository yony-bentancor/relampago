/*
 * Almacenamiento de datos.
 *
 * Mientras MongoDB no esté activo, todo se guarda en un archivo JSON (data/db.json).
 * Si el archivo no existe, se generan los datos de prueba automáticamente.
 * Los modelos (carpeta models/) son la única parte del sistema que habla con este archivo,
 * así que pasar a MongoDB más adelante significa cambiar los modelos, no los controladores.
 */
const fs = require("fs");
const path = require("path");
const config = require("./index");

let datos = null;
let temporizador = null;

function cargar() {
  if (datos) return datos;
  if (!fs.existsSync(config.archivoDatos)) {
    const { generar } = require("../scripts/seed");
    datos = generar();
    escribirAhora();
    console.log("Datos de prueba generados en", path.relative(config.raiz, config.archivoDatos));
  } else {
    datos = JSON.parse(fs.readFileSync(config.archivoDatos, "utf8"));
  }
  return datos;
}

function escribirAhora() {
  fs.mkdirSync(path.dirname(config.archivoDatos), { recursive: true });
  const tmp = config.archivoDatos + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(datos));
  fs.renameSync(tmp, config.archivoDatos);
}

/** Guarda los cambios en disco (agrupa varias escrituras seguidas). */
function guardar() {
  clearTimeout(temporizador);
  temporizador = setTimeout(escribirAhora, 150);
}

function coleccion(nombre) {
  cargar();
  if (!datos[nombre]) datos[nombre] = [];
  return datos[nombre];
}

function nuevoId(prefijo) {
  cargar();
  datos.meta.secuencia = (datos.meta.secuencia || 1000) + 1;
  return prefijo + datos.meta.secuencia;
}

function reemplazarTodo(nuevos) {
  datos = nuevos;
  escribirAhora();
}

process.on("exit", () => { if (datos && temporizador) escribirAhora(); });

module.exports = { cargar, guardar, coleccion, nuevoId, reemplazarTodo };
