const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Usuario = require('../models/usuario.js');
const Comentario = require('../models/comentario.js');

router.get('/me', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    res.json(usuario);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.post('/solicitar-critico', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    if (usuario.rol === 'critico') {
      return res.status(400).json({ msg: 'Ya eres crítico' });
    }
    
    if (usuario.solicitudCritico && usuario.solicitudCritico.estado === 'pendiente') {
      return res.status(400).json({ msg: 'Ya has enviado una solicitud' });
    }

    const { motivacion, redesSociales } = req.body;
    
    usuario.solicitudCritico = {
      motivacion,
      redesSociales,
      estado: 'pendiente'
    };
    
    await usuario.save();
    res.json({ msg: 'Solicitud enviada correctamente' });
    
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.get('/pendientes', auth, async (req, res) => {
  try {
    const admin = await Usuario.findById(req.usuario.id);
    if (admin.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    const usuariosPendientes = await Usuario.find({ 'solicitudCritico.estado': 'pendiente' });
    res.json(usuariosPendientes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.put('/aprobar-critico/:id', auth, async (req, res) => {
  try {
    const admin = await Usuario.findById(req.usuario.id);
    if (admin.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario || !usuario.solicitudCritico || usuario.solicitudCritico.estado !== 'pendiente') {
      return res.status(404).json({ msg: 'Solicitud no encontrada o ya procesada' });
    }
    
    usuario.rol = 'critico';
    usuario.solicitudCritico.estado = 'aprobado';
    await usuario.save();
    
    res.json({ msg: 'Usuario aprobado como crítico' });
    
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor');
  }
});

router.put('/rechazar-critico/:id', auth, async (req, res) => {
  try {
    const admin = await Usuario.findById(req.usuario.id);
    if (admin.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario || !usuario.solicitudCritico || usuario.solicitudCritico.estado !== 'pendiente') {
      return res.status(404).json({ msg: 'Solicitud no encontrada o ya procesada' });
    }
    
    usuario.solicitudCritico.estado = 'rechazado';
    await usuario.save();
    
    res.json({ msg: 'Solicitud de crítico rechazada' });
    
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;