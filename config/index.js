const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const raiz = path.join(__dirname, "..");

module.exports = {
  raiz,
  puerto: Number(process.env.PORT) || 3000,
  produccion: process.env.NODE_ENV === "production",
  secretoSesion: process.env.SESSION_SECRET || "cambiar-este-secreto-en-produccion",
  // Mientras MongoDB no esté activo, los datos se guardan en un archivo JSON.
  archivoDatos: process.env.DATA_FILE || path.join(raiz, "data", "db.json"),
  carpetaPrivada: path.join(raiz, "uploads", "privado"),
  carpetaPublica: path.join(raiz, "uploads", "publico"),
  // Muestra los usuarios de prueba en la pantalla de ingreso.
  modoDemo: process.env.MODO_DEMO !== "false",
  // Contraseña de todos los usuarios de prueba.
  claveDemo: process.env.CLAVE_DEMO || "relampago2026",
  // Dirección pública del sitio (se usa para el QR de la cantina).
  urlSitio: process.env.URL_SITIO || "",
  tamanioMaximoArchivo: 5 * 1024 * 1024,
};
