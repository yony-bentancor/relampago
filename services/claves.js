/* Hash de contraseñas con scrypt (incluido en Node, no requiere dependencias). */
const crypto = require("crypto");

function hashClave(clave) {
  const sal = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(clave), sal, 32).toString("hex");
  return `scrypt$${sal}$${hash}`;
}

function verificarClave(clave, guardada) {
  if (!guardada || !guardada.startsWith("scrypt$")) return false;
  const [, sal, hash] = guardada.split("$");
  const calc = crypto.scryptSync(String(clave), sal, 32);
  const esperado = Buffer.from(hash, "hex");
  return esperado.length === calc.length && crypto.timingSafeEqual(calc, esperado);
}

module.exports = { hashClave, verificarClave };
