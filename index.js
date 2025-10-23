const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./database');

connectDB();

const app = express();

const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:8100'
};
app.use(cors(corsOptions)); 
app.use(express.json()); 

const PORT = process.env.PORT || 3000;

app.use('/api/auth', require('./routes/auth'));
app.use('/api/comentarios', require('./routes/comentarios'));
app.use('/api/peliculas', require('./routes/peliculas'));
app.use('/api/usuarios', require('./routes/usuarios'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});