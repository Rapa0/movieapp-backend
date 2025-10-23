const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Usuario = require('../models/usuario');

router.get('/me', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-password');
        res.json(usuario);
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

router.post('/solicitar-critico', auth, async (req, res) => {
    const { motivo, enlaces } = req.body;
    try {
        await Usuario.findByIdAndUpdate(req.usuario.id, { 
            estado: 'pendiente_critico',
            solicitudCritico: {
                motivo,
                enlaces,
                fecha: new Date()
            }
        });
        res.json({ msg: 'Solicitud enviada correctamente.' });
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

router.get('/pendientes', [auth, admin], async (req, res) => {
    try {
        const usuarios = await Usuario.find({ estado: 'pendiente_critico' }).select('-password');
        res.json(usuarios);
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

router.put('/aprobar-critico/:id', [auth, admin], async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id, 
            { rol: 'critico', estado: 'activo', solicitudCritico: {} },
            { new: true }
        );
        res.json(usuario);
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

router.put('/rechazar-critico/:id', [auth, admin], async (req, res) => {
    try {
        await Usuario.findByIdAndUpdate(req.params.id, { 
            estado: 'activo',
            solicitudCritico: {}
        });
        res.json({ msg: 'Solicitud rechazada.' });
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;