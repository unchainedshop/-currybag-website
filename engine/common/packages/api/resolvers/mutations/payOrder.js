import { log } from 'meteor/unchained:core-logger';
import { Orders, OrderPaymentStatus } from 'meteor/unchained:core-orders';
import {
  OrderNotFoundError,
  OrderWrongPaymentStatusError,
  OrderWrongStatusError,
} from '../../errors';

export default function (root, { orderId }, { userId }) {
  log('mutation payOrder', { orderId, userId });
  const order = Orders.findOne({ _id: orderId });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  const payment = order.payment();
  if (payment.status !== OrderPaymentStatus.OPEN && order.confirmed) {
    throw new OrderWrongPaymentStatusError({
      status: payment.status,
    });
  }
  payment.markPaid();
  return order.processOrder();
}
