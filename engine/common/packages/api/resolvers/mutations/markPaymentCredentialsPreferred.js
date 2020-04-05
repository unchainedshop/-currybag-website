import { log } from 'meteor/unchained:core-logger';
import { PaymentCredentials } from 'meteor/unchained:core-payment';
import { PaymentCredentialsNotFoundError } from '../../errors';

export default (root, { paymentCredentialsId }, { userId }) => {
  log(`mutation markPaymentCredentialsPreferred ${paymentCredentialsId}`, {
    userId,
  });
  const credentials = PaymentCredentials.findOne({ _id: paymentCredentialsId });
  if (!credentials)
    throw new PaymentCredentialsNotFoundError({ paymentCredentialsId });
  return credentials.markPreferred();
};
