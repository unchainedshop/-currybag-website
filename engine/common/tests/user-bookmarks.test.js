import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct } from './seeds/products';
import { ADMIN_TOKEN, User, Admin } from './seeds/users';

let connection;
let db;  // eslint-disable-line
let graphqlFetch;

describe('User Bookmarks', () => {
  let Bookmarks;

  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    Bookmarks = db.collection('bookmarks');
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createBookmark', () => {
    it('create a new bookmark for a specific user', async () => {
      const { data: { createBookmark } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createBookmark($productId: ID!, $userId: ID!) {
            createBookmark(productId: $productId, userId: $userId) {
              _id
              created
              user {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          userId: User._id
        }
      });
      expect(createBookmark).toMatchObject({
        user: {
          _id: User._id
        }
      });
    });
  });

  describe('Mutation.removeBookmark', () => {
    it('remove a bookmark', async () => {
      const bookmark = await Bookmarks.findOne({ userId: User._id });
      const { data: { removeBookmark } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
            }
          }
        `,
        variables: {
          bookmarkId: bookmark._id
        }
      });
      expect(removeBookmark._id).toBeTruthy();
    });
  });

  describe('Mutation.bookmark', () => {
    it('create a new bookmark for logged in user', async () => {
      const { data: { bookmark } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation bookmark($productId: ID!, $bookmarked: Boolean) {
            bookmark(productId: $productId, bookmarked: $bookmarked) {
              _id
              created
              user {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          bookmarked: true
        }
      });
      expect(bookmark).toMatchObject({
        user: {
          _id: Admin._id
        }
      });
    });
  });

  describe('User.bookmarks', () => {
    it('returns 1 bookmark', async () => {
      const { data: { user: { bookmarks } } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query bookmarks($userId: ID!) {
            user(userId: $userId) {
              _id
              bookmarks {
                product {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          userId: Admin._id
        }
      });
      expect(bookmarks).toMatchObject([
        {
          product: {
            _id: SimpleProduct._id
          }
        }
      ]);
    });
  });
});
