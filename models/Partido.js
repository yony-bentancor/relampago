const mongoose = require("mongoose");

const partidoSchema = new mongoose.Schema(
  {
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categoria",
      required: true,
    },
    rival: { type: String, required: true },
    fecha: { type: Date, required: true },
    hora: String,
    cancha: String,
    condicion: {
      type: String,
      enum: ["local", "visitante"],
      default: "local",
    },
    resultadoRelampago: Number,
    resultadoRival: Number,
    estado: {
      type: String,
      enum: ["programado", "jugado", "suspendido"],
      default: "programado",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Partido", partidoSchema);
