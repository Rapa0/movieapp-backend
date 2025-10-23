const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const Usuario = require('../models/usuario');
const router = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const tempVerification = {}; 

router.post('/registro', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const userExists = await Usuario.findOne({ $or: [{ email }, { nombre }] });
        if (userExists) {
            return res.status(400).json({ msg: 'El email o el nombre de usuario ya están en uso.' });
        }
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        tempVerification[email] = {
            nombre,
            email,
            password: password, 
            codigo,
            timestamp: Date.now()
        };
        const msg = {
            to: email,
            from: process.env.VERIFIED_EMAIL,
            subject: 'Código de Verificación - MovieApp',
            text: `Tu código de verificación para MovieApp es: ${codigo}`,
            html: `<strong>Tu código de verificación para MovieApp es: ${codigo}</strong>`,
        };
        await sgMail.send(msg);
        res.status(200).json({ msg: 'Código de verificación enviado al correo.' });
    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).send('Error en el servidor al procesar el registro.');
    }
});

router.post('/verificar', async (req, res) => {
    const { email, codigo } = req.body;
    try {
        const tempUser = tempVerification[email];
        if (!tempUser || tempUser.codigo !== codigo) {
            return res.status(400).json({ msg: 'El código de verificación es incorrecto.' });
        }
        const diezMinutos = 10 * 60 * 1000;
        if (Date.now() - tempUser.timestamp > diezMinutos) {
            delete tempVerification[email];
            return res.status(400).json({ msg: 'El código de verificación ha expirado.' });
        }
        const usuario = new Usuario({
            nombre: tempUser.nombre,
            email: tempUser.email,
            password: tempUser.password
        });
        await usuario.save(); 
        delete tempVerification[email];
        const payload = { usuario: { id: usuario.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (error, token) => {
            if (error) throw error;
            res.status(201).json({ token });
        });
    } catch (error) {
        console.error("Error al verificar código:", error);
        res.status(500).send('Error en el servidor al verificar el código.');
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }
        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }
        const payload = { usuario: { id: usuario.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (error, token) => {
            if (error) throw error;
            res.json({ token });
        });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).send('Error en el servidor');
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const successResponse = { msg: 'Si existe una cuenta con ese email, te hemos enviado un código para restablecer tu contraseña.' };
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.json(successResponse);
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        tempVerification[email] = { codigo, userId: usuario.id, timestamp: Date.now() };
        const msg = {
            to: email,
            from: process.env.VERIFIED_EMAIL,
            subject: 'Código de Restablecimiento - MovieApp',
            text: `Tu código para restablecer tu contraseña es: ${codigo}`,
            html: `<strong>Tu código de restablecimiento es: ${codigo}</strong>`,
        };
        await sgMail.send(msg);
        return res.json(successResponse); 
    } catch (error) {
        console.error("Error en forgot-password:", error);
        return res.status(200).json(successResponse); 
    }
});

router.post('/verify-reset-code', async (req, res) => {
    const { email, codigo } = req.body;
    try {
        const tempUser = tempVerification[email];
        if (!tempUser || tempUser.codigo !== codigo) {
            return res.status(400).json({ msg: 'El código de verificación es incorrecto.' });
        }
        const diezMinutos = 10 * 60 * 1000;
        if (Date.now() - tempUser.timestamp > diezMinutos) {
            delete tempVerification[email];
            return res.status(400).json({ msg: 'El código de verificación ha expirado.' });
        }
        res.json({ msg: 'Código válido.' });
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, codigo, password } = req.body;
    try {
        const tempUser = tempVerification[email];
        if (!tempUser || tempUser.codigo !== codigo) {
            return res.status(400).json({ msg: 'El código de verificación es incorrecto o inválido.' });
        }
        const diezMinutos = 10 * 60 * 1000;
        if (Date.now() - tempUser.timestamp > diezMinutos) {
            delete tempVerification[email];
            return res.status(400).json({ msg: 'El código de verificación ha expirado.' });
        }
        const usuario = await Usuario.findById(tempUser.userId);
        if (!usuario) {
            delete tempVerification[email];
            return res.status(400).json({ msg: 'Usuario no encontrado.' });
        }
        usuario.password = password;
        await usuario.save(); 
        delete tempVerification[email];
        res.json({ msg: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        console.error("Error en reset-password:", error);
        res.status(500).json({ msg: 'Error interno del servidor al actualizar la contraseña.' });
    }
});

module.exports = router;