import { useEffect, useState } from 'react';

import MetaTags from '../modules/common/components/MetaTags';
import Footer from '../modules/layout/components/Footer';
import Header from '../modules/layout/components/Header';

const Conditions = () => {
  const [currentUrl, setcurrentUrl] = useState('');

  useEffect(() => {
    setcurrentUrl(window.location.href);
  }, []);

  return (
    <>
      <MetaTags title="Terms and Conditions" url={currentUrl} />
      <Header />
      <div className="container">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <h1>Conditions</h1>
            <p>...</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Conditions;
