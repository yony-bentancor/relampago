/* Control de acceso: sesión iniciada y permisos por rol. */
const { Usuario } = require("../models");

/** Carga el usuario de la sesión en req.usuario. */
async function cargarUsuario(req, res, next) {
  try {
    req.usuario = null;
    if (req.session.usuarioId) {
      const u = await Usuario.porId(req.session.usuarioId);
      if (u && u.activo) req.usuario = u;
      else delete req.session.usuarioId;
    }
    next();
  } catch (e) { next(e); }
}

function requiereSesion(req, res, next) {
  if (req.usuario) return next();
  req.session.volverA = req.originalUrl;
  req.session.flash = { tipo: "info", texto: "Ingresá con tu cuenta para continuar." };
  return res.redirect("/ingresar");
}

/** Permite el acceso si el usuario tiene al menos uno de los roles indicados. */
function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return requiereSesion(req, res, next);
    if (roles.some((r) => req.usuario.roles.includes(r))) return next();
    res.status(403);
    return res.render("errores/403", { titulo: "Sin permiso" });
  };
}

const tieneRol = (usuario, ...roles) => !!usuario && roles.some((r) => usuario.roles.includes(r));

module.exports = { cargarUsuario, requiereSesion, requiereRol, tieneRol };
