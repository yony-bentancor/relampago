/*
 * Modelo base. Todos los modelos heredan estos métodos.
 * Son asíncronos para que el cambio a MongoDB/Mongoose no obligue a tocar los controladores.
 */
const store = require("../config/store");

class Modelo {
  static coleccion = "";
  static prefijo = "x";

  static _datos() { return store.coleccion(this.coleccion); }

  /** Lista todos los documentos, opcionalmente filtrados con una función. */
  static async todos(filtro) {
    const d = this._datos();
    return filtro ? d.filter(filtro) : d.slice();
  }

  static async uno(filtro) { return this._datos().find(filtro) || null; }

  static async porId(id) {
    if (!id) return null;
    return this._datos().find((x) => x.id === id) || null;
  }

  static async contar(filtro) { return filtro ? this._datos().filter(filtro).length : this._datos().length; }

  static async crear(datos) {
    const doc = { id: store.nuevoId(this.prefijo), creado: new Date().toISOString(), ...datos };
    this._datos().push(doc);
    store.guardar();
    return doc;
  }

  static async actualizar(id, cambios) {
    const doc = await this.porId(id);
    if (!doc) return null;
    Object.assign(doc, cambios, { actualizado: new Date().toISOString() });
    store.guardar();
    return doc;
  }

  /** Guarda un documento que se modificó directamente. */
  static async guardar(doc) {
    if (doc) doc.actualizado = new Date().toISOString();
    store.guardar();
    return doc;
  }

  static async eliminar(id) {
    const d = this._datos();
    const i = d.findIndex((x) => x.id === id);
    if (i === -1) return false;
    d.splice(i, 1);
    store.guardar();
    return true;
  }
}

module.exports = Modelo;
