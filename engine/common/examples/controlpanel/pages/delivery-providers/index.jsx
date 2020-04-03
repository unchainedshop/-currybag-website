import React from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import DeliveryProviderList from '../../components/delivery-providers/DeliveryProviderList';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(props => (
  <App {...props}>
    <Container>
      <h2>Delivery</h2>
      <DeliveryProviderList />
    </Container>
  </App>
));
