import Link from 'next/link';
import { useRouter } from 'next/router';
import useUserQuery from '../modules/auth/hooks/useUserQuery';
import ManageCart from '../modules/cart/components/ManageCart';
import Header from '../modules/layout/components/Header';
import Footer from '../modules/layout/components/Footer';

const Cart = () => {
  const router = useRouter();
  const { user, loading } = useUserQuery();

  if (!user && !loading) router.push('/login?next=cart');

  return (
    <div className="container">
      <Header />
      <h1>
        shopping cart{' '}
        <span role="img" aria-label="Cart Icon">
          🛒
        </span>
      </h1>
      <ManageCart />

      <div className="button-group mt-5">
        <Link
          href={user?.isGuest ?? true ? '/register?next=payment' : '/payment'}
        >
          <a className="button button--primary button--big text-uppercase">
            Order once
          </a>
        </Link>
        <button
          disabled
          type="button"
          className="button button--primary button--big text-uppercase"
        >
          Available soon by subscription
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
