const mongoose = require('mongoose');

const comentarioSchema = new mongoose.Schema({
  pelicula: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pelicula', 
    required: true 
  },
  peliculaId: { 
    type: String, 
    required: true 
  },
  autor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  autorNombre: { 
    type: String, 
    required: true 
  },
  autorRol: { 
    type: String, 
    required: true, 
    enum: ['usuario', 'critico', 'admin']
  },
  texto: { 
    type: String, 
    required: true 
  },
  puntuacion: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 10 
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Comentario', comentarioSchema);