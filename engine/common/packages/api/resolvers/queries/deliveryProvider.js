import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

export default function (root, { deliveryProviderId }, { userId }) {
  log(`query delivery-provider ${deliveryProviderId}`, { userId });
  return DeliveryProviders.findProviderById(deliveryProviderId);
}
