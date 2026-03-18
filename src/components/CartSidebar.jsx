import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Link, useNavigate } from 'react-router-dom';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, cartTotal, getCartLineKey } = useCart();
  const navigate = useNavigate();
  
  // Ensure cart is an array locally as well for extra safety
  const safeCart = Array.isArray(cart) ? cart : [];

  const handleStartShopping = () => {
    onClose();
    navigate('/candy-chocolate');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md md:max-w-lg bg-white shadow-2xl z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-gray-50 shrink-0">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 shrink-0" /> Your Cart
              </h2>
              <button
                onClick={onClose}
                className="p-2.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors touch-manipulation"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4">
              {safeCart.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center space-y-4 px-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Your cart is empty</h3>
                  <p className="text-sm sm:text-base text-gray-500 max-w-xs">Looks like you haven't added anything to your cart yet.</p>
                  <Button onClick={handleStartShopping} className="mt-4 min-h-[44px] px-6 bg-rose-600 hover:bg-rose-500">
                    Start Shopping
                  </Button>
                </div>
              ) : (
                safeCart.map((item) => (
                  <div
                    key={getCartLineKey ? getCartLineKey(item) : item.id || Math.random()}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                  >
                    <div className="w-full sm:w-20 h-40 sm:h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <img src={item.image || ''} alt={item.title || 'Product'} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="font-medium text-gray-900 line-clamp-2 sm:line-clamp-1 text-sm sm:text-base">{item.title || 'Product'}</h4>
                        <p className="text-sm text-gray-500">{item.category || ''}</p>
                        {item.nameOnBar && <p className="text-xs text-rose-600 font-medium">Name: {item.nameOnBar}</p>}
                        {item.customInstructions && <p className="text-xs text-gray-600 mt-0.5">Instructions: {item.customInstructions}</p>}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 sm:mt-2 flex-wrap">
                        <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item, -1)}
                            disabled={item.quantity <= 1}
                            className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center p-2 hover:bg-gray-100 text-gray-600 disabled:opacity-50 touch-manipulation"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
                          </button>
                          <span className="px-3 sm:px-2 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item, 1)}
                            className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center p-2 hover:bg-gray-100 text-gray-600 touch-manipulation"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                        <p className="font-bold text-gray-900 text-base sm:text-sm">₹{((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item)}
                      className="self-start sm:self-center p-2.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                      aria-label="Remove from cart"
                    >
                      <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {safeCart.length > 0 && (
              <div className="p-4 sm:p-5 border-t bg-gray-50 space-y-4 shrink-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{(cartTotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className="text-gray-600">Free for 508213; nominal ₹100 for other pincodes</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span>₹{(cartTotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="w-full block text-center bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white min-h-[48px] flex items-center justify-center py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-lg transition-colors touch-manipulation"
                  aria-label="Go to checkout"
                >
                  Go to Checkout
                </Link>
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="w-full block text-center text-sm sm:text-base text-gray-600 hover:text-rose-600 min-h-[44px] flex items-center justify-center py-2 touch-manipulation border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  View cart page
                </Link>
                <button
                  onClick={onClose}
                  className="w-full text-center text-sm sm:text-base text-gray-500 hover:text-gray-900 min-h-[44px] flex items-center justify-center py-2 touch-manipulation"
                >
                  Continue shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;