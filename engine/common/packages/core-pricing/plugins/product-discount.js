import {
  ProductPricingDirector,
  ProductPricingAdapter,
  ProductPricingSheetRowCategories,
} from 'meteor/unchained:core-pricing';

const applyRate = ({ rate, fixedRate }, amount) =>
  rate ? amount * rate : Math.min(fixedRate, amount);

class ProductDiscount extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.product-discount';

  static version = '1.0';

  static label = 'Berechnung der Bestellposition: Prozentual-Gutscheine';

  static orderIndex = 10;

  static isActivatedFor() {
    return true;
  }

  addDiscount(discount, total, isTaxable) {
    const { configuration, discountId } = discount;
    const { isNetPrice = false, ...meta } = configuration;
    const amount = applyRate(configuration, total);
    this.result.addDiscount({
      amount: amount * -1,
      isNetPrice,
      isTaxable,
      discountId,
      meta: { adapter: this.constructor.key, ...meta },
    });
  }

  async calculate() {
    const taxableTotal = this.calculation.sum({
      category: ProductPricingSheetRowCategories.Item,
      isTaxable: true,
    });
    const nonTaxableTotal = this.calculation.sum({
      category: ProductPricingSheetRowCategories.Item,
      isTaxable: false,
    });

    this.discounts.forEach((discount) => {
      if (taxableTotal !== 0) {
        this.addDiscount(discount, taxableTotal, true);
      }
      if (nonTaxableTotal !== 0) {
        this.addDiscount(discount, nonTaxableTotal, false);
      }
    });

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductDiscount);
