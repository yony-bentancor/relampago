/* Comunicados, noticias, galería y sponsors. */
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { Comunicado, Noticia, Categoria, Socio, Usuario, Config } = require("../models");
const { decorar, destinatarios } = require("../services/comunicados");
const { notificar } = require("../services/notificaciones");
const { flash, texto } = require("../services/util");
const { hoy, ahora } = require("../services/fechas");

/** Desde dónde puede enviar cada usuario y a quién. */
async function opciones(u) {
  const origenes = [];
  if (u.roles.some((r) => r === "admin" || r === "comunicacion")) origenes.push("Club");
  if (u.roles.includes("entrenador")) origenes.push("Técnico");
  if (u.roles.includes("cantina")) origenes.push("Cantina");
  if (u.roles.includes("tesorero")) origenes.push("Tesorería");
  const todas = await Categoria.activas();
  const propias = await Categoria.deEntrenador(u.id);
  return { origenes, todas, propias };
}

function destinosPermitidos(origen, op) {
  if (origen === "Técnico") return op.propias.map((c) => c.id);
  const d = ["todos", ...op.todas.map((c) => c.id)];
  if (origen === "Club" || origen === "Tesorería") d.push("socio");
  return d;
}

exports.comunicados = async (req, res) => {
  const u = req.usuario;
  const op = await opciones(u);
  const veTodo = u.roles.some((r) => r === "admin" || r === "comunicacion");
  const enviados = await decorar((await Comunicado.recientes((m) => veTodo || m.de === u.id)).slice(0, 30));
  const socios = [];
  for (const s of await Socio.todos()) { const us = await Usuario.porId(s.usuario); if (us) socios.push({ id: s.id, nombre: Usuario.nombreCompleto(us) }); }
  socios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  res.render("panel/comunicacion/comunicados", { titulo: "Comunicados", op, enviados, socios, destinos: Object.fromEntries(op.origenes.map((o) => [o, destinosPermitidos(o, op)])) });
};

exports.enviar = async (req, res) => {
  const u = req.usuario, b = req.body;
  const op = await opciones(u);
  const origen = op.origenes.includes(b.origen) ? b.origen : op.origenes[0];
  let para = b.para;
  if (!origen || !destinosPermitidos(origen, op).includes(para)) { flash(req, "error", "No podés enviar a ese destinatario."); return res.redirect("/panel/comunicados"); }
  if (para === "socio") para = b.socio;
  const titulo = texto(b.titulo, 120), cuerpo = texto(b.texto, 2000);
  if (!titulo || !cuerpo || !para || (para !== "todos" && !para.startsWith("c") && !(await Socio.porId(para)))) { flash(req, "error", "Completá el título, el mensaje y el destinatario."); return res.redirect("/panel/comunicados"); }
  await Comunicado.crear({ fecha: ahora(), de: u.id, origen, para, titulo, texto: cuerpo });
  const ids = await destinatarios(para);
  for (const id of ids) await notificar(id, `${origen}: ${titulo}`, { enlace: "/panel/avisos" });
  flash(req, "ok", `Comunicado enviado a ${ids.length} familia${ids.length === 1 ? "" : "s"}.`);
  res.redirect("/panel/comunicados");
};

/* ---------- Noticias ---------- */
exports.noticias = async (req, res) => {
  const ns = (await Noticia.todos()).sort((a, b) => b.fecha.localeCompare(a.fecha));
  res.render("panel/comunicacion/noticias", { titulo: "Noticias", noticias: ns });
};

exports.formNoticia = async (req, res, next) => {
  const n = req.params.id ? await Noticia.porId(req.params.id) : { titulo: "", seccion: "Club", texto: "", foto: null, publicada: true };
  if (!n) return next();
  res.render("panel/comunicacion/noticia-form", { titulo: req.params.id ? "Editar noticia" : "Nueva noticia", n, seccionesNoticia: Noticia.SECCIONES, fotosGaleria: (await Config.obtener()).galeria });
};

exports.guardarNoticia = async (req, res) => {
  const b = req.body;
  const titulo = texto(b.titulo, 140), cuerpo = texto(b.texto, 5000);
  if (!titulo || !cuerpo) { flash(req, "error", "La noticia necesita título y texto."); return res.redirect(req.params.id ? `/panel/noticias/${req.params.id}/editar` : "/panel/noticias/nueva"); }
  let foto = b.fotoGaleria || null;
  if (req.archivos && req.archivos.foto) foto = req.archivos.foto.url;
  const datos = { titulo, texto: cuerpo, seccion: Noticia.SECCIONES.includes(b.seccion) ? b.seccion : "Club", publicada: b.publicada === "1" };
  if (foto || b.quitarFoto) datos.foto = b.quitarFoto ? null : foto;
  if (req.params.id) await Noticia.actualizar(req.params.id, datos);
  else await Noticia.crear({ ...datos, foto: datos.foto || null, fecha: hoy(), autor: req.usuario.id });
  flash(req, "ok", datos.publicada ? "Noticia publicada en la web." : "Noticia guardada como borrador.");
  res.redirect("/panel/noticias");
};

exports.borrarNoticia = async (req, res) => {
  await Noticia.eliminar(req.params.id);
  flash(req, "ok", "Noticia eliminada.");
  res.redirect("/panel/noticias");
};

/* ---------- Galería y sponsors ---------- */
exports.galeria = async (req, res) => {
  const { Jugador } = require("../models");
  const sinAutorizacion = await Jugador.todos((j) => j.activo !== false && !j.autorizaImagen);
  res.render("panel/comunicacion/galeria", { titulo: "Galería y sponsors", sinAutorizacion, categoriasPorId: res.locals.categoriasPorId });
};

exports.subirFoto = async (req, res) => {
  const f = req.archivos && req.archivos.foto;
  if (!f) { flash(req, "error", (req.erroresSubida || [])[0] || "Elegí una foto."); return res.redirect("/panel/galeria"); }
  if (!req.body.confirmo) { fs.rm(path.join(config.carpetaPublica, f.archivo), () => {}); flash(req, "error", "Confirmá que todos los jugadores que aparecen tienen autorización de imagen."); return res.redirect("/panel/galeria"); }
  const cfg = await Config.obtener();
  await Config.actualizar({ galeria: [{ foto: f.url, titulo: texto(req.body.titulo, 100) || "Foto del club" }, ...cfg.galeria] });
  flash(req, "ok", "Foto publicada en la galería.");
  res.redirect("/panel/galeria");
};

exports.quitarFoto = async (req, res) => {
  const cfg = await Config.obtener();
  const i = parseInt(req.body.indice, 10);
  if (cfg.galeria[i]) { cfg.galeria.splice(i, 1); await Config.actualizar({ galeria: cfg.galeria }); flash(req, "ok", "Foto quitada de la galería."); }
  res.redirect("/panel/galeria");
};

exports.agregarSponsor = async (req, res) => {
  const cfg = await Config.obtener();
  const nombre = texto(req.body.nombre, 60);
  if (nombre) { await Config.actualizar({ sponsors: [...cfg.sponsors, { nombre, rubro: texto(req.body.rubro, 60) }] }); flash(req, "ok", `${nombre} agregado a los sponsors.`); }
  res.redirect("/panel/galeria");
};

exports.quitarSponsor = async (req, res) => {
  const cfg = await Config.obtener();
  const i = parseInt(req.body.indice, 10);
  if (cfg.sponsors[i]) { const [s] = cfg.sponsors.splice(i, 1); await Config.actualizar({ sponsors: cfg.sponsors }); flash(req, "ok", `${s.nombre} quitado de los sponsors.`); }
  res.redirect("/panel/galeria");
};
