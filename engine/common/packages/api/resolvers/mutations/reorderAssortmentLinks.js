import { log } from 'meteor/unchained:core-logger';
import { AssortmentLinks } from 'meteor/unchained:core-assortments';

export default function (root, { sortKeys = [] }, { userId }) {
  log('mutation reorderAssortmentLinks', { userId });
  return AssortmentLinks.updateManualOrder({ sortKeys });
}
