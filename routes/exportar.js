const router = require("express").Router();
const { requiereSesion } = require("../middlewares/auth");
const c = require("../controllers/exportarController");

// La tabla de posiciones es pública; el resto requiere sesión y el permiso de cada reporte.
router.get("/tabla.:formato", (req, res, next) => { req.params.tipo = "tabla"; c.exportar(req, res, next); });
router.get("/:tipo.:formato", requiereSesion, c.exportar);

module.exports = router;
