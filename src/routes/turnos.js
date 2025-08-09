// routes/turnos.js
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const {
  crearTurno,
  obtenerTurnosPorEvento,
  obtenerAsignacionesPorTurno,
  asignarUsuario,
  eliminarTurno,
  editarTurno,
  eliminarAsignacion,
  editarRolAsignado,
} = require('../controllers/turnosController');

router.post('/', verificarToken, crearTurno);
router.get('/evento/:evento_id', verificarToken, obtenerTurnosPorEvento);
router.get('/usuarios/:turno_id', verificarToken, obtenerAsignacionesPorTurno);
router.post('/asignar', verificarToken, asignarUsuario);
router.delete('/:turno_id', verificarToken, eliminarTurno);
router.put('/:turno_id', verificarToken, editarTurno);
router.delete('/asignacion/:id', verificarToken, eliminarAsignacion);
router.put('/asignacion/:id', verificarToken, editarRolAsignado);

module.exports = router;
