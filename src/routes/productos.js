// routes/productos.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const verificarToken = require('../middlewares/authMiddleware');
const {
  obtenerProductos,
  crearProducto,
  eliminarProducto,
  actualizarProducto,
  restaurarProducto,
  obtenerProductosInactivos,
} = require('../controllers/productosController');

const router = express.Router();

// Configurar almacenamiento de imágenes
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const nombre = Date.now() + path.extname(file.originalname);
    cb(null, nombre);
  },
});
const upload = multer({ storage });

// Rutas
router.get('/', obtenerProductos);
router.post('/', verificarToken, upload.single('imagen'), crearProducto);
router.delete('/:id', verificarToken, eliminarProducto);
router.put('/:id', verificarToken, upload.single('imagen'), actualizarProducto);
router.get('/inactivos', verificarToken, obtenerProductosInactivos);
router.put('/restaurar/:id', verificarToken, restaurarProducto);



module.exports = router;
