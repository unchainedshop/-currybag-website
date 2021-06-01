import Image from 'next/image';
import Link from 'next/link';
import { useIntl } from 'react-intl';

import getMediaUrl from '../../common/utils/getMediaUrl';

const ProductListItem = ({ product }) => {
  const intl = useIntl();
  return (
    <Link
      href={`/${intl.formatMessage({ id: 'product' })}/${product?.texts?.slug}`}
    >
      <a>
        <div className="text-center">
          <Image
            loading="lazy"
            src={`${
              getMediaUrl(product) || '/static/img/sun-glass-placeholder.jpeg'
            }`}
            alt={product?.texts?.title}
            width="500"
            height="300"
            quality={100}
            layout="responsive"
            objectFit="contain"
          />
          <h3 className="p-3">{product?.texts?.title}</h3>
        </div>
      </a>
    </Link>
  );
};

export default ProductListItem;
