/* Administración: control general del club. */
const { Usuario, Socio, Jugador, Categoria, Inscripcion, Cuota, Partido, Temporada, Config } = require("../models");
const est = require("../services/estadisticas");
const { notificar } = require("../services/notificaciones");
const { hashClave } = require("../services/claves");
const { flash, texto, entero } = require("../services/util");
const { hoy } = require("../services/fechas");

const ROLES_VALIDOS = Object.keys(Usuario.ROLES);

exports.dashboard = async (req, res) => {
  const cfg = await Config.obtener();
  const periodoActual = hoy().slice(0, 7);
  const qs = await Cuota.todos((q) => q.periodo <= periodoActual);
  const cobradas = qs.filter((q) => q.estado === "pagada"), pendientes = qs.filter((q) => q.estado !== "pagada");
  const proximos = await est.proximos(cfg.temporada);
  const primerDia = proximos[0] && proximos[0].dia;
  const inscripciones = (await Inscripcion.todos(Inscripcion.abiertas)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  res.render("panel/admin/dashboard", {
    titulo: "Administración",
    jugadores: await Jugador.contar((j) => j.activo !== false),
    socios: await Socio.contar(), sociosConJugadores: new Set((await Jugador.todos((j) => j.activo !== false)).map((j) => j.socio)).size,
    categorias: (await Categoria.activas()).length, entrenadores: (await Usuario.conRol("entrenador")).length,
    cobrado: cobradas.reduce((t, q) => t + q.monto, 0), cuotasCobradas: cobradas.length,
    pendiente: pendientes.reduce((t, q) => t + q.monto, 0), cuotasPendientes: pendientes.length,
    sociosConDeuda: new Set(qs.filter((q) => q.estado === "vencida").map((q) => q.socio)).size,
    proximos: proximos.filter((p) => p.dia === primerDia), inscripciones,
    sociosInscripcion: Object.fromEntries(await Promise.all(inscripciones.map(async (i) => { const s = await Socio.porId(i.socio); return [i.socio, s ? await Usuario.porId(s.usuario) : null]; }))),
    carnes: (await est.carnesAVencer(cfg.avisoCarneDias)).slice(0, 6),
  });
};

/* ---------- Inscripciones ---------- */
exports.inscripciones = async (req, res) => {
  const filtro = ["abiertas", "aprobada", "rechazada", "todas"].includes(req.query.estado) ? req.query.estado : "abiertas";
  const lista = (await Inscripcion.todos((i) => filtro === "todas" || (filtro === "abiertas" ? Inscripcion.abiertas(i) : i.estado === filtro))).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const responsables = {};
  for (const i of lista) { const s = await Socio.porId(i.socio); responsables[i.id] = s ? await Usuario.porId(s.usuario) : null; }
  res.render("panel/admin/inscripciones", { titulo: "Inscripciones", filtro, lista, responsables });
};

exports.cambiarInscripcion = async (req, res, next) => {
  const i = await Inscripcion.porId(req.params.id);
  if (!i) return next();
  const estado = req.body.estado;
  if (!Inscripcion.ESTADOS.includes(estado)) return res.redirect("/panel/inscripciones");
  i.estado = estado; i.revisadaPor = req.usuario.id; i.nota = texto(req.body.nota, 300) || i.nota;
  await Inscripcion.guardar(i);
  const s = await Socio.porId(i.socio), u = s && (await Usuario.porId(s.usuario));
  const cat = await Categoria.porId(i.categoria);
  if (estado === "aprobada") {
    const plantel = await Jugador.deCategoria(i.categoria);
    const camiseta = plantel.reduce((m, j) => Math.max(m, j.camiseta || 0), 1) + 1;
    const j = await Jugador.crear({ nombre: i.nombre, apellido: i.apellido, nacimiento: i.nacimiento, ci: i.ci, categoria: i.categoria, socio: i.socio,
      camiseta, posicion: "A definir", carneVence: i.carneVence, autorizaImagen: !!i.autorizaImagen,
      docs: { cedula: i.docs.cedula || false, carne: i.docs.carne || false, autorizacion: true, fichaMedica: !!(i.medica && (i.medica.observaciones || i.medica.prestador)) },
      medica: { observaciones: (i.medica && i.medica.observaciones) || null, grupoSanguineo: "", prestador: (i.medica && i.medica.prestador) || "", emergenciaMovil: "" },
      observaciones: [], alta: hoy(), activo: true, inscripcion: i.id });
    if (u && !u.roles.includes("socio")) { u.roles.push("socio"); await Usuario.guardar(u); }
    if (u) await notificar(u.id, `La inscripción de ${i.nombre} en ${cat.nombre} fue aprobada. ¡Bienvenido al club!`, { tipo: "ok", enlace: `/panel/jugadores/${j.id}` });
    if (cat.entrenador) await notificar(cat.entrenador, `Se sumó ${i.nombre} ${i.apellido} a ${cat.nombre}.`, { enlace: `/panel/jugadores/${j.id}` });
    flash(req, "ok", `${i.nombre} quedó inscripto en ${cat.nombre}.${u ? ` Se avisó a ${u.nombre}.` : ""}`);
  } else {
    if (u) await notificar(u.id, `La inscripción de ${i.nombre} pasó a: ${estado}.${i.nota ? " " + i.nota : ""}`, { tipo: estado === "rechazada" ? "alerta" : "info", enlace: "/panel/familia" });
    flash(req, "ok", `Inscripción ${estado}.${u ? ` Se avisó a ${u.nombre}.` : ""}`);
  }
  res.redirect("/panel/inscripciones");
};

/* ---------- Usuarios y permisos ---------- */
exports.usuarios = async (req, res) => {
  const filtro = ["equipo", "socios", "todos"].includes(req.query.ver) ? req.query.ver : "equipo";
  const q = texto(req.query.q, 60).toLowerCase();
  let lista = await Usuario.todos((u) => filtro === "todos" || (filtro === "equipo" ? u.roles.some((r) => r !== "socio" && r !== "delegado") : u.roles.includes("socio")));
  if (q) lista = lista.filter((u) => `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(q));
  lista.sort((a, b) => (a.apellido + a.nombre).localeCompare(b.apellido + b.nombre));
  const cats = await Categoria.activas();
  res.render("panel/admin/usuarios", { titulo: "Usuarios y permisos", lista: lista.slice(0, 150), total: lista.length, filtro, q, cats, roles: ROLES_VALIDOS });
};

exports.crearUsuario = async (req, res) => {
  const b = req.body;
  const roles = [].concat(b.roles || []).filter((r) => ROLES_VALIDOS.includes(r));
  const email = texto(b.email, 120).toLowerCase();
  if (!b.nombre || !b.apellido || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !roles.length) { flash(req, "error", "Completá nombre, apellido, un correo válido y al menos un permiso."); return res.redirect("/panel/usuarios"); }
  if (await Usuario.porEmail(email)) { flash(req, "error", "Ya existe un usuario con ese correo."); return res.redirect("/panel/usuarios"); }
  const clave = texto(b.clave, 60) || Math.random().toString(36).slice(2, 10);
  const u = await Usuario.crear({ nombre: texto(b.nombre, 60), apellido: texto(b.apellido, 60), email, telefono: texto(b.telefono, 30), clave: hashClave(clave), roles, activo: true });
  if (roles.includes("socio")) {
    const s = await Socio.crear({ usuario: u.id, nro: await Socio.siguienteNumero(), alta: hoy(), direccion: "", parentesco: "Socio", apellidoFamilia: u.apellido, emergencia: { nombre: "", telefono: "", vinculo: "" } });
    await Usuario.actualizar(u.id, { socioId: s.id });
  }
  const cat = b.categoria ? await Categoria.porId(b.categoria) : null;
  if (cat && roles.includes("entrenador")) await Categoria.actualizar(cat.id, { entrenador: u.id });
  if (cat && roles.includes("delegado")) { await Categoria.actualizar(cat.id, { delegado: u.id }); await Usuario.actualizar(u.id, { delegadoDe: [cat.id] }); }
  flash(req, "ok", `Usuario creado: ${u.nombre} ${u.apellido}. Contraseña inicial: ${clave} (pedile que la cambie en Mis datos).`);
  res.redirect(`/panel/usuarios?ver=todos&q=${encodeURIComponent(u.apellido)}`);
};

exports.guardarPermisos = async (req, res, next) => {
  const u = await Usuario.porId(req.params.id);
  if (!u) return next();
  const roles = [].concat(req.body.roles || []).filter((r) => ROLES_VALIDOS.includes(r));
  if (!roles.length) { flash(req, "error", "Cada usuario necesita al menos un permiso."); return res.redirect(req.body.volver || "/panel/usuarios"); }
  if (u.id === req.usuario.id && !roles.includes("admin")) { flash(req, "error", "No podés quitarte a vos mismo el permiso de administrador."); return res.redirect(req.body.volver || "/panel/usuarios"); }
  if (roles.includes("socio") && !u.socioId) {
    const s = await Socio.crear({ usuario: u.id, nro: await Socio.siguienteNumero(), alta: hoy(), direccion: "", parentesco: "Socio", apellidoFamilia: u.apellido, emergencia: { nombre: "", telefono: "", vinculo: "" } });
    u.socioId = s.id;
  }
  u.roles = roles;
  u.activo = req.body.activo === "1";
  if (!roles.includes("delegado")) u.delegadoDe = [];
  await Usuario.guardar(u);
  flash(req, "ok", `Permisos de ${u.nombre} ${u.apellido} guardados: ${roles.map((r) => Usuario.ROLES[r]).join(", ")}${u.activo ? "" : " (desactivado)"}.`);
  const destino = String(req.body.volver || "");
  res.redirect(destino.startsWith("/panel/") ? destino : "/panel/usuarios");
};

exports.restablecerClave = async (req, res, next) => {
  const u = await Usuario.porId(req.params.id);
  if (!u) return next();
  const clave = Math.random().toString(36).slice(2, 10);
  await Usuario.actualizar(u.id, { clave: hashClave(clave) });
  flash(req, "ok", `Nueva contraseña para ${u.nombre} ${u.apellido}: ${clave}`);
  res.redirect(`/panel/usuarios?ver=todos&q=${encodeURIComponent(u.apellido)}`);
};

/* ---------- Jugadores ---------- */
exports.jugadores = async (req, res) => {
  const cfg = await Config.obtener();
  const cats = await Categoria.activas();
  const cat = req.query.cat || "", q = texto(req.query.q, 60).toLowerCase();
  const usuarios = Object.fromEntries((await Usuario.todos()).map((u) => [u.id, u]));
  const socios = Object.fromEntries((await Socio.todos()).map((s) => [s.id, usuarios[s.usuario]]));
  const vencidas = {};
  (await Cuota.todos((x) => x.estado === "vencida")).forEach((x) => { vencidas[x.jugador] = (vencidas[x.jugador] || 0) + 1; });
  let js = await Jugador.todos((j) => j.activo !== false && (!cat || j.categoria === cat));
  if (q) js = js.filter((j) => `${j.nombre} ${j.apellido} ${j.ci}`.toLowerCase().includes(q));
  js.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.camiseta - b.camiseta);
  res.render("panel/admin/jugadores", { titulo: "Jugadores", cats, cat, q, filas: js.map((j) => ({ j, responsable: socios[j.socio], carne: Jugador.estadoCarne(j, cfg.avisoCarneDias), docs: Jugador.docsCompletos(j), vencidas: vencidas[j.id] || 0, edad: Jugador.edad(j) })) });
};

/* ---------- Categorías ---------- */
exports.categorias = async (req, res) => {
  const cats = await Categoria.activas();
  const entrenadores = await Usuario.conRol("entrenador");
  const filas = await Promise.all(cats.map(async (c) => {
    const js = await Jugador.deCategoria(c.id);
    const padres = [];
    for (const sid of new Set(js.map((j) => j.socio))) { const s = await Socio.porId(sid); if (s) padres.push(await Usuario.porId(s.usuario)); }
    return { c, jugadores: js.length, padres };
  }));
  res.render("panel/admin/categorias", { titulo: "Categorías", filas, entrenadores });
};

exports.guardarCategoria = async (req, res, next) => {
  const c = await Categoria.porId(req.params.id);
  if (!c) return next();
  const b = req.body;
  const ent = await Usuario.porId(b.entrenador);
  if (ent) c.entrenador = ent.id;
  if (b.delegado !== c.delegado) {
    const viejo = c.delegado && (await Usuario.porId(c.delegado));
    if (viejo) { viejo.delegadoDe = (viejo.delegadoDe || []).filter((x) => x !== c.id); if (!viejo.delegadoDe.length) viejo.roles = viejo.roles.filter((r) => r !== "delegado"); await Usuario.guardar(viejo); }
    const nuevo = b.delegado && (await Usuario.porId(b.delegado));
    if (nuevo) { nuevo.delegadoDe = [...new Set([...(nuevo.delegadoDe || []), c.id])]; if (!nuevo.roles.includes("delegado")) nuevo.roles.push("delegado"); await Usuario.guardar(nuevo); c.delegado = nuevo.id; }
    else c.delegado = null;
  }
  if (/^\d{2}:\d{2}$/.test(b.hora || "")) c.hora = b.hora;
  if (b.entreno) c.entreno = texto(b.entreno, 60);
  await Categoria.guardar(c);
  flash(req, "ok", `${c.nombre} actualizada.`);
  res.redirect("/panel/categorias");
};

exports.nuevaCategoria = async (req, res) => {
  const anio = entero(req.body.anio);
  if (anio < 2000 || anio > 2100) { flash(req, "error", "Indicá un año de nacimiento válido."); return res.redirect("/panel/categorias"); }
  const existe = await Categoria.porId(`c${anio}`);
  if (existe) { await Categoria.actualizar(existe.id, { activa: true }); flash(req, "ok", `La categoría ${anio} quedó activa.`); return res.redirect("/panel/categorias"); }
  const entrenadores = await Usuario.conRol("entrenador");
  await Categoria.crear({ id: `c${anio}`, anio, nombre: `Relámpago ${anio}`, entrenador: entrenadores[0] ? entrenadores[0].id : null, delegado: null, hora: "08:00", entreno: "Martes y jueves 17:00", activa: true });
  flash(req, "ok", `Se agregó la categoría ${anio}. Asignale entrenador y delegado.`);
  res.redirect("/panel/categorias");
};

/* ---------- Carnés de salud ---------- */
exports.carnes = async (req, res) => {
  const cfg = await Config.obtener();
  const lista = await est.carnesAVencer(cfg.avisoCarneDias);
  const usuarios = Object.fromEntries((await Usuario.todos()).map((u) => [u.id, u]));
  const socios = Object.fromEntries((await Socio.todos()).map((s) => [s.id, usuarios[s.usuario]]));
  res.render("panel/admin/carnes", { titulo: "Carnés de salud", lista, socios, vencidos: lista.filter((x) => x.estado.clase === "mal").length, porVencer: lista.filter((x) => x.estado.clase === "warn").length, total: await Jugador.contar((j) => j.activo !== false) });
};

exports.avisarCarnes = async (req, res) => {
  const cfg = await Config.obtener();
  const lista = await est.carnesAVencer(cfg.avisoCarneDias);
  for (const { jugador: j, estado } of lista) {
    const s = await Socio.porId(j.socio);
    if (s) await notificar(s.usuario, `El carné de salud de ${j.nombre}: ${estado.texto.toLowerCase()}. Subí el nuevo desde Mis jugadores.`, { tipo: "alerta", enlace: "/panel/mis-jugadores" });
    const c = await Categoria.porId(j.categoria);
    if (c && c.entrenador && estado.clase === "mal") await notificar(c.entrenador, `${j.nombre} ${j.apellido} tiene el carné de salud vencido.`, { tipo: "alerta", enlace: `/panel/jugadores/${j.id}` });
  }
  flash(req, "ok", `Se avisó a ${lista.length} familias.`);
  res.redirect("/panel/carnes");
};

/* ---------- Temporadas ---------- */
exports.temporadas = async (req, res) => {
  const cfg = await Config.obtener();
  const cats = await Categoria.activas();
  const partidos = await Partido.todos((p) => p.temporada === cfg.temporada && Partido.esDelClub(p));
  res.render("panel/admin/temporadas", { titulo: "Temporadas", historial: await Temporada.historial(), cats, jugados: partidos.filter((p) => p.jugado).length, totalPartidos: partidos.length, jugadores: await Jugador.contar((j) => j.activo !== false) });
};

exports.cerrarTemporada = async (req, res) => {
  const cfg = await Config.obtener();
  if (req.body.confirmar !== `CERRAR ${cfg.temporada}`) { flash(req, "error", `Para cerrar la temporada escribí exactamente: CERRAR ${cfg.temporada}`); return res.redirect("/panel/temporadas"); }
  const cats = await Categoria.activas();
  const resumen = [];
  for (const c of cats) {
    const t = await est.tabla(c.id, cfg.temporada);
    const i = t.findIndex((r) => r.equipo === Partido.CLUB);
    const r = t[i] || { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
    const e = await Usuario.porId(c.entrenador);
    resumen.push({ categoria: c.id, anioCategoria: c.anio, pos: i + 1, pj: r.pj, g: r.g, e: r.e, p: r.p, gf: r.gf, gc: r.gc, jugadores: (await Jugador.deCategoria(c.id)).length, entrenador: Usuario.nombreCompleto(e) });
  }
  const qs = await Cuota.todos((q) => q.periodo.startsWith(String(cfg.temporada)));
  await Temporada.crear({ anio: cfg.temporada, cerrada: hoy(), resumen, cuotas: { emitido: qs.reduce((t, q) => t + q.monto, 0), cobrado: qs.filter((q) => q.estado === "pagada").reduce((t, q) => t + q.monto, 0) } });
  // Nueva temporada: egresa la categoría mayor y se agrega la nueva categoría menor.
  const nueva = cfg.temporada + 1;
  const mayor = cats[0];
  if (mayor) { await Categoria.actualizar(mayor.id, { activa: false }); (await Jugador.deCategoria(mayor.id)).forEach((j) => { j.activo = false; }); await Jugador.guardar(null); }
  const anioMenor = nueva - 6;
  if (!(await Categoria.porId(`c${anioMenor}`))) await Categoria.crear({ id: `c${anioMenor}`, anio: anioMenor, nombre: `Relámpago ${anioMenor}`, entrenador: mayor ? mayor.entrenador : null, delegado: null, hora: "08:00", entreno: "Martes y jueves 17:00", activa: true });
  await Config.actualizar({ temporada: nueva });
  flash(req, "ok", `Temporada ${cfg.temporada} cerrada y guardada en el historial. Empezó la temporada ${nueva}: cargá el fixture desde Cargar resultados.`);
  res.redirect("/panel/temporadas");
};

/* ---------- Configuración ---------- */
exports.configuracion = async (req, res) => res.render("panel/admin/configuracion", { titulo: "Configuración" });

exports.guardarConfiguracion = async (req, res) => {
  const b = req.body;
  const cambios = {
    club: texto(b.club, 80) || "Club Atlético Relámpago",
    cuota: Math.max(0, entero(b.cuota, 950)), cuotaHermano: Math.max(0, entero(b.cuotaHermano, 750)),
    diaVencimiento: Math.min(28, Math.max(1, entero(b.diaVencimiento, 10))), avisoCarneDias: Math.min(120, Math.max(1, entero(b.avisoCarneDias, 30))),
    cuentaTransferencia: texto(b.cuentaTransferencia, 120), direccion: texto(b.direccion, 120), telefono: texto(b.telefono, 40), email: texto(b.email, 80),
  };
  await Config.actualizar(cambios);
  flash(req, "ok", "Configuración guardada. La cuota nueva se aplica desde el próximo mes.");
  res.redirect("/panel/configuracion");
};

