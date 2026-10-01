/* Partes del panel comunes a todos los usuarios: inicio, avisos, datos personales, ficha de jugador y archivos. */
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { Usuario, Socio, Jugador, Categoria, Notificacion, Entrenamiento, Convocatoria, Partido, Cuota, Inscripcion } = require("../models");
const { inicioDe } = require("../services/menu");
const { paraUsuario } = require("../services/comunicados");
const { hashClave, verificarClave } = require("../services/claves");
const permisos = require("../services/permisos");
const { flash, texto } = require("../services/util");

exports.inicio = (req, res) => res.redirect(inicioDe(req.usuario));

exports.avisos = async (req, res) => {
  const u = req.usuario;
  const notificaciones = await Notificacion.dePara(u.id);
  const sinLeer = new Set(notificaciones.filter((n) => !n.leida).map((n) => n.id));
  notificaciones.forEach((n) => { n.leida = true; });
  if (notificaciones.length) await Notificacion.guardar(notificaciones[0]);
  res.render("panel/comun/avisos", { titulo: "Avisos y comunicados", notificaciones: notificaciones.slice(0, 60), sinLeer, comunicados: (await paraUsuario(u)).slice(0, 40), avisosSinLeer: 0 });
};

exports.perfil = async (req, res) => {
  const socio = req.usuario.socioId ? await Socio.porId(req.usuario.socioId) : null;
  res.render("panel/comun/perfil", { titulo: "Mis datos", socio });
};

exports.guardarPerfil = async (req, res) => {
  const u = req.usuario, b = req.body;
  const email = texto(b.email, 120).toLowerCase();
  if (!b.nombre || !b.apellido || !email) { flash(req, "error", "Nombre, apellido y correo son obligatorios."); return res.redirect("/panel/perfil"); }
  const otro = await Usuario.porEmail(email);
  if (otro && otro.id !== u.id) { flash(req, "error", "Ese correo ya lo usa otra cuenta."); return res.redirect("/panel/perfil"); }
  await Usuario.actualizar(u.id, { nombre: texto(b.nombre, 60), apellido: texto(b.apellido, 60), email, telefono: texto(b.telefono, 30) });
  if (u.socioId) {
    const s = await Socio.porId(u.socioId);
    await Socio.actualizar(s.id, { direccion: texto(b.direccion, 120), emergencia: { nombre: texto(b.emNombre, 80), telefono: texto(b.emTelefono, 30), vinculo: texto(b.emVinculo, 30) } });
  }
  flash(req, "ok", "Datos guardados.");
  res.redirect("/panel/perfil");
};

exports.cambiarClave = async (req, res) => {
  const u = req.usuario, { actual, nueva, nueva2 } = req.body;
  if (!verificarClave(actual, u.clave)) { flash(req, "error", "La contraseña actual no es correcta."); return res.redirect("/panel/perfil"); }
  if (!nueva || nueva.length < 6 || nueva !== nueva2) { flash(req, "error", "La nueva contraseña tiene que tener al menos 6 caracteres y coincidir en los dos campos."); return res.redirect("/panel/perfil"); }
  await Usuario.actualizar(u.id, { clave: hashClave(nueva) });
  flash(req, "ok", "Contraseña cambiada.");
  res.redirect("/panel/perfil");
};

/** Ficha completa del jugador, con control de acceso. */
exports.ficha = async (req, res, next) => {
  const u = req.usuario;
  const j = await Jugador.porId(req.params.id);
  if (!j) return next();
  if (!(await permisos.puedeVerJugador(u, j))) return res.status(403).render("errores/403", { titulo: "Sin permiso" });
  const c = await Categoria.porId(j.categoria);
  const s = await Socio.porId(j.socio);
  const ents = await Entrenamiento.deCategoria(j.categoria);
  const asis = Entrenamiento.asistenciaDe(j.id, ents);
  const convocatorias = await Convocatoria.contar((cv) => cv.jugadores.includes(j.id) && cv.publicada);
  const partidos = await Partido.contar((p) => p.categoria === j.categoria && p.jugado && Partido.esDelClub(p));
  const verCuotas = u.roles.some((r) => ["admin", "tesorero"].includes(r)) || u.socioId === j.socio;
  res.render("panel/comun/ficha", {
    titulo: Jugador.nombreCompleto(j), j, c, s, responsable: s ? await Usuario.porId(s.usuario) : null,
    entrenador: c ? await Usuario.porId(c.entrenador) : null, asis, convocatorias, partidos,
    verMedica: await permisos.puedeVerMedica(u, j), puedeObservar: await permisos.puedeEditarDeportivo(u, j),
    cuotas: verCuotas ? (await Cuota.todos((q) => q.jugador === j.id)).sort((a, b) => b.periodo.localeCompare(a.periodo)) : null,
    estadoCarne: Jugador.estadoCarne(j, res.locals.cfg.avisoCarneDias), edad: Jugador.edad(j),
    autores: Object.fromEntries((await Usuario.todos()).map((x) => [x.id, Usuario.nombreCompleto(x)])),
  });
};

/** Descarga de documentos privados (cédula, carné, comprobantes) solo para quien tiene permiso. */
exports.archivo = async (req, res, next) => {
  const nombre = path.basename(req.params.archivo);
  const ruta = path.join(config.carpetaPrivada, nombre);
  if (!fs.existsSync(ruta)) return next();
  const u = req.usuario;
  const usa = (d) => d && typeof d === "object" && d.archivo === nombre;
  let permitido = u.roles.includes("admin");
  if (!permitido) {
    const j = await Jugador.uno((x) => Object.values(x.docs || {}).some(usa));
    if (j) permitido = await permisos.puedeVerJugador(u, j);
  }
  if (!permitido) {
    const i = await Inscripcion.uno((x) => Object.values(x.docs || {}).some(usa));
    if (i) permitido = u.socioId === i.socio;
  }
  if (!permitido) {
    const q = await Cuota.uno((x) => x.pago && x.pago.comprobante === nombre);
    if (q) permitido = u.roles.includes("tesorero") || u.socioId === q.socio;
  }
  if (!permitido) return res.status(403).render("errores/403", { titulo: "Sin permiso" });
  res.set("Cache-Control", "private, no-store");
  res.sendFile(ruta);
};
