/* Quién puede ver qué información de un jugador. */
const { Categoria } = require("../models");

async function puedeVerJugador(u, j) {
  if (!u || !j) return false;
  if (u.roles.includes("admin") || u.roles.includes("tesorero")) return true;
  if (u.socioId && u.socioId === j.socio) return true;
  const c = await Categoria.porId(j.categoria);
  return !!c && c.entrenador === u.id;
}

/** La información médica es sensible: solo administración, el entrenador de la categoría y la familia. */
async function puedeVerMedica(u, j) {
  if (!u || !j) return false;
  if (u.roles.includes("admin")) return true;
  if (u.socioId && u.socioId === j.socio) return true;
  const c = await Categoria.porId(j.categoria);
  return !!c && c.entrenador === u.id;
}

async function puedeEditarDeportivo(u, j) {
  if (!u || !j) return false;
  if (u.roles.includes("admin")) return true;
  const c = await Categoria.porId(j.categoria);
  return !!c && c.entrenador === u.id;
}

module.exports = { puedeVerJugador, puedeVerMedica, puedeEditarDeportivo };
