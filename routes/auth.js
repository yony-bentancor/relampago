const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const User = require("../models/User");

// FORMULARIO LOGIN
router.get("/login", (req, res) => {
  res.render("public/login", { error: null });
});

// PROCESAR LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("public/login", {
        error: "Debes ingresar email y contraseña",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.render("public/login", {
        error: "Usuario no encontrado",
      });
    }

    if (!user.activo) {
      return res.render("public/login", {
        error: "Usuario inactivo",
      });
    }

    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) {
      return res.render("public/login", {
        error: "Contraseña incorrecta",
      });
    }

    req.session.user = {
      id: user._id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
    };

    if (user.rol === "admin") {
      return res.redirect("/admin");
    }

    if (user.rol === "socio") {
      return res.redirect("/socios/dashboard");
    }

    if (user.rol === "entrenador") {
      return res.redirect("/entrenador/dashboard");
    }

    if (user.rol === "tesorero") {
      return res.redirect("/cuotas/admin");
    }

    return res.redirect("/");
  } catch (error) {
    console.error("Error en login:", error);
    return res.render("public/login", {
      error: "Error al iniciar sesión",
    });
  }
});

// CERRAR SESIÓN
router.get("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Error al cerrar sesión:", error);
      return res.redirect("/");
    }

    res.clearCookie("connect.sid");
    return res.redirect("/");
  });
});

// FORMULARIO REGISTRO
router.get("/register", (req, res) => {
  res.render("public/register", { error: null });
});

// PROCESAR REGISTRO
router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, cedula, direccion } =
      req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.render("public/register", {
        error: "Nombre, apellido, email y contraseña son obligatorios",
      });
    }

    const existe = await User.findOne({ email: email.toLowerCase().trim() });

    if (existe) {
      return res.render("public/register", {
        error: "Ya existe un usuario con ese email",
      });
    }

    const nuevoUser = new User({
      nombre,
      apellido,
      email: email.toLowerCase().trim(),
      password,
      telefono,
      cedula,
      direccion,
      rol: "socio",
      activo: true,
    });

    await nuevoUser.save();

    req.session.user = {
      id: nuevoUser._id,
      nombre: nuevoUser.nombre,
      apellido: nuevoUser.apellido,
      email: nuevoUser.email,
      rol: nuevoUser.rol,
    };

    res.redirect("/socios/dashboard");
  } catch (error) {
    console.error("Error en registro:", error);
    res.render("public/register", {
      error: "Error al registrar usuario",
    });
  }
});

module.exports = router;
