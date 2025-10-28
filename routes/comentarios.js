const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Comentario = require('../models/comentario.js');
const Usuario = require('../models/usuario.js');
const Pelicula = require('../models/pelicula.js');
const mongoose = require('mongoose');

router.post('/local-scores', async (req, res) => {
    const { movieIds } = req.body;

    if (!Array.isArray(movieIds) || movieIds.length === 0) {
        return res.status(400).json({ msg: 'Debe proporcionar una lista de IDs de películas.' });
    }

    try {
        const peliculas = await Pelicula.find({ tmdbId: { $in: movieIds } }, '_id tmdbId');
        const peliculaIds = peliculas.map(p => p._id);
        const tmdbIdMap = new Map(peliculas.map(p => [p._id.toString(), p.tmdbId]));

        if (peliculaIds.length === 0) {
            return res.json([]);
        }

        const pipeline = [
            { $match: { pelicula: { $in: peliculaIds } } },
            
            { 
                $group: {
                    _id: { peliculaId: '$pelicula', autorRol: '$autorRol' },
                    averageScore: { $avg: '$puntuacion' }
                }
            },
            
            { 
                $group: {
                    _id: '$_id.peliculaId',
                    scores: { 
                        $push: { 
                            rol: '$_id.autorRol', 
                            score: '$averageScore' 
                        } 
                    }
                }
            }
        ];

        const results = await Comentario.aggregate(pipeline);

        const formattedScores = results.map(result => {
            const userScoreObj = result.scores.find(s => s.rol === 'usuario' || s.rol === 'admin');
            const criticScoreObj = result.scores.find(s => s.rol === 'critico');
            
            const rawUserScore = userScoreObj ? userScoreObj.score : 0;
            const rawCriticScore = criticScoreObj ? criticScoreObj.score : 0;
            
            const userScore = rawUserScore > 0 ? parseFloat(rawUserScore.toFixed(1)) : null;
            const criticScore = rawCriticScore > 0 ? parseFloat(rawCriticScore.toFixed(1)) : null;

            const tmdbId = tmdbIdMap.get(result._id.toString());

            return {
                tmdbId: tmdbId,
                userScore: userScore,
                criticScore: criticScore
            };
        });

        res.json(formattedScores);

    } catch (error) {
        console.error('Error al obtener scores locales:', error.message);
        return res.status(500).send('Error en el servidor al calcular puntuaciones.');
    }
});


router.get('/:peliculaId', async (req, res) => {
    try {
        const pelicula = await Pelicula.findOne({ tmdbId: req.params.peliculaId });
        if (!pelicula) {
            return res.json([]);
        }
        const comentarios = await Comentario.find({ pelicula: pelicula._id }).sort({ fecha: -1 });
        res.json(comentarios);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

router.post(
    '/:peliculaId',
    [
        auth,
        [
            check('texto', 'El texto es obligatorio').not().isEmpty(),
            check('puntuacion', 'La puntuación es obligatoria').not().isEmpty().isNumeric(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { texto, puntuacion } = req.body;
        const { peliculaId } = req.params;

        try {
            const pelicula = await Pelicula.findOne({ tmdbId: peliculaId });
            if (!pelicula) {
                return res.status(404).json({ msg: 'Película no encontrada en la base de datos local.' });
            }
            
            const usuario = await Usuario.findById(req.usuario.id);
            if (!usuario) {
                return res.status(404).json({ msg: 'Usuario no encontrado' });
            }

            const nuevoComentario = new Comentario({
                pelicula: pelicula._id,
                peliculaId: peliculaId,
                autor: req.usuario.id,
                autorNombre: usuario.nombre,
                autorRol: usuario.rol,
                texto,
                puntuacion,
            });

            const comentario = await nuevoComentario.save();
            res.json(comentario);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Error en el servidor');
        }
    }
);

router.put(
    '/:id', 
    [ 
        auth, 
        [
            check('texto', 'El texto es obligatorio').not().isEmpty(),
            check('puntuacion', 'La puntuación es obligatoria').not().isEmpty().isNumeric(),
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { texto, puntuacion } = req.body;
        
        try {
            let comentario = await Comentario.findById(req.params.id);
            if (!comentario) return res.status(404).json({ msg: 'Comentario no encontrado' });
            
            if (comentario.autor.toString() !== req.usuario.id) {
                return res.status(401).json({ msg: 'No autorizado' });
            }
            
            comentario = await Comentario.findByIdAndUpdate(
                req.params.id,
                { $set: { texto, puntuacion, fecha: Date.now() } }, 
                { new: true }
            );
            
            res.json(comentario);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Error en el servidor');
        }
    }
);

router.delete('/:id', auth, async (req, res) => {
    try {
        let comentario = await Comentario.findById(req.params.id);
        if (!comentario) return res.status(404).json({ msg: 'Comentario no encontrado' });

        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

        if (comentario.autor.toString() !== req.usuario.id && usuario.rol !== 'admin') {
            return res.status(401).json({ msg: 'No autorizado' });
        }
        
        await Comentario.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Comentario eliminado' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;