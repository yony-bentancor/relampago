const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const Jugador = require("../models/Jugador");
const Partido = require("../models/Partido");
const Noticia = require("../models/Noticia");
const Cuota = require("../models/Cuota");

// PANEL DEL SOCIO
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("socio"),
  async (req, res) => {
    try {
      const socioId = req.session.user.id;

      const hijos = await Jugador.find({
        "responsables.usuario": socioId,
      })
        .populate("categoria")
        .lean();

      const hijoIds = hijos.map((hijo) => hijo._id);

      const cuotas = await Cuota.find({
        jugador: { $in: hijoIds },
      })
        .populate("jugador")
        .sort({ anio: -1, mes: -1 })
        .lean();

      const proximosPartidos = await Partido.find({
        estado: "programado",
      })
        .populate("categoria")
        .sort({ fecha: 1 })
        .limit(5)
        .lean();

      const noticias = await Noticia.find({
        publicada: true,
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      res.render("socios/dashboard", {
        hijos,
        cuotas,
        proximosPartidos,
        noticias,
      });
    } catch (error) {
      console.error("Error al cargar panel del socio:", error);
      res.status(500).send("Error al cargar panel del socio");
    }
  },
);

module.exports = router;
