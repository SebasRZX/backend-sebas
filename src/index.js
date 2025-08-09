const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const usuariosRoutes = require('./routes/usuarios');
const categoriasRouter = require('./routes/categorias');
const productosRoutes = require('./routes/productos');
const ventasRoutes = require('./routes/ventas');
const comandasRoutes = require('./routes/comandas');
const eventosRoutes = require('./routes/eventos');
const turnosRoutes = require('./routes/turnos');
const cajaRoutes = require('./routes/caja');

require('dotenv').config();

const app = express();

// ⚠️ Reemplazar esto en producción
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Rutas API
app.use('/usuarios', usuariosRoutes);
app.use('/categorias', categoriasRouter);
app.use('/productos', productosRoutes);
app.use('/ventas', ventasRoutes);
app.use('/comandas', comandasRoutes);
app.use('/eventos', eventosRoutes);
app.use('/turnos', turnosRoutes);
app.use('/caja', cajaRoutes);

// Archivos estáticos (p. ej., imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Puerto dinámico para Azure
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});