import {
  ProductPricingDirector,
  ProductPricingAdapter,
} from 'meteor/unchained:core-pricing';

class ProductEuTax extends ProductPricingAdapter {
  static key = 'shop.unchained.pricing.product-eu-tax';

  static version = '1.0';

  static label = 'Berechnung der Bestellposition: Nettopreis und MwSt (EU)';

  static orderIndex = 20;

  static isActivatedFor(ctx) {
    if (ctx.country !== 'CH') {
      return true; // check if delivery address is in eu country?
    }
    return false;
  }

  // eslint-disable-next-line
  getTaxRate() {
    return 0.19;
  }

  calculate() {
    const taxRate = this.getTaxRate();
    this.log(`ProductEuTax -> Tax Multiplicator: ${taxRate}`);
    this.calculation
      .filterBy({ isTaxable: true })
      .forEach(({ isNetPrice, ...row }) => {
        if (!isNetPrice) {
          const taxAmount = row.amount - row.amount / (1 + taxRate);
          this.result.calculation.push({
            ...row,
            amount: -taxAmount,
            isTaxable: false,
            meta: { adapter: this.constructor.key },
          });
          this.result.addTax({
            amount: taxAmount,
            rate: taxRate,
            meta: { adapter: this.constructor.key },
          });
        } else {
          const taxAmount = row.amount * taxRate;
          this.result.addTax({
            amount: taxAmount,
            rate: taxRate,
            meta: { adapter: this.constructor.key },
          });
        }
      });
    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(ProductEuTax);
