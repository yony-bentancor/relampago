/*
 * Socio: la familia o responsable asociado al club. Un socio puede tener varios jugadores.
 * Campos: id, usuario (id de Usuario), nro, alta, direccion, parentesco,
 *         emergencia { nombre, telefono, vinculo }
 */
const Modelo = require("./Modelo");

class Socio extends Modelo {
  static coleccion = "socios";
  static prefijo = "s";

  static async porUsuario(usuarioId) { return this.uno((s) => s.usuario === usuarioId); }

  static async siguienteNumero() {
    const todos = await this.todos();
    return todos.reduce((m, s) => Math.max(m, s.nro || 0), 1000) + 1;
  }
}

module.exports = Socio;
