export default [
  /* GraphQL */ `
    type DeliveryFee {
      _id: ID!
      isTaxable: Boolean!
      isNetPrice: Boolean!
      country: Country!
      price: Money!
    }

    type DeliveryInterface {
      _id: ID!
      label: String
      version: String
    }

    enum DeliveryProviderType {
      """
      Pick-Up
      """
      PICKUP

      """
      Shipping
      """
      SHIPPING
    }

    enum DeliveryProviderError {
      ADAPTER_NOT_FOUND
      NOT_IMPLEMENTED
      INCOMPLETE_CONFIGURATION
      WRONG_CREDENTIALS
    }

    type DeliveryProvider {
      _id: ID!
      created: Date
      updated: Date
      deleted: Date
      type: DeliveryProviderType
      interface: DeliveryInterface
      configuration: JSON
      configurationError: DeliveryProviderError
      isActive: Boolean
      simulatedPrice(
        useNetPrice: Boolean = false
        orderId: ID
        context: JSON
      ): DeliveryFee
    }
  `,
];
