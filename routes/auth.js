const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

router.get("/login", (req, res) => {
  res.render("public/login", { error: null });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("public/login", { error: "Usuario no encontrado" });
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      return res.render("public/login", { error: "Contraseña incorrecta" });
    }

    req.session.user = {
      id: user._id,
      nombre: user.nombre,
      rol: user.rol,
    };

    if (user.rol === "admin") return res.redirect("/admin");
    if (user.rol === "padre") return res.redirect("/padres/dashboard");

    return res.redirect("/");
  } catch (error) {
    console.error(error);
    res.render("public/login", { error: "Error al iniciar sesión" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
