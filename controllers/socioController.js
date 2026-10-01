/* Área del socio: su familia, inscripciones, partidos, cuotas y pagos. */
const { Jugador, Categoria, Cuota, Inscripcion, Convocatoria, Partido, Entrenamiento, Usuario, Socio, Config } = require("../models");
const est = require("../services/estadisticas");
const { notificar, notificarRol } = require("../services/notificaciones");
const { paraUsuario } = require("../services/comunicados");
const { flash, texto, fechaValida } = require("../services/util");
const { hoy } = require("../services/fechas");

async function socioDe(req) { return req.usuario.socioId ? Socio.porId(req.usuario.socioId) : null; }

exports.familia = async (req, res) => {
  const u = req.usuario, cfg = await Config.obtener();
  const jugadores = await Jugador.deSocio(u.socioId);
  const cuotas = await Cuota.deSocio(u.socioId);
  const vencidas = cuotas.filter((q) => q.estado === "vencida"), pendientes = cuotas.filter((q) => q.estado === "pendiente");
  const cats = [...new Set(jugadores.map((j) => j.categoria))];
  const proximos = (await est.proximos(cfg.temporada, cats)).filter((p, i, a) => a.findIndex((x) => x.categoria === p.categoria) === i);
  const convs = {};
  for (const p of proximos) convs[p.id] = await Convocatoria.uno((c) => c.partido === p.id && c.publicada);
  res.render("panel/socio/familia", {
    titulo: "Mi familia", socio: await socioDe(req), jugadores, vencidas, pendientes, proximos, convs,
    carnes: jugadores.map((j) => ({ j, e: Jugador.estadoCarne(j, cfg.avisoCarneDias) })).filter((x) => x.e.clase !== "ok"),
    inscripciones: (await Inscripcion.todos((i) => i.socio === u.socioId)).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    comunicados: (await paraUsuario(u)).slice(0, 4),
  });
};

exports.misJugadores = async (req, res) => {
  const cfg = await Config.obtener();
  const jugadores = await Jugador.deSocio(req.usuario.socioId);
  const datos = await Promise.all(jugadores.map(async (j) => {
    const c = await Categoria.porId(j.categoria);
    return { j, c, entrenador: await Usuario.porId(c.entrenador), asis: Entrenamiento.asistenciaDe(j.id, await Entrenamiento.deCategoria(j.categoria)), carne: Jugador.estadoCarne(j, cfg.avisoCarneDias), edad: Jugador.edad(j) };
  }));
  res.render("panel/socio/mis-jugadores", { titulo: "Mis jugadores", datos });
};

exports.formInscribir = async (req, res) => {
  res.render("panel/socio/inscribir", { titulo: "Inscribir jugador", categorias: await Categoria.activas(), datos: {}, errores: [] });
};

exports.inscribir = async (req, res) => {
  const u = req.usuario, b = req.body, a = req.archivos || {};
  const categorias = await Categoria.activas();
  const errores = [...(req.erroresSubida || [])];
  if (!b.nombre || !b.apellido) errores.push("Completá el nombre y el apellido del jugador.");
  if (!fechaValida(b.nacimiento)) errores.push("Indicá la fecha de nacimiento.");
  if (!b.ci) errores.push("Indicá la cédula del jugador.");
  if (!a.cedula) errores.push("Adjuntá la foto de la cédula.");
  if (!a.carne) errores.push("Adjuntá el carné de salud.");
  if (!fechaValida(b.carneVence)) errores.push("Indicá el vencimiento del carné de salud.");
  if (!b.declaro) errores.push("Confirmá que la información es correcta.");
  const anio = Number(String(b.nacimiento || "").slice(0, 4));
  const cat = categorias.find((c) => c.anio === anio);
  if (fechaValida(b.nacimiento) && !cat) errores.push(`No hay una categoría para nacidos en ${anio}. Consultá con el club.`);
  if (errores.length) return res.status(400).render("panel/socio/inscribir", { titulo: "Inscribir jugador", categorias, datos: b, errores });

  const doc = (f) => (f ? { archivo: f.archivo, nombreOriginal: f.nombreOriginal, fecha: hoy() } : false);
  const i = await Inscripcion.crear({
    nombre: texto(b.nombre, 60), apellido: texto(b.apellido, 60), nacimiento: b.nacimiento, ci: texto(b.ci, 20), categoria: cat.id, socio: u.socioId,
    estado: "pendiente", fecha: hoy(), docs: { cedula: doc(a.cedula), carne: doc(a.carne), otros: doc(a.otros) },
    autorizaImagen: !!b.autorizaImagen, carneVence: b.carneVence, medica: { observaciones: texto(b.medica, 500) || null, prestador: texto(b.prestador, 60) }, nota: "",
  });
  await notificarRol("admin", `Nueva inscripción: ${i.nombre} ${i.apellido} en ${cat.nombre}.`, { tipo: "alerta", enlace: "/panel/inscripciones" });
  await notificar(u.id, `Recibimos la inscripción de ${i.nombre}. Te avisamos cuando la comisión la revise.`);
  flash(req, "ok", `Inscripción enviada para ${cat.nombre}. La administración ya la puede ver.`);
  res.redirect("/panel/familia");
};

exports.misPartidos = async (req, res) => {
  const cfg = await Config.obtener();
  const jugadores = await Jugador.deSocio(req.usuario.socioId);
  const bloques = await Promise.all(jugadores.map(async (j) => {
    const proximos = await Partido.delClub(j.categoria, cfg.temporada, false);
    const convs = {};
    for (const p of proximos) convs[p.id] = await Convocatoria.uno((c) => c.partido === p.id && c.publicada);
    return { j, c: await Categoria.porId(j.categoria), proximos, convs, jugados: (await Partido.delClub(j.categoria, cfg.temporada, true)).slice(0, 4) };
  }));
  res.render("panel/socio/mis-partidos", { titulo: "Partidos y convocatorias", bloques });
};

exports.misCuotas = async (req, res) => {
  const cuotas = await Cuota.deSocio(req.usuario.socioId);
  const jugadores = Object.fromEntries((await Jugador.todos((j) => j.socio === req.usuario.socioId)).map((j) => [j.id, j]));
  res.render("panel/socio/mis-cuotas", { titulo: "Cuotas", cuotas, jugadores, nombreMes: Cuota.nombreMes, aPagar: cuotas.filter((q) => q.estado === "vencida" || q.estado === "pendiente") });
};

exports.formPagoOnline = async (req, res) => {
  const cuotas = (await Cuota.deSocio(req.usuario.socioId)).filter((q) => q.estado === "vencida" || q.estado === "pendiente");
  if (!cuotas.length) { flash(req, "info", "No tenés cuotas para pagar."); return res.redirect("/panel/mis-cuotas"); }
  const jugadores = Object.fromEntries((await Jugador.todos((j) => j.socio === req.usuario.socioId)).map((j) => [j.id, j]));
  res.render("panel/socio/pago-online", { titulo: "Pago online", cuotas, jugadores, nombreMes: Cuota.nombreMes });
};

/** Pago online SIMULADO: en el sistema real acá se conecta Mercado Pago u otra pasarela. */
exports.pagarOnline = async (req, res) => {
  const u = req.usuario;
  const ids = [].concat(req.body.cuotas || []);
  const cuotas = (await Cuota.deSocio(u.socioId)).filter((q) => ids.includes(q.id) && (q.estado === "vencida" || q.estado === "pendiente"));
  if (!cuotas.length) { flash(req, "error", "Elegí al menos una cuota."); return res.redirect("/panel/mis-cuotas/pagar"); }
  const total = cuotas.reduce((t, q) => t + q.monto, 0);
  for (const q of cuotas) await Cuota.marcarPagada(q, { metodo: "Pago online", registradoPor: null });
  const pesos = "$U " + total.toLocaleString("es-UY");
  await notificarRol("tesorero", `${Usuario.nombreCompleto(u)} pagó online ${pesos} (${cuotas.length} cuota${cuotas.length > 1 ? "s" : ""}).`, { tipo: "ok", enlace: "/panel/cuotas?estado=pagada" });
  await notificar(u.id, `Recibimos tu pago online de ${pesos}. ¡Gracias!`, { tipo: "ok" });
  flash(req, "ok", `Pago aprobado por ${pesos} (simulado). Tesorería ya lo ve.`);
  res.redirect("/panel/mis-cuotas");
};

exports.informarTransferencia = async (req, res) => {
  const u = req.usuario;
  const ids = [].concat(req.body.cuotas || []);
  const comprobante = req.archivos && req.archivos.comprobante;
  const cuotas = (await Cuota.deSocio(u.socioId)).filter((q) => ids.includes(q.id) && (q.estado === "vencida" || q.estado === "pendiente"));
  if (!cuotas.length) { flash(req, "error", "Elegí las cuotas que pagaste."); return res.redirect("/panel/mis-cuotas"); }
  if (!comprobante) { flash(req, "error", (req.erroresSubida || [])[0] || "Adjuntá el comprobante de la transferencia."); return res.redirect("/panel/mis-cuotas"); }
  for (const q of cuotas) { q.estado = "a confirmar"; q.pago = { fecha: hoy(), metodo: "Transferencia", registradoPor: null, comprobante: comprobante.archivo }; }
  await Cuota.guardar(cuotas[0]);
  await notificarRol("tesorero", `${Usuario.nombreCompleto(u)} informó una transferencia por ${cuotas.length} cuota${cuotas.length > 1 ? "s" : ""}.`, { tipo: "alerta", enlace: "/panel/cuotas?estado=a%20confirmar" });
  flash(req, "ok", "Transferencia informada. Tesorería la confirma y te avisa.");
  res.redirect("/panel/mis-cuotas");
};

exports.actualizarCarne = async (req, res, next) => {
  const j = await Jugador.porId(req.params.id);
  if (!j || j.socio !== req.usuario.socioId) return next();
  const a = req.archivos || {};
  if (!a.carne) { flash(req, "error", (req.erroresSubida || [])[0] || "Adjuntá la foto del carné nuevo."); return res.redirect("/panel/mis-jugadores"); }
  if (!fechaValida(req.body.carneVence)) { flash(req, "error", "Indicá la fecha de vencimiento."); return res.redirect("/panel/mis-jugadores"); }
  j.carneVence = req.body.carneVence;
  j.docs = { ...(j.docs || {}), carne: { archivo: a.carne.archivo, nombreOriginal: a.carne.nombreOriginal, fecha: hoy() } };
  await Jugador.guardar(j);
  await notificarRol("admin", `${Usuario.nombreCompleto(req.usuario)} actualizó el carné de salud de ${Jugador.nombreCompleto(j)}.`, { enlace: `/panel/jugadores/${j.id}` });
  flash(req, "ok", `Carné de ${j.nombre} actualizado.`);
  res.redirect("/panel/mis-jugadores");
};
