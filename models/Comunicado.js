/*
 * Comunicado del club, de un técnico, de la cantina o de tesorería.
 * Campos: id, fecha (ISO), de (id de Usuario), origen (Club | Técnico | Cantina | Tesorería),
 *         para ("todos" | id de categoría | id de socio), titulo, texto
 */
const Modelo = require("./Modelo");

class Comunicado extends Modelo {
  static coleccion = "comunicados";
  static prefijo = "m";

  static async recientes(filtro) {
    const cs = await this.todos(filtro);
    return cs.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }
}

module.exports = Comunicado;
