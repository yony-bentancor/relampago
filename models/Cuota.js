const mongoose = require("mongoose");

const cuotaSchema = new mongoose.Schema(
  {
    jugador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jugador",
      required: true,
    },

    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mes: Number,
    anio: Number,

    tipo: {
      type: String,
      enum: ["mensual", "anual"],
      required: true,
    },

    monto: Number,

    estado: {
      type: String,
      enum: ["pendiente", "pagado", "vencido"],
      default: "pendiente",
    },

    fechaPago: Date,
    metodoPago: String,
    comprobante: String,
    observaciones: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Cuota", cuotaSchema);
