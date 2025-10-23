const Comentario = require('../models/comentario');

module.exports = async function(req, res, next) {
    try {
        const comentario = await Comentario.findById(req.params.id);
        if (!comentario) {
            return res.status(404).json({ msg: 'Comentario no encontrado.' });
        }
        if (comentario.autor.toString() !== req.usuario.id) {
            return res.status(401).json({ msg: 'No autorizado.' });
        }
        next();
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
};