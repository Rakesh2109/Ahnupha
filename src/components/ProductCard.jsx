import React, { useState, useEffect, useMemo, memo } from 'react';
import { Star, ShoppingCart, Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

const STOCK_STORAGE_KEY = 'ahnupha_product_stock';

const ProductCard = ({ product, priority = false, customiseOnly = false }) => {
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentImageSrc, setCurrentImageSrc] = useState(product?.image);
  const [stockRevision, setStockRevision] = useState(0);

  if (!product || typeof product !== 'object') return null;
  
  // Timeout for slow-loading images (8 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (imageLoading && retryCount < 2) {
        // Retry with a different image source or retry same source
        setRetryCount(prev => prev + 1);
        setImageLoading(true);
        // Force reload by adding timestamp
        setCurrentImageSrc(`${product.image}?retry=${retryCount + 1}&t=${Date.now()}`);
      } else if (imageLoading) {
        setImageLoading(false);
        setImageError(true);
      }
    }, 8000); // 8 second timeout
    
    return () => clearTimeout(timer);
  }, [imageLoading, retryCount, product.image]);
  
  // Reset when product changes
  useEffect(() => {
    setCurrentImageSrc(product.image);
    setImageLoading(true);
    setImageError(false);
    setRetryCount(0);
  }, [product.id, product.image]);

  // Re-read stock when admin updates it (storage event or window focus)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STOCK_STORAGE_KEY) setStockRevision((r) => r + 1);
    };
    const onFocus = () => setStockRevision((r) => r + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const isWishlisted = isInWishlist(product.id);

  // Get stock from localStorage override or default from product - MEMOIZED
  const stockLimit = useMemo(() => {
    try {
      const savedStock = localStorage.getItem(STOCK_STORAGE_KEY);
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        // Allow 0: use saved value if key exists (including 0), else fallback
        if (Object.prototype.hasOwnProperty.call(parsed, product.id)) {
          const val = Number(parsed[product.id]);
          return Number.isFinite(val) ? val : Number(product?.stock);
        }
      }
    } catch (error) {
      console.error('Error reading stock from localStorage:', error);
    }
    return Number(product?.stock);
  }, [product.id, product.stock, stockRevision]);

  // Memoize cart quantity lookup - CRITICAL for performance
  const inCartQty = useMemo(() => {
    if (!cart || cart.length === 0) return 0;
    const item = cart.find((i) => i.id === product.id);
    return item?.quantity || 0;
  }, [cart, product.id]);

  const remainingStock = useMemo(() => 
    Number.isFinite(stockLimit) ? Math.max(0, stockLimit - inCartQty) : null,
    [stockLimit, inCartQty]
  );
  
  const isLowStock = useMemo(() => 
    remainingStock !== null && remainingStock > 0 && remainingStock <= 3,
    [remainingStock]
  );
  
  const isOutOfStock = useMemo(() => 
    remainingStock !== null && remainingStock <= 0,
    [remainingStock]
  );

  const handleProductClick = () => {
    // Products with weightOptions need the product detail (on Chocolate page) to choose weight
    if (product.weightOptions?.length) {
      navigate(`/candy-chocolate?product=${product.id}`);
    } else {
      setSearchParams({ product: product.id });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      viewport={{ once: true, margin: "50px" }}
      className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-rose-100 transition-all flex flex-col h-full group relative"
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product);
        }}
        className="absolute top-3 right-3 z-10 min-w-[44px] min-h-[44px] p-2 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all touch-manipulation"
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
      </button>

      <div 
        className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer"
        onClick={handleProductClick}
      >
        {imageLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 z-10">
            <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading image...</span>
          </div>
        )}
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-amber-100">
            <span className="text-gray-400 text-sm">Image not available</span>
          </div>
        ) : (
          <img 
            src={currentImageSrc} 
            alt={product.imageAlt || product.title}
            className={`w-full h-full ${product.imageFit === 'cover' ? 'object-cover' : 'object-contain'} group-hover:scale-105 transition-transform duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            loading={priority ? "eager" : "lazy"}
            fetchpriority={priority ? "high" : "auto"}
            decoding="async"
            onLoad={() => {
              setImageLoading(false);
              setImageError(false);
            }}
            onError={() => {
              if (retryCount < 2) {
                setRetryCount(prev => prev + 1);
                setImageLoading(true);
                setCurrentImageSrc(`${product.image}?retry=${retryCount + 1}&t=${Date.now()}`);
              } else {
                setImageLoading(false);
                setImageError(true);
              }
            }}
          />
        )}

        {/* Simple Round Badge: Discount % or Special Offer */}
        {product.offerPrice && (product.discount || product.offerLabel) && (
          <div className="absolute top-3 left-3 z-20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-14 h-14 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full shadow-lg flex items-center justify-center"
            >
              <div className="text-center px-0.5">
                {product.discount ? (
                  <>
                    <div className="text-xs font-black leading-tight">{product.discount}%</div>
                    <div className="text-xs font-bold leading-tight">OFF</div>
                  </>
                ) : (
                  <div className="text-[9px] font-bold leading-tight">{product.offerLabel}</div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Stock Badge - No numbers shown to users */}
        {isOutOfStock ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-lg">
            <div className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold shadow-lg">
              Out of stock
            </div>
          </div>
        ) : isLowStock ? (
          <div className="absolute top-3 right-3 z-20">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-extrabold border border-rose-300 shadow-lg backdrop-blur-sm"
            >
              ⚡ Hurry, selling fast!
            </motion.div>
          </div>
        ) : null}
        
        {/* Overlay: Personalise (customise only) or Add to Cart */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/50 to-transparent flex justify-center">
             {customiseOnly ? (
               <Button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   handleProductClick();
                 }}
                 className="w-full min-h-[44px] bg-white text-rose-500 hover:bg-rose-500 hover:text-white border-0 font-medium shadow-lg transition-all touch-manipulation"
                 size="sm"
               >
                 Personalise
               </Button>
             ) : (
               <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (product.weightOptions?.length) {
                    handleProductClick();
                  } else {
                    addToCart({ ...product, stock: stockLimit ?? product.stock });
                  }
                }}
                disabled={isOutOfStock}
                className="w-full min-h-[44px] bg-white text-rose-500 hover:bg-rose-500 hover:text-white border-0 font-medium shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-rose-500 touch-manipulation"
                size="sm"
             >
                {product.weightOptions?.length ? (
                  <span className="text-sm font-medium">Choose weight</span>
                ) : (
                  <><ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart</>
                )}
             </Button>
             )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs font-medium text-rose-500 uppercase tracking-wider mb-1">{product.category}</div>
        <h3 
          className="text-base font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-rose-500 transition-colors cursor-pointer"
          onClick={handleProductClick}
        >
          {product.title}
        </h3>
        
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-amber-400" aria-hidden="true">
             {[1, 2, 3, 4, 5].map((i) => {
               const rating = Number(product.rating);
               const filled = Number.isFinite(rating) ? i <= Math.round(rating) : false;
               return (
                 <Star
                   key={i}
                   className={`w-3 h-3 ${filled ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                 />
               );
             })}
          </div>
          <span className="text-xs text-gray-500 ml-1">
             ({product.reviews ?? 0})
          </span>
        </div>
        
        {product.weight && (
          <div className="text-xs text-gray-600 font-medium mb-2">
            Weight: {product.weight}
          </div>
        )}

        {/* Stock Message - No numbers shown to users */}
        {isOutOfStock && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-bold">
              Out of stock
            </span>
          </div>
        )}
        {remainingStock !== null && isLowStock && !isOutOfStock && (
          <div className="mb-3">
            <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1">
              <span className="animate-pulse">⚡</span>
              Few left - Order now!
            </span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            {product.comingSoon ? (
              <span className="text-lg font-bold text-rose-600/90">Coming soon</span>
            ) : product.offerPrice && (product.discount || product.offerLabel) ? (
              <>
                {/* Discount / Special Offer Badge */}
                <div className="inline-block mb-1">
                  <span className="bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-extrabold px-2 py-1 rounded-full shadow-sm">
                    {product.discount ? `${product.discount}% OFF` : product.offerLabel}
                  </span>
                </div>
                
                {/* Pricing */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
                    ₹{product.offerPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </>
            ) : product.weightOptions?.length ? (
              <span className="text-xl font-bold text-gray-900">From ₹{Math.min(...product.weightOptions.map(o => o.price)).toLocaleString('en-IN')}</span>
            ) : product.price !== undefined ? (
              <span className="text-xl font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
            ) : (
              <span className="text-xl font-bold text-green-600">FREE</span>
            )}
          </div>
          {customiseOnly ? (
            <Button 
              variant="ghost"
              size="sm"
              className="md:hidden text-rose-500"
              onClick={(e) => { e.stopPropagation(); handleProductClick(); }}
            >
              Personalise
            </Button>
          ) : (
            <Button 
             variant="ghost"
             size="sm"
             className="md:hidden text-rose-500"
             onClick={(e) => {
               e.stopPropagation();
               if (product.comingSoon) return;
               if (product.weightOptions?.length) {
                 handleProductClick();
               } else {
                 addToCart({ ...product, stock: stockLimit ?? product.stock });
               }
             }}
             disabled={isOutOfStock || product.comingSoon}
          >
             {product.comingSoon ? <span className="text-sm font-medium text-rose-600/90">Coming soon</span> : isOutOfStock ? <span className="text-sm font-medium text-gray-500">Out of stock</span> : product.weightOptions?.length ? <span className="text-xs font-medium">Choose weight</span> : <ShoppingCart className="w-5 h-5" />}
          </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(ProductCard);