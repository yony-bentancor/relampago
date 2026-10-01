/* Área del entrenador: solo ve las categorías que tiene asignadas (el administrador ve todas). */
const { Jugador, Entrenamiento, Convocatoria, Partido, Config, Socio } = require("../models");
const { notificar } = require("../services/notificaciones");
const { flash, texto, categoriasDeTrabajo, elegir } = require("../services/util");
const permisos = require("../services/permisos");
const { hoy, fechaCorta } = require("../services/fechas");

async function contexto(req) {
  const cats = await categoriasDeTrabajo(req.usuario);
  return { cats, cat: elegir(cats, req.query.cat || req.body.cat) };
}

exports.plantel = async (req, res) => {
  const { cats, cat } = await contexto(req);
  if (!cat) return res.render("panel/entrenador/sin-categoria", { titulo: "Mis categorías" });
  const cfg = await Config.obtener();
  const jugadores = await Jugador.deCategoria(cat.id);
  const ents = await Entrenamiento.deCategoria(cat.id);
  const filas = jugadores.map((j) => ({ j, asis: Entrenamiento.asistenciaDe(j.id, ents), carne: Jugador.estadoCarne(j, cfg.avisoCarneDias), docs: Jugador.docsCompletos(j), edad: Jugador.edad(j) }));
  res.render("panel/entrenador/plantel", { titulo: cat.nombre, cats, cat, filas, alertas: filas.filter((f) => f.carne.clase !== "ok" || !f.docs) });
};

exports.asistencia = async (req, res) => {
  const { cats, cat } = await contexto(req);
  if (!cat) return res.render("panel/entrenador/sin-categoria", { titulo: "Asistencia" });
  const jugadores = await Jugador.deCategoria(cat.id);
  const ents = (await Entrenamiento.deCategoria(cat.id)).slice(-24);
  const dia = req.query.dia && /^\d{4}-\d{2}-\d{2}$/.test(req.query.dia) ? req.query.dia : hoy();
  const delDia = await Entrenamiento.delDia(cat.id, dia);
  res.render("panel/entrenador/asistencia", { titulo: "Asistencia", cats, cat, jugadores, ents, dia, delDia, tomar: req.query.tomar === "1" || !!req.query.dia });
};

exports.guardarAsistencia = async (req, res) => {
  const { cat } = await contexto(req);
  if (!cat) return res.redirect("/panel/asistencia");
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(req.body.dia || "") ? req.body.dia : hoy();
  const presentes = new Set([].concat(req.body.presentes || []));
  const jugadores = await Jugador.deCategoria(cat.id);
  const asistencia = Object.fromEntries(jugadores.map((j) => [j.id, presentes.has(j.id)]));
  const suspendido = !!req.body.suspendido;
  const ex = await Entrenamiento.delDia(cat.id, dia);
  if (ex) await Entrenamiento.actualizar(ex.id, { asistencia: suspendido ? {} : asistencia, suspendido, tomadaPor: req.usuario.id });
  else await Entrenamiento.crear({ categoria: cat.id, dia, asistencia: suspendido ? {} : asistencia, suspendido, tomadaPor: req.usuario.id });
  flash(req, "ok", suspendido ? `Entrenamiento del ${fechaCorta(dia)} marcado como suspendido.` : `Asistencia guardada: ${presentes.size} de ${jugadores.length} presentes.`);
  res.redirect(`/panel/asistencia?cat=${cat.id}`);
};

exports.convocatorias = async (req, res) => {
  const { cats, cat } = await contexto(req);
  if (!cat) return res.render("panel/entrenador/sin-categoria", { titulo: "Convocatorias" });
  const cfg = await Config.obtener();
  const proximos = await Partido.delClub(cat.id, cfg.temporada, false);
  const partido = proximos.find((p) => p.id === req.query.partido) || proximos[0] || null;
  const conv = partido ? await Convocatoria.dePartido(partido.id) : null;
  const jugadores = await Jugador.deCategoria(cat.id);
  res.render("panel/entrenador/convocatorias", { titulo: "Convocatorias", cats, cat, proximos, partido, conv, jugadores: jugadores.map((j) => ({ j, carne: Jugador.estadoCarne(j, cfg.avisoCarneDias) })) });
};

exports.guardarConvocatoria = async (req, res, next) => {
  const p = await Partido.porId(req.params.partido);
  if (!p) return next();
  const cats = await categoriasDeTrabajo(req.usuario);
  if (!cats.some((c) => c.id === p.categoria)) return res.status(403).render("errores/403", { titulo: "Sin permiso" });
  const jugadores = await Jugador.deCategoria(p.categoria);
  const elegidos = [].concat(req.body.convocados || []).filter((id) => jugadores.some((j) => j.id === id));
  const publicar = req.body.accion === "publicar";
  let cv = await Convocatoria.dePartido(p.id);
  const datos = { jugadores: elegidos, citacion: texto(req.body.citacion, 200) || "Presentarse 40 minutos antes con equipo completo." };
  if (publicar) Object.assign(datos, { publicada: true, publicadaEl: new Date().toISOString() });
  if (cv) await Convocatoria.actualizar(cv.id, datos); else cv = await Convocatoria.crear({ partido: p.id, publicada: false, ...datos });
  if (publicar) {
    const rival = Partido.rival(p);
    for (const j of jugadores) {
      const s = await Socio.porId(j.socio);
      if (!s) continue;
      await notificar(s.usuario, elegidos.includes(j.id)
        ? `${j.nombre} está convocado para el ${fechaCorta(p.dia)} a las ${p.hora} contra ${rival}. ${datos.citacion}`
        : `${j.nombre} no fue convocado para el partido del ${fechaCorta(p.dia)} contra ${rival}.`, { enlace: "/panel/mis-partidos" });
    }
    flash(req, "ok", `Convocatoria publicada: ${elegidos.length} convocados. Se avisó a las familias.`);
  } else flash(req, "ok", "Convocatoria guardada como borrador.");
  res.redirect(`/panel/convocatorias?cat=${p.categoria}&partido=${p.id}`);
};

exports.agregarObservacion = async (req, res, next) => {
  const j = await Jugador.porId(req.params.id);
  if (!j) return next();
  if (!(await permisos.puedeEditarDeportivo(req.usuario, j))) return res.status(403).render("errores/403", { titulo: "Sin permiso" });
  const t = texto(req.body.texto, 400);
  if (t) { (j.observaciones ||= []).unshift({ fecha: hoy(), texto: t, autor: req.usuario.id }); await Jugador.guardar(j); flash(req, "ok", "Observación agregada."); }
  res.redirect(`/panel/jugadores/${j.id}`);
};

exports.editarDeportivo = async (req, res, next) => {
  const j = await Jugador.porId(req.params.id);
  if (!j) return next();
  if (!(await permisos.puedeEditarDeportivo(req.usuario, j))) return res.status(403).render("errores/403", { titulo: "Sin permiso" });
  const n = parseInt(req.body.camiseta, 10);
  if (Number.isFinite(n) && n > 0 && n < 100) j.camiseta = n;
  if (["Arquero", "Defensa", "Mediocampo", "Delantero", "A definir"].includes(req.body.posicion)) j.posicion = req.body.posicion;
  await Jugador.guardar(j);
  flash(req, "ok", "Datos deportivos actualizados.");
  res.redirect(`/panel/jugadores/${j.id}`);
};

