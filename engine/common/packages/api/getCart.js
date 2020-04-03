import { Users } from 'meteor/unchained:core-users';
import { Orders } from 'meteor/unchained:core-orders';
import { Countries } from 'meteor/unchained:core-countries';
import {
  UserNotFoundError,
  OrderNotFoundError,
  OrderWrongStatusError,
} from './errors';

export default ({ orderId, userId, user: userObject, countryContext }) => {
  if (orderId) {
    const order = Orders.findOne({ _id: orderId });
    if (!order) throw new OrderNotFoundError({ orderId });
    if (!order.isCart()) {
      throw new OrderWrongStatusError({ status: order.status });
    }
    return order;
  }
  const user = userObject || Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const cart =
    user.cart({ countryContext }) ||
    Orders.createOrder({
      user,
      currency: Countries.resolveDefaultCurrencyCode({
        isoCode: countryContext,
      }),
      countryCode: countryContext,
    });
  return cart;
};
