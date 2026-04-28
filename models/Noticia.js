const mongoose = require("mongoose");

const noticiaSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true },
    resumen: String,
    contenido: { type: String, required: true },
    imagen: String,
    publicada: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Noticia", noticiaSchema);
