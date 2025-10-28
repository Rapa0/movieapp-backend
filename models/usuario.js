const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: {
        type: String,
        enum: ['usuario', 'critico', 'admin'],
        default: 'usuario'
    },
    estado: {
        type: String,
        enum: ['activo', 'pendiente_verificacion'], 
        default: 'activo'
    },
    solicitudCritico: {
        motivo: { type: String },
        redesSociales: { type: String }, 
        estado: {                     
            type: String,
            enum: ['pendiente', 'aprobado', 'rechazado'],
            default: null 
        },
        fecha: { type: Date }        
    }
});

usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('Usuario', usuarioSchema);