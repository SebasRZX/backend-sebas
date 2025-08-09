const db = require('../config/db');

// Abrir caja
const abrirCaja = async (req, res) => {
    const { monto_apertura } = req.body;
    const usuario_id = req.usuario.id;

    try {
        const [cajaExistente] = await db.execute(
            `SELECT * FROM cajas WHERE usuario_id = ? AND estado = 'abierta'`,
            [usuario_id]
        );

        if (cajaExistente.length > 0) {
            return res.status(400).json({ error: 'Ya hay una caja abierta' });
        }

        await db.execute(
            `INSERT INTO cajas (usuario_id, fecha_apertura, monto_apertura) VALUES (?, NOW(), ?)`,
            [usuario_id, monto_apertura]
        );

        res.json({ mensaje: 'Caja abierta correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al abrir la caja' });
    }
};

// Cerrar caja
const cerrarCaja = async (req, res) => {
    const { monto_cierre, observaciones } = req.body;
    const usuario_id = req.usuario.id;

    try {
        const [caja] = await db.execute(
            `SELECT * FROM cajas WHERE usuario_id = ? AND estado = 'abierta'`,
            [usuario_id]
        );

        if (caja.length === 0) {
            return res.status(400).json({ error: 'No hay caja abierta' });
        }

        await db.execute(
            `UPDATE cajas SET fecha_cierre = NOW(), monto_cierre = ?, observaciones = ?, estado = 'cerrada' WHERE id = ?`,
            [monto_cierre, observaciones || '', caja[0].id]
        );

        res.json({ mensaje: 'Caja cerrada correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al cerrar la caja' });
    }
};

// Obtener caja abierta actual
const obtenerCajaActual = async (req, res) => {
    const usuario_id = req.usuario.id;

    try {
        const [caja] = await db.execute(
            `SELECT * FROM cajas WHERE usuario_id = ? AND estado = 'abierta'`,
            [usuario_id]
        );

        if (caja.length === 0) return res.json(null);

        res.json(caja[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al consultar caja actual' });
    }
};

// Obtener resumen de caja
const obtenerResumenCaja = async (req, res) => {
    const usuario_id = req.usuario.id;

    try {
        const [caja] = await db.execute(
            `SELECT * FROM cajas WHERE usuario_id = ? AND estado = 'abierta'`,
            [usuario_id]
        );

        if (caja.length === 0) {
            return res.status(400).json({ error: 'No hay caja abierta' });
        }

        const caja_id = caja[0].id;

        const [ventas] = await db.execute(
            `SELECT forma_pago, SUM(total) as total FROM ventas WHERE caja_id = ? GROUP BY forma_pago`,
            [caja_id]
        );

        const resumen = {
            efectivo: 0,
            sinpe: 0,
            total: 0,
        };

        for (const row of ventas) {
            if (row.forma_pago === 'efectivo') resumen.efectivo = Number(row.total);
            if (row.forma_pago === 'sinpe') resumen.sinpe = Number(row.total);
        }

        resumen.total = resumen.efectivo + resumen.sinpe;

        res.json({ resumen, caja: caja[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener resumen de caja' });
    }
};

// Obtener reporte de cajas
const obtenerReporteCajas = async (req, res) => {
    try {
        const { fecha_inicio: desde, fecha_fin: hasta, usuario_id } = req.query;

        let condiciones = [];
        let valores = [];

        if (desde) {
            condiciones.push(`fecha_apertura >= ?`);
            valores.push(desde);
        }

        if (hasta) {
            condiciones.push(`fecha_apertura <= ?`);
            valores.push(hasta);
        }

        if (usuario_id) {
            condiciones.push(`usuario_id = ?`);
            valores.push(usuario_id);
        }

        const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [cajas] = await db.execute(
            `
      SELECT c.*, u.nombre AS nombre_usuario
      FROM cajas c
      JOIN usuarios u ON c.usuario_id = u.id
      ${whereClause}
      ORDER BY c.fecha_apertura DESC
      `,
            valores
        );

        res.json(cajas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener reporte de cajas' });
    }
};

module.exports = {
    abrirCaja,
    cerrarCaja,
    obtenerCajaActual,
    obtenerResumenCaja,
    obtenerReporteCajas,
};
