import Link from 'next/link';

import useUser from '../modules/auth/hooks/useUser';
import Footer from '../modules/layout/components/Footer';

const AboutUs = () => {
  const { user } = useUser();
  return (
    <div className="container">
      <Link href="/">
        <a className="color-brand">
          <h3 className="my-2 mr-2">
            Hi {user?.profile?.displayName || user?.username}
          </h3>
        </a>
      </Link>
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <h1>about us</h1>
          <p>...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUs;
