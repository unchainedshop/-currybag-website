import { log } from 'meteor/unchained:core-logger';
import getCart from '../../getCart';

export default async function (
  root,
  { orderId, code },
  { userId, user, countryContext }
) {
  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });
  const cart = await getCart({ orderId, user, countryContext });
  return cart.addDiscount({ code });
}
