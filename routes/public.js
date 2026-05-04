const express = require("express");
const router = express.Router();
const Inscripcion = require("../models/Inscripcion");

// ===============================
// MODELOS MONGOOSE DESACTIVADOS
// ===============================
// Los dejamos comentados para probar la app sin MongoDB.
// Cuando quieras volver a usar la base, descomentás estas líneas.

// const Categoria = require("../models/Categoria");
// const Partido = require("../models/Partido");
// const Noticia = require("../models/Noticia");
// const Inscripcion = require("../models/Inscripcion");

// ===============================
// DATOS MOCK / DE PRUEBA
// ===============================
// Esto simula los datos que normalmente vendrían desde MongoDB.

const noticiasMock = [
  {
    titulo: "Bienvenidos al Club Relámpago",
    contenido:
      "Esta es una noticia de prueba para ver el sitio funcionando sin base de datos.",
    publicada: true,
    createdAt: new Date("2026-04-20"),
  },
  {
    titulo: "Comienzan los entrenamientos",
    contenido: "Los entrenamientos arrancan el sábado en el horario habitual.",
    publicada: true,
    createdAt: new Date("2026-04-18"),
  },
  {
    titulo: "Se viene el próximo amistoso",
    contenido:
      "El domingo tendremos una jornada de fútbol para todas las categorías.",
    publicada: true,
    createdAt: new Date("2026-04-15"),
  },
];

const categoriasMock = [
  { nombre: "2016" },
  { nombre: "2017" },
  { nombre: "2018" },
  { nombre: "Sub 10" },
  { nombre: "Sub 12" },
];

const partidosMock = [
  {
    rival: "Deportivo Malvín",
    fecha: new Date("2026-04-25T10:00:00"),
    cancha: "Cancha principal",
    categoria: { nombre: "2016" },
  },
  {
    rival: "Juventud del Este",
    fecha: new Date("2026-04-26T11:30:00"),
    cancha: "Cancha auxiliar",
    categoria: { nombre: "Sub 10" },
  },
  {
    rival: "Huracán Buceo",
    fecha: new Date("2026-04-27T14:00:00"),
    cancha: "Complejo deportivo",
    categoria: { nombre: "Sub 12" },
  },
];

// ===============================
// HOME
// ===============================
router.get("/", async (req, res) => {
  try {
    // VERSIÓN CON MONGO:
    // const noticias = await Noticia.find({ publicada: true })
    //   .sort({ createdAt: -1 })
    //   .limit(3)
    //   .lean();

    // VERSIÓN SIN MONGO:
    const noticias = noticiasMock
      .filter((n) => n.publicada)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    res.render("public/home", { noticias });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar inicio");
  }
});

// ===============================
// CATEGORÍAS
// ===============================
router.get("/categorias", async (req, res) => {
  try {
    // VERSIÓN CON MONGO:
    // const categorias = await Categoria.find().sort({ nombre: 1 }).lean();

    // VERSIÓN SIN MONGO:
    const categorias = [...categoriasMock].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );

    res.render("public/categorias", { categorias });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar categorías");
  }
});

// ===============================
// FIXTURE
// ===============================
router.get("/fixture", async (req, res) => {
  try {
    // VERSIÓN CON MONGO:
    // const partidos = await Partido.find()
    //   .populate("categoria")
    //   .sort({ fecha: 1 })
    //   .lean();

    // VERSIÓN SIN MONGO:
    const partidos = [...partidosMock].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha),
    );

    res.render("public/fixture", { partidos });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar fixture");
  }
});

// ===============================
// NOTICIAS
// ===============================
router.get("/noticias", async (req, res) => {
  try {
    // VERSIÓN CON MONGO:
    // const noticias = await Noticia.find({ publicada: true })
    //   .sort({ createdAt: -1 })
    //   .lean();

    // VERSIÓN SIN MONGO:
    const noticias = noticiasMock
      .filter((n) => n.publicada)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render("public/noticias", { noticias });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar noticias");
  }
});

// ===============================
// INSCRIPCIÓN - FORMULARIO
// ===============================
router.get("/inscripcion", (req, res) => {
  res.render("public/inscripcion", { ok: req.query.ok });
});

// ===============================
// INSCRIPCIÓN - ENVÍO
// ===============================

// POST guardar en Mongo
router.post("/inscripcion", async (req, res) => {
  try {
    console.log("Nueva inscripción recibida:", req.body);

    const nueva = await Inscripcion.create(req.body);

    console.log("Guardado en Mongo:", nueva);

    res.redirect("/inscripcion?ok=1");
  } catch (error) {
    console.error("Error al guardar inscripción:", error);
    res.status(500).send("Error al guardar la inscripción");
  }
});

module.exports = router;
