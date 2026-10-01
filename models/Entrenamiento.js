/*
 * Entrenamiento con su lista de asistencia.
 * Campos: id, categoria, dia, suspendido, asistencia { [jugadorId]: true|false }, tomadaPor
 */
const Modelo = require("./Modelo");

class Entrenamiento extends Modelo {
  static coleccion = "entrenamientos";
  static prefijo = "e";

  static async deCategoria(categoriaId) {
    const es = await this.todos((e) => e.categoria === categoriaId);
    return es.sort((a, b) => a.dia.localeCompare(b.dia));
  }

  static async delDia(categoriaId, dia) { return this.uno((e) => e.categoria === categoriaId && e.dia === dia); }

  /** { presentes, total, porcentaje } de un jugador en una lista de entrenamientos. */
  static asistenciaDe(jugadorId, entrenamientos) {
    const validos = entrenamientos.filter((e) => !e.suspendido && jugadorId in e.asistencia);
    const presentes = validos.filter((e) => e.asistencia[jugadorId]).length;
    return { presentes, total: validos.length, porcentaje: validos.length ? Math.round((presentes / validos.length) * 100) : 0 };
  }
}

module.exports = Entrenamiento;
