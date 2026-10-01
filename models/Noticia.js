/*
 * Noticia de la web pública.
 * Campos: id, fecha, titulo, seccion, texto, foto (ruta de imagen), publicada, autor
 */
const Modelo = require("./Modelo");

class Noticia extends Modelo {
  static coleccion = "noticias";
  static prefijo = "n";
  static SECCIONES = ["Club", "Resultados", "Comunidad", "Inscripciones"];

  static async publicadas() {
    const ns = await this.todos((n) => n.publicada !== false);
    return ns.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }
}

module.exports = Noticia;
