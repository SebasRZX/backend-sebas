// routes/eventos.js
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const {
  crearEvento,
  obtenerEventos,
  editarEvento,
  eliminarEvento,
  obtenerEventoActivo,
  cambiarEstadoEvento,
} = require('../controllers/eventosController');

router.post('/', verificarToken, crearEvento);
router.get('/', verificarToken, obtenerEventos);
router.put('/:id', verificarToken, editarEvento);
router.delete('/:id', verificarToken, eliminarEvento);
router.get('/activo', verificarToken, obtenerEventoActivo);
router.put('/:id/estado', verificarToken, cambiarEstadoEvento);

module.exports = router;
