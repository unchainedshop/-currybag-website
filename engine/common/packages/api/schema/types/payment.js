export default [
  /* GraphQL */ `
    type PaymentInterface {
      _id: ID!
      label: String
      version: String
    }

    enum PaymentProviderType {
      """
      Card
      """
      CARD

      """
      Invoice
      """
      INVOICE

      """
      Generic
      """
      GENERIC
    }

    enum PaymentProviderError {
      ADAPTER_NOT_FOUND
      NOT_IMPLEMENTED
      INCOMPLETE_CONFIGURATION
      WRONG_CREDENTIALS
    }

    type PaymentCredentials {
      _id: ID!
      user: User!
      paymentProvider: PaymentProvider!
      meta: JSON
      isValid: Boolean
      isPreferred: Boolean
    }

    type PaymentProvider {
      _id: ID!
      created: Date
      updated: Date
      deleted: Date
      type: PaymentProviderType
      interface: PaymentInterface
      configuration: JSON
      configurationError: PaymentProviderError
    }
  `,
];
