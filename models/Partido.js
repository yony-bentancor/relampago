/*
 * Partido del fixture (incluye los partidos entre rivales para calcular la tabla).
 * Campos: id, temporada, categoria, fecha (número de fecha o "Amistoso"), dia (AAAA-MM-DD),
 *         hora, local, visitante, gl, gv (goles), jugado, cancha, cargadoPor
 */
const Modelo = require("./Modelo");

const CLUB = "Relámpago";

class Partido extends Modelo {
  static coleccion = "partidos";
  static prefijo = "p";
  static CLUB = CLUB;

  static esDelClub(p) { return p.local === CLUB || p.visitante === CLUB; }

  static async delClub(categoriaId, temporada, jugado) {
    const ps = await this.todos((p) => p.categoria === categoriaId && p.temporada === temporada && this.esDelClub(p) &&
      (jugado === undefined || p.jugado === jugado));
    return ps.sort((a, b) => (jugado ? b.dia.localeCompare(a.dia) : a.dia.localeCompare(b.dia)));
  }

  static resultadoClub(p) {
    if (!p.jugado) return null;
    const dif = p.local === CLUB ? p.gl - p.gv : p.gv - p.gl;
    return dif > 0 ? "gano" : dif < 0 ? "perdio" : "empato";
  }

  static rival(p) { return p.local === CLUB ? p.visitante : p.local; }
}

module.exports = Partido;
