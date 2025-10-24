const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./database');

connectDB();

const app = express();

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:8100',
    'https://localhost',
    'ionic://localhost',
    'http://localhost'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
};

app.use(cors(corsOptions)); 
app.use(express.json()); 

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('¡API de MovieApp funcionando!');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/comentarios', require('./routes/comentarios'));
app.use('/api/peliculas', require('./routes/peliculas'));
app.use('/api/usuarios', require('./routes/usuarios'));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
