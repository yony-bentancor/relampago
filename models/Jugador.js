const mongoose = require("mongoose");

const jugadorSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    apellido: {
      type: String,
      required: true,
      trim: true,
    },

    fechaNacimiento: {
      type: Date,
      required: true,
    },

    cedula: {
      type: String,
      trim: true,
      default: "",
    },

    foto: {
      type: String,
      default: "",
    },

    categoria: {
      type: String,
      required: true,
    },

    responsables: [
      {
        usuario: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        parentesco: {
          type: String,
          enum: ["padre", "madre", "tutor", "otro"],
          required: true,
        },

        principal: {
          type: Boolean,
          default: false,
        },
      },
    ],

    datosMedicos: {
      mutualista: {
        type: String,
        trim: true,
        default: "",
      },

      emergenciaMovil: {
        type: String,
        trim: true,
        default: "",
      },

      numeroEmergencia: {
        type: String,
        trim: true,
        default: "",
      },

      alergias: {
        type: String,
        trim: true,
        default: "",
      },

      medicacion: {
        type: String,
        trim: true,
        default: "",
      },

      enfermedades: {
        type: String,
        trim: true,
        default: "",
      },

      observaciones: {
        type: String,
        trim: true,
        default: "",
      },
    },

    observaciones: {
      type: String,
      trim: true,
      default: "",
    },

    estado: {
      type: String,
      enum: ["pendiente", "activo", "inactivo", "baja"],
      default: "pendiente",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Jugador", jugadorSchema);
