import { useRouter } from 'next/router';

import LoadingItem from '../../modules/common/components/LoadingItem';
import MetaTags from '../../modules/common/components/MetaTags';
import Footer from '../../modules/layout/components/Footer';
import Header from '../../modules/layout/components/Header';
import OrderDetailComponent from '../../modules/orders/components/OrderDetailComponent';
import useOrderDetail from '../../modules/orders/hooks/useOrderDetail';

const OrderDetail = () => {
  const router = useRouter();

  const { order, loading } = useOrderDetail({
    orderId: router.query?.id,
  });

  return (
    <>
      <MetaTags title={`Order: ${order?.orderNumber}`} />
      <Header />
      {loading ? <LoadingItem /> : <OrderDetailComponent order={order} />}
      <Footer />
    </>
  );
};

export default OrderDetail;
