const db = require('../config/db');

// Crear una venta (comanda)
const crearVenta = async (req, res) => {
    const {
        productos,
        forma_pago,
        comprobante,
        monto_pagado,
        nombre_cliente,
        evento_id
    } = req.body;
    const usuario_id = req.usuario.id;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: 'No se enviaron productos' });
    }

    if (!nombre_cliente || nombre_cliente.trim() === '') {
        return res.status(400).json({ error: 'Debe ingresar el nombre del cliente' });
    }

    if (!['efectivo', 'sinpe'].includes(forma_pago)) {
        return res.status(400).json({ error: 'Forma de pago no válida' });
    }

    if (forma_pago === 'sinpe' && (!comprobante || comprobante.trim() === '')) {
        return res.status(400).json({ error: 'Debe proporcionar el comprobante SINPE' });
    }

    if (forma_pago === 'efectivo') {
        if (!monto_pagado || isNaN(monto_pagado)) {
            return res.status(400).json({ error: 'Monto pagado no válido para efectivo' });
        }
        if (Number(monto_pagado) < 0) {
            return res.status(400).json({ error: 'Monto pagado no puede ser negativo' });
        }
    }

    const total = productos.reduce((acc, p) => {
        const extra = p.paraLlevar ? 100 * p.cantidad : 0;
        return acc + p.precio * p.cantidad + extra;
    }, 0);

    const vuelto =
        forma_pago === 'efectivo'
            ? Math.max(0, Number(monto_pagado) - total)
            : null;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [caja] = await conn.execute(
            `SELECT id FROM cajas WHERE usuario_id = ? AND estado = 'abierta'`,
            [usuario_id]
        );

        if (caja.length === 0) {
            return res.status(400).json({ error: 'No hay caja abierta para registrar la venta' });
        }

        const caja_id = caja[0].id;

        console.log('Valor de evento_id recibido:', evento_id);

        const [ventaResult] = await conn.execute(
            `INSERT INTO ventas (
        usuario_id, total, forma_pago, comprobante_sinpe,
        monto_pagado, vuelto, nombre_cliente, caja_id, evento_id, fecha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                usuario_id,
                total,
                forma_pago,
                forma_pago === 'sinpe' ? comprobante.trim() : null,
                forma_pago === 'efectivo' ? Number(monto_pagado) : null,
                forma_pago === 'efectivo' ? vuelto : null,
                nombre_cliente.trim(),
                caja_id,
                evento_id
            ]
        );

        const venta_id = ventaResult.insertId;

        for (const p of productos) {
            await conn.execute(
                `INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?)`,
                [venta_id, p.id, p.cantidad, p.precio]
            );

            await conn.execute(
                `UPDATE productos SET cantidad = cantidad - ? WHERE id = ?`,
                [p.cantidad, p.id]
            );
        }

        await conn.commit();

        res.status(201).json({
            mensaje: 'Venta registrada correctamente',
            venta_id,
            total,
            vuelto,
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error al registrar venta:', error);
        res.status(500).json({ error: 'Error al registrar la venta' });
    } finally {
        conn.release();
    }
};

// Reporte de ventas por evento
const reporteVentasPorEvento = async (req, res) => {
    const { evento_id, desde, hasta } = req.query;

    if (!evento_id || !desde || !hasta) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    try {
        const [resultado] = await db.execute(
            `
      SELECT 
        COUNT(v.id) AS total_ventas,
        SUM(v.total) AS monto_total,
        SUM(CASE WHEN v.forma_pago = 'efectivo' THEN v.total ELSE 0 END) AS total_efectivo,
        SUM(CASE WHEN v.forma_pago = 'sinpe' THEN v.total ELSE 0 END) AS total_sinpe
      FROM ventas v
      WHERE v.evento_id = ? AND DATE(v.fecha) BETWEEN ? AND ?
      `,
            [evento_id, desde, hasta]
        );

        res.json(resultado[0]);
    } catch (error) {
        console.error('Error al generar reporte:', error);
        res.status(500).json({ error: 'Error al generar el reporte' });
    }
};

module.exports = {
    crearVenta,
    reporteVentasPorEvento,
};
