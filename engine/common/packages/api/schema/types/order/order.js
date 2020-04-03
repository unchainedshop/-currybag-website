export default [
  /* GraphQL */ `
    enum OrderStatus {
      """
      Open Order / Cart
      """
      OPEN

      """
      Order has been sent but confirmation awaiting
      """
      PENDING

      """
      Order has been confirmed
      """
      CONFIRMED

      """
      Order has been fullfilled completely (all positions in delivery)
      """
      FULLFILLED
    }

    enum OrderPriceCategory {
      """
      Product Price Total
      """
      ITEMS

      """
      Payment Fees
      """
      PAYMENT

      """
      Delivery Fees
      """
      DELIVERY

      """
      Tax
      """
      TAXES

      """
      Discount
      """
      DISCOUNTS
    }

    enum OrderDocumentType {
      """
      Order Confirmation
      """
      ORDER_CONFIRMATION

      """
      Delivery Note
      """
      DELIVERY_NOTE

      """
      Invoice
      """
      INVOICE

      """
      Receipt
      """
      RECEIPT

      """
      Other
      """
      OTHER
    }

    """
    Just an order
    """
    type Order {
      _id: ID!
      user: User
      status: OrderStatus
      created: Date
      updated: Date
      ordered: Date
      orderNumber: String
      confirmed: Date
      fullfilled: Date
      contact: Contact
      country: Country
      meta: JSON
      currency: Currency
      billingAddress: Address
      delivery: OrderDelivery
      payment: OrderPayment
      items: [OrderItem!]
      discounts: [OrderDiscount!]
      total(category: OrderPriceCategory): Money
      documents(type: OrderDocumentType = CONFIRMATION): [Media!]!
      supportedDeliveryProviders: [DeliveryProvider!]!
      supportedPaymentProviders: [PaymentProvider!]!
      logs(limit: Int = 10, offset: Int = 0): [Log!]!
    }
  `,
];
