import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import useSignForCheckout from '../hooks/useSignForCheckout';
import LoadingItem from '../../common/components/LoadingItem';
import renderPrice from '../../common/utils/renderPrice';
import useCheckOutCart from '../../cart/hooks/useCheckOutCart';

const BityPayment = ({ cart }) => {
  const intl = useIntl();
  const { signForCheckout } = useSignForCheckout();
  const [{ payload, signature }, setSign] = useState({});
  const [isPaymentButtonDisabled, setPaymentButtonDisabled] = useState(false);
  const { checkOutCart } = useCheckOutCart();

  useEffect(async () => {
    const sign = await signForCheckout({
      orderPaymentId: cart?.paymentInfo._id,
    });
    setSign(JSON.parse(sign));
  }, [cart]);

  if (!payload) return <LoadingItem />;

  return (
    <div>
      <p>
        Please follow these steps carefully for a successful Bitcoin payment:
      </p>
      <ol>
        <li>
          You will have to send EXACTLY{' '}
          <b>
            {payload?.output?.currency === 'BTC'
              ? payload?.input?.amount / 100
              : payload?.input?.amount}
          </b>{' '}
          Bitcoins to the Bitcoin Wallet Address we will present to you after
          submitting the order. Please do not send part of the amount in
          multiple transactions or from multiple source addresses.
        </li>
        <li>
          Please always double and triple check the destination address so you
          don't accidentally send the Bitcoins to somebody else.
        </li>
        <li>
          Please start the payment immediately after submission of the order.
          Bitcoins fluctuate and we can only guarantee the Bitcoin price that is
          presented to you for 6 hours after you have submitted the order.
        </li>
      </ol>
      <div>
        {payload?.output?.currency === 'BTC' ? (
          <h3>
            {renderPrice({
              amount: payload.input.amount,
              currency: 'BTC',
              addBTCFraction: payload?.output?.currency === 'BTC',
            })}
          </h3>
        ) : (
          renderPrice(cart?.total)
        )}

        {payload?.output?.currency !== 'BTC' &&
          (payload?.input?.amount ? (
            <>
              <h3>
                {renderPrice({
                  amount: payload.input.amount,
                  currency: 'BTC',
                  addBTCFraction: false,
                })}
              </h3>
              <p>
                BTC/{cart?.total.currency}{' '}
                {renderPrice({
                  amount: cart?.total.amount / payload.input.amount,
                  currency: cart?.total.currency,
                  addBTCFraction: false,
                })}{' '}
                (includes comissions)
              </p>
            </>
          ) : (
            <h3>Calculating Price in Bitcoin</h3>
          ))}
      </div>
      <button
        type="button"
        role="link"
        className="button button--primary button--big"
        disabled={isPaymentButtonDisabled}
        onClick={async () => {
          setPaymentButtonDisabled(true);
          await checkOutCart({
            orderContext: { bityPayload: payload, bitySignature: signature },
          });
          setPaymentButtonDisabled(false);
        }}
      >
        {intl.formatMessage({ id: 'confirm_order' })}
      </button>
    </div>
  );
};

export default BityPayment;
