const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkOwnership = require('../middleware/checkOwnership');
const Comentario = require('../models/comentario');
const Usuario = require('../models/usuario');

router.get('/:peliculaId', async (req, res) => {
    try {
        const comentarios = await Comentario.find({ peliculaId: req.params.peliculaId })
            .populate('autor', 'nombre _id') 
            .sort({ createdAt: -1 });
        res.json(comentarios);
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

router.post('/:peliculaId', auth, async (req, res) => {
    const { texto, puntuacion } = req.body;
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        const nuevoComentario = new Comentario({
            texto,
            puntuacion,
            peliculaId: req.params.peliculaId,
            autor: req.usuario.id,
            autorRol: usuario.rol
        });
        const comentario = await nuevoComentario.save();
        res.json(comentario);
    } catch (error) {
        console.error("Error al crear comentario:", error);
        res.status(500).send('Error en el servidor');
    }
});

router.put('/:id', [auth, checkOwnership], async (req, res) => {
    const { texto, puntuacion } = req.body;
    try {
        const comentario = await Comentario.findByIdAndUpdate(
            req.params.id,
            { texto, puntuacion },
            { new: true }
        );
        res.json(comentario);
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

router.delete('/:id', [auth, checkOwnership], async (req, res) => {
    try {
        await Comentario.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Comentario eliminado.' });
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;