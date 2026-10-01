/*
 * Solicitud de inscripción de un jugador.
 * Campos: id, nombre, apellido, nacimiento, ci, categoria, socio, estado (pendiente | en revisión | aprobada | rechazada),
 *         fecha, docs { cedula, carne, otros }, autorizaImagen, carneVence, medica { observaciones, prestador }, nota, revisadaPor
 */
const Modelo = require("./Modelo");

class Inscripcion extends Modelo {
  static coleccion = "inscripciones";
  static prefijo = "i";
  static ESTADOS = ["pendiente", "en revisión", "aprobada", "rechazada"];
  static abiertas(i) { return i.estado === "pendiente" || i.estado === "en revisión"; }
}

module.exports = Inscripcion;
