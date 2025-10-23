const mongoose = require('mongoose');

const peliculaSchema = new mongoose.Schema({
    tmdbId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    overview: { type: String },
    poster_path: { type: String },
    release_date: { type: String },
    tagline: { type: String }
});

module.exports = mongoose.model('Pelicula', peliculaSchema);