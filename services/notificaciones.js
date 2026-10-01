/* Avisos dentro de la plataforma. En el sistema real también podrían salir por correo o WhatsApp. */
const { Notificacion, Usuario } = require("../models");
const { ahora } = require("./fechas");

async function notificar(usuarioId, texto, { tipo = "info", enlace = null } = {}) {
  if (!usuarioId) return null;
  return Notificacion.crear({ para: usuarioId, fecha: ahora(), texto, tipo, enlace, leida: false });
}

async function notificarRol(rol, texto, opciones) {
  const us = await Usuario.conRol(rol);
  await Promise.all(us.map((u) => notificar(u.id, texto, opciones)));
  return us.length;
}

module.exports = { notificar, notificarRol };
