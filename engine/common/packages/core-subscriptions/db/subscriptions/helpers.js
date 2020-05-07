import Hashids from 'hashids/cjs';
import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { objectInvert } from 'meteor/unchained:utils';
import { Users } from 'meteor/unchained:core-users';
import { Products } from 'meteor/unchained:core-products';
import { Countries } from 'meteor/unchained:core-countries';
import { Currencies } from 'meteor/unchained:core-currencies';
import { Logs, log } from 'meteor/unchained:core-logger';
import {
  MessagingDirector,
  MessagingType,
} from 'meteor/unchained:core-messaging';
import { Subscriptions } from './collections';
import { SubscriptionStatus } from './schema';
import { SubscriptionDirector } from '../../director';

const { EMAIL_FROM, UI_ENDPOINT } = process.env;

Logs.helpers({
  subscription() {
    return (
      this.meta &&
      Subscriptions.findOne({
        _id: this.meta.subscriptionId,
      })
    );
  },
});

Users.helpers({
  subscriptions() {
    return Subscriptions.find(
      { userId: this._id },
      {
        sort: {
          created: -1,
        },
      }
    ).fetch();
  },
});

Subscriptions.helpers({
  user() {
    return Users.findOne({
      _id: this.userId,
    });
  },
  product() {
    return Products.findOne({
      _id: this.productId,
    });
  },
  country() {
    return Countries.findOne({ isoCode: this.countryCode });
  },
  currency() {
    return Currencies.findOne({ isoCode: this.currencyCode });
  },
  normalizedStatus() {
    return objectInvert(SubscriptionStatus)[this.status || null];
  },
  updateContext(context) {
    return Subscriptions.updateContext({
      subscriptionId: this._id,
      context,
    });
  },
  updateBillingAddress(billingAddress = {}) {
    return Subscriptions.updateBillingAddress({
      subscriptionId: this._id,
      billingAddress,
    });
  },
  updateContact(contact = {}) {
    return Subscriptions.updateContact({
      subscriptionId: this._id,
      contact,
    });
  },
  updateDelivery(delivery = {}) {
    return Subscriptions.updateDelivery({
      subscriptionId: this._id,
      delivery,
    });
  },
  updatePayment(payment = {}) {
    return Subscriptions.updatePayment({
      subscriptionId: this._id,
      payment,
    });
  },
  updatePlan(plan = {}) {
    return Subscriptions.updatePlan({
      subscriptionId: this._id,
      plan,
    });
  },
  async terminate({ subscriptionContext } = {}, options) {
    if (this.status === SubscriptionStatus.TERMINATED) return this;
    return (
      await this.setStatus(
        SubscriptionStatus.TERMINATED,
        'terminated manually'
      ).process({ subscriptionContext })
    ).sendStatusToCustomer(options);
  },
  async activate({ subscriptionContext } = {}, options) {
    if (this.status === SubscriptionStatus.TERMINATED) return this;
    return (
      await this.setStatus(
        SubscriptionStatus.ACTIVE,
        'activated manually'
      ).process({ subscriptionContext })
    ).sendStatusToCustomer(options);
  },
  sendStatusToCustomer(options) {
    const user = this.user();
    const locale = user.locale(options).normalized;
    const director = new MessagingDirector({
      locale,
      subscription: this,
      type: MessagingType.EMAIL,
    });
    director.sendMessage({
      template: 'shop.unchained.subscriptions.status',
      meta: {
        mailPrefix: `${this.subscriptionNumber}_`,
        from: EMAIL_FROM,
        to: user.primaryEmail()?.address,
        url: `${UI_ENDPOINT}/subscription?_id=${this._id}&otp=${this.subscriptionNumber}`,
        subscription: this,
      },
    });
    return this;
  },
  async initializeSubscription(orderIdForFirstPeriod) {
    const period = await this.director().nextPeriod({
      orderId: orderIdForFirstPeriod,
    });
    if (period && (orderIdForFirstPeriod || period.isTrial)) {
      const initialized = await Subscriptions.linkOrderToSubscription({
        orderId: orderIdForFirstPeriod,
        subscriptionId: this._id,
        period,
      });
      return initialized.process({ orderIdForFirstPeriod });
    }
    return this.process({ orderIdForFirstPeriod });
  },
  // eslint-disable-next-line
  async reactivateSubscription() {},
  async process({ subscriptionContext, orderIdForFirstPeriod } = {}) {
    if (this.nextStatus() === SubscriptionStatus.ACTIVE) {
      await this.reactivateSubscription(
        subscriptionContext,
        orderIdForFirstPeriod
      );
    }
    return this.setStatus(this.nextStatus(), 'subscription processed');
  },
  nextStatus() {
    let { status } = this;
    const director = this.director();

    if (
      status === SubscriptionStatus.INITIAL ||
      status === SubscriptionStatus.PAUSED
    ) {
      if (Promise.await(director.isValidForActivation())) {
        status = SubscriptionStatus.ACTIVE;
      }
    } else if (status === SubscriptionStatus.ACTIVE) {
      if (Promise.await(director.isOverdue())) {
        status = SubscriptionStatus.PAUSED;
      }
    } else if (this.isExpired()) {
      status = SubscriptionStatus.TERMINATED;
    }
    return status;
  },
  director() {
    const director = new SubscriptionDirector(this);
    return director;
  },
  setStatus(status, info) {
    return Subscriptions.updateStatus({
      subscriptionId: this._id,
      status,
      info,
    });
  },
  logs({ limit, offset }) {
    const selector = { 'meta.subscriptionId': this._id };
    const logs = Logs.find(selector, {
      skip: offset,
      limit,
      sort: {
        created: -1,
      },
    }).fetch();
    return logs;
  },
  isExpired(referenceDate) {
    const now = new Date() || referenceDate;
    const expiryDate = new Date(this.expires);
    const isExpired = now.getTime() > expiryDate.getTime();
    return isExpired;
  },
});

Subscriptions.createSubscription = async (
  {
    productId,
    quantity,
    configuration,
    userId,
    countryCode,
    currencyCode,
    contact,
    billingAddress,
    payment,
    delivery,
    orderIdForFirstPeriod,
  },
  options
) => {
  log('Create Subscription', { userId });
  const subscriptionId = Subscriptions.insert({
    productId,
    quantity,
    configuration,
    created: new Date(),
    status: SubscriptionStatus.INITIAL,
    userId,
    contact,
    billingAddress,
    payment,
    periods: [],
    delivery,
    currencyCode:
      currencyCode ||
      Countries.resolveDefaultCurrencyCode({
        isoCode: countryCode,
      }),
    countryCode,
  });
  const subscription = Subscriptions.findOne({ _id: subscriptionId });
  const initialized = await subscription.initializeSubscription(
    orderIdForFirstPeriod
  );
  return initialized.sendStatusToCustomer(options);
};

Subscriptions.linkOrderToSubscription = async ({
  subscriptionId,
  period,
  orderId,
}) => {
  const { start, end, isTrial } = period;
  Subscriptions.update(
    { _id: subscriptionId },
    {
      $push: {
        periods: {
          start,
          end,
          isTrial,
          orderId,
        },
      },
      $set: {
        updated: new Date(),
      },
    }
  );
  return Subscriptions.findOne({ _id: subscriptionId });
};

Subscriptions.updateBillingAddress = ({ billingAddress, subscriptionId }) => {
  log('Update Billing Address', { subscriptionId });
  Subscriptions.update(
    { _id: subscriptionId },
    {
      $set: {
        billingAddress,
        updated: new Date(),
      },
    }
  );
  return Subscriptions.findOne({ _id: subscriptionId });
};

Subscriptions.updateContact = ({ contact, subscriptionId }) => {
  log('Update Contact', { subscriptionId });
  Subscriptions.update(
    { _id: subscriptionId },
    {
      $set: {
        contact,
        updated: new Date(),
      },
    }
  );
  return Subscriptions.findOne({ _id: subscriptionId });
};

Subscriptions.updatePayment = ({ payment, subscriptionId }) => {
  log('Update Payment', { subscriptionId });
  Subscriptions.update(
    { _id: subscriptionId },
    {
      $set: {
        payment,
        updated: new Date(),
      },
    }
  );
  return Subscriptions.findOne({ _id: subscriptionId });
};

Subscriptions.updateDelivery = ({ delivery, subscriptionId }) => {
  log('Update Delivery', { subscriptionId });
  Subscriptions.update(
    { _id: subscriptionId },
    {
      $set: {
        delivery,
        updated: new Date(),
      },
    }
  );
  return Subscriptions.findOne({ _id: subscriptionId });
};

Subscriptions.updatePlan = ({ plan, subscriptionId }) => {
  log('Update Plan', { subscriptionId });
  Subscriptions.update(
    { _id: subscriptionId },
    {
      $set: {
        plan,
        updated: new Date(),
      },
    }
  );
  return Subscriptions.findOne({ _id: subscriptionId });
};

Subscriptions.updateContext = ({ context, subscriptionId }) => {
  log('Update Arbitrary Context', { subscriptionId });
  Subscriptions.update(
    { _id: subscriptionId },
    {
      $set: {
        context,
        updated: new Date(),
      },
    }
  );
  return Subscriptions.findOne({ _id: subscriptionId });
};

Subscriptions.newSubscriptionNumber = () => {
  let subscriptionNumber = null;
  const hashids = new Hashids(
    'unchained',
    6,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
  );
  while (!subscriptionNumber) {
    const randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
    const newHashID = hashids.encode(randomNumber);
    if (
      Subscriptions.find(
        { subscriptionNumber: newHashID },
        { limit: 1 }
      ).count() === 0
    ) {
      subscriptionNumber = newHashID;
    }
  }
  return subscriptionNumber;
};

Subscriptions.updateStatus = ({ status, subscriptionId, info = '' }) => {
  const subscription = Subscriptions.findOne({ _id: subscriptionId });
  if (subscription.status === status) return subscription;
  const date = new Date();
  const modifier = {
    $set: { status, updated: new Date() },
    $push: {
      log: {
        date,
        status,
        info,
      },
    },
  };
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      modifier.$set.subscriptionNumber = Subscriptions.newSubscriptionNumber();
      break;
    case SubscriptionStatus.TERMINATED:
      modifier.$set.expires = subscription.periods?.pop()?.end || new Date();
      break;
    default:
      break;
  }
  log(`New Status: ${status}`, { subscriptionId });
  Subscriptions.update({ _id: subscriptionId }, modifier);
  return Subscriptions.findOne({ _id: subscriptionId });
};
