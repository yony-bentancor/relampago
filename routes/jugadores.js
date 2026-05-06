const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const Jugador = require("../models/Jugador");
const Categoria = require("../models/Categoria");

// FORMULARIO NUEVO JUGADOR
router.get("/nuevo", authMiddleware, async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ anio: 1 }).lean();

    res.render("jugadores/nuevo", {
      categorias,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar formulario");
  }
});

// CREAR JUGADOR
router.post("/nuevo", authMiddleware, async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      fechaNacimiento,
      cedula,
      categoria,
      mutualista,
      emergenciaMovil,
      numeroEmergencia,
      alergias,
      medicacion,
      enfermedades,
      observaciones,
    } = req.body;

    const nuevoJugador = new Jugador({
      nombre,
      apellido,
      fechaNacimiento,
      cedula,
      categoria,

      responsables: [
        {
          usuario: req.session.user.id,
          parentesco: "padre",
          principal: true,
        },
      ],

      datosMedicos: {
        mutualista,
        emergenciaMovil,
        numeroEmergencia,
        alergias,
        medicacion,
        enfermedades,
        observaciones,
      },
    });

    await nuevoJugador.save();

    res.redirect("/socios/dashboard");
  } catch (error) {
    console.error(error);

    const categorias = await Categoria.find().lean();

    res.render("jugadores/nuevo", {
      categorias,
      error: "Error al crear jugador",
    });
  }
});

// VER FICHA DEL JUGADOR
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const jugador = await Jugador.findById(req.params.id)
      .populate("categoria")
      .populate("responsables.usuario")
      .lean();

    if (!jugador) {
      return res.status(404).send("Jugador no encontrado");
    }

    res.render("jugadores/ficha", {
      jugador,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar ficha");
  }
});

// FORMULARIO EDITAR
router.get("/:id/editar", authMiddleware, async (req, res) => {
  try {
    const jugador = await Jugador.findById(req.params.id).lean();

    const categorias = await Categoria.find().sort({ anio: 1 }).lean();

    if (!jugador) {
      return res.status(404).send("Jugador no encontrado");
    }

    res.render("jugadores/editar", {
      jugador,
      categorias,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar edición");
  }
});

// GUARDAR EDICIÓN
router.post("/:id/editar", authMiddleware, async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      fechaNacimiento,
      cedula,
      categoria,
      observaciones,
    } = req.body;

    await Jugador.findByIdAndUpdate(req.params.id, {
      nombre,
      apellido,
      fechaNacimiento,
      cedula,
      categoria,
      observaciones,
    });

    res.redirect(`/jugadores/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al guardar cambios");
  }
});

module.exports = router;
