import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';
import SimpleSchema from 'simpl-schema';
import { Logs } from './collections';

const ONE_DAY_IN_SECONDS = 86400;

Logs.attachSchema(
  new SimpleSchema(
    {
      level: { type: String, required: true },
      message: { type: String, required: true },
      meta: { type: Object, blackbox: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20181204,
  name: 'Move orderId and userId into meta field',
  up() {
    Logs.find({
      $or: [{ orderId: { $exists: true } }, { userId: { $exists: true } }],
    })
      .fetch()
      .forEach(({ _id, userId, orderId }) => {
        Logs.update(
          { _id },
          {
            $set: {
              meta: { orderId, userId },
            },
            $unset: {
              orderId: 1,
              userId: 1,
            },
          }
        );
      });
  },
  down() {
    Logs.find({
      $or: [
        { 'meta.orderId': { $exists: true } },
        { 'meta.userId': { $exists: true } },
      ],
    })
      .fetch()
      .forEach(({ _id, userId, orderId }) => {
        Logs.update(
          { _id },
          {
            $set: {
              orderId,
              userId,
            },
            $unset: {
              'meta.orderId': 1,
              'meta.userId': 1,
            },
          }
        );
      });
  },
});

export default () => {
  Migrations.migrateTo('latest');

  Logs.rawCollection().createIndex(
    {
      created: -1,
    },
    { expireAfterSeconds: 2 * ONE_DAY_IN_SECONDS }
  );
};
