/* Pequeñas utilidades para los controladores. */
const { Categoria } = require("../models");

function flash(req, tipo, texto) { req.session.flash = { tipo, texto }; }

/** Vuelve a la página anterior (si es del mismo sitio) o a la indicada. */
function volver(req, res, porDefecto) {
  const ref = req.get("referer") || "";
  try {
    const u = new URL(ref);
    if (u.host === req.get("host")) return res.redirect(u.pathname + u.search);
  } catch { /* sin referer */ }
  return res.redirect(porDefecto);
}

const texto = (v, max = 500) => String(v ?? "").trim().slice(0, max);
const entero = (v, def = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : def; };
const fechaValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

/** Categorías que puede ver/gestionar un usuario como entrenador (el admin ve todas). */
async function categoriasDeTrabajo(usuario) {
  if (usuario.roles.includes("admin")) return Categoria.activas();
  return Categoria.deEntrenador(usuario.id);
}

/** Elige la categoría pedida en ?cat= si está permitida; si no, la primera. */
function elegir(cats, id) { return cats.find((c) => c.id === id) || cats[0] || null; }

module.exports = { flash, volver, texto, entero, fechaValida, categoriasDeTrabajo, elegir };
