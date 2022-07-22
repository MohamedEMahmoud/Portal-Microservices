import { createInvoice } from '../../services/create-invoice';
import { Request, Response } from 'express';
import { BadRequestError, LoggerService } from '@portal-microservices/common';
import { Order } from '../../models/order/order.model';
import path from 'path';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

/**
 * get invoice controller
 * @param req
 * @param res
 * @return {Promise<void>}
 */

const getInvoice = async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.query;
  const order = await Order.findById(orderId);

  const invoiceName = 'invoice' + '-' + orderId + '.pdf';
  const invoicePath = path.join(
    __dirname,
    '../',
    'data',
    'invoices',
    invoiceName
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'inline; filemname = "' + invoiceName + '"'
  );

  if (!order) {
    logger.error(`There is no such a order with this id:${orderId}`);
    throw new BadRequestError(
      `There is no such a order with this id:${orderId}`
    );
  }

  if (order.customer.toString() !== req.currentUser!.id) {
    console.log(req.currentUser!.id);

    logger.error(
      `you can't show this invoice order because this order not belong to you`
    );
    throw new BadRequestError(
      `you can't show this invoice order because this order not belong to you`
    );
  }

  const getInvoice = createInvoice(res, order, invoicePath);

  res.send({
    status: 200,
    getInvoice,
    success: true,
  });
};

export { getInvoice };
