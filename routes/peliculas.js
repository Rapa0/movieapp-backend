const express = require('express');
const router = express.Router();
const axios = require('axios');
const Pelicula = require('../models/pelicula.js');
const Comentario = require('../models/comentario.js');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

router.get('/:id', async (req, res) => {
  const { id } = req.params; 
  try {
    
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=es-ES`);
    const data = tmdbResponse.data;

    let pelicula = await Pelicula.findOne({ tmdbId: id });
    
    if (!pelicula) {
      pelicula = new Pelicula({
        tmdbId: data.id,
        title: data.title,
        overview: data.overview,
        poster_path: data.poster_path,
        release_date: data.release_date,
        tagline: data.tagline
      });
      await pelicula.save();
    }
    
    res.json(data);

  } catch (error) {
    console.error('Error fetching movie details from TMDB or saving movie:', error.message);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
