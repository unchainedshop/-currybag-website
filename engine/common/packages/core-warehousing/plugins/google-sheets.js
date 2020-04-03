import {
  WarehousingDirector,
  WarehousingAdapter,
} from 'meteor/unchained:core-warehousing';
import Sheets from 'node-sheets';
import NodeCache from 'node-cache';
import { log } from 'meteor/unchained:core-logger';

const { NODE_ENV, GOOGLE_SHEETS_PRIVATE_KEY_DATA } = process.env;

const googleCache = new NodeCache(
  NODE_ENV === 'production'
    ? { stdTTL: 180, checkperiod: 10 } // 4 minutes lag in production
    : { stdTTL: 30, checkperiod: 5 }
); // 7 seconds lag in development

async function downloadSpreadsheet() {
  if (!GOOGLE_SHEETS_PRIVATE_KEY_DATA) return null;
  try {
    // https://docs.google.com/spreadsheets/d/1lVplebvDHgPfPZnnp7NCM60iyu3WARGE1JZh6Xx5uvc/edit?usp=sharing
    const gs = new Sheets('1lVplebvDHgPfPZnnp7NCM60iyu3WARGE1JZh6Xx5uvc');
    const authData = JSON.parse(GOOGLE_SHEETS_PRIVATE_KEY_DATA);
    await gs.authorizeJWT(authData);
    const delivery = await gs.tables('delivery!A:ZZZ');
    const inventory = await gs.tables('inventory!A:ZZZ');
    log(`GoogleSheet: Updated cache with TTL: ${googleCache.options.stdTTL}`, {
      level: 'verbose',
    });
    return {
      delivery,
      inventory,
    };
  } catch (err) {
    log(err, { level: 'error' }); // eslint-disable-line
    throw err;
  }
}

const updateGoogleCache = async () => {
  try {
    const sheet = await downloadSpreadsheet();
    if (sheet) {
      googleCache.set('tables', sheet);
      googleCache.set('tablesFallback', sheet, 0);
      return sheet;
    }
  } catch (e) {
    console.error(e); // eslint-disable-line
  }
  return null;
};

googleCache.on('expired', updateGoogleCache);

updateGoogleCache();

class GoogleSheets extends WarehousingAdapter {
  static key = 'shop.unchained.warehousing.google-sheets';

  static version = '1.0';

  static label = 'Google Sheets';

  static orderIndex = 0;

  static initialConfiguration = [
    {
      key: 'address',
      value: null,
    },
  ];

  static typeSupported(type) {
    return type === 'PHYSICAL';
  }

  static async getRows(name) {
    const cachedTables =
      googleCache.get('tables') || googleCache.get('tablesFallback');
    let tables = cachedTables;
    if (!cachedTables) {
      tables = await updateGoogleCache();
    }
    if (!tables || !tables[name] || !tables[name].rows) return [];
    return tables[name].rows;
  }

  isActive(context) { // eslint-disable-line
    return true;
  }

  configurationError() { // eslint-disable-line
    return null;
  }

  async getRemoteTime(sku, quantity, selector) {
    const rows = await this.constructor.getRows('delivery');
    const resolvedRow = rows.reduce((result, row) => {
      const parsedQuantity = parseInt(row.Quantity.value, 10);
      const parsedSKU = row.SKU.value.toUpperCase();
      if (parsedSKU === sku && parsedQuantity <= quantity) {
        return row;
      }
      return result;
    }, null);
    if (!resolvedRow) return null;
    const time = parseInt(resolvedRow[selector].value, 10) || 0;
    log(
      `GoogleSheet: Resolve Time ${selector} (${quantity}) for ${sku}: ${time}`,
      { level: 'verbose' }
    );
    return time;
  }

  async getRemoteInventory(sku) {
    const rows = await this.constructor.getRows('inventory');
    const resolvedRow = [].concat(rows).reduce((result, row) => {
      if (result || !row) return result;
      const parsedSKU = row.SKU.value.toUpperCase();
      if (parsedSKU === sku) {
        return row;
      }
      return result;
    }, null);
    if (!resolvedRow) return null;
    const amount = parseInt(resolvedRow.Stock.value, 10) || 0;
    log(`GoogleSheet: Resolve Inventory for ${sku}: ${amount}`, {
      level: 'verbose',
    });
    return amount;
  }

  async stock() {
    const { product } = this.context;
    const { sku } = product.warehousing || {};
    return this.getRemoteInventory(sku);
  }

  async productionTime(quantity) {
    const { product } = this.context;
    const { sku } = product.warehousing || {};
    if (!sku) return null;
    const selector = 'WAREHOUSE_HOURS';
    const timeInHours = await this.getRemoteTime(
      sku.toUpperCase(),
      quantity,
      selector
    );
    if (!timeInHours) return null;
    return timeInHours * 60 * 60 * 1000;
  }

  async commissioningTime(quantity) {
    const { product, deliveryProvider } = this.context;
    const { sku } = product.warehousing || {};
    if (!sku) return null;
    const { type } = deliveryProvider;
    const selector = `DELIVERY_HOURS:${type}`;
    const timeInHours = await this.getRemoteTime(
      sku.toUpperCase(),
      quantity,
      selector
    );
    if (!timeInHours) return null;
    return timeInHours * 60 * 60 * 1000;
  }
}

WarehousingDirector.registerAdapter(GoogleSheets);
