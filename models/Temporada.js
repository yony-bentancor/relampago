/*
 * Temporada cerrada (historial de solo lectura).
 * Campos: id, anio, cerrada (fecha), resumen [ { categoria, anioCategoria, pos, pj, g, e, p, gf, gc, jugadores, entrenador } ],
 *         cuotas { emitido, cobrado }
 */
const Modelo = require("./Modelo");

class Temporada extends Modelo {
  static coleccion = "temporadas";
  static prefijo = "t";

  static async historial() {
    const ts = await this.todos();
    return ts.sort((a, b) => b.anio - a.anio);
  }
}

module.exports = Temporada;
