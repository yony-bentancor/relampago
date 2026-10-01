/* Ingreso, registro y salida. */
const config = require("../config");
const { Usuario, Socio } = require("../models");
const { hashClave } = require("../services/claves");
const { notificarRol } = require("../services/notificaciones");
const { inicioDe } = require("../services/menu");
const { ahora } = require("../services/fechas");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.formIngreso = async (req, res) => {
  if (req.usuario) return res.redirect("/panel");
  const prueba = config.modoDemo ? await Usuario.todos((u) => u.prueba) : [];
  res.render("auth/ingresar", { titulo: "Ingresar", prueba, email: "", claveDemo: config.modoDemo ? config.claveDemo : null });
};

exports.ingresar = async (req, res, next) => {
  const { email, clave } = req.body;
  const u = await Usuario.autenticar(email, clave);
  if (!u) {
    req.session.flash = { tipo: "error", texto: "El correo o la contraseña no son correctos." };
    return res.redirect("/ingresar");
  }
  const volverA = req.session.volverA;
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.usuarioId = u.id;
    u.ultimoIngreso = ahora();
    Usuario.guardar(u);
    req.session.flash = { tipo: "ok", texto: `Hola, ${u.nombre}. Ingresaste como ${u.roles.map((r) => Usuario.ROLES[r]).join(", ")}.` };
    res.redirect(volverA && volverA.startsWith("/") && !volverA.startsWith("//") ? volverA : inicioDe(u));
  });
};

exports.formRegistro = (req, res) => {
  if (req.usuario) return res.redirect("/panel");
  res.render("auth/registro", { titulo: "Crear cuenta", datos: {} });
};

exports.registrar = async (req, res) => {
  const d = req.body;
  const errores = [];
  if (!d.nombre || !d.apellido) errores.push("Completá tu nombre y apellido.");
  if (!EMAIL.test(d.email || "")) errores.push("Escribí un correo válido.");
  if (!d.clave || d.clave.length < 6) errores.push("La contraseña tiene que tener al menos 6 caracteres.");
  if (d.clave !== d.clave2) errores.push("Las dos contraseñas no coinciden.");
  if (!d.acepto) errores.push("Tenés que aceptar el reglamento del club.");
  if (await Usuario.porEmail(d.email)) errores.push("Ya hay una cuenta con ese correo. Probá ingresar.");
  if (errores.length) return res.status(400).render("auth/registro", { titulo: "Crear cuenta", datos: d, errores });

  const u = await Usuario.crear({ nombre: d.nombre.trim(), apellido: d.apellido.trim(), email: d.email.trim().toLowerCase(), telefono: (d.telefono || "").trim(), clave: hashClave(d.clave), roles: ["socio"], activo: true });
  const s = await Socio.crear({ usuario: u.id, nro: await Socio.siguienteNumero(), alta: ahora().slice(0, 10), direccion: "", parentesco: d.vinculo || "Responsable", apellidoFamilia: u.apellido, emergencia: { nombre: "", telefono: "", vinculo: "" } });
  await Usuario.actualizar(u.id, { socioId: s.id });
  await notificarRol("admin", `Nuevo socio registrado: ${Usuario.nombreCompleto(u)} (N.º ${s.nro}).`, { enlace: "/panel/usuarios" });
  req.session.regenerate(() => {
    req.session.usuarioId = u.id;
    req.session.flash = { tipo: "ok", texto: `Bienvenido, ${u.nombre}. Ya sos socio N.º ${s.nro}. Ahora podés inscribir a tu hijo o hija.` };
    res.redirect("/panel/inscribir");
  });
};

exports.salir = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("relampago.sid");
    res.redirect("/");
  });
};
