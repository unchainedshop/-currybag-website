import gql from 'graphql-tag';
import hashPassword from './hashPassword';
import { storeLoginToken } from './store';

export default async function(
  { username, email, password, profile, disableHashing = false },
  apollo
) {
  const variables = { username, email, profile };
  if (disableHashing) {
    variables.plainPassword = password;
  } else {
    variables.password = hashPassword(password);
  }
  const result = await apollo.mutate({
    mutation: gql`
      mutation createUser(
        $username: String
        $email: String
        $password: HashedPasswordInput
        $plainPassword: String
        $profile: UserProfileInput
      ) {
        createUser(
          username: $username
          email: $email
          password: $password
          plainPassword: $plainPassword
          profile: $profile
        ) {
          id
          token
          tokenExpires
        }
      }
    `,
    variables
  });

  if (result.data.createUser) {
    // immediately login
    const { id, token, tokenExpires } = result.data.createUser;
    await storeLoginToken(id, token, new Date(tokenExpires));
    return id;
  }
  return null;
}
