/* Gestión de la cantina: productos, pedidos y QR del mostrador. */
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { Producto, Pedido, Usuario } = require("../models");
const { notificar } = require("../services/notificaciones");
const { flash, texto, entero } = require("../services/util");

exports.productos = async (req, res) => {
  const rubro = Producto.RUBROS.includes(req.query.rubro) ? req.query.rubro : "";
  const ps = (await Producto.todos((p) => !rubro || p.rubro === rubro)).sort((a, b) => Producto.RUBROS.indexOf(a.rubro) - Producto.RUBROS.indexOf(b.rubro) || a.nombre.localeCompare(b.nombre));
  res.render("panel/cantina/productos", { titulo: "Productos de cantina", productos: ps, rubro, rubros: Producto.RUBROS, total: await Producto.contar() });
};

exports.formProducto = async (req, res, next) => {
  const p = req.params.id ? await Producto.porId(req.params.id) : { nombre: "", rubro: "Bebidas", precio: "", stock: "", activo: true, foto: null };
  if (!p) return next();
  res.render("panel/cantina/producto-form", { titulo: req.params.id ? "Editar producto" : "Agregar producto", p, rubros: Producto.RUBROS });
};

exports.guardarProducto = async (req, res) => {
  const b = req.body;
  const nombre = texto(b.nombre, 80);
  const volverA = req.params.id ? `/panel/cantina/productos/${req.params.id}/editar` : "/panel/cantina/productos/nuevo";
  if (req.erroresSubida && req.erroresSubida.length) { flash(req, "error", req.erroresSubida[0]); return res.redirect(volverA); }
  if (!nombre || !(entero(b.precio, -1) >= 0) || !(entero(b.stock, -1) >= 0)) { flash(req, "error", "Completá nombre, precio y stock."); return res.redirect(volverA); }
  const datos = { nombre, rubro: Producto.RUBROS.includes(b.rubro) ? b.rubro : "Bebidas", precio: entero(b.precio), stock: entero(b.stock), activo: b.activo === "1" };
  if (req.archivos && req.archivos.foto) datos.foto = req.archivos.foto.url;
  if (b.quitarFoto) datos.foto = null;
  if (req.params.id) await Producto.actualizar(req.params.id, datos);
  else await Producto.crear({ foto: null, ...datos });
  flash(req, "ok", `${nombre}: guardado.`);
  res.redirect("/panel/cantina/productos");
};

exports.borrarProducto = async (req, res) => {
  const p = await Producto.porId(req.params.id);
  if (p) {
    if (p.foto && p.foto.startsWith("/subidas/")) fs.rm(path.join(config.carpetaPublica, path.basename(p.foto)), () => {});
    await Producto.eliminar(p.id);
    flash(req, "ok", `${p.nombre}: quitado de la cantina.`);
  }
  res.redirect("/panel/cantina/productos");
};

exports.alternarProducto = async (req, res) => {
  const p = await Producto.porId(req.params.id);
  if (p) { p.activo = !p.activo; await Producto.guardar(p); flash(req, "ok", `${p.nombre}: ${p.activo ? "a la venta" : "oculto en la tienda"}.`); }
  res.redirect(`/panel/cantina/productos${req.body.rubro ? "?rubro=" + encodeURIComponent(req.body.rubro) : ""}`);
};

exports.pedidos = async (req, res) => {
  const estado = ["pendiente", "listo", "entregado", "todos"].includes(req.query.estado) ? req.query.estado : "abiertos";
  const todos = (await Pedido.todos()).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const lista = todos.filter((o) => estado === "todos" || (estado === "abiertos" ? o.estado !== "entregado" : o.estado === estado));
  const usuarios = Object.fromEntries((await Usuario.todos()).map((u) => [u.id, u]));
  res.render("panel/cantina/pedidos", { titulo: "Pedidos", estado, lista, usuarios, paraPreparar: todos.filter((o) => o.estado === "pendiente").length, listos: todos.filter((o) => o.estado === "listo").length, vendido: todos.reduce((t, o) => t + o.total, 0), cantidad: todos.length });
};

exports.estadoPedido = async (req, res, next) => {
  const o = await Pedido.porId(req.params.id);
  if (!o) return next();
  if (!Pedido.ESTADOS.includes(req.body.estado)) return res.redirect("/panel/cantina/pedidos");
  o.estado = req.body.estado;
  await Pedido.guardar(o);
  if (o.estado === "listo") await notificar(o.usuario, `Tu pedido N.º ${o.numero} está listo para retirar en la cantina.`, { tipo: "ok", enlace: `/panel/tienda/pedido/${o.id}` });
  flash(req, "ok", o.estado === "listo" ? `Pedido ${o.numero} listo. Se avisó al socio.` : `Pedido ${o.numero} ${o.estado}.`);
  res.redirect("/panel/cantina/pedidos");
};

exports.qr = async (req, res) => {
  const base = config.urlSitio || `${req.protocol}://${req.get("host")}`;
  res.render("panel/cantina/qr", { titulo: "QR del mostrador", url: `${base}/cantina` });
};
