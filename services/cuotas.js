/* Genera automáticamente la cuota del mes para cada jugador activo. */
const { Cuota, Jugador, Config } = require("../models");
const { hoy } = require("./fechas");

async function generarCuotasDelMes() {
  const cfg = await Config.obtener();
  const h = hoy();
  const anio = Number(h.slice(0, 4)), mes = Number(h.slice(5, 7));
  if (!cfg.mesesCuota.includes(mes)) return 0;
  const periodo = `${anio}-${String(mes).padStart(2, "0")}`;
  const jugadores = await Jugador.todos((j) => j.activo !== false);
  const existentes = new Set((await Cuota.todos((q) => q.periodo === periodo)).map((q) => q.jugador));
  // El primer jugador de cada familia paga la cuota completa; los hermanos, la reducida.
  const porSocio = {};
  jugadores.sort((a, b) => a.alta.localeCompare(b.alta) || a.id.localeCompare(b.id)).forEach((j) => (porSocio[j.socio] ||= []).push(j));
  let creadas = 0;
  for (const hijos of Object.values(porSocio)) {
    for (const [i, j] of hijos.entries()) {
      if (existentes.has(j.id)) continue;
      await Cuota.crear({ jugador: j.id, socio: j.socio, periodo, monto: i === 0 ? cfg.cuota : cfg.cuotaHermano,
        vence: `${periodo}-${String(cfg.diaVencimiento).padStart(2, "0")}`, estado: "pendiente", pago: null });
      creadas++;
    }
  }
  return creadas;
}

module.exports = { generarCuotasDelMes };
