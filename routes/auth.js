const router = require("express").Router();
const a = require("../middlewares/asincrono");
const c = require("../controllers/authController");

router.get("/ingresar", a(c.formIngreso));
router.post("/ingresar", a(c.ingresar));
router.get("/registro", c.formRegistro);
router.post("/registro", a(c.registrar));
router.post("/salir", c.salir);

module.exports = router;
