// routes/usuarios.js

const express = require('express');
const verificarToken = require('../middlewares/authMiddleware');
const {
  loginUsuario,
  verificarUsuario,
  logoutUsuario,
  obtenerUsuarios,
  crearUsuario,
  eliminarUsuario,
  editarUsuario,
} = require('../controllers/usuariosController');

const router = express.Router();

router.post('/login', loginUsuario);
router.get('/verificar', verificarToken, verificarUsuario);
router.post('/logout', logoutUsuario);

router.get('/', verificarToken, obtenerUsuarios);
router.post('/', verificarToken, crearUsuario);
router.delete('/:id', verificarToken, eliminarUsuario);
router.put('/:id', verificarToken, editarUsuario);

module.exports = router;
