const express = require('express');
const router = express.Router();
const axios = require('axios');
const Pelicula = require('../models/pelicula');

router.get('/:tmdbId', async (req, res) => {
    try {

        let pelicula = await Pelicula.findOne({ tmdbId: req.params.tmdbId });

        if (pelicula) {
            return res.json(pelicula);
        }

        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/${req.params.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=es-ES`);
        
        const data = tmdbResponse.data;

        pelicula = new Pelicula({
            tmdbId: data.id,
            title: data.title,
            overview: data.overview,
            poster_path: data.poster_path,
            release_date: data.release_date,
            tagline: data.tagline
        });
       
        await pelicula.save();
        

        res.json(pelicula);

    } catch (error) {
        console.error('Error al obtener detalles de la película:', error.message);
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;