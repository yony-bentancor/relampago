const path = require("path");
const express = require("express");
const session = require("express-session");

const config = require("./config");
const conectarDB = require("./config/db");
const store = require("./config/store");
const { cargarUsuario } = require("./middlewares/auth");
const locales = require("./middlewares/locales");
const { noEncontrado, manejarError } = require("./middlewares/errores");
const { Cuota } = require("./models");
const { generarCuotasDelMes } = require("./services/cuotas");

const app = express();

// Vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1); // Heroku

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public"), { maxAge: config.produccion ? "7d" : 0 }));
app.use("/subidas", express.static(config.carpetaPublica, { maxAge: "7d" }));

// Formularios
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));

// Sesiones
app.use(session({
  name: "relampago.sid",
  secret: config.secretoSesion,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: config.produccion, maxAge: 1000 * 60 * 60 * 24 * 7 },
}));

// Usuario y variables comunes de las vistas
app.use(cargarUsuario);
app.use(locales);

// Rutas
app.use("/", require("./routes/publico"));
app.use("/", require("./routes/auth"));
app.use("/panel", require("./routes/panel"));
app.use("/exportar", require("./routes/exportar"));
app.use("/archivos", require("./routes/archivos"));

// Errores
app.use(noEncontrado);
app.use(manejarError);

async function iniciar() {
  await conectarDB();
  store.cargar();
  await generarCuotasDelMes();
  await Cuota.actualizarVencidas();
  // Una vez por hora: cuota del mes nueva y cuotas que vencieron.
  setInterval(async () => { await generarCuotasDelMes(); await Cuota.actualizarVencidas(); }, 60 * 60 * 1000).unref();
  app.listen(config.puerto, () => console.log(`Club Relámpago en http://localhost:${config.puerto}`));
}

if (require.main === module) iniciar();

module.exports = app;
