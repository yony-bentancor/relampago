const router = require("express").Router();
const a = require("../middlewares/asincrono");
const { requiereSesion } = require("../middlewares/auth");
const c = require("../controllers/panelController");

router.get("/:archivo", requiereSesion, a(c.archivo));

module.exports = router;
