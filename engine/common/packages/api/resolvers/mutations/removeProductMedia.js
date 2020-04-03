import { log } from 'meteor/unchained:core-logger';
import { ProductMedia } from 'meteor/unchained:core-products';

export default function (root, { productMediaId }, { userId }) {
  log(`mutation removeProductMedia ${productMediaId}`, { userId });
  const productMedia = ProductMedia.findOne({ _id: productMediaId });
  ProductMedia.remove({ _id: productMediaId });
  return productMedia;
}
