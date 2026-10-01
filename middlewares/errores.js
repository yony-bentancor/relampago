/* Páginas de error. */
function noEncontrado(req, res) {
  res.status(404).render("errores/404", { titulo: "Página no encontrada" });
}

// eslint-disable-next-line no-unused-vars
function manejarError(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500);
  if (!res.locals.cfg) return res.type("text").send("Algo salió mal. Probá de nuevo en unos segundos.");
  if (req.accepts("html")) return res.render("errores/500", { titulo: "Algo salió mal", detalle: process.env.NODE_ENV === "production" ? null : err.stack });
  res.json({ error: "Error interno" });
}

module.exports = { noEncontrado, manejarError };
