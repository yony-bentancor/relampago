/* Todas las rutas del panel requieren sesión; cada grupo exige además su permiso. */
const router = require("express").Router();
const a = require("../middlewares/asincrono");
const { requiereSesion, requiereRol } = require("../middlewares/auth");
const subida = require("../middlewares/subida");

const panel = require("../controllers/panelController");
const socio = require("../controllers/socioController");
const entrenador = require("../controllers/entrenadorController");
const delegado = require("../controllers/delegadoController");
const tesoreria = require("../controllers/tesoreriaController");
const admin = require("../controllers/adminController");
const comunicacion = require("../controllers/comunicacionController");
const cantina = require("../controllers/cantinaController");
const tienda = require("../controllers/tiendaController");

router.use(requiereSesion);

// Para todos
router.get("/", panel.inicio);
router.get("/avisos", a(panel.avisos));
router.get("/perfil", a(panel.perfil));
router.post("/perfil", a(panel.guardarPerfil));
router.post("/perfil/clave", a(panel.cambiarClave));
router.get("/jugadores/:id", a(panel.ficha));
router.get("/tienda", a(tienda.tienda));
router.post("/tienda/carrito", a(tienda.carrito));
router.post("/tienda/vaciar", tienda.vaciar);
router.post("/tienda/comprar", a(tienda.comprar));
router.get("/tienda/pedido/:id", a(tienda.pedido));

// Socio
const esSocio = requiereRol("socio");
router.get("/familia", esSocio, a(socio.familia));
router.get("/mis-jugadores", esSocio, a(socio.misJugadores));
router.post("/mis-jugadores/:id/carne", esSocio, subida({ privado: true }), a(socio.actualizarCarne));
router.get("/inscribir", esSocio, a(socio.formInscribir));
router.post("/inscribir", esSocio, subida({ privado: true }), a(socio.inscribir));
router.get("/mis-partidos", esSocio, a(socio.misPartidos));
router.get("/mis-cuotas", esSocio, a(socio.misCuotas));
router.get("/mis-cuotas/pagar", esSocio, a(socio.formPagoOnline));
router.post("/mis-cuotas/pagar", esSocio, a(socio.pagarOnline));
router.post("/mis-cuotas/transferencia", esSocio, subida({ privado: true }), a(socio.informarTransferencia));

// Entrenador (el administrador también puede entrar)
const esEntrenador = requiereRol("entrenador", "admin");
router.get("/plantel", esEntrenador, a(entrenador.plantel));
router.get("/asistencia", esEntrenador, a(entrenador.asistencia));
router.post("/asistencia", esEntrenador, a(entrenador.guardarAsistencia));
router.get("/convocatorias", esEntrenador, a(entrenador.convocatorias));
router.post("/convocatorias/:partido", esEntrenador, a(entrenador.guardarConvocatoria));
router.post("/jugadores/:id/observaciones", esEntrenador, a(entrenador.agregarObservacion));
router.post("/jugadores/:id/deportivo", esEntrenador, a(entrenador.editarDeportivo));

// Delegado
const esDelegado = requiereRol("delegado", "admin");
router.get("/resultados", esDelegado, a(delegado.resultados));
router.post("/partidos", esDelegado, a(delegado.nuevoPartido));
router.post("/partidos/:id/resultado", esDelegado, a(delegado.guardarResultado));

// Comunicados: club, técnicos, cantina y tesorería
const puedeComunicar = requiereRol("admin", "comunicacion", "entrenador", "cantina", "tesorero");
router.get("/comunicados", puedeComunicar, a(comunicacion.comunicados));
router.post("/comunicados", puedeComunicar, a(comunicacion.enviar));
const esComunicacion = requiereRol("admin", "comunicacion");
router.get("/noticias", esComunicacion, a(comunicacion.noticias));
router.get("/noticias/nueva", esComunicacion, a(comunicacion.formNoticia));
router.post("/noticias/nueva", esComunicacion, subida({ privado: false, soloImagenes: true }), a(comunicacion.guardarNoticia));
router.get("/noticias/:id/editar", esComunicacion, a(comunicacion.formNoticia));
router.post("/noticias/:id/editar", esComunicacion, subida({ privado: false, soloImagenes: true }), a(comunicacion.guardarNoticia));
router.post("/noticias/:id/borrar", esComunicacion, a(comunicacion.borrarNoticia));
router.get("/galeria", esComunicacion, a(comunicacion.galeria));
router.post("/galeria", esComunicacion, subida({ privado: false, soloImagenes: true }), a(comunicacion.subirFoto));
router.post("/galeria/quitar", esComunicacion, a(comunicacion.quitarFoto));
router.post("/sponsors", esComunicacion, a(comunicacion.agregarSponsor));
router.post("/sponsors/quitar", esComunicacion, a(comunicacion.quitarSponsor));

// Cantina
const esCantina = requiereRol("cantina", "admin");
router.get("/cantina/productos", esCantina, a(cantina.productos));
router.get("/cantina/productos/nuevo", esCantina, a(cantina.formProducto));
router.post("/cantina/productos/nuevo", esCantina, subida({ privado: false, soloImagenes: true }), a(cantina.guardarProducto));
router.get("/cantina/productos/:id/editar", esCantina, a(cantina.formProducto));
router.post("/cantina/productos/:id/editar", esCantina, subida({ privado: false, soloImagenes: true }), a(cantina.guardarProducto));
router.post("/cantina/productos/:id/borrar", esCantina, a(cantina.borrarProducto));
router.post("/cantina/productos/:id/alternar", esCantina, a(cantina.alternarProducto));
router.get("/cantina/pedidos", esCantina, a(cantina.pedidos));
router.post("/cantina/pedidos/:id/estado", esCantina, a(cantina.estadoPedido));
router.get("/cantina/qr", esCantina, a(cantina.qr));

// Tesorería
const esTesoreria = requiereRol("tesorero", "admin");
router.get("/tesoreria", esTesoreria, a(tesoreria.resumen));
router.post("/tesoreria/recordatorio", esTesoreria, a(tesoreria.recordatorio));
router.get("/cuotas", esTesoreria, a(tesoreria.cuotas));
router.get("/cuotas/:id/pagar", esTesoreria, a(tesoreria.formPago));
router.post("/cuotas/:id/pagar", esTesoreria, a(tesoreria.registrarPago));
router.get("/cuenta", esTesoreria, a(tesoreria.cuenta));
router.get("/cuenta/:socio", esTesoreria, a(tesoreria.cuenta));
router.post("/cuenta/:socio/aviso", esTesoreria, a(tesoreria.avisoSocio));
router.get("/reportes", esTesoreria, a(tesoreria.reportes));

// Administración
const esAdmin = requiereRol("admin");
router.get("/admin", esAdmin, a(admin.dashboard));
router.get("/inscripciones", esAdmin, a(admin.inscripciones));
router.post("/inscripciones/:id/estado", esAdmin, a(admin.cambiarInscripcion));
router.get("/usuarios", esAdmin, a(admin.usuarios));
router.post("/usuarios", esAdmin, a(admin.crearUsuario));
router.post("/usuarios/:id/permisos", esAdmin, a(admin.guardarPermisos));
router.post("/usuarios/:id/clave", esAdmin, a(admin.restablecerClave));
router.get("/jugadores", esAdmin, a(admin.jugadores));
router.get("/categorias", esAdmin, a(admin.categorias));
router.post("/categorias", esAdmin, a(admin.nuevaCategoria));
router.post("/categorias/:id", esAdmin, a(admin.guardarCategoria));
router.get("/carnes", esAdmin, a(admin.carnes));
router.post("/carnes/avisar", esAdmin, a(admin.avisarCarnes));
router.get("/temporadas", esAdmin, a(admin.temporadas));
router.post("/temporadas/cerrar", esAdmin, a(admin.cerrarTemporada));
router.get("/configuracion", esAdmin, a(admin.configuracion));
router.post("/configuracion", esAdmin, a(admin.guardarConfiguracion));

module.exports = router;
