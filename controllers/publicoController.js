/* Web pública: lo que ve cualquier persona sin registrarse. */
const { Categoria, Partido, Noticia, Jugador, Usuario, Config } = require("../models");
const est = require("../services/estadisticas");

async function categoriaElegida(req) {
  const cats = await Categoria.activas();
  const cfg = await Config.obtener();
  const sel = cats.find((c) => c.id === req.query.cat || String(c.anio) === req.params.anio) || cats.find((c) => c.anio === cfg.temporada - 10) || cats[0];
  return { cats, sel };
}

exports.inicio = async (req, res) => {
  const cfg = await Config.obtener();
  const proximos = await est.proximos(cfg.temporada);
  const primerDia = proximos[0] && proximos[0].dia;
  res.render("public/inicio", {
    titulo: null,
    proximos: proximos.filter((p) => p.dia === primerDia),
    resultados: await est.ultimosResultados(cfg.temporada, 4),
    noticias: (await Noticia.publicadas()).slice(0, 3),
    totalJugadores: await Jugador.contar((j) => j.activo !== false),
    totalCategorias: (await Categoria.activas()).length,
  });
};

exports.club = async (req, res) => {
  const cats = await Categoria.activas();
  const comision = await Usuario.todos((u) => u.activo && u.roles.some((r) => r === "admin" || r === "tesorero"));
  const entrenadores = await Promise.all(cats.map(async (c) => ({ c, e: await Usuario.porId(c.entrenador) })));
  res.render("public/club", { titulo: "El club", comision, entrenadores });
};

exports.categorias = async (req, res) => {
  const cfg = await Config.obtener();
  const { cats, sel } = await categoriaElegida(req);
  res.render("public/categorias", {
    titulo: "Categorías", cats, sel,
    entrenador: await Usuario.porId(sel.entrenador),
    jugadores: await Jugador.deCategoria(sel.id),
    tabla: await est.tabla(sel.id, cfg.temporada),
    posicion: await est.posicionClub(sel.id, cfg.temporada),
    proximo: (await Partido.delClub(sel.id, cfg.temporada, false))[0] || null,
  });
};

exports.fixture = async (req, res) => {
  const cfg = await Config.obtener();
  const { cats, sel } = await categoriaElegida(req);
  const vista = ["proximos", "resultados", "tabla", "fechas"].includes(req.query.vista) ? req.query.vista : "proximos";
  const datos = { titulo: "Fixture", cats, sel, vista };
  if (vista === "tabla") datos.tabla = await est.tabla(sel.id, cfg.temporada);
  else if (vista === "resultados") datos.partidos = await Partido.delClub(sel.id, cfg.temporada, true);
  else if (vista === "proximos") datos.partidos = await Partido.delClub(sel.id, cfg.temporada, false);
  else {
    const ps = await Partido.todos((p) => p.categoria === sel.id && p.temporada === cfg.temporada);
    const fechas = {};
    ps.sort((a, b) => a.dia.localeCompare(b.dia)).forEach((p) => (fechas[p.fecha] ||= []).push(p));
    datos.fechas = Object.entries(fechas);
  }
  res.render("public/fixture", datos);
};

exports.noticias = async (req, res) => res.render("public/noticias", { titulo: "Noticias", noticias: await Noticia.publicadas() });

exports.noticia = async (req, res, next) => {
  const n = await Noticia.porId(req.params.id);
  if (!n || n.publicada === false) return next();
  res.render("public/noticia", { titulo: n.titulo, n });
};

exports.galeria = async (req, res) => res.render("public/galeria", { titulo: "Galería" });

exports.haceteSocio = async (req, res) => res.render("public/socios", { titulo: "Hacete socio" });

exports.contacto = async (req, res) => res.render("public/contacto", { titulo: "Contacto", enviado: false });

exports.enviarContacto = async (req, res) => {
  const { nombre, contacto, mensaje } = req.body;
  if (!nombre || !contacto || !mensaje) {
    req.session.flash = { tipo: "error", texto: "Completá tu nombre, cómo contactarte y el mensaje." };
    return res.redirect("/contacto");
  }
  const { notificarRol } = require("../services/notificaciones");
  await notificarRol("admin", `Mensaje de contacto de ${String(nombre).slice(0, 80)} (${String(contacto).slice(0, 80)}): ${String(mensaje).slice(0, 400)}`);
  req.session.flash = { tipo: "ok", texto: "Mensaje enviado a secretaría. Te contestamos a la brevedad." };
  res.redirect("/contacto");
};
