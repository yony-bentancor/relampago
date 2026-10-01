/* Variables y funciones disponibles en todas las vistas. */
const config = require("../config");
const { Usuario, Notificacion, Config, Producto, Categoria } = require("../models");
const { seccionesDe } = require("../services/menu");
const f = require("../services/fechas");

const pesos = (n) => "$U " + Math.round(Number(n) || 0).toLocaleString("es-UY");

module.exports = async function locales(req, res, next) {
  try {
    const u = req.usuario;
    res.locals.usuario = Usuario.publico(u);
    res.locals.ruta = req.path;
    res.locals.urlActual = req.originalUrl;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
    res.locals.cfg = await Config.obtener();
    res.locals.categoriasPorId = Object.fromEntries((await Categoria.todos()).map((c) => [c.id, c]));
    res.locals.modoDemo = config.modoDemo;
    res.locals.ROLES = Usuario.ROLES;
    res.locals.tieneRol = (...roles) => !!u && roles.some((r) => u.roles.includes(r));
    res.locals.secciones = u ? await seccionesDe(u) : [];
    res.locals.avisosSinLeer = u ? await Notificacion.sinLeer(u.id) : 0;
    const carrito = req.session.carrito || {};
    res.locals.itemsCarrito = Object.values(carrito).reduce((a, b) => a + b, 0);
    // Formatos
    res.locals.pesos = pesos;
    res.locals.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    res.locals.fCorta = f.fechaCorta;
    res.locals.fLarga = f.fechaLarga;
    res.locals.fHora = f.hora;
    res.locals.hoy = f.hoy();
    res.locals.nombreDe = Usuario.nombreCompleto;
    res.locals.inicialesDe = Usuario.iniciales;
    res.locals.inicialesProducto = Producto.iniciales;
    res.locals.qs = (extra) => { const p = new URLSearchParams({ ...req.query, ...extra }); for (const [k, v] of [...p]) if (v === "" || v === "undefined") p.delete(k); const s = p.toString(); return s ? "?" + s : ""; };
    next();
  } catch (e) { next(e); }
};
