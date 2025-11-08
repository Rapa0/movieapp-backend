const express = require('express');
const router = express.Router();
const axios = require('axios');
const Pelicula = require('../models/pelicula.js');
const Comentario = require('../models/comentario.js');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https.api.themoviedb.org/3';

router.get('/now-playing', async (req, res) => {
  const page = req.query.page || 1;
  try {
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&page=${page}&language=es-ES`);
    res.json(tmdbResponse.data);
  } catch (error) {
    console.error('Error fetching now playing movies:', error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.get('/top-rated', async (req, res) => {
  const page = req.query.page || 1;
  try {
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}&language=es-ES`);
    res.json(tmdbResponse.data);
  } catch (error) {
    console.error('Error fetching top rated movies:', error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.get('/upcoming', async (req, res) => {
  const page = req.query.page || 1;
  try {
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&page=${page}&language=es-ES`);
    res.json(tmdbResponse.data);
  } catch (error) {
    console.error('Error fetching upcoming movies:', error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.get('/search', async (req, res) => {
  const query = req.query.query || '';
  const page = req.query.page || 1;
  try {
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${query}&language=es-ES&page=${page}`);
    res.json(tmdbResponse.data);
  } catch (error) {
    console.error('Error fetching search results:', error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.get('/genres', async (req, res) => {
  try {
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=es-ES`);
    res.json(tmdbResponse.data);
  } catch (error) {
    console.error('Error fetching genres:', error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.get('/genre/:genreId', async (req, res) => {
  const genreId = req.params.genreId;
  const page = req.query.page || 1;
  try {
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}&language=es-ES`);
    res.json(tmdbResponse.data);
  } catch (error) {
    console.error('Error fetching movies by genre:', error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.get('/:movieId/credits', async (req, res) => {
  const movieId = req.params.movieId;
  try {
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=es-ES`);
    res.json(tmdbResponse.data);
  } catch (error) {
    console.error('Error fetching movie credits:', error.message);
    res.status(500).send('Error en el servidor');
  }
});


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