const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const Inscripcion = require("../models/Inscripcion");
const Jugador = require("../models/Jugador");

// CREAR INSCRIPCIÓN
router.post(
  "/crear/:jugadorId",
  authMiddleware,
  roleMiddleware("socio"),
  async (req, res) => {
    try {
      const jugador = await Jugador.findById(req.params.jugadorId);

      if (!jugador) {
        return res.status(404).send("Jugador no encontrado");
      }

      const existe = await Inscripcion.findOne({
        jugador: jugador._id,
        temporada: new Date().getFullYear(),
      });

      if (existe) {
        return res.status(400).send("Ya existe inscripción");
      }

      const nuevaInscripcion = new Inscripcion({
        jugador: jugador._id,
        responsable: req.session.user.id,
        temporada: new Date().getFullYear(),
        estado: "pendiente",
      });

      await nuevaInscripcion.save();

      res.redirect("/socios/dashboard");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al crear inscripción");
    }
  },
);

// LISTADO ADMIN
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const inscripciones = await Inscripcion.find()
        .populate("jugador")
        .populate("responsable")
        .sort({ createdAt: -1 })
        .lean();

      res.render("inscripciones/admin", {
        inscripciones,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al cargar inscripciones");
    }
  },
);

// APROBAR INSCRIPCIÓN
router.post(
  "/:id/aprobar",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      await Inscripcion.findByIdAndUpdate(req.params.id, {
        estado: "aprobada",
      });

      res.redirect("/inscripciones/admin");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al aprobar inscripción");
    }
  },
);

// RECHAZAR INSCRIPCIÓN
router.post(
  "/:id/rechazar",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      await Inscripcion.findByIdAndUpdate(req.params.id, {
        estado: "rechazada",
      });

      res.redirect("/inscripciones/admin");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al rechazar inscripción");
    }
  },
);

module.exports = router;
