/*
 * Jugador: la ficha del niño o niña.
 * Campos: id, nombre, apellido, nacimiento, ci, categoria, socio, camiseta, posicion,
 *         carneVence, autorizaImagen, alta, activo,
 *         docs { cedula, carne, autorizacion, fichaMedica } -> cada uno { archivo, nombreOriginal, fecha } o true/false en los datos de prueba
 *         medica { observaciones, grupoSanguineo, prestador, emergenciaMovil }  (información sensible)
 *         observaciones [ { fecha, texto, autor } ]
 */
const Modelo = require("./Modelo");
const { hoy, diasEntre, fechaLarga } = require("../services/fechas");

class Jugador extends Modelo {
  static coleccion = "jugadores";
  static prefijo = "j";

  static async deCategoria(categoriaId) {
    const js = await this.todos((j) => j.categoria === categoriaId && j.activo !== false);
    return js.sort((a, b) => a.camiseta - b.camiseta);
  }

  static async deSocio(socioId) { return this.todos((j) => j.socio === socioId && j.activo !== false); }

  static nombreCompleto(j) { return `${j.nombre} ${j.apellido}`; }

  static edad(j) {
    const n = new Date(j.nacimiento + "T12:00:00"), h = new Date(hoy() + "T12:00:00");
    let a = h.getFullYear() - n.getFullYear();
    if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate(), 12)) a--;
    return a;
  }

  /** Estado del carné de salud: { clase: ok|warn|mal, texto, dias } */
  static estadoCarne(j, diasAviso = 30) {
    if (!j.carneVence) return { clase: "mal", texto: "Sin carné", dias: -1 };
    const d = diasEntre(hoy(), j.carneVence);
    if (d < 0) return { clase: "mal", texto: `Vencido hace ${-d} día${d === -1 ? "" : "s"}`, dias: d };
    if (d <= diasAviso) return { clase: "warn", texto: d === 0 ? "Vence hoy" : `Vence en ${d} día${d === 1 ? "" : "s"}`, dias: d };
    return { clase: "ok", texto: `Vigente hasta ${fechaLarga(j.carneVence)}`, dias: d };
  }

  static docsCompletos(j) {
    return ["cedula", "carne", "autorizacion", "fichaMedica"].every((k) => !!(j.docs && j.docs[k]));
  }
}

module.exports = Jugador;
