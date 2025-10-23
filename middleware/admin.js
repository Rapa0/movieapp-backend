const Usuario = require('../models/usuario');

module.exports = async function(req, res, next) {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (usuario.rol !== 'admin') {
            return res.status(403).json({ msg: 'Acceso denegado. Se requieren permisos de administrador.' });
        }
        next();
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
};