module.exports = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.session.user || !rolesPermitidos.includes(req.session.user.rol)) {
      return res.status(403).send("No autorizado");
    }
    next();
  };
};
