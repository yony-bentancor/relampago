const roleMiddleware = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/auth/login");
    }

    const rolUsuario = req.session.user.rol;

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).send("Acceso denegado");
    }

    next();
  };
};

module.exports = roleMiddleware;
