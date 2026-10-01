/*
 * Categoría: un año de nacimiento (por ejemplo Relámpago 2016).
 * Campos: id, anio, nombre, entrenador (id de Usuario), delegado (id de Usuario),
 *         hora (partidos de los sábados), entreno (días y horario), activa
 */
const Modelo = require("./Modelo");

class Categoria extends Modelo {
  static coleccion = "categorias";
  static prefijo = "c";

  static async activas() {
    const cs = await this.todos((c) => c.activa !== false);
    return cs.sort((a, b) => a.anio - b.anio);
  }

  static async deEntrenador(usuarioId) {
    const cs = await this.todos((c) => c.activa !== false && c.entrenador === usuarioId);
    return cs.sort((a, b) => a.anio - b.anio);
  }
}

module.exports = Categoria;
