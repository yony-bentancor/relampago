/* Delegados: cargan partidos y resultados de su categoría (el administrador, de todas). */
const { Categoria, Partido, Config } = require("../models");
const est = require("../services/estadisticas");
const { flash, texto, elegir, fechaValida } = require("../services/util");

async function categoriasDelegado(u) {
  const activas = await Categoria.activas();
  return u.roles.includes("admin") ? activas : activas.filter((c) => (u.delegadoDe || []).includes(c.id));
}

exports.resultados = async (req, res) => {
  const cfg = await Config.obtener();
  const cats = await categoriasDelegado(req.usuario);
  const cat = elegir(cats, req.query.cat);
  if (!cat) return res.render("panel/delegado/resultados", { titulo: "Cargar resultados", cats, cat: null });
  const partidos = (await Partido.delClub(cat.id, cfg.temporada)).sort((a, b) => a.dia.localeCompare(b.dia));
  res.render("panel/delegado/resultados", { titulo: "Cargar resultados", cats, cat, partidos, sinResultado: partidos.filter((p) => !p.jugado && p.dia < res.locals.hoy), tabla: await est.tabla(cat.id, cfg.temporada) });
};

exports.guardarResultado = async (req, res, next) => {
  const p = await Partido.porId(req.params.id);
  if (!p) return next();
  const cats = await categoriasDelegado(req.usuario);
  if (!cats.some((c) => c.id === p.categoria)) return res.status(403).render("errores/403", { titulo: "Sin permiso" });
  if (req.body.borrar) {
    Object.assign(p, { gl: null, gv: null, jugado: false });
    await Partido.guardar(p);
    flash(req, "ok", "Se borró el resultado.");
    return res.redirect(`/panel/resultados?cat=${p.categoria}#p-${p.id}`);
  }
  const gl = parseInt(req.body.gl, 10), gv = parseInt(req.body.gv, 10);
  if (!(gl >= 0 && gl <= 40 && gv >= 0 && gv <= 40)) { flash(req, "error", "Completá los goles de los dos equipos."); return res.redirect(`/panel/resultados?cat=${p.categoria}#p-${p.id}`); }
  Object.assign(p, { gl, gv, jugado: true, cargadoPor: req.usuario.id });
  await Partido.guardar(p);
  flash(req, "ok", `Resultado guardado: ${p.local} ${gl} – ${gv} ${p.visitante}. La tabla y la web ya están actualizadas.`);
  res.redirect(`/panel/resultados?cat=${p.categoria}#p-${p.id}`);
};

exports.nuevoPartido = async (req, res) => {
  const cfg = await Config.obtener();
  const cats = await categoriasDelegado(req.usuario);
  const cat = elegir(cats, req.body.cat);
  const rival = texto(req.body.rival, 60);
  if (!cat || !rival || !fechaValida(req.body.dia)) { flash(req, "error", "Completá el rival y el día del partido."); return res.redirect("/panel/resultados"); }
  const local = req.body.condicion !== "visitante";
  await Partido.crear({ temporada: cfg.temporada, categoria: cat.id, fecha: "Amistoso", dia: req.body.dia, hora: texto(req.body.hora, 5) || cat.hora,
    local: local ? Partido.CLUB : rival, visitante: local ? rival : Partido.CLUB, gl: null, gv: null, jugado: false,
    cancha: local ? "Cancha del Club Relámpago" : `Cancha de ${rival}`, cargadoPor: req.usuario.id });
  flash(req, "ok", `Partido contra ${rival} agregado.`);
  res.redirect(`/panel/resultados?cat=${cat.id}`);
};
