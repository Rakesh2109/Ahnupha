import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

const STOCK_STORAGE_KEY = 'ahnupha_product_stock';

const WishlistSidebar = ({ isOpen, onClose }) => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const safeWishlist = Array.isArray(wishlist) ? wishlist : [];

  const getStockForProduct = (item) => {
    try {
      const saved = localStorage.getItem(STOCK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[item.id] !== undefined && Number.isFinite(Number(parsed[item.id]))) return Number(parsed[item.id]);
      }
    } catch (_) {}
    return item.stock;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md md:max-w-lg bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-gray-50 shrink-0">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" aria-hidden /> Your Wishlist
              </h2>
              <button
                onClick={onClose}
                className="p-2.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors touch-manipulation"
                aria-label="Close wishlist"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4">
              {safeWishlist.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center space-y-4 px-2">
                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center shrink-0">
                    <Heart className="w-8 h-8 text-rose-300" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Your wishlist is empty</h3>
                  <p className="text-sm sm:text-base text-gray-500 max-w-xs">Save items you love here to buy them later.</p>
                  <Button onClick={onClose} variant="outline" className="mt-4 border-rose-50 text-rose-500 hover:bg-rose-50 min-h-[44px] px-6">
                    Discover Products
                  </Button>
                </div>
              ) : (
                safeWishlist.map((item) => (
                  <div
                    key={item?.id || Math.random()}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                  >
                    <div className="w-full sm:w-20 h-40 sm:h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <img src={item?.image || ''} alt={item?.title || 'Product'} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="font-medium text-gray-900 line-clamp-2 sm:line-clamp-1 text-sm sm:text-base">{item?.title || 'Product'}</h4>
                        <p className="text-sm font-bold text-rose-500 mt-1">₹{(item?.price ?? 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-3 sm:mt-2">
                        <Button
                          size="sm"
                          className="flex-1 min-h-[44px] sm:min-h-[36px] h-auto py-2.5 sm:py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-medium text-xs sm:text-sm touch-manipulation border-0 shadow-md"
                          onClick={() => {
                            addToCart({ ...item, stock: getStockForProduct(item) });
                            removeFromWishlist(item?.id);
                          }}
                        >
                          <ShoppingCart className="w-4 h-4 sm:w-3 sm:h-3 mr-2 shrink-0" /> Move to Cart
                        </Button>
                        <button
                          onClick={() => removeFromWishlist(item?.id)}
                          className="p-2.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WishlistSidebar;