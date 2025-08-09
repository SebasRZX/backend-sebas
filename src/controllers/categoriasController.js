const db = require('../config/db');

// Obtener todas las categorías
const obtenerCategorias = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categorias');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
};

module.exports = {
    obtenerCategorias,
};
