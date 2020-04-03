import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleDeliveryProvider } from './seeds/deliveries';

describe('setup delivery providers', () => {
  let connection;
  let graphqlFetch;

  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createDeliveryProvider', () => {
    it('create a shipping delivery provider', async () => {
      const {
        data: { createDeliveryProvider, errors } = {}
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createDeliveryProvider(
            $deliveryProvider: CreateProviderInput!
          ) {
            createDeliveryProvider(deliveryProvider: $deliveryProvider) {
              _id
              created
              updated
              deleted
              type
              interface {
                _id
                version
                label
              }
              configuration
              configurationError
            }
          }
        `,
        variables: {
          deliveryProvider: {
            type: 'SHIPPING',
            adapterKey: 'shop.unchained.post'
          }
        }
      });
      expect(errors).toEqual(undefined);
      expect(createDeliveryProvider).toMatchObject({
        configurationError: null,
        configuration: [],
        deleted: null,
        interface: {
          _id: 'shop.unchained.post'
        },
        type: 'SHIPPING'
      });
    });
  });

  describe('Mutation.updateDeliveryProvider', () => {
    it('Update a delivery provider', async () => {
      const {
        data: { updateDeliveryProvider, errors }
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateDeliveryProvider(
            $deliveryProvider: UpdateProviderInput!
            $deliveryProviderId: ID!
          ) {
            updateDeliveryProvider(
              deliveryProvider: $deliveryProvider
              deliveryProviderId: $deliveryProviderId
            ) {
              _id
              type
              deleted
              interface {
                _id
              }
              configuration
              configurationError
            }
          }
        `,
        variables: {
          deliveryProviderId: SimpleDeliveryProvider._id,
          deliveryProvider: {
            configuration: [
              {
                key: 'gugus',
                value: 'blub'
              }
            ]
          }
        }
      });
      expect(errors).toEqual(undefined);
      expect(updateDeliveryProvider).toMatchObject({
        configuration: [
          {
            key: 'gugus',
            value: 'blub'
          }
        ],
        configurationError: null,
        deleted: null,
        interface: {
          _id: 'shop.unchained.post'
        },
        type: 'SHIPPING'
      });
    });
  });

  describe('Mutation.removeDeliveryProvider', () => {
    it('Remove a delivery provider', async () => {
      const {
        data: { removeDeliveryProvider, errors }
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeDeliveryProvider($deliveryProviderId: ID!) {
            removeDeliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          deliveryProviderId: SimpleDeliveryProvider._id
        }
      });
      expect(errors).toEqual(undefined);
      expect(removeDeliveryProvider).toMatchObject({
        deleted: expect.anything(),
        _id: SimpleDeliveryProvider._id
      });
    });
  });
});
