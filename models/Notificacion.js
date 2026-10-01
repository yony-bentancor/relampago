/*
 * Aviso personal para un usuario (pago registrado, convocatoria, vencimiento, inscripción...).
 * Campos: id, para (id de Usuario), fecha (ISO), texto, tipo (info | ok | alerta), leida, enlace
 */
const Modelo = require("./Modelo");

class Notificacion extends Modelo {
  static coleccion = "notificaciones";
  static prefijo = "a";

  static async dePara(usuarioId) {
    const ns = await this.todos((n) => n.para === usuarioId);
    return ns.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  static async sinLeer(usuarioId) { return this.contar((n) => n.para === usuarioId && !n.leida); }
}

module.exports = Notificacion;
