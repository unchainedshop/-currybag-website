import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { ProductPricingDirector } from 'meteor/unchained:core-pricing';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { Countries } from 'meteor/unchained:core-countries';
import { findLocalizedText } from 'meteor/unchained:core';
import { objectInvert, findUnusedSlug } from 'meteor/unchained:utils';
import { Locale } from 'locale';
import crypto from 'crypto';
import { Products, ProductTexts } from './collections';
import { ProductVariations } from '../product-variations/collections';
import { ProductMedia, Media } from '../product-media/collections';
import { ProductReviews } from '../product-reviews/collections';

import { ProductStatus, ProductTypes } from './schema';

Products.createProduct = (
  { locale, title, type, ...rest },
  { autopublish = false } = {}
) => {
  const product = {
    created: new Date(),
    type: ProductTypes[type],
    status: ProductStatus.DRAFT,
    sequence: Products.getNewSequence(),
    ...rest,
  };
  const productId = Products.insert(product);
  const productObject = Products.findOne({ _id: productId });
  productObject.upsertLocalizedText(locale, { title });
  if (autopublish) {
    productObject.publish();
  }
  return productObject;
};

Products.updateProduct = ({ productId, type, ...product }) => {
  const modifier = {
    $set: {
      ...product,
      updated: new Date(),
    },
  };
  if (type) {
    modifier.$set.type = ProductTypes[type];
  }
  Products.update({ _id: productId }, modifier);
  return Products.findOne({ _id: productId });
};

Products.getNewSequence = (oldSequence) => {
  const sequence = oldSequence + 1 || Products.find({}).count() * 10;
  if (Products.find({ sequence }).count() > 0) {
    return Products.getNewSequence(sequence);
  }
  return sequence;
};

ProductTexts.makeSlug = ({ slug, title, productId }, options) => {
  const checkSlugIsUnique = (newPotentialSlug) => {
    return (
      ProductTexts.find({
        productId: { $ne: productId },
        slug: newPotentialSlug,
      }).count() === 0
    );
  };
  return findUnusedSlug(
    checkSlugIsUnique,
    options
  )({
    existingSlug: slug,
    title: title || productId,
  });
};

Products.helpers({
  publish() {
    switch (this.status) {
      case ProductStatus.DRAFT:
        Products.update(
          { _id: this._id },
          {
            $set: {
              status: ProductStatus.ACTIVE,
              updated: new Date(),
              published: new Date(),
            },
          }
        );
        return true;
      default:
        return false;
    }
  },
  unpublish() {
    switch (this.status) {
      case ProductStatus.ACTIVE:
        Products.update(
          { _id: this._id },
          {
            $set: {
              status: ProductStatus.DRAFT,
              updated: new Date(),
              published: null,
            },
          }
        );
        return true;
      default:
        return false;
    }
  },
  upsertLocalizedText(locale, { slug: forcedSlug, title = null, ...fields }) {
    const slug = ProductTexts.makeSlug({
      slug: forcedSlug,
      title,
      productId: this._id,
    });
    ProductTexts.upsert(
      {
        productId: this._id,
        locale,
      },
      {
        $set: {
          updated: new Date(),
          title,
          locale,
          slug,
          ...fields,
        },
      },
      { bypassCollection2: true }
    );

    Products.update(
      {
        _id: this._id,
      },
      {
        $set: {
          updated: new Date(),
        },
        $addToSet: {
          slugs: slug,
        },
      }
    );
    Products.update(
      {
        _id: { $ne: this._id },
        slugs: slug,
      },
      {
        $set: {
          updated: new Date(),
        },
        $pullAll: {
          slugs: slug,
        },
      },
      { multi: true }
    );
    return ProductTexts.findOne({ productId: this._id, locale });
  },
  addMediaLink({ mediaId, meta, tags = [] }) {
    const sortKey = ProductMedia.getNewSortKey(this._id);
    const productMediaId = ProductMedia.insert({
      mediaId,
      tags,
      sortKey,
      productId: this._id,
      created: new Date(),
      meta,
    });
    const productMediaObject = ProductMedia.findOne({ _id: productMediaId });
    return productMediaObject;
  },
  addMedia({ rawFile, href, name, userId, meta, tags = [], ...options }) {
    const fileLoader = rawFile
      ? Media.insertWithRemoteFile({
          file: rawFile,
          userId,
        })
      : Media.insertWithRemoteURL({
          url: href,
          fileName: name,
          userId,
          ...options,
        });
    const file = Promise.await(fileLoader);
    return this.addMediaLink({ mediaId: file._id, tags, meta });
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return Products.getLocalizedTexts(this._id, parsedLocale);
  },
  normalizedStatus() {
    return objectInvert(ProductStatus)[this.status || null];
  },
  media({ limit, offset, tags }) {
    const selector = { productId: this._id };
    if (tags && tags.length > 0) {
      selector.tags = { $all: tags };
    }
    return ProductMedia.find(selector, {
      skip: offset,
      limit,
      sort: { sortKey: 1 },
    }).fetch();
  },
  variations() {
    return ProductVariations.find({ productId: this._id }).fetch();
  },
  variation(key) {
    return ProductVariations.findOne({ productId: this._id, key });
  },
  proxyAssignments() {
    return ((this.proxy && this.proxy.assignments) || []).map((assignment) => ({
      assignment,
      product: this,
    }));
  },
  proxyProducts(vectors, { includeInactive = false } = {}) {
    const { proxy = {} } = this;
    let filtered = [...(proxy.assignments || [])];

    vectors.forEach(({ key, value }) => {
      filtered = filtered.filter((assignment) => {
        if (assignment.vector[key] === value) {
          return true;
        }
        return false;
      });
    });
    const productIds = filtered.map(
      (filteredAssignment) => filteredAssignment.productId
    );
    const selector = {
      _id: { $in: productIds },
      status: includeInactive
        ? { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
        : ProductStatus.ACTIVE,
    };
    return Products.find(selector).fetch();
  },
  userDispatches({ deliveryProviderType, ...options }, requestContext) {
    const deliveryProviders = DeliveryProviders.findProviders({
      type: deliveryProviderType,
    });
    return deliveryProviders.reduce(
      (oldResult, deliveryProvider) =>
        oldResult.concat(
          oldResult,
          WarehousingProviders.findSupported({
            product: this,
            deliveryProvider,
          }).map((warehousingProvider) => {
            const context = {
              warehousingProvider,
              deliveryProvider,
              product: this,
              requestContext,
              ...options,
            };
            const dispatch = warehousingProvider.estimatedDispatch(context);
            return {
              ...context,
              ...dispatch,
            };
          })
        ),
      []
    );
  },

  userStocks({ deliveryProviderType, ...options }, requestContext) {
    const deliveryProviders = DeliveryProviders.findProviders({
      type: deliveryProviderType,
    });
    return deliveryProviders.reduce(
      (oldResult, deliveryProvider) =>
        oldResult.concat(
          oldResult,
          WarehousingProviders.findSupported({
            product: this,
            deliveryProvider,
          }).map((warehousingProvider) => {
            const context = {
              warehousingProvider,
              deliveryProvider,
              product: this,
              requestContext,
              ...options,
            };
            const stock = warehousingProvider.estimatedStock(context);
            return {
              ...context,
              ...stock,
            };
          })
        ),
      []
    );
  },

  userDiscounts(/* { quantity, country, userId }, requestContext */) {
    // TODO: User Discount Simulation
    return [];
  },

  userPrice({ quantity = 1, country, user, useNetPrice }, requestContext) {
    const currency = Countries.resolveDefaultCurrencyCode({
      isoCode: country,
    });
    const pricingDirector = new ProductPricingDirector({
      product: this,
      user,
      country,
      currency,
      quantity,
      requestContext,
    });
    const calculated = pricingDirector.calculate();
    if (!calculated) return null;

    const pricing = pricingDirector.resultSheet();
    const userPrice = pricing.unitPrice({ useNetPrice });

    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            country,
            quantity,
            useNetPrice,
            user ? user._id : 'ANONYMOUS',
          ].join('')
        )
        .digest('hex'),
      amount: userPrice.amount,
      currencyCode: userPrice.currency,
      countryCode: country,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
  price({ country, quantity = 1 }) {
    const currency = Countries.resolveDefaultCurrencyCode({
      isoCode: country,
    });
    const pricing = ((this.commerce && this.commerce.pricing) || []).sort(
      (
        { maxQuantity: leftMaxQuantity = 0 },
        { maxQuantity: rightMaxQuantity = 0 }
      ) => {
        if (
          leftMaxQuantity === rightMaxQuantity ||
          (!leftMaxQuantity && !rightMaxQuantity)
        )
          return 0;
        if (leftMaxQuantity === 0) return -1;
        if (rightMaxQuantity === 0) return 1;
        return leftMaxQuantity - rightMaxQuantity;
      }
    );
    const price = pricing.reduce(
      (oldValue, curPrice) => {
        if (
          curPrice.currencyCode === currency &&
          curPrice.countryCode === country &&
          (!curPrice.maxQuantity || curPrice.maxQuantity >= quantity)
        ) {
          return {
            ...oldValue,
            ...curPrice,
          };
        }
        return oldValue;
      },
      {
        amount: null,
        currencyCode: currency,
        countryCode: country,
        isTaxable: false,
        isNetPrice: false,
      }
    );
    if (price.amount !== undefined && price.amount !== null) {
      return {
        _id: crypto
          .createHash('sha256')
          .update([this._id, country, currency].join(''))
          .digest('hex'),
        ...price,
      };
    }
    return null;
  },
  resolveOrderableProduct({ configuration = [] }) {
    this.checkIsActive();
    if (this.type === ProductTypes.ConfigurableProduct) {
      const variations = this.variations();
      const vectors = configuration.filter(({ key: configurationKey }) => {
        const isKeyEqualsVariationKey = Boolean(
          variations.filter(
            ({ key: variationKey }) => variationKey === configurationKey
          ).length
        );
        return isKeyEqualsVariationKey;
      });
      const variants = this.proxyProducts(vectors);
      if (variants.length !== 1) {
        throw new Error(
          'There needs to be exactly one variant left when adding a ConfigurableProduct to the cart, configuration not distinct enough'
        );
      }
      const resolvedProduct = variants[0];
      resolvedProduct.checkIsActive();
      return resolvedProduct;
    }
    return this;
  },
  checkIsActive() {
    if (!this.isActive()) {
      throw new Error(
        'This product is not available for ordering at the moment'
      );
    }
  },
  isActive() {
    if (this.status === ProductStatus.ACTIVE) return true;
    return false;
  },
  reviews({ limit, offset }) {
    return ProductReviews.findReviews(
      { productId: this._id },
      { skip: offset, limit }
    );
  },
});

Products.getLocalizedTexts = (productId, locale) =>
  findLocalizedText(ProductTexts, { productId }, locale);
