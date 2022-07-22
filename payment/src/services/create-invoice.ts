import PDFDocument from 'pdfkit';
import { OrderDoc } from '../../../order/src/models/order.model';
import fs from 'fs';
import { Response } from 'express';

async function createInvoice(
  res: Response,
  order: OrderDoc,
  path: fs.PathLike
) {
  let doc = new PDFDocument({ margin: 50, compress: false });

  generateCustomerInformation(doc, order);
  generateInvoiceTable(doc, order);

  doc.pipe(fs.createWriteStream(path));
  doc.pipe(res);
  doc.end();
}

async function generateTableRow(
  doc: PDFKit.PDFDocument,
  y: number,
  c1: string,
  c2: string,
  c3: string
) {
  doc
    .fontSize(10)
    .text(c1, 50, y)
    .text(c2, 150, y)
    .text(c3, 280, y, { width: 90, align: 'right' });
}

async function generateCustomerInformation(
  doc: PDFKit.PDFDocument,
  order: OrderDoc
) {
  doc
    .text(`Invoice Number: ${Math.floor(Math.random() * 10000)}`, 50, 200)
    .text(`Invoice Date: ${new Date()}`, 50, 215)
    .text(`Balance Due: ${order.totalOrderPrice}`, 50, 130)

    .text(order.shippingAddress.name, 300, 200)
    .text(order.shippingAddress.address, 300, 215)
    .text(
      `${order.shippingAddress.city},${order.shippingAddress.country}`,
      300,
      130
    )
    .moveDown();
}

async function generateInvoiceTable(doc: PDFKit.PDFDocument, order: OrderDoc) {
  let i,
    invoiceTableTop = 330;

  for (i = 0; i < order.cartItems.length; i++) {
    const item = order.cartItems[i];
    const position = invoiceTableTop + (i + 1) * 30;

    generateTableRow(
      doc,
      position,
      String(item.price / item.quantity),
      String(item.quantity),
      String(item.price)
    );
  }
}

export { createInvoice };
