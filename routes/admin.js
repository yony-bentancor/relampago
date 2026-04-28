const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const Categoria = require("../models/Categoria");
const Partido = require("../models/Partido");
//const Noticia = require("../models/Noticia");
const Jugador = require("../models/Jugador");
const Inscripcion = require("../models/Inscripcion");

router.get("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const totalJugadores = await Jugador.countDocuments();
    const totalCategorias = await Categoria.countDocuments();
    const totalPartidos = await Partido.countDocuments();
    const totalNoticias = await Noticia.countDocuments();
    const totalInscripciones = await Inscripcion.countDocuments({
      estado: "nueva",
    });

    res.render("admin/dashboard", {
      totalJugadores,
      totalCategorias,
      totalPartidos,
      totalNoticias,
      totalInscripciones,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar panel admin");
  }
});

module.exports = router;
