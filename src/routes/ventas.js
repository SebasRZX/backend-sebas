// routes/ventas.js
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const {
  crearVenta,
  reporteVentasPorEvento,
} = require('../controllers/ventasController');

router.post('/', verificarToken, crearVenta);
router.get('/reporte', verificarToken, reporteVentasPorEvento);

module.exports = router;
