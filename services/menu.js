/* Secciones del panel según los permisos (roles) de cada usuario. */
const { Inscripcion, Cuota, Pedido, Jugador, Config } = require("../models");

async function seccionesDe(usuario) {
  if (!usuario) return [];
  const r = (x) => usuario.roles.includes(x);
  const cfg = await Config.obtener();
  const grupos = [];
  if (r("admin")) {
    const ins = await Inscripcion.contar(Inscripcion.abiertas);
    const carnes = await Jugador.contar((j) => j.activo !== false && Jugador.estadoCarne(j, cfg.avisoCarneDias).clase !== "ok");
    grupos.push({ titulo: "Administración", items: [
      ["/panel/admin", "Resumen"], ["/panel/inscripciones", "Inscripciones", ins], ["/panel/usuarios", "Usuarios y permisos"],
      ["/panel/jugadores", "Jugadores"], ["/panel/categorias", "Categorías"], ["/panel/carnes", "Carnés de salud", carnes],
      ["/panel/temporadas", "Temporadas"], ["/panel/configuracion", "Configuración"]] });
  }
  if (r("tesorero") || r("admin")) {
    const conf = await Cuota.contar((q) => q.estado === "a confirmar");
    grupos.push({ titulo: "Tesorería", items: [["/panel/tesoreria", "Resumen de cuotas"], ["/panel/cuotas", "Cuotas y pagos", conf], ["/panel/cuenta", "Estado de cuenta"], ["/panel/reportes", "Reportes"], ["/panel/comunicados", "Enviar aviso"]] });
  }
  if (r("entrenador")) grupos.push({ titulo: "Entrenador", items: [["/panel/plantel", "Mis categorías"], ["/panel/asistencia", "Asistencia"], ["/panel/convocatorias", "Convocatorias"], ["/panel/comunicados", "Comunicar a familias"]] });
  if (r("delegado") || r("admin")) grupos.push({ titulo: "Partidos", items: [["/panel/resultados", "Cargar resultados"]] });
  if (r("comunicacion") || r("admin")) grupos.push({ titulo: "Comunicación", items: [["/panel/comunicados", "Comunicados"], ["/panel/noticias", "Noticias"], ["/panel/galeria", "Galería y sponsors"]] });
  if (r("cantina") || r("admin")) {
    const ped = await Pedido.contar((o) => o.estado !== "entregado");
    grupos.push({ titulo: "Cantina", items: [["/panel/cantina/productos", "Productos"], ["/panel/cantina/pedidos", "Pedidos", ped], ["/panel/cantina/qr", "QR del mostrador"], ["/panel/comunicados", "Avisos de cantina"]] });
  }
  if (r("socio")) {
    const venc = usuario.socioId ? await Cuota.contar((q) => q.socio === usuario.socioId && q.estado === "vencida") : 0;
    grupos.push({ titulo: "Mi familia", items: [["/panel/familia", "Inicio"], ["/panel/mis-jugadores", "Mis jugadores"], ["/panel/inscribir", "Inscribir jugador"], ["/panel/mis-partidos", "Partidos y convocatorias"], ["/panel/mis-cuotas", "Cuotas", venc]] });
  }
  grupos.push({ titulo: "Para todos", items: [["/panel/tienda", "Cantina online"], ["/panel/avisos", "Avisos y comunicados"], ["/panel/perfil", "Mis datos"]] });
  // Un mismo enlace aparece una sola vez (el primero gana).
  const vistos = new Set();
  grupos.forEach((g) => { g.items = g.items.filter(([url]) => (vistos.has(url) ? false : vistos.add(url))); });
  return grupos.filter((g) => g.items.length);
}

/** Primera pantalla del panel según el rol principal. */
function inicioDe(usuario) {
  const r = (x) => usuario.roles.includes(x);
  if (r("admin")) return "/panel/admin";
  if (r("tesorero")) return "/panel/tesoreria";
  if (r("entrenador")) return "/panel/plantel";
  if (r("comunicacion")) return "/panel/comunicados";
  if (r("cantina")) return "/panel/cantina/pedidos";
  if (r("socio")) return "/panel/familia";
  return "/panel/avisos";
}

module.exports = { seccionesDe, inicioDe };
