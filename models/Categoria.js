const mongoose = require("mongoose");

const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    anio: Number,
    horario: String,
    diasEntrenamiento: [String],
    descripcion: String,
    foto: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Categoria", categoriaSchema);
