/*
 * Datos de prueba del Club Relámpago.
 *
 *   npm run seed        -> borra los datos actuales y genera todo de nuevo
 *
 * Se generan relativos a la fecha de hoy: temporada en curso, fixture de 14 fechas,
 * cuotas de marzo hasta el mes actual, asistencias de las últimas 8 semanas, etc.
 * Todos los nombres, cédulas y teléfonos son inventados.
 */
const { hashClave } = require("../services/claves");
const { hoy, sumarDias, diaSemana } = require("../services/fechas");

// Generador pseudoaleatorio con semilla: los datos salen iguales cada vez.
function crearAzar(semilla) {
  let a = semilla >>> 0;
  const r = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.entre = (min, max) => min + Math.floor(r() * (max - min + 1));
  r.uno = (arr) => arr[Math.floor(r() * arr.length)];
  r.muestra = (arr, n) => {
    const c = arr.slice();
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c.slice(0, n);
  };
  r.exp = (media) => -Math.log(1 - r()) * media;
  return r;
}

const NINOS = [
  "Benicio",
  "Juan Manuel",
  "Thiago",
  "Bautista",
  "Santino",
  "Lorenzo",
  "Mateo",
  "Valentín",
  "Joaquín",
  "Felipe",
  "Facundo",
  "Agustín",
  "Martín",
  "Bruno",
  "Lautaro",
  "Emiliano",
  "Francisco",
  "Tomás",
  "Santiago",
  "Ignacio",
  "Gael",
  "Liam",
  "Dante",
  "Ciro",
  "Benjamín",
  "Máximo",
  "Simón",
  "León",
  "Federico",
  "Nicolás",
  "Sofía",
  "Valentina",
  "Catalina",
  "Juana",
  "Renzo",
  "Franco",
  "Alfonso",
  "Rafael",
  "Matías",
  "Diego",
  "Pedro",
  "Manuel",
  "Julián",
  "Ramiro",
  "Salvador",
  "Vicente",
  "Lucas",
  "Germán",
  "Ian",
];
const APELLIDOS = [
  "Rodríguez",
  "González",
  "Fernández",
  "Pérez",
  "Martínez",
  "García",
  "Silva",
  "López",
  "Sosa",
  "Suárez",
  "Díaz",
  "Pereira",
  "Cabrera",
  "Núñez",
  "Ramos",
  "Acosta",
  "Méndez",
  "Castro",
  "Olivera",
  "Benítez",
  "Correa",
  "Romero",
  "Ferreira",
  "Álvarez",
  "Morales",
  "Techera",
  "Viera",
  "Píriz",
  "Machado",
  "Cardozo",
  "Larrosa",
  "Fagúndez",
  "Lima",
  "Rocha",
  "Medina",
  "Bonilla",
  "Arrieta",
  "Vázquez",
  "Giménez",
  "Barrios",
  "De León",
  "Etchegaray",
  "Laborde",
  "Pintos",
  "Rivero",
  "Duarte",
  "Sena",
  "Cáceres",
  "Ledesma",
  "Varela",
];
const PADRES = [
  "Martín",
  "Gonzalo",
  "Diego",
  "Pablo",
  "Federico",
  "Andrés",
  "Sebastián",
  "Nicolás",
  "Marcelo",
  "Rodrigo",
  "Leonardo",
  "Gustavo",
  "Fernando",
  "Alejandro",
  "Javier",
  "Matías",
  "Ignacio",
  "Juan Pablo",
  "Santiago",
  "Mauricio",
];
const MADRES = [
  "Lucía",
  "Carolina",
  "Florencia",
  "Valeria",
  "Andrea",
  "Natalia",
  "Mariana",
  "Victoria",
  "Paula",
  "Soledad",
  "Cecilia",
  "Gabriela",
  "Agustina",
  "Laura",
  "Verónica",
  "Silvana",
  "Micaela",
  "Daniela",
  "Romina",
  "Fernanda",
];
const POSICIONES = [
  "Defensa",
  "Defensa",
  "Mediocampo",
  "Mediocampo",
  "Delantero",
];
const RIVALES = [
  "Estrella del Sur",
  "Los Pinos",
  "Juventud Unida",
  "Atlético Las Acacias",
  "Defensor del Parque",
  "Halcones FC",
  "Sportivo La Rambla",
];
const HORAS = [
  "12:45",
  "12:00",
  "11:15",
  "10:30",
  "10:00",
  "09:30",
  "09:00",
  "08:30",
]; // de la categoría mayor a la menor
const ENTRENADORES = [
  ["Rodrigo", "Viana"],
  ["Matías", "Sellanes"],
  ["Pablo", "Ibarra"],
  ["Germán", "Olmos"],
  ["Sebastián", "Quiroga"],
  ["Lucas", "Montero"],
  ["Federico", "Arbelo"],
  ["Diego", "Salaberry"],
];
const CALLES = [
  "Av. Italia",
  "Camino Carrasco",
  "Rambla República de México",
  "Av. Rivera",
  "Bolivia",
  "Michigan",
  "Missouri",
  "Alberto Zum Felde",
  "Av. Arocena",
  "Gral. Paz",
];
const OBSERVACIONES = [
  "Muy buena actitud en los entrenamientos.",
  "Mejoró mucho el pase con pierna izquierda.",
  "Trabajar la ubicación en defensa.",
  "Gran compañero, siempre ayuda a los más chicos.",
  "Le cuesta llegar en hora a los entrenamientos.",
  "Excelente atajada en el último partido.",
];
const PRODUCTOS = [
  ["Bebidas", "Agua sin gas 500 ml", 70],
  ["Bebidas", "Agua con gas 500 ml", 70],
  ["Bebidas", "Refresco cola 500 ml", 110],
  ["Bebidas", "Refresco cola sin azúcar 500 ml", 110],
  ["Bebidas", "Refresco naranja 500 ml", 110],
  ["Bebidas", "Refresco lima limón 500 ml", 110],
  ["Bebidas", "Refresco pomelo 500 ml", 110],
  ["Bebidas", "Bebida deportiva 500 ml", 130],
  ["Bebidas", "Jugo de naranja 250 ml", 80],
  ["Bebidas", "Jugo de durazno 250 ml", 80],
  ["Bebidas", "Cocoa caliente", 90],
  ["Bebidas", "Café", 80],
  ["Bebidas", "Café con leche", 100],
  ["Bebidas", "Té", 60],
  ["Bebidas", "Agua caliente para el termo", 40],
  ["Comidas", "Choripán", 220],
  ["Comidas", "Hamburguesa completa", 280],
  ["Comidas", "Pancho", 150],
  ["Comidas", "Milanesa al pan", 300],
  ["Comidas", "Sándwich caliente", 160],
  ["Comidas", "Porción de pizza", 120],
  ["Comidas", "Porción de fainá", 90],
  ["Comidas", "Empanada de carne", 110],
  ["Comidas", "Empanada de jamón y queso", 110],
  ["Comidas", "Porción de tortilla", 130],
  ["Comidas", "Torta frita", 50],
  ["Comidas", "Bizcochos surtidos (4)", 120],
  ["Comidas", "Medialuna", 45],
  ["Golosinas", "Alfajor de maicena", 70],
  ["Golosinas", "Alfajor de chocolate", 80],
  ["Golosinas", "Papas fritas chicas", 90],
  ["Golosinas", "Barra de chocolate", 100],
  ["Golosinas", "Turrón de maní", 40],
  ["Golosinas", "Garrapiñada", 80],
  ["Golosinas", "Pop dulce", 70],
  ["Golosinas", "Chicles", 30],
  ["Golosinas", "Barra de cereal", 60],
  ["Helados", "Palito de agua", 60],
  ["Helados", "Helado de vasito", 110],
  ["Helados", "Bombón helado", 130],
];

const sinTildes = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
const pad = (n) => String(n).padStart(2, "0");

function generar(fechaBase = hoy()) {
  const r = crearAzar(29);
  const HOY = fechaBase;
  const anioHoy = Number(HOY.slice(0, 4)),
    mesHoy = Number(HOY.slice(5, 7));
  const temporada = mesHoy >= 3 ? anioHoy : anioHoy - 1;
  const anios = Array.from({ length: 8 }, (_, i) => temporada - 13 + i); // 2013..2020 en la temporada 2026
  const ahoraISO = (dia, h = "09:00") => `${dia}T${h}`;
  const unaClave = hashClave(process.env.CLAVE_DEMO || "relampago2026");
  let seq = 1000;
  const id = (p) => p + ++seq;
  const ci = () => {
    const n = r.entre(5100000, 6600000);
    return `${Math.floor(n / 1e6)}.${String(Math.floor(n / 1000) % 1000).padStart(3, "0")}.${String(n % 1000).padStart(3, "0")}-${r.entre(0, 9)}`;
  };
  const tel = () =>
    `09${r.entre(1, 9)} ${r.entre(100, 999)} ${r.entre(100, 999)}`;

  const usuarios = [],
    socios = [],
    jugadores = [],
    categorias = [];
  const emailsUsados = new Set();
  function usuario(nombre, apellido, roles, extra = {}) {
    let email = extra.email;
    if (!email) {
      const dominio = roles.some((x) => x !== "socio" && x !== "delegado")
        ? "relampago.uy"
        : "correo.uy";
      let base = `${sinTildes(nombre.split(" ")[0])}.${sinTildes(apellido)}`,
        e = `${base}@${dominio}`,
        k = 2;
      while (emailsUsados.has(e)) e = `${base}${k++}@${dominio}`;
      email = e;
    }
    emailsUsados.add(email);
    const u = {
      id: id("u"),
      nombre,
      apellido,
      email,
      telefono: tel(),
      clave: unaClave,
      roles,
      activo: true,
      creado: ahoraISO(HOY),
      ...extra,
      email,
    };
    usuarios.push(u);
    return u;
  }

  // --- Equipo del club. Las cuentas con correo fijo son las de prueba que se muestran en la pantalla de ingreso.
  const admin = usuario("Alejandro", "Pittaluga", ["admin"], {
    email: "admin@relampago.uy",
    prueba: "Administrador",
  });
  usuario("Verónica", "Curbelo", ["admin"]);
  usuario("Marcelo", "Irigoyen", ["admin"]);
  const tesorera = usuario("Silvana", "Dutra", ["tesorero"], {
    email: "tesoreria@relampago.uy",
    prueba: "Tesorería",
  });
  const entrenadores = ENTRENADORES.map(([n, a], i) =>
    usuario(
      n,
      a,
      ["entrenador"],
      i === 3
        ? {
            email: "entrenador@relampago.uy",
            prueba: "Entrenador (categoría 2016)",
          }
        : {},
    ),
  );
  const comunicacion = [
    usuario("Agustina", "Sarachu", ["comunicacion"], {
      email: "comunicacion@relampago.uy",
      prueba: "Comunicación",
    }),
    usuario("Juan Pablo", "Ferrari", ["comunicacion"]),
    usuario("Romina", "Borges", ["comunicacion", "cantina"], {
      email: "cantina@relampago.uy",
      prueba: "Cantina y comunicación",
    }),
  ];

  anios.forEach((a, i) =>
    categorias.push({
      id: `c${a}`,
      anio: a,
      nombre: `Relámpago ${a}`,
      entrenador: entrenadores[i].id,
      delegado: null,
      hora: HORAS[i],
      entreno:
        a <= temporada - 10 ? "Martes y jueves 18:00" : "Martes y jueves 17:00",
      activa: true,
      creado: ahoraISO(HOY),
    }),
  );

  // --- Familias y jugadores (10 por categoría)
  const combos = new Set();
  const familiasConHermanos = [];
  function nuevaFamilia(opciones = {}) {
    let ape, ape2;
    do {
      ape = r.uno(APELLIDOS);
      ape2 = r.uno(APELLIDOS);
    } while (ape === ape2 || combos.has(ape + ape2));
    combos.add(ape + ape2);
    const mama = opciones.mama ?? r() < 0.6;
    const u = usuario(
      opciones.nombre || r.uno(mama ? MADRES : PADRES),
      mama ? ape2 : ape,
      ["socio"],
      opciones.extra || {},
    );
    const s = {
      id: id("s"),
      usuario: u.id,
      nro: 1000 + socios.length + 1,
      alta: `${r.entre(temporada - 7, temporada)}-03-01`,
      direccion: `${r.uno(CALLES)} ${r.entre(1000, 6900)}`,
      parentesco: mama ? "Madre" : "Padre",
      apellidoFamilia: ape,
      emergencia: {
        nombre: `${r.uno(mama ? PADRES : MADRES)} ${ape}`,
        telefono: tel(),
        vinculo: mama ? "Padre" : "Madre",
      },
      creado: ahoraISO(HOY),
    };
    u.socioId = s.id;
    socios.push(s);
    return s;
  }
  // Familia de prueba "socio@relampago.uy": dos hijos (2016 y 2019), con deuda y un carné por vencer.
  const familiaPrueba = nuevaFamilia({
    mama: true,
    nombre: "Lucía",
    extra: { email: "socio@relampago.uy", prueba: "Socia con dos hijos" },
  });
  const familiaDelegado = nuevaFamilia({
    mama: false,
    nombre: "Gonzalo",
    extra: {
      email: "delegado@relampago.uy",
      prueba: "Socio y delegado (categoría 2016)",
    },
  });

  for (const a of anios) {
    const cat = `c${a}`;
    for (let k = 0; k < 10; k++) {
      let s;
      if (a === temporada - 10 && k === 1)
        s = familiaPrueba; // hijo en 2016
      else if (a === temporada - 7 && k === 2)
        s = familiaPrueba; // hija en 2019
      else if (a === temporada - 10 && k === 3)
        s = familiaDelegado; // hijo del delegado 2016
      else if (familiasConHermanos.length && r() < 0.22)
        s = familiasConHermanos.splice(
          Math.floor(r() * familiasConHermanos.length),
          1,
        )[0];
      else {
        s = nuevaFamilia();
        if (r() < 0.35) familiasConHermanos.push(s);
      }
      const nac = `${a}-${pad(r.entre(1, 12))}-${pad(r.entre(1, 28))}`;
      let vence = sumarDias(HOY, r.entre(-60, 360));
      if ((jugadores.length + 1) % 11 === 0)
        vence = sumarDias(HOY, r.entre(3, 25));
      const x = r();
      const obs =
        x < 0.1
          ? "Asma leve. Usa inhalador antes de esfuerzos intensos."
          : x < 0.16
            ? "Alergia a la penicilina."
            : x < 0.2
              ? "Alergia al maní. Avisar en cantina."
              : x < 0.23
                ? "Usa lentes durante la actividad."
                : null;
      jugadores.push({
        id: id("j"),
        nombre: r.uno(NINOS),
        apellido: s.apellidoFamilia,
        nacimiento: nac,
        ci: ci(),
        categoria: cat,
        socio: s.id,
        camiseta: null,
        posicion: k === 0 ? "Arquero" : r.uno(POSICIONES),
        carneVence: vence,
        autorizaImagen: r() > 0.12,
        docs: {
          cedula: r() > 0.05,
          carne: true,
          autorizacion: true,
          fichaMedica: r() > 0.08,
        },
        medica: {
          observaciones: obs,
          grupoSanguineo: r.uno(["O+", "O+", "A+", "A+", "B+", "O-", "AB+"]),
          prestador: r.uno([
            "CASMU",
            "Médica Uruguaya",
            "Española",
            "SMI",
            "Hospital Británico",
            "ASSE",
            "CAMI",
          ]),
          emergenciaMovil: r.uno(["SEMM", "UCM", "Emergencia Uno", "SUAT"]),
        },
        observaciones: [],
        alta: `${r.entre(Math.max(a + 5, temporada - 7), temporada)}-03-01`,
        activo: true,
        creado: ahoraISO(HOY),
      });
    }
    const js = jugadores.filter((j) => j.categoria === cat);
    const usados = new Set([1]);
    js.forEach((j) => {
      if (j.posicion === "Arquero") j.camiseta = 1;
      else {
        let n;
        do {
          n = r.entre(2, 20);
        } while (usados.has(n));
        usados.add(n);
        j.camiseta = n;
      }
    });
  }
  // Ajustes de la familia de prueba: un carné por vencer.
  const hijosPrueba = jugadores.filter((j) => j.socio === familiaPrueba.id);
  hijosPrueba[1].carneVence = sumarDias(HOY, 12);
  hijosPrueba.forEach((j) => {
    j.alta = `${temporada - 1}-03-01`;
  });

  // --- Delegados: un padre o madre por categoría
  categorias.forEach((c) => {
    const js = jugadores.filter((j) => j.categoria === c.id);
    const s =
      c.anio === temporada - 10
        ? familiaDelegado
        : socios.find((x) => x.id === js[4].socio);
    const u = usuarios.find((x) => x.id === s.usuario);
    if (!u.roles.includes("delegado")) u.roles.push("delegado");
    (u.delegadoDe ||= []).push(c.id);
    c.delegado = u.id;
  });

  r.muestra(jugadores, 22).forEach((j) =>
    j.observaciones.push({
      fecha: sumarDias(HOY, -r.entre(3, 80)),
      texto: r.uno(OBSERVACIONES),
      autor: categorias.find((c) => c.id === j.categoria).entrenador,
    }),
  );

  // --- Fixture: liga de 8 equipos, ida y vuelta (14 fechas), sábado por medio desde mayo.
  const partidos = [];
  const liga = ["Relámpago", ...RIVALES];
  const fechas = (() => {
    const t = liga.slice(),
      rondas = [];
    for (let k = 0; k < t.length - 1; k++) {
      const pares = [];
      for (let i = 0; i < t.length / 2; i++)
        pares.push(
          k % 2 ? [t[t.length - 1 - i], t[i]] : [t[i], t[t.length - 1 - i]],
        );
      rondas.push(pares);
      t.splice(1, 0, t.pop());
    }
    return [...rondas, ...rondas.map((rd) => rd.map(([a, b]) => [b, a]))];
  })();
  let inicio = `${temporada}-05-01`;
  while (diaSemana(inicio) !== 6) inicio = sumarDias(inicio, 1);
  categorias.forEach((c) => {
    const fuerza = Object.fromEntries(liga.map((e) => [e, 0.6 + r() * 1.0]));
    fuerza["Relámpago"] = 1.0 + r() * 0.7;
    fechas.forEach((rd, f) => {
      const dia = sumarDias(inicio, 14 * f);
      rd.forEach(([a, b]) => {
        const jugado = dia < HOY;
        partidos.push({
          id: id("p"),
          temporada,
          categoria: c.id,
          fecha: f + 1,
          dia,
          local: a,
          visitante: b,
          gl: jugado ? Math.min(7, Math.floor(r.exp(fuerza[a]))) : null,
          gv: jugado ? Math.min(7, Math.floor(r.exp(fuerza[b]))) : null,
          jugado,
          hora: a === "Relámpago" || b === "Relámpago" ? c.hora : null,
          cancha:
            a === "Relámpago" ? "Cancha del Club Relámpago" : `Cancha de ${a}`,
          creado: ahoraISO(HOY),
        });
      });
    });
  });

  // --- Convocatorias de la próxima fecha
  const convocatorias = [];
  categorias.forEach((c) => {
    const p = partidos
      .filter(
        (x) =>
          x.categoria === c.id &&
          !x.jugado &&
          (x.local === "Relámpago" || x.visitante === "Relámpago"),
      )
      .sort((a, b) => a.dia.localeCompare(b.dia))[0];
    if (!p) return;
    const js = jugadores.filter((j) => j.categoria === c.id).map((j) => j.id);
    const publicada = c.anio % 2 === 0;
    convocatorias.push({
      id: id("v"),
      partido: p.id,
      jugadores: c.anio <= temporada - 10 ? r.muestra(js, 9) : js,
      citacion: "Presentarse 40 minutos antes con equipo completo.",
      publicada,
      publicadaEl: publicada ? ahoraISO(sumarDias(HOY, -2), "18:30") : null,
      creado: ahoraISO(HOY),
    });
  });

  // --- Entrenamientos y asistencia: martes y jueves de las últimas 8 semanas
  const entrenamientos = [];
  const suspendido = (() => {
    let d = sumarDias(HOY, -14);
    while (diaSemana(d) !== 4) d = sumarDias(d, -1);
    return d;
  })();
  for (let d = sumarDias(HOY, -56); d < HOY; d = sumarDias(d, 1)) {
    if (![2, 4].includes(diaSemana(d))) continue;
    categorias.forEach((c) => {
      const asistencia = {};
      if (d !== suspendido)
        jugadores
          .filter((j) => j.categoria === c.id)
          .forEach((j) => {
            asistencia[j.id] = r() < 0.86;
          });
      entrenamientos.push({
        id: id("e"),
        categoria: c.id,
        dia: d,
        suspendido: d === suspendido,
        asistencia,
        tomadaPor: c.entrenador,
        creado: ahoraISO(d, "19:00"),
      });
    });
  }

  // --- Cuotas: de marzo al mes actual (máximo noviembre). El primer hijo paga la cuota completa; los hermanos, la reducida.
  const config = {
    club: "Club Atlético Relámpago",
    temporada,
    cuota: 950,
    cuotaHermano: 750,
    diaVencimiento: 10,
    avisoCarneDias: 30,
    mesesCuota: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    cuentaTransferencia: "A confirmar",
    direccion: "A confirmar",
    telefono: "A confirmar",
    email: "A confirmar",
    sponsors: [
      { nombre: "Cortiluz Cortinas", rubro: "Sponsor de camiseta" },
      { nombre: "Atan", rubro: "Indumentaria oficial" },
    ],
    galeria: [
      { foto: "/img/foto3.jpg", titulo: "Foto del plantel" },
      { foto: "/img/foto1.jpg", titulo: "La charla antes del partido" },
      { foto: "/img/hero.jpg", titulo: "Atardecer en la cancha del club" },
    ],
  };
  const ultimoMes = temporada < anioHoy ? 11 : Math.min(11, mesHoy);
  const meses = config.mesesCuota.filter((m) => m <= ultimoMes);
  const cuotas = [];
  const morosos = new Set(
    r.muestra(
      socios.map((s) => s.id),
      11,
    ),
  );
  morosos.add(familiaPrueba.id);
  const metodos = [
    "Efectivo",
    "Transferencia",
    "Transferencia",
    "Pago online",
    "Efectivo",
  ];
  socios.forEach((s) => {
    const hijos = jugadores.filter((j) => j.socio === s.id);
    hijos.forEach((j, idx) => {
      meses.forEach((m) => {
        const periodo = `${temporada}-${pad(m)}`,
          vence = `${periodo}-${pad(config.diaVencimiento)}`;
        let pagada = vence < HOY;
        if (
          morosos.has(s.id) &&
          m >=
            (s.id === familiaPrueba.id
              ? ultimoMes - 1
              : r.entre(ultimoMes - 3, ultimoMes))
        )
          pagada = false;
        if (vence >= HOY) pagada = r() < 0.18;
        let pago = null;
        if (pagada) {
          let fp = sumarDias(vence, -r.entre(-9, 12));
          if (fp >= HOY) fp = sumarDias(HOY, -1);
          pago = {
            fecha: fp,
            metodo: r.uno(metodos),
            registradoPor: r() < 0.7 ? tesorera.id : admin.id,
            comprobante: null,
          };
        }
        cuotas.push({
          id: id("q"),
          jugador: j.id,
          socio: s.id,
          periodo,
          monto: idx === 0 ? config.cuota : config.cuotaHermano,
          vence,
          estado: pagada ? "pagada" : vence < HOY ? "vencida" : "pendiente",
          pago,
          creado: ahoraISO(`${periodo}-01`),
        });
      });
    });
  });

  // --- Inscripciones
  const inscripciones = [];
  [
    ["Joaquín", 7, "pendiente"],
    ["Bautista", 7, "pendiente"],
    ["Felipe", 4, "en revisión"],
    ["Catalina", 5, "pendiente"],
    ["Simón", 7, "en revisión"],
    ["Lorenzo", 2, "aprobada"],
    ["Rafael", 3, "rechazada"],
  ].forEach(([n, i, estado], k) => {
    const a = anios[i];
    const s = k % 3 === 2 ? r.uno(socios.slice(2)) : nuevaFamilia();
    const abierta = estado === "pendiente" || estado === "en revisión";
    inscripciones.push({
      id: id("i"),
      nombre: n,
      apellido: s.apellidoFamilia,
      nacimiento: `${a}-${pad(r.entre(1, 12))}-${pad(r.entre(1, 28))}`,
      ci: ci(),
      categoria: `c${a}`,
      socio: s.id,
      estado,
      fecha: sumarDias(HOY, -(abierta ? r.entre(1, 20) : r.entre(25, 60))),
      docs: {
        cedula: true,
        carne: estado !== "pendiente" || k % 2 === 0,
        otros: false,
      },
      autorizaImagen: k !== 3,
      carneVence: sumarDias(HOY, r.entre(90, 330)),
      medica: {
        observaciones: null,
        prestador: r.uno(["CASMU", "SMI", "ASSE"]),
      },
      nota:
        estado === "rechazada"
          ? "Categoría completa. Queda en lista de espera para la próxima temporada."
          : "",
      creado: ahoraISO(HOY),
    });
  });

  // --- Comunicados y noticias
  const proximo2016 = partidos
    .filter(
      (p) =>
        p.categoria === `c${temporada - 10}` &&
        !p.jugado &&
        (p.local === "Relámpago" || p.visitante === "Relámpago"),
    )
    .sort((a, b) => a.dia.localeCompare(b.dia))[0];
  const comunicados = [
    {
      id: id("m"),
      fecha: ahoraISO(sumarDias(HOY, -1), "19:10"),
      de: comunicacion[0].id,
      origen: "Club",
      para: "todos",
      titulo: "Asamblea de socios",
      texto:
        "La semana que viene hacemos la asamblea anual en la sede, a las 20:00. Se presenta el balance de la temporada y la nueva plataforma web.",
    },
    {
      id: id("m"),
      fecha: ahoraISO(sumarDias(HOY, -2), "08:02"),
      de: entrenadores[3].id,
      origen: "Técnico",
      para: `c${temporada - 10}`,
      titulo: `Relámpago ${temporada - 10} juega el sábado`,
      texto: `Relámpago ${temporada - 10} juega el sábado a las ${proximo2016 ? proximo2016.hora : "10:30"}. Citación 40 minutos antes en la cancha con equipo completo y botella de agua.`,
    },
    {
      id: id("m"),
      fecha: ahoraISO(suspendido, "15:45"),
      de: comunicacion[1].id,
      origen: "Club",
      para: "todos",
      titulo: "Entrenamiento suspendido por lluvia",
      texto:
        "Hoy se suspenden todos los entrenamientos por el estado de la cancha. Nos vemos el martes.",
    },
    {
      id: id("m"),
      fecha: ahoraISO(sumarDias(HOY, -5), "11:30"),
      de: comunicacion[2].id,
      origen: "Cantina",
      para: "todos",
      titulo: "Tortas fritas en la cantina",
      texto:
        "Este sábado hay tortas fritas y cocoa caliente desde las 8:30. Podés pedir desde la web y retirar sin hacer fila.",
    },
    {
      id: id("m"),
      fecha: ahoraISO(sumarDias(HOY, -9), "18:00"),
      de: entrenadores[7].id,
      origen: "Técnico",
      para: `c${temporada - 6}`,
      titulo: "Foto del equipo",
      texto:
        "El martes sacamos la foto oficial del plantel. Vengan con la camiseta titular.",
    },
    {
      id: id("m"),
      fecha: ahoraISO(sumarDias(HOY, -20), "10:00"),
      de: tesorera.id,
      origen: "Tesorería",
      para: "todos",
      titulo: "Recordatorio de cuota",
      texto: `La cuota vence el día ${config.diaVencimiento} de cada mes. Podés pagar online, por transferencia o en la sede los martes y jueves de 18 a 20.`,
    },
  ];
  const noticias = [
    {
      id: id("n"),
      fecha: sumarDias(HOY, -4),
      titulo: "Fin de semana con siete victorias",
      seccion: "Resultados",
      texto:
        "Las categorías del club sumaron siete triunfos en la última fecha. Se destacó la categoría 2016, que ganó de visitante y quedó a un punto de la punta.",
      foto: "/img/foto1.jpg",
      publicada: true,
      autor: comunicacion[0].id,
    },
    {
      id: id("n"),
      fecha: sumarDias(HOY, -16),
      titulo: "Llegaron las camisetas nuevas",
      seccion: "Club",
      texto:
        "Gracias a nuestros sponsors renovamos el juego de camisetas de todas las categorías. Se entregan en la sede contra firma del responsable.",
      foto: "/img/foto3.jpg",
      publicada: true,
      autor: comunicacion[0].id,
    },
    {
      id: id("n"),
      fecha: sumarDias(HOY, -29),
      titulo: "Jornada de arreglo de la cancha",
      seccion: "Comunidad",
      texto:
        "Más de cuarenta familias se sumaron a la jornada de mantenimiento: se niveló el campo y se pintaron los bancos de suplentes.",
      foto: "/img/hero.jpg",
      publicada: true,
      autor: comunicacion[1].id,
    },
    {
      id: id("n"),
      fecha: sumarDias(HOY, -42),
      titulo: "Abrimos inscripciones para la próxima temporada",
      seccion: "Inscripciones",
      texto:
        "Ya podés anotar a tu hijo o hija desde la web. Recibimos niñas y niños de 6 a 13 años.",
      foto: null,
      publicada: true,
      autor: comunicacion[0].id,
    },
  ];

  // --- Cantina
  const productos = PRODUCTOS.map(([rubro, nombre, precio]) => ({
    id: id("x"),
    nombre,
    rubro,
    precio,
    stock: r.entre(6, 48),
    activo: true,
    foto: null,
    creado: ahoraISO(HOY),
  }));
  productos[5].stock = 0;
  productos[33].stock = 3;
  const pedidos = [];
  for (let i = 1; i <= 8; i++) {
    const s = i <= 2 ? familiaPrueba : r.uno(socios);
    const items = r.muestra(productos, r.entre(1, 4)).map((p) => ({
      producto: p.id,
      nombre: p.nombre,
      precio: p.precio,
      cant: r.entre(1, 3),
    }));
    const dia = i < 6 ? sumarDias(HOY, -5) : HOY;
    pedidos.push({
      id: id("o"),
      numero: 100 + i,
      usuario: s.usuario,
      fecha: ahoraISO(dia, `${pad(8 + i)}:${pad(r.entre(0, 59))}`),
      items,
      total: items.reduce((t, it) => t + it.precio * it.cant, 0),
      pago: r.uno(["Pago online", "QR en cantina", "Transferencia"]),
      estado: i < 6 ? "entregado" : i === 6 ? "listo" : "pendiente",
    });
  }

  // --- Temporada anterior (historial)
  const temporadas = [
    {
      id: id("t"),
      anio: temporada - 1,
      cerrada: `${temporada - 1}-12-15`,
      resumen: categorias
        .filter((c) => c.anio < temporada - 6)
        .map((c) => {
          const pj = 14,
            g = r.entre(4, 11),
            e = r.entre(1, pj - g),
            p = pj - g - e;
          return {
            categoria: c.id,
            anioCategoria: c.anio,
            pos: r.entre(1, 6),
            pj,
            g,
            e,
            p,
            gf: g * 2 + e + r.entre(0, 8),
            gc: p * 2 + e + r.entre(0, 6),
            jugadores: r.entre(9, 12),
            entrenador: r.uno(ENTRENADORES).join(" "),
          };
        }),
      cuotas: { emitido: 612000, cobrado: 571500 },
    },
  ];

  // --- Avisos iniciales
  const notificaciones = [];
  const aviso = (para, texto, tipo = "info", enlace = null) =>
    notificaciones.push({
      id: id("a"),
      para,
      fecha: ahoraISO(HOY, "08:00"),
      texto,
      tipo,
      enlace,
      leida: false,
    });
  usuarios
    .filter((u) => u.roles.includes("admin"))
    .forEach((u) => {
      aviso(
        u.id,
        `Hay ${inscripciones.filter((i) => i.estado === "pendiente").length} inscripciones nuevas para revisar.`,
        "alerta",
        "/panel/inscripciones",
      );
    });
  jugadores.forEach((j) => {
    const dias = Math.round((new Date(j.carneVence) - new Date(HOY)) / 864e5);
    if (dias <= config.avisoCarneDias) {
      const s = socios.find((x) => x.id === j.socio);
      aviso(
        s.usuario,
        dias < 0
          ? `El carné de salud de ${j.nombre} está vencido. No puede jugar hasta renovarlo.`
          : `El carné de salud de ${j.nombre} vence en ${dias} días.`,
        "alerta",
        "/panel/mis-jugadores",
      );
    }
  });
  aviso(
    tesorera.id,
    "Hay socios con cuotas vencidas. Podés enviarles un recordatorio desde Tesorería.",
    "info",
    "/panel/tesoreria",
  );

  return {
    meta: {
      generado: new Date().toISOString(),
      fechaBase: HOY,
      secuencia: seq,
    },
    config,
    usuarios,
    socios,
    jugadores,
    categorias,
    partidos,
    convocatorias,
    entrenamientos,
    cuotas,
    inscripciones,
    comunicados,
    noticias,
    productos,
    pedidos,
    temporadas,
    notificaciones,
  };
}

module.exports = { generar };

// Ejecutado directamente: npm run seed
if (require.main === module) {
  const store = require("../config/store");
  const datos = generar();
  store.reemplazarTodo(datos);
  const cuenta = (k) => datos[k].length;
  console.log(
    `Listo: ${cuenta("usuarios")} usuarios, ${cuenta("socios")} socios, ${cuenta("jugadores")} jugadores, ${cuenta("partidos")} partidos, ${cuenta("cuotas")} cuotas, ${cuenta("productos")} productos.`,
  );
  console.log(
    "Usuarios de prueba (contraseña: " +
      (process.env.CLAVE_DEMO || "relampago2026") +
      "):",
  );
  datos.usuarios
    .filter((u) => u.prueba)
    .forEach((u) => console.log(`  ${u.email.padEnd(28)} ${u.prueba}`));
}
