// routes/comandas.js
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { generarComanda } = require('../controllers/comandasController');

router.get('/:id', verificarToken, generarComanda);

module.exports = router;
