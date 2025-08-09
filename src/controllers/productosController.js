// controllers/productosController.js
const db = require('../config/db');

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT productos.*, categorias.nombre AS categoria, categorias.id AS categoria_id
      FROM productos
      LEFT JOIN categorias ON productos.categoria_id = categorias.id
      WHERE productos.estado = 'activo'
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};


//Crear productos
const crearProducto = async (req, res) => {
  try {
    console.log('BODY:', req.body);
    console.log('FILE:', req.file);

    const { nombre, descripcion, precio, cantidad, categoria_id } = req.body;
    const imagen_url = req.file ? req.file.filename : null;

    if (!nombre || !precio || !cantidad || !categoria_id) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const query = `
      INSERT INTO productos (nombre, descripcion, precio, cantidad, categoria_id, imagen_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [
      nombre,
      descripcion || '',
      parseFloat(precio),
      parseInt(cantidad),
      parseInt(categoria_id),
      imagen_url,
    ]);

    res.status(201).json({ mensaje: 'Producto creado correctamente' });
  } catch (error) {
    console.error('ERROR en crearProducto:', error);
    //res.status(500).json({ error: 'Error al crear producto' });
    res.status(500).json({ error: error.message });
  }
};

// Obtener productos inactivos
const obtenerProductosInactivos = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT productos.*, categorias.nombre AS categoria, categorias.id AS categoria_id
      FROM productos
      LEFT JOIN categorias ON productos.categoria_id = categorias.id
      WHERE productos.estado = 'inactivo'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos inactivos' });
  }
};

//Restaurar productos
const restaurarProducto = async (req, res) => {
  try {
    await db.execute('UPDATE productos SET estado = "activo" WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Producto restaurado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al restaurar producto' });
  }
};


// "Eliminar" producto (eliminado suave)
const eliminarProducto = async (req, res) => {
  try {
    await db.execute('UPDATE productos SET estado = ? WHERE id = ?', ['inactivo', req.params.id]);
    res.json({ mensaje: 'Producto desactivado (eliminado suave)' });
  } catch (err) {
    res.status(500).json({ error: 'Error al desactivar producto' });
  }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
  const { nombre, descripcion, precio, cantidad, categoria_id } = req.body;
  const imagen_url = req.file ? req.file.filename : null;
 
  let query = `UPDATE productos SET nombre=?, descripcion=?, precio=?, cantidad=?, categoria_id=?`;
  const params = [nombre, descripcion, precio, cantidad, categoria_id];
 
  if (imagen_url) {
    query += `, imagen_url=?`;
    params.push(imagen_url);
  }
 
  query += ` WHERE id = ?`;
  params.push(req.params.id);
 
  try {
    await db.execute(query, params);
    res.json({ mensaje: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

module.exports = {
  obtenerProductos,
  crearProducto,
  eliminarProducto,
  actualizarProducto,
  restaurarProducto,
  obtenerProductosInactivos,
};
