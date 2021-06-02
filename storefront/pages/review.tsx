import { useRouter } from 'next/router';

import { useIntl } from 'react-intl';
import useUser from '../modules/auth/hooks/useUser';
import useSetOrderPaymentProvider from '../modules/orders/hooks/setPaymentOrderProvider';
import useCheckOutCart from '../modules/cart/hooks/useCheckOutCart';
import Header from '../modules/layout/components/Header';
import Footer from '../modules/layout/components/Footer';
import ManageCart from '../modules/cart/components/ManageCart';
import DeliveryAddressEditable from '../modules/checkout/components/DeliveryAddressEditable';
import BillingAddressEditable from '../modules/checkout/components/BillingAddressEditable';
import useUpdateOrderDeliveryShipping from '../modules/checkout/hooks/useUpdateDeliveryShipping';
import useUpdateCart from '../modules/checkout/hooks/useUpdateCart';
import MetaTags from '../modules/common/components/MetaTags';

const titleForProvider = (_id) => {
  return {
    uh2Qz5Cgh6jZeCZ7w: 'Wire Transfer',
  }[_id];
};

const Review = () => {
  const router = useRouter();
  const { user } = useUser();
  const intl = useIntl();

  const { checkOutCart } = useCheckOutCart();
  const { setOrderPaymentProvider } = useSetOrderPaymentProvider();
  const { updateOrderDeliveryAddress } = useUpdateOrderDeliveryShipping();
  const { updateCart } = useUpdateCart();

  const setBillingSameAsDelivery = () => {
    updateCart({
      billingAddress: {
        firstName: user?.cart?.deliveryInfo?.address?.firstName,
        lastName: user?.cart?.deliveryInfo?.address?.lastName,
        company: user?.cart?.deliveryInfo?.address?.company,
        addressLine: user?.cart?.deliveryInfo?.address?.addressLine,
        postalCode: user?.cart?.deliveryInfo?.address?.postalCode,
        city: user?.cart?.deliveryInfo?.address?.city,
        countryCode: user?.cart?.deliveryInfo?.address?.countryCode,
      },
    });
  };

  const checkout = async ({
    paymentContext = undefined,
    deliveryContext = undefined,
    orderContext = undefined,
  } = {}) => {
    if (user?.cart?.deliveryInfo?.address === null) setBillingSameAsDelivery();
    await checkOutCart({
      orderId: user.cart._id,
      orderContext,
      paymentContext,
      deliveryContext,
    });

    setTimeout(() => {
      router.replace({
        pathname: '/thank-you',
        query: { orderId: user.cart._id },
      });
    }, 2000);
  };

  const selectPayment = async (providerId) => {
    await setOrderPaymentProvider({
      orderId: user.cart._id,
      paymentProviderId: providerId,
    });
  };

  if (!user?.cart) {
    return (
      <>
        <Header />
        <div className="container mt-5" />
        <Footer />
      </>
    );
  }

  const sameAsDeliveryChange = (event) => {
    if (event.target.checked) {
      if (user?.cart?.deliveryInfo?.address) {
        setBillingSameAsDelivery();
      }
      updateOrderDeliveryAddress({
        orderDeliveryId: user?.cart?.deliveryInfo?._id,
        address: null,
        meta: null,
      });
    } else {
      updateOrderDeliveryAddress({
        orderDeliveryId: user?.cart?.deliveryInfo?._id,
        address: {
          firstName: user?.cart?.billingAddress?.firstName,
          lastName: user?.cart?.billingAddress?.lastName,
          company: user?.cart?.billingAddress?.company,
          addressLine: user?.cart?.billingAddress?.addressLine,
          postalCode: user?.cart?.billingAddress?.postalCode,
          city: user?.cart?.billingAddress?.city,
          countryCode: user?.cart?.billingAddress?.countryCode,
        },
        meta: null,
      });
    }
  };

  return (
    <>
      <MetaTags title={intl.formatMessage({ id: 'order_review' })} />
      <Header />

      <div className="container mt-5">
        <div className="row">
          <div className="col-lg-8 mb-5">
            <h2 className="mt-0 mb-5">
              {`${intl.formatMessage({
                id: 'checkout',
              })} - ${intl.formatMessage({ id: 'order_review' })}`}
            </h2>
            <h4>{intl.formatMessage({ id: 'delivery_address' })}</h4>
            <DeliveryAddressEditable user={user} />

            <h4 className="mt-5">
              {intl.formatMessage({ id: 'billing_address' })}
            </h4>

            <div className="form-check my-3">
              <label className="form-check-label mb-5" htmlFor="same">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="same"
                  defaultChecked={user?.cart?.deliveryInfo?.address === null}
                  name="same"
                  onChange={(e) => sameAsDeliveryChange(e)}
                />
                <span className="ml-3">
                  {intl.formatMessage({ id: 'same_as_delivery' })}
                </span>
              </label>
            </div>
            <BillingAddressEditable user={user} />

            <h4 className="mt-5">
              {intl.formatMessage({ id: 'payment_method' })}
            </h4>
            <section className="">
              {user?.cart?.supportedPaymentProviders.map(({ _id }) => (
                <div key={_id} className="form-check my-2 my-lg-1">
                  <label className="form-check-label">
                    <input
                      type="radio"
                      className="form-check-input"
                      name="paymentmethods"
                      value={_id}
                      checked={_id === user?.cart?.paymentInfo?.provider?._id}
                      onChange={(e) => {
                        e.preventDefault();
                        selectPayment(_id);
                      }}
                    />
                    <span className="ml-3">{titleForProvider(_id)}</span>
                  </label>
                </div>
              ))}
            </section>

            <div className="mt-5">
              {user?.cart?.paymentInfo?.provider?._id ===
              'uh2Qz5Cgh6jZeCZ7w' ? (
                <button
                  type="button"
                  role="link"
                  className="button button--primary button--big"
                  onClick={() => checkout()}
                >
                  {intl.formatMessage({ id: 'confirm_purchase' })}
                </button>
              ) : (
                ''
              )}
            </div>
          </div>
          <div className="col-lg-4">
            <h2 className="mt-0 mb-5">
              {intl.formatMessage({ id: 'order_summary' })}
            </h2>
            <ManageCart user={user} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Review;
