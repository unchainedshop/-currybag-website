import { Promise } from 'meteor/promise';
import 'meteor/dburles:collection-helpers';
import { WarehousingProviders } from './collections';
import { WarehousingDirector } from '../director';

WarehousingProviders.helpers({
  transformContext(key, value) {
    return value;
  },
  defaultContext() {
    return {};
  },
  interface() {
    return new WarehousingDirector(this).interfaceClass();
  },
  configurationError() {
    return new WarehousingDirector(this).configurationError();
  },
  isActive(context) {
    return new WarehousingDirector(this).isActive(context);
  },
  estimatedDispatch(context) {
    return Promise.await(
      new WarehousingDirector(this).estimatedDispatch(context)
    );
  },
  estimatedStock(context) {
    return Promise.await(new WarehousingDirector(this).estimatedStock(context));
  },
});

WarehousingProviders.createProvider = ({ type, ...rest }) => {
  const InterfaceClass = new WarehousingDirector(rest).interfaceClass();
  const providerId = WarehousingProviders.insert({
    ...rest,
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    type,
  });
  return WarehousingProviders.findOne({ _id: providerId });
};

WarehousingProviders.updateProvider = ({ _id, ...rest }) => {
  WarehousingProviders.update(
    { _id, deleted: null },
    {
      $set: {
        ...rest,
        updated: new Date(),
      },
    }
  );
  return WarehousingProviders.findOne({ _id, deleted: null });
};

WarehousingProviders.removeProvider = ({ _id }) => {
  WarehousingProviders.update(
    { _id, deleted: null },
    {
      $set: {
        deleted: new Date(),
      },
    }
  );
  return WarehousingProviders.findOne({ _id });
};

WarehousingProviders.findProviderById = (_id) =>
  WarehousingProviders.findOne({ _id });

WarehousingProviders.findProviders = ({ type } = {}) =>
  WarehousingProviders.find({
    ...(type ? { type } : {}),
    deleted: null,
  }).fetch();

WarehousingProviders.findSupported = ({ product, deliveryProvider }) =>
  WarehousingProviders.findProviders().filter((warehousingProvider) =>
    warehousingProvider.isActive({ product, deliveryProvider })
  );
