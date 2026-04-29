require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const connectDB = require("./config/db");

const publicRoutes = require("./routes/public");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const padresRoutes = require("./routes/padres");

const app = express();

connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use("/", publicRoutes);
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/padres", padresRoutes);

app.use((req, res) => {
  res.status(404).send("Página no encontrada");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
