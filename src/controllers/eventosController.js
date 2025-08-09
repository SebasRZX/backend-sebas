const db = require('../config/db');

// Crear evento
const crearEvento = async (req, res) => {
  const { nombre, descripcion, fecha_inicio, fecha_fin } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO eventos (nombre, descripcion, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)`,
      [nombre, descripcion, fecha_inicio, fecha_fin]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

// Obtener todos los eventos
const obtenerEventos = async (req, res) => {
  try {
    const [result] = await db.execute(`SELECT * FROM eventos`);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

// Editar evento
const editarEvento = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, fecha_inicio, fecha_fin } = req.body;

  try {
    await db.execute(
      `UPDATE eventos SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ? WHERE id = ?`,
      [nombre, descripcion, fecha_inicio, fecha_fin, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
};

// Eliminar evento
const eliminarEvento = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute(`DELETE FROM eventos WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
};

// Obtener evento activo actual (por fecha)
const obtenerEventoActivo = async (req, res) => {
  try {
    const [eventos] = await db.execute(`
      SELECT * FROM eventos
      WHERE estado = 'activo'
        AND CURDATE() BETWEEN fecha_inicio AND fecha_fin
      ORDER BY fecha_inicio ASC
      LIMIT 1
    `);

    if (eventos.length === 0) {
      return res.status(404).json({ error: 'No hay evento activo actualmente' });
    }

    res.json(eventos[0]);
  } catch (error) {
    console.error('Error al obtener evento activo:', error);
    res.status(500).json({ error: 'Error al obtener el evento activo' });
  }
};

// Cambiar estado del evento (activo/inactivo)
const cambiarEstadoEvento = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!['activo', 'inactivo'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  try {
    await db.execute(`UPDATE eventos SET estado = ? WHERE id = ?`, [estado, id]);
    res.json({ mensaje: 'Estado del evento actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el estado del evento:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del evento' });
  }
};

module.exports = {
  crearEvento,
  obtenerEventos,
  editarEvento,
  eliminarEvento,
  obtenerEventoActivo,
  cambiarEstadoEvento,
};
