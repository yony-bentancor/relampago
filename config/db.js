/*
 * Conexión a MongoDB (todavía no activa).
 *
 * El sistema funciona hoy con un archivo JSON (ver config/store.js).
 * Cuando quieras activar MongoDB:
 *   1. npm install mongoose
 *   2. Cargá MONGO_URI en el archivo .env (o en las Config Vars de Heroku).
 *   3. Reemplazá los métodos de models/Modelo.js por consultas de Mongoose
 *      (cada modelo ya tiene sus campos documentados al principio del archivo).
 */
const conectar = async () => {
  if (!process.env.MONGO_URI || process.env.USAR_MONGO !== "true") {
    console.log("Base de datos: archivo JSON local (MongoDB desactivado).");
    return null;
  }
  const mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB conectado");
  return mongoose;
};

module.exports = conectar;
