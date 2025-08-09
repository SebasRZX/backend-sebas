// routes/cajas.js
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const {
    abrirCaja,
    cerrarCaja,
    obtenerCajaActual,
    obtenerResumenCaja,
    obtenerReporteCajas,
} = require('../controllers/cajasController');

router.post('/abrir', verificarToken, abrirCaja);
router.post('/cerrar', verificarToken, cerrarCaja);
router.get('/actual', verificarToken, obtenerCajaActual);
router.get('/resumen', verificarToken, obtenerResumenCaja);
router.get('/reporte', verificarToken, obtenerReporteCajas);

module.exports = router;
