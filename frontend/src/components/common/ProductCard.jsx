import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { BargainingModal } from '../bargaining/BargainingModal';
import { MapPin, Star, Tag, Store, Armchair } from 'lucide-react';
import { formatINR, formatDistance } from '../../utils/formatters';
import { resolveProductImages } from '../../utils/productPhotos';
import './ProductCard.css';

export const ProductCard = ({ product }) => {
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const productTitle = product.title || product.name || 'Furniture item';
  // The photo the record carries, or a matching local photo when it has none.
  // Resolved before the effects below so a changed URL always gets a fresh
  // attempt; the same failing URL keeps its placeholder instead of retrying.
  const imageUrl = resolveProductImages(product)[0];
  const showImage = Boolean(imageUrl) && !imageError;

  useEffect(() => { setImageError(false); }, [imageUrl]);

  return (
    <>
      <Card hoverEffect padding="none" className="product-card">
        <div className="product-image-wrap">
          <Link to={`/products/${product.id}`} aria-label={`View details for ${productTitle}`}>
            {showImage ? (
              <img
                src={imageUrl}
                alt={productTitle}
                className="product-img"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              /* The listing has no photo of its own and no verified match:
                 show the on-brand placeholder instead of borrowing an
                 unrelated stock image (the old fallback was a camera). */
              <div className="product-img-placeholder" role="img" aria-label={`${productTitle} photo unavailable`}>
                <Armchair size={26} strokeWidth={1.5} />
                <span>Photo coming soon</span>
              </div>
            )}
          </Link>
          <div className="product-badges-float flex items-center gap-1">
            <Badge variant="default" size="sm" className="distance-badge">
              <MapPin size={10} className="text-accent" /> {formatDistance(product.distanceKm)}
            </Badge>
            {product.bargainable && (
              <Badge variant="bargain" size="sm">
                <Tag size={10} /> Smart Offer
              </Badge>
            )}
          </div>
        </div>

        <div className="product-info-body">
          <div className="product-seller-row flex items-center justify-between text-xs text-muted mb-1">
            <span className="flex items-center gap-1 truncate" title={product.sellerName}>
              <Store size={12} className="flex-shrink-0" /> {product.sellerName}
            </span>
            {/* Real merchant rating only: an unrated store renders no star
                rather than a fabricated score. */}
            {(Number(product.rating) || 0) > 0 && (
              <span className="flex items-center gap-1 font-semibold text-main flex-shrink-0">
                <Star size={12} fill="#f59e0b" color="#f59e0b" /> {product.rating}
              </span>
            )}
          </div>

          <Link to={`/products/${product.id}`}>
            <h3 className="product-title" title={productTitle}>{productTitle}</h3>
          </Link>

          {/* Price and fulfilment are one metadata group — kept adjacent instead
              of being pushed to opposite ends of the card by space-between. */}
          <div className="product-pricing-row flex items-baseline mt-2">
            <div className="price-group">
              <span className="product-price">{formatINR(product.price)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="product-orig-price">{formatINR(product.originalPrice)}</span>
              )}
            </div>
            <span className="text-xs text-muted">
              {product.pickupAvailable ? 'Store Pickup' : 'Delivery only'}
            </span>
          </div>

          <div className="product-actions-grid mt-3 flex gap-2">
            <Link to={`/products/${product.id}`} className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </Link>
            {product.bargainable && (
              <Button
                variant="bargain"
                size="sm"
                icon={Tag}
                onClick={() => setIsBargainModalOpen(true)}
                title="Propose a custom price to the seller"
              >
                Bargain
              </Button>
            )}
          </div>
        </div>
      </Card>

      <BargainingModal
        isOpen={isBargainModalOpen}
        onClose={() => setIsBargainModalOpen(false)}
        product={product}
      />
    </>
  );
};
