const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generarComandaPDF = (venta, detalles) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, `../tmp/comanda_${venta.id}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(18).text(`Comanda #${venta.id}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`);
    doc.text(`Usuario: ${venta.usuario}`);
    doc.moveDown();

    doc.text('Detalles:', { underline: true });
    detalles.forEach((item) => {
      doc.text(`${item.nombre} x${item.cantidad}`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ₡${Number(venta.total).toLocaleString()}`, {
      align: 'right',
    });

    doc.end();

    stream.on('finish', () => {
      resolve(filePath);
    });

    stream.on('error', reject);
  });
};

module.exports = generarComandaPDF;
