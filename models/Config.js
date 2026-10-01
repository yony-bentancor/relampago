/*
 * Configuración general del club (un único documento).
 * Campos: club, temporada, cuota, cuotaHermano, diaVencimiento, avisoCarneDias, cuentaTransferencia,
 *         direccion, telefono, email, mesesCuota [3..11], sponsors [ { nombre, rubro } ], galeria [ { foto, titulo } ]
 */
const store = require("../config/store");

const Config = {
  async obtener() {
    const d = store.cargar();
    return d.config;
  },
  async actualizar(cambios) {
    const d = store.cargar();
    Object.assign(d.config, cambios);
    store.guardar();
    return d.config;
  },
};

module.exports = Config;
