/* Tesorería: cuotas, pagos, deudas, estado de cuenta y reportes. */
const { Cuota, Socio, Usuario, Jugador, Categoria, Config } = require("../models");
const est = require("../services/estadisticas");
const { notificar } = require("../services/notificaciones");
const { flash, volver, fechaValida } = require("../services/util");
const { hoy, MESES_LARGOS } = require("../services/fechas");

const pesos = (n) => "$U " + Math.round(n).toLocaleString("es-UY");

async function mapas() {
  const usuarios = Object.fromEntries((await Usuario.todos()).map((u) => [u.id, u]));
  const socios = Object.fromEntries((await Socio.todos()).map((s) => [s.id, { ...s, u: usuarios[s.usuario] }]));
  const jugadores = Object.fromEntries((await Jugador.todos()).map((j) => [j.id, j]));
  return { usuarios, socios, jugadores };
}

exports.resumen = async (req, res) => {
  const cfg = await Config.obtener();
  const meses = await est.resumenCuotasPorMes(cfg.temporada);
  const periodoActual = hoy().slice(0, 7);
  const hasta = meses.filter((m) => m.periodo <= periodoActual);
  const emitido = hasta.reduce((t, m) => t + m.emitido, 0), cobrado = hasta.reduce((t, m) => t + m.cobrado, 0);
  const deudores = await est.sociosConDeuda();
  const { socios } = await mapas();
  res.render("panel/tesoreria/resumen", {
    titulo: "Tesorería", meses, emitido, cobrado, deudores: deudores.map((d) => ({ ...d, s: socios[d.socio] })),
    deuda: deudores.reduce((t, d) => t + d.monto, 0), mesActual: meses.find((m) => m.periodo === periodoActual),
    aConfirmar: await Cuota.contar((q) => q.estado === "a confirmar"),
  });
};

exports.cuotas = async (req, res) => {
  const cfg = await Config.obtener();
  const estado = ["a confirmar", "vencida", "pendiente", "pagada", "todas"].includes(req.query.estado) ? req.query.estado : "vencida";
  const periodo = /^\d{4}-\d{2}$/.test(req.query.mes || "") ? req.query.mes : "";
  const cat = req.query.cat || "";
  const { socios, jugadores } = await mapas();
  let qs = await Cuota.todos((q) => (estado === "todas" || q.estado === estado) && (!periodo || q.periodo === periodo) && (!cat || (jugadores[q.jugador] && jugadores[q.jugador].categoria === cat)));
  qs.sort((a, b) => b.periodo.localeCompare(a.periodo) || (socios[a.socio].u.apellido || "").localeCompare(socios[b.socio].u.apellido || ""));
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1), porPagina = 60;
  res.render("panel/tesoreria/cuotas", {
    titulo: "Cuotas y pagos", estado, periodo, cat, total: qs.length, suma: qs.reduce((t, q) => t + q.monto, 0),
    cuotas: qs.slice((pagina - 1) * porPagina, pagina * porPagina), pagina, paginas: Math.ceil(qs.length / porPagina),
    socios, jugadores, nombreMes: Cuota.nombreMes, categorias: await Categoria.activas(),
    meses: (await est.resumenCuotasPorMes(cfg.temporada)).map((m) => m.periodo),
  });
};

exports.formPago = async (req, res, next) => {
  const q = await Cuota.porId(req.params.id);
  if (!q) return next();
  const { socios, jugadores } = await mapas();
  res.render("panel/tesoreria/pago", { titulo: "Registrar pago", q, s: socios[q.socio], j: jugadores[q.jugador], nombreMes: Cuota.nombreMes, metodos: Cuota.METODOS, volver: String(req.query.volver || "").startsWith("/panel/") ? req.query.volver : "" });
};

exports.registrarPago = async (req, res, next) => {
  const q = await Cuota.porId(req.params.id);
  if (!q) return next();
  if (q.estado === "pagada") { flash(req, "info", "Esa cuota ya estaba paga."); return res.redirect(req.body.volver || "/panel/cuotas"); }
  const metodo = Cuota.METODOS.includes(req.body.metodo) ? req.body.metodo : "Efectivo";
  await Cuota.marcarPagada(q, { fecha: fechaValida(req.body.fecha) ? req.body.fecha : hoy(), metodo, registradoPor: req.usuario.id });
  const s = await Socio.porId(q.socio), j = await Jugador.porId(q.jugador);
  const avisar = req.body.avisar !== "0";
  if (avisar) await notificar(s.usuario, `Registramos tu pago de ${pesos(q.monto)} de la cuota de ${Cuota.nombreMes(q)} de ${j.nombre}. ¡Gracias!`, { tipo: "ok", enlace: "/panel/mis-cuotas" });
  const u = await Usuario.porId(s.usuario);
  flash(req, "ok", `Cuota de ${Cuota.nombreMes(q)} marcada como paga.${avisar ? ` Se avisó a ${u.nombre} en el momento.` : ""}`);
  const destino = String(req.body.volver || "");
  res.redirect(destino.startsWith("/panel/") ? destino : "/panel/cuotas");
};

exports.cuenta = async (req, res) => {
  const { socios, jugadores } = await mapas();
  const conJugadores = Object.values(socios).filter((s) => Object.values(jugadores).some((j) => j.socio === s.id) && s.u)
    .sort((a, b) => (a.u.apellido + a.u.nombre).localeCompare(b.u.apellido + b.u.nombre));
  let sid = req.params.socio || req.query.socio;
  if (!socios[sid]) sid = (await est.sociosConDeuda())[0]?.socio || conJugadores[0]?.id;
  const s = socios[sid];
  const cuotas = await Cuota.deSocio(sid);
  res.render("panel/tesoreria/cuenta", {
    titulo: "Estado de cuenta", s, conJugadores, cuotas, jugadores, nombreMes: Cuota.nombreMes,
    hijos: Object.values(jugadores).filter((j) => j.socio === sid),
    pagado: cuotas.filter((q) => q.estado === "pagada").reduce((t, q) => t + q.monto, 0),
    deuda: cuotas.filter((q) => q.estado === "vencida").reduce((t, q) => t + q.monto, 0),
    nombres: Object.fromEntries((await Usuario.todos()).map((u) => [u.id, u.nombre])),
  });
};

exports.reportes = async (req, res) => {
  const cfg = await Config.obtener();
  const meses = await est.resumenCuotasPorMes(cfg.temporada);
  const periodoActual = hoy().slice(0, 7);
  const cats = await Categoria.activas();
  const jugadores = Object.fromEntries((await Jugador.todos()).map((j) => [j.id, j]));
  const qs = await Cuota.todos((q) => q.periodo <= periodoActual && q.periodo.startsWith(String(cfg.temporada)));
  const porCategoria = cats.map((c) => {
    const d = qs.filter((q) => jugadores[q.jugador] && jugadores[q.jugador].categoria === c.id);
    const emitido = d.reduce((t, q) => t + q.monto, 0), cobrado = d.filter((q) => q.estado === "pagada").reduce((t, q) => t + q.monto, 0);
    return { c, emitido, cobrado };
  });
  const porMetodo = {};
  qs.filter((q) => q.estado === "pagada" && q.pago).forEach((q) => { porMetodo[q.pago.metodo] = (porMetodo[q.pago.metodo] || 0) + q.monto; });
  res.render("panel/tesoreria/reportes", { titulo: "Reportes", meses, porCategoria, porMetodo: Object.entries(porMetodo).sort((a, b) => b[1] - a[1]), MESES_LARGOS });
};

exports.recordatorio = async (req, res) => {
  const deudores = await est.sociosConDeuda();
  for (const d of deudores) {
    const s = await Socio.porId(d.socio);
    await notificar(s.usuario, `Recordatorio de tesorería: tenés ${d.cuotas} cuota${d.cuotas > 1 ? "s" : ""} vencida${d.cuotas > 1 ? "s" : ""} por ${pesos(d.monto)}. Podés pagar online desde Cuotas.`, { tipo: "alerta", enlace: "/panel/mis-cuotas" });
  }
  flash(req, "ok", `Recordatorio enviado a ${deudores.length} socios.`);
  volver(req, res, "/panel/tesoreria");
};

exports.avisoSocio = async (req, res, next) => {
  const s = await Socio.porId(req.params.socio);
  if (!s) return next();
  const deuda = await Cuota.deudaDeSocio(s.id);
  await notificar(s.usuario, deuda ? `Tesorería: tu saldo vencido es de ${pesos(deuda)}. Podés pagar online desde Cuotas.` : "Tesorería: estás al día con las cuotas. ¡Gracias!", { tipo: deuda ? "alerta" : "ok", enlace: "/panel/mis-cuotas" });
  flash(req, "ok", "Aviso enviado al socio.");
  res.redirect(`/panel/cuenta/${s.id}`);
};
