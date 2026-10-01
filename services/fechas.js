/* Utilidades de fechas. Todas las fechas se guardan como texto AAAA-MM-DD (o ISO con hora). */
const ZONA = process.env.ZONA_HORARIA || "America/Montevideo";
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
const MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];

function partes(fecha = new Date()) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(fecha).map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}

/** Fecha de hoy en Montevideo (se puede fijar con FECHA_DEMO para pruebas). */
function hoy() { return process.env.FECHA_DEMO || partes().fecha; }
/** Fecha y hora actual "AAAA-MM-DDTHH:MM". */
function ahora() { return `${hoy()}T${partes().hora}`; }

const aDate = (s) => new Date(String(s).slice(0, 10) + "T12:00:00Z");
const aTexto = (d) => d.toISOString().slice(0, 10);
function sumarDias(s, n) { const d = aDate(s); d.setUTCDate(d.getUTCDate() + n); return aTexto(d); }
function diasEntre(a, b) { return Math.round((aDate(b) - aDate(a)) / 864e5); }
function diaSemana(s) { return aDate(s).getUTCDay(); }

function fechaCorta(s) { if (!s) return ""; const d = aDate(s); return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`; }
function fechaLarga(s) { if (!s) return ""; const [a, m, d] = String(s).slice(0, 10).split("-"); return `${d}/${m}/${a}`; }
function hora(s) { return s && s.length > 10 ? s.slice(11, 16) : ""; }

module.exports = { hoy, ahora, sumarDias, diasEntre, diaSemana, fechaCorta, fechaLarga, hora, aDate, aTexto, DIAS, MESES, MESES_LARGOS };
