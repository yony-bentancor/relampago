# Club Relámpago

Web pública y sistema de gestión del **Club Atlético Relámpago** (baby fútbol, categorías 2013 a 2020).

Hecho con **Node.js + Express + EJS**. Por ahora los datos se guardan en un archivo JSON, así que **no necesita MongoDB** para funcionar. Está preparado para pasar a MongoDB más adelante sin tocar los controladores.

---

## Arrancar en tu computadora

Necesitás Node.js 18 o más nuevo.

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm start
```

Abrí http://localhost:3000

La primera vez se generan solos los datos de prueba en `data/db.json`. Para borrar todo y volver a generarlos:

```bash
npm run seed
```

Para desarrollar con reinicio automático al guardar: `npm run dev`.

## Usuarios de prueba

Todos usan la contraseña **`relampago2026`**. También aparecen en la pantalla **Ingresar** con un botón para entrar directo (se ocultan con `MODO_DEMO=false`).

| Correo | Qué ve |
|---|---|
| admin@relampago.uy | Administrador: todo el sistema |
| tesoreria@relampago.uy | Tesorería: cuotas, pagos, deudas y reportes |
| entrenador@relampago.uy | Entrenador de la categoría 2016 |
| delegado@relampago.uy | Socio con un hijo en 2016 y delegado de esa categoría |
| comunicacion@relampago.uy | Comunicación: comunicados, noticias, galería |
| cantina@relampago.uy | Cantina y comunicación |
| socio@relampago.uy | Socia con dos hijos (2016 y 2019), un carné por vencer y cuotas atrasadas |

El resto de los usuarios de ejemplo (otros 2 administradores, 7 entrenadores, delegados y unos 70 socios) usan la misma contraseña. Sus correos se ven en **Usuarios y permisos**.

## Qué incluye

**Web pública:** inicio, el club, categorías y planteles, fixture, resultados, tabla de posiciones, noticias, galería, sponsors, hacete socio, contacto, registro e ingreso. Cualquier persona puede registrarse.

**Por rol** (una persona puede tener varios):

| Rol | Funciones |
|---|---|
| Socio | Sus jugadores (puede tener varios), ficha completa, inscripción con documentos, partidos y convocatorias, cuotas, pago online (simulado), aviso de transferencia con comprobante, actualizar carné de salud, comunicados, datos personales |
| Entrenador | Solo sus categorías: plantel, ficha completa del niño (incluida la información médica), asistencia, convocatorias, observaciones, comunicados a sus familias |
| Delegado | Carga resultados y partidos de su categoría; la tabla se actualiza sola |
| Tesorero | Resumen, cuotas y pagos (marcar como paga avisa al socio en el momento), confirmar transferencias, estado de cuenta, reportes, recordatorios |
| Comunicación | Comunicados (a todos, a una categoría o a un socio), noticias, galería y sponsors |
| Cantina | Productos con foto, precio y stock; pedidos; QR del mostrador |
| Administrador | Todo lo anterior, más inscripciones, usuarios y permisos, jugadores, categorías, carnés de salud, temporadas y configuración |

**Para todos los registrados:** cantina online con carrito (se puede llegar escaneando el QR del mostrador), avisos y comunicados.

**Otras cosas importantes:**
- **Exportar a PDF y Excel** desde casi todas las pantallas (padrón, plantel, asistencia, cuotas, deudores, estado de cuenta, reportes, carnés, inscripciones, productos, pedidos, tabla y temporadas). Se generan sin librerías externas.
- **Carné de salud** con vencimiento y aviso a la familia y a la administración (30 días antes, configurable).
- **Fotos de los niños** solo con autorización de los padres: la web pública muestra nombre e inicial, y comunicación ve la lista de quienes no autorizaron.
- **Información médica** visible solo para administración, el entrenador de la categoría y la familia.
- **Documentos privados** (cédula, carné, comprobantes) solo los ve quien tiene permiso.
- **Temporadas:** al cerrar una se guarda el historial y se arma la siguiente.
- **Cuotas automáticas:** cada mes (marzo a noviembre) se genera la cuota de cada jugador. El primer hijo paga la cuota completa y los hermanos la reducida. Las cuotas impagas pasan a "vencida" solas.
- **Navegación en celulares:** menú desplegable, secciones del panel en un cajón lateral, y tablas que se convierten en tarjetas.

## Estructura

```
app.js                  arranque del servidor
config/                 configuración, almacenamiento JSON y conexión a MongoDB (pendiente)
models/                 un modelo por entidad (Usuario, Socio, Jugador, Cuota, Partido...)
controllers/            lógica de cada área (público, socio, entrenador, tesorería, admin...)
routes/                 rutas: público, ingreso, panel, exportar, archivos
middlewares/            sesión y permisos, subida de archivos, variables de las vistas, errores
services/               fechas, contraseñas, avisos, estadísticas, menú por rol, PDF y Excel
views/                  plantillas EJS (público, panel por rol, parciales)
public/                 CSS, JS del navegador e imágenes del club
scripts/seed.js         genera los datos de prueba
data/                   db.json (se genera solo, no se sube a GitHub)
uploads/                documentos y fotos subidos (no se suben a GitHub)
```

## Publicar en Heroku

```bash
heroku create club-relampago
heroku config:set SESSION_SECRET="un-texto-largo-y-aleatorio" NODE_ENV=production MODO_DEMO=true URL_SITIO=https://club-relampago.herokuapp.com
git push heroku main
```

El archivo `Procfile` ya está incluido.

**Importante sobre Heroku sin base de datos:** el disco de Heroku se borra cada vez que la app se reinicia (al menos una vez por día). Con el archivo JSON, los cambios y los archivos subidos se pierden y vuelven los datos de prueba. Para un prototipo de demostración está bien. Para usarlo de verdad hay que activar MongoDB y guardar los archivos en un servicio como Cloudinary o S3.

## Activar MongoDB más adelante

1. `npm install mongoose`
2. En `.env` (o en las Config Vars de Heroku) poné `USAR_MONGO=true` y `MONGO_URI=...`
3. Reemplazá los métodos de `models/Modelo.js` (`todos`, `uno`, `porId`, `crear`, `actualizar`, `guardar`, `eliminar`, `contar`) por consultas de Mongoose. Cada modelo tiene sus campos documentados al principio del archivo, para armar los esquemas.

Los controladores no cambian, porque solo usan esos métodos.

## Seguridad

- **Nunca subas el archivo `.env` a GitHub.** Ya está en `.gitignore`. Las claves de producción van en las Config Vars de Heroku.
- Las contraseñas se guardan cifradas (scrypt).
- Antes de usarlo con familias reales: poné `MODO_DEMO=false`, cambiá las contraseñas de prueba y revisá quién tiene cada permiso.

## Pendiente

- Pago online real (Mercado Pago). Hoy el botón simula el pago.
- Avisos por correo o WhatsApp. Hoy los avisos se ven dentro de la plataforma.
- Datos reales del club: dirección, teléfono, correo, historia, cuenta bancaria y monto de la cuota (se editan en **Configuración**).
