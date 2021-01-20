import { useMutation, gql } from '@apollo/client';

const UpdateUserProfileMutation = gql`
  mutation UpdateUserProfile($profile: UserProfileInput!, $userId: ID!) {
    updateUserProfile(profile: $profile, userId: $userId) {
      _id
    }
  }
`;

const useUpdateUserProfile = () => {
  const [updateUserProfileMutation, { error }] = useMutation(
    UpdateUserProfileMutation,
  );

  const updateUserProfile = async ({ profile, userId }) => {
    return await updateUserProfileMutation({
      variables: { userId, profile },
      refetchQueries: ['UserQuery'],
    });
  };

  return {
    updateUserProfile,
    error,
  };
};

export default useUpdateUserProfile;
