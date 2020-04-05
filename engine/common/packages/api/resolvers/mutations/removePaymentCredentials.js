import { log } from 'meteor/unchained:core-logger';
import { PaymentCredentials } from 'meteor/unchained:core-payment';
import { PaymentCredentialsNotFoundError } from '../../errors';

export default (root, { paymentCredentialsId }, { userId }) => {
  log(`mutation removePaymentCredentials ${paymentCredentialsId}`, { userId });
  const removedCredentials = PaymentCredentials.removeCredentials({
    paymentCredentialsId,
  });
  if (!removedCredentials)
    throw new PaymentCredentialsNotFoundError({ paymentCredentialsId });
  return removedCredentials;
};
