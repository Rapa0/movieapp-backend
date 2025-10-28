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
  console.log('RECIBIDA: Solicitud POST /solicitar-critico');
  console.log('Usuario ID desde token:', req.usuario.id);
  console.log('Body recibido:', req.body);

  try {
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      console.error('ERROR: Usuario no encontrado con ID:', req.usuario.id);
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    console.log('Usuario encontrado:', usuario.nombre, 'Rol:', usuario.rol);

    if (usuario.rol === 'critico') {
      console.warn('ADVERTENCIA: Usuario ya es crítico.');
      return res.status(400).json({ msg: 'Ya eres crítico' });
    }

    if (usuario.solicitudCritico && usuario.solicitudCritico.estado === 'pendiente') {
      console.warn('ADVERTENCIA: Solicitud pendiente existente.');
      return res.status(400).json({ msg: 'Ya has enviado una solicitud' });
    }

    const { motivacion, redesSocialiales } = req.body;

    if (!motivacion || motivacion.length < 20) {
       console.error('ERROR: Motivación inválida recibida.');
       return res.status(400).json({ msg: 'La motivación es requerida y debe tener al menos 20 caracteres.'});
    }

    usuario.solicitudCritico = {
      motivacion,
      redesSociales: redesSocialiales,
      estado: 'pendiente',
      fecha: new Date()
    };

    console.log('Intentando guardar solicitud para:', usuario.nombre);
    await usuario.save();
    console.log('Solicitud guardada exitosamente para:', usuario.nombre);

    res.json({ msg: 'Solicitud enviada correctamente' });

  } catch (error) {
    console.error('ERROR FATAL en /solicitar-critico:', error);
    console.error('Stack Trace:', error.stack);
    res.status(500).send('Error en el servidor al procesar la solicitud.');
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