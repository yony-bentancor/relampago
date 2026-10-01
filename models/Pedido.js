/*
 * Pedido de la cantina.
 * Campos: id, numero, usuario, fecha (ISO), items [ { producto, nombre, precio, cant } ], total,
 *         pago (Pago online | QR en cantina | Transferencia), estado (pendiente | listo | entregado)
 */
const Modelo = require("./Modelo");

class Pedido extends Modelo {
  static coleccion = "pedidos";
  static prefijo = "o";
  static ESTADOS = ["pendiente", "listo", "entregado"];
  static PAGOS = ["Pago online", "QR en cantina", "Transferencia"];

  static async siguienteNumero() {
    const ps = await this.todos();
    return ps.reduce((m, p) => Math.max(m, p.numero || 0), 100) + 1;
  }
}

module.exports = Pedido;
