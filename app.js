require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const connectDB = require("./config/db");

const publicRoutes = require("./routes/public");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const sociosRoutes = require("./routes/socios");
const jugadoresRoutes = require("./routes/jugadores");
const inscripcionesRoutes = require("./routes/inscripciones");
const cuotasRoutes = require("./routes/cuotas");

const app = express();

// CONEXIÓN A MONGODB
connectDB();

// CONFIGURACIÓN EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MIDDLEWARES
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// SESIONES
app.use(
  session({
    secret: process.env.SESSION_SECRET || "relampago_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
    },
  }),
);

// USUARIO DISPONIBLE EN TODAS LAS VISTAS
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// RUTAS
app.use("/", publicRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/socios", sociosRoutes);
app.use("/jugadores", jugadoresRoutes);
app.use("/inscripciones", inscripcionesRoutes);
app.use("/cuotas", cuotasRoutes);

// ERROR 404
app.use((req, res) => {
  res.status(404).send("Página no encontrada");
});

// SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
