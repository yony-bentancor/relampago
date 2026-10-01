const router = require("express").Router();
const a = require("../middlewares/asincrono");
const c = require("../controllers/publicoController");

router.get("/", a(c.inicio));
router.get("/club", a(c.club));
router.get("/categorias", a(c.categorias));
router.get("/categorias/:anio", a(c.categorias));
router.get("/fixture", a(c.fixture));
router.get("/noticias", a(c.noticias));
router.get("/noticias/:id", a(c.noticia));
router.get("/galeria", a(c.galeria));
router.get("/hacete-socio", a(c.haceteSocio));
router.get("/contacto", a(c.contacto));
router.post("/contacto", a(c.enviarContacto));
// Dirección del QR del mostrador de la cantina
router.get("/cantina", (req, res) => {
  if (req.usuario) return res.redirect("/panel/tienda");
  req.session.volverA = "/panel/tienda";
  req.session.flash = { tipo: "info", texto: "Ingresá con tu cuenta para pedir en la cantina." };
  res.redirect("/ingresar");
});

module.exports = router;
