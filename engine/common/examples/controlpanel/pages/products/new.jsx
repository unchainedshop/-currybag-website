import React from 'react';
import { withRouter } from 'next/router';
import { compose, withHandlers } from 'recompose';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import FormNewProduct from '../../components/products/FormNewProduct';
import connectApollo from '../../lib/connectApollo';

const New = ({ onSuccess, ...rest }) => (
  <App {...rest}>
    <Container>
      <p>New product</p>
      <FormNewProduct onSuccess={onSuccess} />
    </Container>
  </App>
);

export default connectApollo(
  compose(
    withRouter,
    withHandlers({
      onSuccess: ({ router }) => productId => {
        router.push({ pathname: '/products/edit', query: { _id: productId } });
      }
    })
  )(New)
);
