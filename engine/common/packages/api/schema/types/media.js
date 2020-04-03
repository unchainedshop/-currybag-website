export default [
  /* GraphQL */ `
    type Media {
      _id: ID!
      name: String!
      type: String!
      size: Int!
      url(version: String = "original", baseUrl: String): String!
      meta: JSON
    }
  `,
];
