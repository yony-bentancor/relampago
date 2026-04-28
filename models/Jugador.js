const mongoose = require("mongoose");

const jugadorSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    fechaNacimiento: { type: Date, required: true },
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categoria",
      required: true,
    },
    padre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fichaMedica: String,
    observaciones: String,
    foto: String,
    activo: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Jugador", jugadorSchema);
