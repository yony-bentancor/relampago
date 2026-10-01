/* Cantina online: carrito y compra para usuarios registrados. */
const { Producto, Pedido, Usuario } = require("../models");
const { notificarRol, notificar } = require("../services/notificaciones");
const { flash } = require("../services/util");
const { ahora } = require("../services/fechas");

const carrito = (req) => (req.session.carrito ||= {});

exports.tienda = async (req, res) => {
  const rubro = Producto.RUBROS.includes(req.query.rubro) ? req.query.rubro : "";
  const productos = (await Producto.aLaVenta()).filter((p) => !rubro || p.rubro === rubro);
  const c = carrito(req);
  const items = [];
  for (const [id, cant] of Object.entries(c)) { const p = await Producto.porId(id); if (p && p.activo) items.push({ p, cant }); else delete c[id]; }
  const misPedidos = (await Pedido.todos((o) => o.usuario === req.usuario.id)).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  res.render("panel/comun/tienda", { titulo: "Cantina online", productos, rubro, rubros: Producto.RUBROS, items, total: items.reduce((t, i) => t + i.p.precio * i.cant, 0), misPedidos, claseBody: items.length ? "con-carrito" : "", pagos: Pedido.PAGOS });
};

exports.carrito = async (req, res) => {
  const p = await Producto.porId(req.body.producto);
  const c = carrito(req);
  if (p && p.activo) {
    const n = (c[p.id] || 0) + (parseInt(req.body.cambio, 10) || 0);
    if (n > p.stock) flash(req, "alerta", `No hay más stock de ${p.nombre}.`);
    else if (n <= 0) delete c[p.id];
    else c[p.id] = n;
  }
  const rubro = Producto.RUBROS.includes(req.body.rubro) ? req.body.rubro : "";
  res.redirect(`/panel/tienda${rubro ? "?rubro=" + encodeURIComponent(rubro) : ""}#p-${req.body.producto}`);
};

exports.vaciar = (req, res) => { req.session.carrito = {}; res.redirect("/panel/tienda"); };

exports.comprar = async (req, res) => {
  const c = carrito(req);
  const items = [];
  for (const [id, cant] of Object.entries(c)) {
    const p = await Producto.porId(id);
    if (!p || !p.activo) continue;
    if (cant > p.stock) { flash(req, "error", `Solo quedan ${p.stock} de ${p.nombre}. Ajustá la cantidad.`); return res.redirect("/panel/tienda"); }
    items.push({ producto: p.id, nombre: p.nombre, precio: p.precio, cant });
  }
  if (!items.length) { flash(req, "error", "El carrito está vacío."); return res.redirect("/panel/tienda"); }
  for (const it of items) { const p = await Producto.porId(it.producto); p.stock -= it.cant; await Producto.guardar(p); }
  const pago = Pedido.PAGOS.includes(req.body.pago) ? req.body.pago : "Pago online";
  const o = await Pedido.crear({ numero: await Pedido.siguienteNumero(), usuario: req.usuario.id, fecha: ahora(), items, total: items.reduce((t, i) => t + i.precio * i.cant, 0), pago, estado: "pendiente" });
  req.session.carrito = {};
  await notificarRol("cantina", `Pedido nuevo N.º ${o.numero} de ${Usuario.nombreCompleto(req.usuario)} por $U ${o.total.toLocaleString("es-UY")}.`, { tipo: "alerta", enlace: "/panel/cantina/pedidos" });
  await notificar(req.usuario.id, `Recibimos tu pedido N.º ${o.numero}. Te avisamos cuando esté listo.`, { enlace: `/panel/tienda/pedido/${o.id}` });
  res.redirect(`/panel/tienda/pedido/${o.id}?nuevo=1`);
};

exports.pedido = async (req, res, next) => {
  const o = await Pedido.porId(req.params.id);
  if (!o) return next();
  if (o.usuario !== req.usuario.id && !req.usuario.roles.some((r) => r === "cantina" || r === "admin")) return res.status(403).render("errores/403", { titulo: "Sin permiso" });
  res.render("panel/comun/pedido", { titulo: `Pedido ${o.numero}`, o, nuevo: req.query.nuevo === "1" });
};
