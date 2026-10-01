/*
 * Convocatoria de un partido.
 * Campos: id, partido, jugadores [ids], citacion, publicada, publicadaEl
 */
const Modelo = require("./Modelo");

class Convocatoria extends Modelo {
  static coleccion = "convocatorias";
  static prefijo = "v";

  static async dePartido(partidoId) { return this.uno((c) => c.partido === partidoId); }
}

module.exports = Convocatoria;
