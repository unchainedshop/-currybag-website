import { fakeTimestampFields, fakeAddress } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { Orders } from './collections';
import { OrderStatus } from './schema';

Factory.define('order', Orders, {
  userId: () => Factory.get('user'),
  ordered: () => faker.date.past(),
  confirmed: () => faker.date.past(),
  fullfilled: () => faker.date.past(),
  billingAddress: () => fakeAddress(),
  status: () => faker.random.arrayElement(OrderStatus),
  currency: () => 'CHF',
  paymentId: () => null,
  deliveryId: () => null,
  ...fakeTimestampFields,
});
