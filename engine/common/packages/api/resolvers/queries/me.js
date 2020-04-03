import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function (root, params, { userId, remoteAddress }) {
  log(`query me ${remoteAddress}`, { userId });
  return Users.findOne({ _id: userId });
}
