export default [
  /* GraphQL */ `
    type Dispatch {
      _id: ID!
      deliveryProvider: DeliveryProvider
      warehousingProvider: WarehousingProvider
      shipping: Date
      earliestDelivery: Date
    }
  `,
];
