const db = require('../config/db');

const generarComanda = async (req, res) => {
  const venta_id = req.params.id;

  try {
    const [ventaResult] = await db.execute(
      `SELECT v.id, v.fecha, v.nombre_cliente, v.forma_pago, v.comprobante_sinpe, v.vuelto, v.monto_pagado, u.nombre AS usuario
       FROM ventas v
       JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id = ?`,
      [venta_id]
    );

    if (ventaResult.length === 0) return res.status(404).send('Venta no encontrada');
    const venta = ventaResult[0];

    const [detalles] = await db.execute(
      `SELECT p.nombre, d.cantidad, d.precio_unitario
       FROM detalle_venta d
       JOIN productos p ON p.id = d.producto_id
       WHERE d.venta_id = ?`,
      [venta_id]
    );

    const total = detalles.reduce(
      (acc, item) => acc + item.precio_unitario * item.cantidad,
      0
    );

    // Generar comanda en HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Comanda #${venta.id}</title>
  <style>
    body {
      font-family: monospace;
      font-size: 12px;
      width: 58mm;
      margin: 0;
      padding: 10px;
    }
    .center {
      text-align: center;
    }
    .line {
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    .producto {
      display: flex;
      justify-content: space-between;
    }
    @media print {
      @page { size: 58mm auto; margin: 0; }
      body { margin: 0; }
    }
  </style>
</head>
<body onload="window.print();">
  <div class="center">
    <strong>Parroquia Santa Rosa</strong><br/>
    Comprobante de Venta<br/>
    ------------------------------<br/>
  </div>
  <div>
    Comanda #${venta.id}<br/>
    Fecha: ${new Date(venta.fecha).toLocaleString()}<br/>
    Cliente: ${venta.nombre_cliente || 'N/D'}<br/>
    Pago: ${venta.forma_pago}<br/>
    ${venta.forma_pago === 'sinpe' ? `Comprobante: ${venta.comprobante_sinpe || 'N/D'}<br/>` : ''}
    ${venta.forma_pago === 'efectivo'
      ? `Pagado: ₡${Number(venta.monto_pagado).toLocaleString()}<br/>Vuelto: ₡${Number(venta.vuelto || 0).toLocaleString()}<br/>`
      : ''}
    Usuario: ${venta.usuario}<br/>
  </div>

  <div class="line"></div>
  <div><strong>Productos:</strong></div>
  ${detalles.map(item => `
    <div class="producto">
      <span>${item.nombre} x${item.cantidad}</span>
      <span>₡${(item.precio_unitario * item.cantidad).toLocaleString()}</span>
    </div>
  `).join('')}
  <div class="line"></div>
  <div class="producto">
    <strong>Total:</strong>
    <strong>₡${total.toLocaleString()}</strong>
  </div>
  <div class="line"></div>

  <div class="center">
    ¡Gracias por su compra!
  </div>
</body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al generar la comanda');
  }
};

module.exports = {
  generarComanda,
};
