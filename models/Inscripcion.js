const mongoose = require("mongoose");

const inscripcionSchema = new mongoose.Schema(
  {
    nombreNinio: { type: String, required: true },
    fechaNacimiento: Date,
    categoriaInteres: String,
    nombreResponsable: { type: String, required: true },
    telefono: { type: String, required: true },
    email: String,
    barrio: String,
    experienciaPrevia: String,
    observacionesMedicas: String,
    estado: {
      type: String,
      enum: ["nueva", "contactado", "cerrada"],
      default: "nueva",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Inscripcion", inscripcionSchema);
