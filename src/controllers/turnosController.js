const db = require('../config/db');

// Crear un turno con asignaciones
const crearTurno = async (req, res) => {
  const { evento_id, fecha, hora_inicio, hora_fin, asignaciones } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO turnos (evento_id, fecha, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)`,
      [evento_id, fecha, hora_inicio, hora_fin]
    );

    const turno_id = result.insertId;

    for (const a of asignaciones) {
      await conn.execute(
        `INSERT INTO turno_usuarios (turno_id, usuario_id, rol_asignado) VALUES (?, ?, ?)`,
        [turno_id, a.usuario_id, a.rol_asignado]
      );
    }

    await conn.commit();
    res.status(201).json({ turno_id });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al crear turno' });
  } finally {
    conn.release();
  }
};

// Obtener turnos por evento
const obtenerTurnosPorEvento = async (req, res) => {
  const { evento_id } = req.params;

  try {
    const [turnos] = await db.execute(
      `SELECT * FROM turnos WHERE evento_id = ?`,
      [evento_id]
    );
    res.json(turnos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
};

// Obtener asignaciones de usuarios por turno
const obtenerAsignacionesPorTurno = async (req, res) => {
  const { turno_id } = req.params;

  try {
    const [asignaciones] = await db.execute(
      `SELECT tu.*, u.nombre 
       FROM turno_usuarios tu 
       JOIN usuarios u ON tu.usuario_id = u.id 
       WHERE tu.turno_id = ?`,
      [turno_id]
    );
    res.json(asignaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asignaciones' });
  }
};

// Asignar usuario a un turno
const asignarUsuario = async (req, res) => {
  const { turno_id, usuario_id, rol_asignado } = req.body;

  try {
    const [existe] = await db.execute(
      `SELECT 1 FROM turno_usuarios WHERE turno_id = ? AND usuario_id = ?`,
      [turno_id, usuario_id]
    );

    if (existe.length > 0) {
      return res.status(400).json({ error: 'Usuario ya asignado a este turno' });
    }

    await db.execute(
      `INSERT INTO turno_usuarios (turno_id, usuario_id, rol_asignado) VALUES (?, ?, ?)`,
      [turno_id, usuario_id, rol_asignado]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al asignar usuario al turno' });
  }
};

// Eliminar turno (y sus asignaciones)
const eliminarTurno = async (req, res) => {
  const { turno_id } = req.params;

  try {
    await db.execute(`DELETE FROM turno_usuarios WHERE turno_id = ?`, [turno_id]);
    await db.execute(`DELETE FROM turnos WHERE id = ?`, [turno_id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el turno' });
  }
};

// Editar turno
const editarTurno = async (req, res) => {
  const { turno_id } = req.params;
  const { fecha, hora_inicio, hora_fin } = req.body;

  try {
    await db.execute(
      `UPDATE turnos SET fecha = ?, hora_inicio = ?, hora_fin = ? WHERE id = ?`,
      [fecha, hora_inicio, hora_fin, turno_id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el turno' });
  }
};

// Eliminar asignación de usuario
const eliminarAsignacion = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute(`DELETE FROM turno_usuarios WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la asignación' });
  }
};

// Editar rol asignado en una asignación
const editarRolAsignado = async (req, res) => {
  const { id } = req.params;
  const { rol_asignado } = req.body;

  try {
    await db.execute(
      `UPDATE turno_usuarios SET rol_asignado = ? WHERE id = ?`,
      [rol_asignado, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el rol asignado' });
  }
};

module.exports = {
  crearTurno,
  obtenerTurnosPorEvento,
  obtenerAsignacionesPorTurno,
  asignarUsuario,
  eliminarTurno,
  editarTurno,
  eliminarAsignacion,
  editarRolAsignado,
};
