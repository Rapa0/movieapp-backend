const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./database');

connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:8100',
  'http://localhost:8101',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'ionic://localhost'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
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