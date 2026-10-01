/* Quién ve cada comunicado y cómo se muestra. */
const { Comunicado, Usuario, Categoria, Socio, Jugador } = require("../models");

/** Agrega paraTexto y deNombre para mostrar en las vistas. */
async function decorar(lista) {
  const cats = Object.fromEntries((await Categoria.todos()).map((c) => [c.id, c]));
  return Promise.all(lista.map(async (m) => {
    let paraTexto = "Todos";
    if (m.para !== "todos") {
      if (cats[m.para]) paraTexto = cats[m.para].nombre;
      else { const s = await Socio.porId(m.para); paraTexto = s ? "Socio: " + Usuario.nombreCompleto(await Usuario.porId(s.usuario)) : "Socio"; }
    }
    return { ...m, paraTexto, deNombre: Usuario.nombreCompleto(await Usuario.porId(m.de)) };
  }));
}

/** Comunicados que le corresponden a un usuario. */
async function paraUsuario(u) {
  const staff = u.roles.some((r) => ["admin", "comunicacion", "tesorero", "cantina"].includes(r));
  const cats = new Set();
  if (u.socioId) (await Jugador.deSocio(u.socioId)).forEach((j) => cats.add(j.categoria));
  (await Categoria.deEntrenador(u.id)).forEach((c) => cats.add(c.id));
  (u.delegadoDe || []).forEach((c) => cats.add(c));
  const lista = await Comunicado.recientes((m) => staff || m.de === u.id || m.para === "todos" || cats.has(m.para) || (u.socioId && m.para === u.socioId));
  return decorar(lista);
}

/** Usuarios que reciben un comunicado según su destino. */
async function destinatarios(para) {
  let socios;
  if (para === "todos") socios = await Socio.todos();
  else if (para.startsWith("c")) { const js = await Jugador.deCategoria(para); socios = [...new Set(js.map((j) => j.socio))].map((id) => ({ id })); }
  else socios = [{ id: para }];
  const ids = [];
  for (const s of socios) { const so = await Socio.porId(s.id); if (so) ids.push(so.usuario); }
  return [...new Set(ids)];
}

module.exports = { decorar, paraUsuario, destinatarios };
