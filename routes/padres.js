const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const Jugador = require("../models/Jugador");
const Partido = require("../models/Partido");
const Noticia = require("../models/Noticia");

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("padre"),
  async (req, res) => {
    try {
      const hijos = await Jugador.find({ padre: req.session.user.id })
        .populate("categoria")
        .lean();

      const proximosPartidos = await Partido.find({ estado: "programado" })
        .populate("categoria")
        .sort({ fecha: 1 })
        .limit(5)
        .lean();

      const noticias = await Noticia.find({ publicada: true })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      res.render("padres/dashboard", {
        hijos,
        proximosPartidos,
        noticias,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al cargar panel de familias");
    }
  },
);

module.exports = router;
