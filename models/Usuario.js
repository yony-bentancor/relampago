/*
 * Usuario: cualquier persona que ingresa al sistema.
 * Campos: id, nombre, apellido, email, telefono, clave (hash), roles[], activo,
 *         socioId (si es socio), delegadoDe[] (ids de categorías), ultimoIngreso
 * Roles posibles: admin, tesorero, entrenador, delegado, comunicacion, cantina, socio
 */
const Modelo = require("./Modelo");
const { verificarClave } = require("../services/claves");

const ROLES = {
  admin: "Administrador",
  tesorero: "Tesorero",
  entrenador: "Entrenador",
  delegado: "Delegado",
  comunicacion: "Comunicación",
  cantina: "Cantina",
  socio: "Socio",
};

class Usuario extends Modelo {
  static coleccion = "usuarios";
  static prefijo = "u";
  static ROLES = ROLES;

  static async porEmail(email) {
    const e = String(email || "").trim().toLowerCase();
    return this.uno((u) => u.email.toLowerCase() === e);
  }

  static async autenticar(email, clave) {
    const u = await this.porEmail(email);
    if (!u || !u.activo) return null;
    return verificarClave(clave, u.clave) ? u : null;
  }

  static async conRol(rol) { return this.todos((u) => u.roles.includes(rol) && u.activo); }

  static nombreCompleto(u) { return u ? `${u.nombre} ${u.apellido}` : "—"; }
  static iniciales(u) { return u ? (u.nombre[0] || "") + (u.apellido[0] || "") : ""; }

  /** Datos del usuario sin la clave, para mostrar en las vistas. */
  static publico(u) {
    if (!u) return null;
    const { clave, ...resto } = u;
    return resto;
  }
}

module.exports = Usuario;
