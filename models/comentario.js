const mongoose = require('mongoose');

const comentarioSchema = new mongoose.Schema({
    texto: { type: String, required: true },
    puntuacion: { type: Number, required: true, min: 1, max: 10 },
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    autorRol: { type: String, required: true, enum: ['usuario', 'critico'] }, 
    peliculaId: { type: String, required: true } 
}, { timestamps: true });

module.exports = mongoose.model('Comentario', comentarioSchema);