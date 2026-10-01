/*
 * Producto de la cantina.
 * Campos: id, nombre, rubro (Bebidas | Comidas | Golosinas | Helados), precio, stock, activo, foto
 */
const Modelo = require("./Modelo");

class Producto extends Modelo {
  static coleccion = "productos";
  static prefijo = "x";
  static RUBROS = ["Bebidas", "Comidas", "Golosinas", "Helados"];

  static async aLaVenta() {
    const ps = await this.todos((p) => p.activo);
    return ps.sort((a, b) => this.RUBROS.indexOf(a.rubro) - this.RUBROS.indexOf(b.rubro) || a.nombre.localeCompare(b.nombre));
  }

  static iniciales(p) {
    return p.nombre.split(" ").filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }
}

module.exports = Producto;
