import React from 'react';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const BtnPublishProduct = ({
  onClick,
  Component = 'button',
  children,
  ...rest
}) => (
  <Component onClick={onClick} {...rest}>
    {children}
  </Component>
);

export default compose(
  graphql(
    gql`
      mutation unpublishProduct($productId: ID!) {
        unpublishProduct(productId: $productId) {
          _id
          status
          published
          updated
        }
      }
    `,
    {
      options: {
        refetchQueries: ['productInfos', 'productTexts']
      }
    }
  ),
  withHandlers({
    onClick: ({ productId, mutate }) => () =>
      mutate({
        variables: {
          productId
        }
      })
  }),
  mapProps(({ productId, mutate, ...rest }) => ({
    ...rest
  })),
  pure
)(BtnPublishProduct);
