const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Comentario = require('../models/comentario.js');
const Usuario = require('../models/Usuario.js');
const Pelicula = require('../models/Pelicula.js');

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