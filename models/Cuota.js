/*
 * Cuota mensual de un jugador.
 * Campos: id, jugador, socio, periodo (AAAA-MM), monto, vence (AAAA-MM-DD),
 *         estado (pendiente | vencida | a confirmar | pagada),
 *         pago { fecha, metodo, registradoPor, comprobante }
 */
const Modelo = require("./Modelo");
const { hoy, MESES_LARGOS } = require("../services/fechas");

class Cuota extends Modelo {
  static coleccion = "cuotas";
  static prefijo = "q";
  static METODOS = ["Efectivo", "Transferencia", "Pago online", "Débito"];

  static nombreMes(c) {
    const [a, m] = c.periodo.split("-");
    return `${MESES_LARGOS[Number(m) - 1]} ${a}`;
  }

  /** Pasa a "vencida" las cuotas pendientes cuya fecha de vencimiento ya pasó. */
  static async actualizarVencidas() {
    const h = hoy();
    const qs = await this.todos((q) => q.estado === "pendiente" && q.vence < h);
    qs.forEach((q) => { q.estado = "vencida"; });
    if (qs.length) await this.guardar(qs[0]);
    return qs.length;
  }

  static async deSocio(socioId) {
    const qs = await this.todos((q) => q.socio === socioId);
    return qs.sort((a, b) => b.periodo.localeCompare(a.periodo));
  }

  static async deudaDeSocio(socioId) {
    const qs = await this.todos((q) => q.socio === socioId && q.estado === "vencida");
    return qs.reduce((t, q) => t + q.monto, 0);
  }

  static async marcarPagada(cuota, { fecha, metodo, registradoPor, comprobante }) {
    cuota.estado = "pagada";
    cuota.pago = { fecha: fecha || hoy(), metodo: metodo || "Efectivo", registradoPor: registradoPor || null, comprobante: comprobante || (cuota.pago && cuota.pago.comprobante) || null };
    return this.guardar(cuota);
  }
}

module.exports = Cuota;
