const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const Cuota = require("../models/Cuota");
const Jugador = require("../models/Jugador");

// LISTADO DE CUOTAS DEL SOCIO
router.get(
  "/mis-cuotas",
  authMiddleware,
  roleMiddleware("socio"),
  async (req, res) => {
    try {
      const socioId = req.session.user.id;

      const jugadores = await Jugador.find({
        "responsables.usuario": socioId,
      }).lean();

      const jugadorIds = jugadores.map((j) => j._id);

      const cuotas = await Cuota.find({
        jugador: { $in: jugadorIds },
      })
        .populate("jugador")
        .sort({ anio: -1, mes: -1 })
        .lean();

      res.render("cuotas/mis-cuotas", {
        cuotas,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al cargar cuotas");
    }
  },
);

// PANEL TESORERÍA
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("tesorero"),
  async (req, res) => {
    try {
      const cuotas = await Cuota.find()
        .populate("jugador")
        .populate("responsable")
        .sort({ anio: -1, mes: -1 })
        .lean();

      res.render("cuotas/admin", {
        cuotas,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al cargar panel de cuotas");
    }
  },
);

// CREAR CUOTA
router.post(
  "/crear",
  authMiddleware,
  roleMiddleware("tesorero"),
  async (req, res) => {
    try {
      const { jugador, responsable, mes, anio, tipo, monto } = req.body;

      const nuevaCuota = new Cuota({
        jugador,
        responsable,
        mes,
        anio,
        tipo,
        monto,
      });

      await nuevaCuota.save();

      res.redirect("/cuotas/admin");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al crear cuota");
    }
  },
);

// MARCAR COMO PAGADA
router.post(
  "/:id/pagar",
  authMiddleware,
  roleMiddleware("tesorero"),
  async (req, res) => {
    try {
      await Cuota.findByIdAndUpdate(req.params.id, {
        estado: "pagado",
        fechaPago: new Date(),
      });

      res.redirect("/cuotas/admin");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al actualizar cuota");
    }
  },
);

module.exports = router;
