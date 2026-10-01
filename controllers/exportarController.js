/* Exportar a PDF o Excel. Cada reporte controla quién lo puede descargar. */
const { Jugador, Categoria, Socio, Usuario, Cuota, Entrenamiento, Inscripcion, Producto, Pedido, Temporada, Config } = require("../models");
const est = require("../services/estadisticas");
const { generarPdf } = require("../services/exportar/pdf");
const { generarXlsx } = require("../services/exportar/xlsx");
const { tieneRol } = require("../middlewares/auth");
const { hoy, fechaLarga, fechaCorta } = require("../services/fechas");

const sinPermiso = () => { const e = new Error("Sin permiso"); e.status = 403; return e; };

async function mapas() {
  const usuarios = Object.fromEntries((await Usuario.todos()).map((u) => [u.id, u]));
  const socios = Object.fromEntries((await Socio.todos()).map((s) => [s.id, { ...s, u: usuarios[s.usuario] }]));
  const jugadores = Object.fromEntries((await Jugador.todos()).map((j) => [j.id, j]));
  const cats = Object.fromEntries((await Categoria.todos()).map((c) => [c.id, c]));
  return { usuarios, socios, jugadores, cats };
}
const nombre = (u) => (u ? `${u.nombre} ${u.apellido}` : "");

/** Categoría pedida, verificando que el usuario sea su entrenador (o admin). */
async function categoriaPermitida(u, id) {
  const c = await Categoria.porId(id);
  if (!c) return null;
  if (tieneRol(u, "admin") || c.entrenador === u.id) return c;
  throw sinPermiso();
}

const REPORTES = {
  async jugadores(u, q) {
    if (!tieneRol(u, "admin", "tesorero")) throw sinPermiso();
    const cfg = await Config.obtener();
    const { socios, cats } = await mapas();
    const js = (await Jugador.todos((j) => j.activo !== false && (!q.cat || j.categoria === q.cat))).sort((a, b) => a.categoria.localeCompare(b.categoria) || a.camiseta - b.camiseta);
    return { titulo: "Padrón de jugadores", subtitulo: `Temporada ${cfg.temporada}${q.cat && cats[q.cat] ? " · " + cats[q.cat].nombre : " · todas las categorías"}`,
      columnas: [{ titulo: "Cat.", ancho: 0.6 }, { titulo: "N.º", ancho: 0.5, tipo: "numero" }, { titulo: "Jugador", ancho: 2.2 }, { titulo: "Nacimiento", ancho: 1 }, { titulo: "Cédula", ancho: 1.1 },
        { titulo: "Responsable", ancho: 2 }, { titulo: "Celular", ancho: 1.2 }, { titulo: "Carné vence", ancho: 1 }, { titulo: "Fotos", ancho: 0.6 }],
      filas: js.map((j) => [cats[j.categoria].anio, j.camiseta, `${j.nombre} ${j.apellido}`, fechaLarga(j.nacimiento), j.ci, nombre(socios[j.socio].u), socios[j.socio].u.telefono, fechaLarga(j.carneVence), j.autorizaImagen ? "Sí" : "No"]),
      resumen: [["Jugadores", String(js.length)], ["Familias", String(new Set(js.map((j) => j.socio)).size)]] };
  },

  async plantel(u, q) {
    const c = await categoriaPermitida(u, q.cat);
    if (!c) throw sinPermiso();
    const { socios } = await mapas();
    const ents = await Entrenamiento.deCategoria(c.id);
    const js = await Jugador.deCategoria(c.id);
    return { titulo: `Plantel ${c.nombre}`, subtitulo: `Entrenador: ${nombre(await Usuario.porId(c.entrenador))} · ${c.entreno}`, horizontal: true,
      columnas: [{ titulo: "N.º", ancho: 0.5, tipo: "numero" }, { titulo: "Jugador", ancho: 2 }, { titulo: "Posición", ancho: 1 }, { titulo: "Edad", ancho: 0.5, tipo: "numero" }, { titulo: "Responsable", ancho: 1.8 },
        { titulo: "Celular", ancho: 1.1 }, { titulo: "Emergencia", ancho: 2 }, { titulo: "Prestador", ancho: 1.1 }, { titulo: "Observación médica", ancho: 2.6 }, { titulo: "Asistencia", ancho: 0.8 }],
      filas: js.map((j) => { const s = socios[j.socio]; const a = Entrenamiento.asistenciaDe(j.id, ents);
        return [j.camiseta, `${j.nombre} ${j.apellido}`, j.posicion, Jugador.edad(j), nombre(s.u), s.u.telefono, `${s.emergencia.nombre} ${s.emergencia.telefono}`.trim(), j.medica.prestador, j.medica.observaciones || "", `${a.porcentaje}%`]; }) };
  },

  async asistencia(u, q) {
    const c = await categoriaPermitida(u, q.cat);
    if (!c) throw sinPermiso();
    const ents = (await Entrenamiento.deCategoria(c.id)).slice(-16);
    const js = await Jugador.deCategoria(c.id);
    return { titulo: `Asistencia ${c.nombre}`, subtitulo: `Últimos ${ents.length} entrenamientos (P = presente, A = ausente, S = suspendido)`, horizontal: true,
      columnas: [{ titulo: "Jugador", ancho: 2.4 }, ...ents.map((e) => ({ titulo: fechaCorta(e.dia).replace(/^\S+ /, ""), ancho: 0.62 })), { titulo: "Total", ancho: 0.7 }],
      filas: js.map((j) => { const a = Entrenamiento.asistenciaDe(j.id, ents); return [`${j.nombre} ${j.apellido}`, ...ents.map((e) => (e.suspendido ? "S" : e.asistencia[j.id] ? "P" : j.id in e.asistencia ? "A" : "")), `${a.presentes}/${a.total}`]; }) };
  },

  async cuotas(u, q) {
    if (!tieneRol(u, "admin", "tesorero")) throw sinPermiso();
    const { socios, jugadores, cats } = await mapas();
    const estado = q.estado || "todas";
    const qs = (await Cuota.todos((x) => (estado === "todas" || x.estado === estado) && (!q.mes || x.periodo === q.mes) && (!q.cat || (jugadores[x.jugador] && jugadores[x.jugador].categoria === q.cat))))
      .sort((a, b) => b.periodo.localeCompare(a.periodo) || nombre(socios[a.socio].u).localeCompare(nombre(socios[b.socio].u)));
    return { titulo: "Cuotas", subtitulo: [estado === "todas" ? "Todos los estados" : `Estado: ${estado}`, q.mes ? Cuota.nombreMes({ periodo: q.mes }) : "todos los meses", q.cat && cats[q.cat] ? cats[q.cat].nombre : ""].filter(Boolean).join(" · "),
      columnas: [{ titulo: "Mes", ancho: 1.1 }, { titulo: "Socio", ancho: 2 }, { titulo: "N.º socio", ancho: 0.7, tipo: "numero" }, { titulo: "Jugador", ancho: 1.8 }, { titulo: "Cat.", ancho: 0.5 }, { titulo: "Monto", ancho: 0.9, tipo: "pesos" }, { titulo: "Estado", ancho: 0.9 }, { titulo: "Fecha de pago", ancho: 1 }, { titulo: "Forma de pago", ancho: 1.1 }],
      filas: qs.map((x) => [Cuota.nombreMes(x), nombre(socios[x.socio].u), socios[x.socio].nro, jugadores[x.jugador] ? `${jugadores[x.jugador].nombre} ${jugadores[x.jugador].apellido}` : "", jugadores[x.jugador] ? cats[jugadores[x.jugador].categoria].anio : "", x.monto, x.estado, x.pago ? fechaLarga(x.pago.fecha) : "", x.pago ? x.pago.metodo : ""]),
      resumen: [["Cuotas", String(qs.length)], ["Total", "$U " + qs.reduce((t, x) => t + x.monto, 0).toLocaleString("es-UY")]] };
  },

  async deudores(u) {
    if (!tieneRol(u, "admin", "tesorero")) throw sinPermiso();
    const { socios } = await mapas();
    const ds = await est.sociosConDeuda();
    return { titulo: "Socios con cuotas vencidas", subtitulo: `Al ${fechaLarga(hoy())}`,
      columnas: [{ titulo: "Socio", ancho: 2.2 }, { titulo: "N.º", ancho: 0.6, tipo: "numero" }, { titulo: "Celular", ancho: 1.2 }, { titulo: "Correo", ancho: 2.2 }, { titulo: "Cuotas", ancho: 0.7, tipo: "numero" }, { titulo: "Deuda", ancho: 1, tipo: "pesos" }],
      filas: ds.map((d) => { const s = socios[d.socio]; return [nombre(s.u), s.nro, s.u.telefono, s.u.email, d.cuotas, d.monto]; }),
      resumen: [["Socios", String(ds.length)], ["Deuda total", "$U " + ds.reduce((t, d) => t + d.monto, 0).toLocaleString("es-UY")]] };
  },

  async cuenta(u, q) {
    const s = await Socio.porId(q.socio);
    if (!s || !(tieneRol(u, "admin", "tesorero") || u.socioId === s.id)) throw sinPermiso();
    const { jugadores } = await mapas();
    const su = await Usuario.porId(s.usuario);
    const qs = await Cuota.deSocio(s.id);
    return { titulo: `Estado de cuenta · ${nombre(su)}`, subtitulo: `Socio N.º ${s.nro} · al ${fechaLarga(hoy())}`,
      columnas: [{ titulo: "Mes", ancho: 1.2 }, { titulo: "Jugador", ancho: 1.8 }, { titulo: "Monto", ancho: 1, tipo: "pesos" }, { titulo: "Vence", ancho: 1 }, { titulo: "Estado", ancho: 1 }, { titulo: "Pagó", ancho: 1 }, { titulo: "Forma de pago", ancho: 1.2 }],
      filas: qs.map((x) => [Cuota.nombreMes(x), jugadores[x.jugador] ? jugadores[x.jugador].nombre : "", x.monto, fechaLarga(x.vence), x.estado, x.pago ? fechaLarga(x.pago.fecha) : "", x.pago ? x.pago.metodo : ""]),
      resumen: [["Pagado", "$U " + qs.filter((x) => x.estado === "pagada").reduce((t, x) => t + x.monto, 0).toLocaleString("es-UY")], ["Deuda vencida", "$U " + qs.filter((x) => x.estado === "vencida").reduce((t, x) => t + x.monto, 0).toLocaleString("es-UY")]] };
  },

  async reporte(u) {
    if (!tieneRol(u, "admin", "tesorero")) throw sinPermiso();
    const cfg = await Config.obtener();
    const meses = await est.resumenCuotasPorMes(cfg.temporada);
    const em = meses.reduce((t, m) => t + m.emitido, 0), co = meses.reduce((t, m) => t + m.cobrado, 0);
    return { titulo: "Reporte mensual de cuotas", subtitulo: `Temporada ${cfg.temporada}`,
      columnas: [{ titulo: "Mes", ancho: 1.4 }, { titulo: "Cuotas", ancho: 0.8, tipo: "numero" }, { titulo: "Pagas", ancho: 0.8, tipo: "numero" }, { titulo: "Emitido", ancho: 1.2, tipo: "pesos" }, { titulo: "Cobrado", ancho: 1.2, tipo: "pesos" }, { titulo: "% cobrado", ancho: 0.9, tipo: "numero" }],
      filas: meses.map((m) => [m.mes, m.cuotas, m.pagas, m.emitido, m.cobrado, Math.round((m.cobrado / m.emitido) * 100)]),
      resumen: [["Emitido", "$U " + em.toLocaleString("es-UY")], ["Cobrado", "$U " + co.toLocaleString("es-UY")], ["Cobranza", Math.round((co / (em || 1)) * 100) + "%"]] };
  },

  async carnes(u) {
    if (!tieneRol(u, "admin")) throw sinPermiso();
    const cfg = await Config.obtener();
    const { socios, cats } = await mapas();
    const l = await est.carnesAVencer(cfg.avisoCarneDias);
    return { titulo: "Carnés de salud vencidos y por vencer", subtitulo: `Aviso con ${cfg.avisoCarneDias} días de anticipación · al ${fechaLarga(hoy())}`,
      columnas: [{ titulo: "Jugador", ancho: 2 }, { titulo: "Cat.", ancho: 0.6 }, { titulo: "Vence", ancho: 1 }, { titulo: "Estado", ancho: 1.6 }, { titulo: "Responsable", ancho: 2 }, { titulo: "Celular", ancho: 1.2 }],
      filas: l.map(({ jugador: j, estado }) => [`${j.nombre} ${j.apellido}`, cats[j.categoria].anio, fechaLarga(j.carneVence), estado.texto, nombre(socios[j.socio].u), socios[j.socio].u.telefono]) };
  },

  async inscripciones(u) {
    if (!tieneRol(u, "admin")) throw sinPermiso();
    const { socios, cats } = await mapas();
    const l = (await Inscripcion.todos()).sort((a, b) => b.fecha.localeCompare(a.fecha));
    return { titulo: "Inscripciones", subtitulo: `Al ${fechaLarga(hoy())}`,
      columnas: [{ titulo: "Fecha", ancho: 1 }, { titulo: "Jugador", ancho: 2 }, { titulo: "Categoría", ancho: 1.2 }, { titulo: "Nacimiento", ancho: 1 }, { titulo: "Responsable", ancho: 2 }, { titulo: "Estado", ancho: 1 }],
      filas: l.map((i) => [fechaLarga(i.fecha), `${i.nombre} ${i.apellido}`, cats[i.categoria] ? cats[i.categoria].nombre : "", fechaLarga(i.nacimiento), socios[i.socio] ? nombre(socios[i.socio].u) : "", i.estado]) };
  },

  async productos(u) {
    if (!tieneRol(u, "admin", "cantina")) throw sinPermiso();
    const ps = (await Producto.todos()).sort((a, b) => Producto.RUBROS.indexOf(a.rubro) - Producto.RUBROS.indexOf(b.rubro) || a.nombre.localeCompare(b.nombre));
    return { titulo: "Productos de cantina", subtitulo: `${ps.length} productos`,
      columnas: [{ titulo: "Producto", ancho: 2.6 }, { titulo: "Rubro", ancho: 1 }, { titulo: "Precio", ancho: 1, tipo: "pesos" }, { titulo: "Stock", ancho: 0.7, tipo: "numero" }, { titulo: "A la venta", ancho: 0.8 }],
      filas: ps.map((p) => [p.nombre, p.rubro, p.precio, p.stock, p.activo ? "Sí" : "No"]) };
  },

  async pedidos(u) {
    if (!tieneRol(u, "admin", "cantina")) throw sinPermiso();
    const { usuarios } = await mapas();
    const os = (await Pedido.todos()).sort((a, b) => b.fecha.localeCompare(a.fecha));
    return { titulo: "Pedidos de cantina", subtitulo: `${os.length} pedidos`,
      columnas: [{ titulo: "N.º", ancho: 0.6, tipo: "numero" }, { titulo: "Fecha", ancho: 1.2 }, { titulo: "Socio", ancho: 1.8 }, { titulo: "Detalle", ancho: 3.2 }, { titulo: "Pago", ancho: 1.1 }, { titulo: "Total", ancho: 0.9, tipo: "pesos" }, { titulo: "Estado", ancho: 0.9 }],
      filas: os.map((o) => [o.numero, `${fechaLarga(o.fecha)} ${o.fecha.slice(11, 16)}`, nombre(usuarios[o.usuario]), o.items.map((i) => `${i.cant} × ${i.nombre}`).join(", "), o.pago, o.total, o.estado]),
      resumen: [["Vendido", "$U " + os.reduce((t, o) => t + o.total, 0).toLocaleString("es-UY")]] };
  },

  async tabla(u, q) {
    const cfg = await Config.obtener();
    const c = await Categoria.porId(q.cat);
    if (!c) throw sinPermiso();
    const t = await est.tabla(c.id, cfg.temporada);
    return { titulo: `Tabla de posiciones ${c.nombre}`, subtitulo: `Temporada ${cfg.temporada} · al ${fechaLarga(hoy())}`,
      columnas: [{ titulo: "#", ancho: 0.4, tipo: "numero" }, { titulo: "Equipo", ancho: 2.4 }, ...["PJ", "G", "E", "P", "GF", "GC", "DG", "Pts"].map((x) => ({ titulo: x, ancho: 0.55, tipo: "numero" }))],
      filas: t.map((r, i) => [i + 1, r.equipo, r.pj, r.g, r.e, r.p, r.gf, r.gc, r.gf - r.gc, r.pts]) };
  },

  async temporada(u, q) {
    if (!tieneRol(u, "admin")) throw sinPermiso();
    const t = (await Temporada.historial()).find((x) => String(x.anio) === String(q.anio));
    if (!t) throw sinPermiso();
    return { titulo: `Temporada ${t.anio}`, subtitulo: `Cerrada el ${fechaLarga(t.cerrada)}`,
      columnas: [{ titulo: "Categoría", ancho: 1 }, { titulo: "Posición", ancho: 0.8, tipo: "numero" }, ...["PJ", "G", "E", "P", "GF", "GC"].map((x) => ({ titulo: x, ancho: 0.55, tipo: "numero" })), { titulo: "Plantel", ancho: 0.7, tipo: "numero" }, { titulo: "Entrenador", ancho: 2 }],
      filas: t.resumen.map((r) => [r.anioCategoria, r.pos, r.pj, r.g, r.e, r.p, r.gf, r.gc, r.jugadores, r.entrenador]),
      resumen: t.cuotas ? [["Cuotas emitidas", "$U " + t.cuotas.emitido.toLocaleString("es-UY")], ["Cobrado", "$U " + t.cuotas.cobrado.toLocaleString("es-UY")]] : [] };
  },
};

exports.exportar = async (req, res, next) => {
  try {
    const { tipo, formato } = req.params;
    if (!REPORTES[tipo] || !["pdf", "xlsx"].includes(formato)) return next();
    const reporte = await REPORTES[tipo](req.usuario, req.query);
    const archivo = `${reporte.titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}-${hoy()}.${formato}`;
    const datos = formato === "pdf" ? generarPdf(reporte) : generarXlsx(reporte);
    res.set("Content-Type", formato === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.set("Content-Disposition", `attachment; filename="${archivo}"`);
    res.set("Cache-Control", "private, no-store");
    res.send(datos);
  } catch (e) {
    if (e.status === 403) return res.status(403).render("errores/403", { titulo: "Sin permiso" });
    next(e);
  }
};
