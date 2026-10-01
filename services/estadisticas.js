/* Cálculos deportivos y de cuotas que usan varias pantallas. */
const { Partido, Cuota, Jugador } = require("../models");
const { MESES_LARGOS } = require("./fechas");

/** Tabla de posiciones de una categoría en una temporada. */
async function tabla(categoriaId, temporada) {
  const ps = await Partido.todos((p) => p.categoria === categoriaId && p.temporada === temporada && typeof p.fecha === "number");
  const t = {};
  const fila = (e) => (t[e] ||= { equipo: e, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 });
  ps.forEach((p) => { fila(p.local); fila(p.visitante); });
  ps.filter((p) => p.jugado).forEach((p) => {
    const a = fila(p.local), b = fila(p.visitante);
    a.pj++; b.pj++; a.gf += p.gl; a.gc += p.gv; b.gf += p.gv; b.gc += p.gl;
    if (p.gl > p.gv) { a.g++; b.p++; a.pts += 3; } else if (p.gl < p.gv) { b.g++; a.p++; b.pts += 3; } else { a.e++; b.e++; a.pts++; b.pts++; }
  });
  return Object.values(t).sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || x.equipo.localeCompare(y.equipo));
}

async function posicionClub(categoriaId, temporada) {
  const t = await tabla(categoriaId, temporada);
  return t.findIndex((r) => r.equipo === Partido.CLUB) + 1;
}

/** Próximos partidos del club (opcionalmente solo de algunas categorías). */
async function proximos(temporada, categorias) {
  const ps = await Partido.todos((p) => p.temporada === temporada && !p.jugado && Partido.esDelClub(p) && (!categorias || categorias.includes(p.categoria)));
  return ps.sort((a, b) => (a.dia + (a.hora || "")).localeCompare(b.dia + (b.hora || "")));
}

async function ultimosResultados(temporada, cantidad = 6) {
  const ps = await Partido.todos((p) => p.temporada === temporada && p.jugado && Partido.esDelClub(p));
  return ps.sort((a, b) => b.dia.localeCompare(a.dia) || (b.hora || "").localeCompare(a.hora || "")).slice(0, cantidad);
}

/** Resumen de cuotas por mes: emitido, cobrado, cantidad. */
async function resumenCuotasPorMes(anio) {
  const qs = await Cuota.todos((q) => q.periodo.startsWith(String(anio)));
  const meses = {};
  qs.forEach((q) => {
    const m = (meses[q.periodo] ||= { periodo: q.periodo, mes: MESES_LARGOS[Number(q.periodo.slice(5)) - 1], emitido: 0, cobrado: 0, cuotas: 0, pagas: 0 });
    m.emitido += q.monto; m.cuotas++;
    if (q.estado === "pagada") { m.cobrado += q.monto; m.pagas++; }
  });
  return Object.values(meses).sort((a, b) => a.periodo.localeCompare(b.periodo));
}

async function sociosConDeuda() {
  const qs = await Cuota.todos((q) => q.estado === "vencida");
  const por = {};
  qs.forEach((q) => { const s = (por[q.socio] ||= { socio: q.socio, cuotas: 0, monto: 0 }); s.cuotas++; s.monto += q.monto; });
  return Object.values(por).sort((a, b) => b.monto - a.monto);
}

async function carnesAVencer(diasAviso) {
  const js = await Jugador.todos((j) => j.activo !== false);
  return js.map((j) => ({ jugador: j, estado: Jugador.estadoCarne(j, diasAviso) }))
    .filter((x) => x.estado.clase !== "ok")
    .sort((a, b) => a.estado.dias - b.estado.dias);
}

module.exports = { tabla, posicionClub, proximos, ultimosResultados, resumenCuotasPorMes, sociosConDeuda, carnesAVencer };
