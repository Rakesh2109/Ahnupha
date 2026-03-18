import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    // Return a safe default object if used outside provider to prevent crashes
    return { 
      cart: [], 
      addToCart: () => {}, 
      removeFromCart: () => {}, 
      updateQuantity: () => {}, 
      clearCart: () => {}, 
      cartTotal: 0, 
      cartCount: 0,
      getCartLineKey: () => ''
    };
  }
  return context;
};

const GUEST_CART_KEY = 'ahnupha_cart_guest';
const LEGACY_CART_KEY = 'ahnupha_cart';

export const CartProvider = ({ children }) => {
  const { currentUser, isLoading: authLoading } = useSupabaseAuth();
  const [cart, setCart] = useState([]);
  const { toast } = useToast();
  const previousUserIdRef = useRef(null);

  // Unique key for a cart line (so personalised bars with different names/bases/seeds stay separate)
  const getCartLineKey = (item) => {
    if (!item) return '';
    const base = `${item.id}-${item.isFreeItem === true ? 'free' : 'paid'}`;
    const name = item.nameOnBar != null ? `-n-${String(item.nameOnBar)}` : '';
    const first = item.firstName != null ? `-f1-${String(item.firstName)}` : '';
    const second = item.secondName != null ? `-f2-${String(item.secondName)}` : '';
    const customT = item.customText != null ? `-ct-${String(item.customText)}` : '';
    const letters = item.firstLetters != null ? `-fl-${String(item.firstLetters)}` : '';
    const baseOpt = item.selectedBase != null ? `-b-${item.selectedBase?.id ?? item.selectedBase}` : '';
    const seeds = Array.isArray(item.selectedSeeds) ? `-s-${[...item.selectedSeeds].sort().join(',')}` : '';
    const chocolateType = item.selectedChocolateType?.id ?? item.selectedChocolateType;
    const smallBitesGram = item.selectedSmallBitesGram?.weight ?? item.selectedSmallBitesGram;
    const smallBites = (item.smallBitesWithWrap && chocolateType && smallBitesGram) ? `-sb-${chocolateType}-${smallBitesGram}` : '';
    const instructions = item.customInstructions != null && String(item.customInstructions).trim() ? `-i-${String(item.customInstructions).trim()}` : '';
    const wrap = item.giftWrap ? '-g1' : '';
    return `${base}${name}${first}${second}${customT}${letters}${baseOpt}${seeds}${smallBites}${instructions}${wrap}`;
  };

  // Function to merge duplicate items in cart (same product + same options only)
  const mergeDuplicateItems = (cartItems) => {
    if (!Array.isArray(cartItems)) return [];
    const itemMap = new Map();
    cartItems.forEach((item) => {
      const key = getCartLineKey(item);
      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        existing.quantity = (existing.quantity || 0) + (item.quantity || 0);
      } else {
        itemMap.set(key, { ...item, quantity: item.quantity || 1 });
      }
    });
    return Array.from(itemMap.values());
  };

  // Load and persist cart when user state changes. Guest cart is kept; on login we merge guest + user cart.
  useEffect(() => {
    if (authLoading) return;

    if (currentUser?.id) {
      // User just logged in (or page load while logged in)
      previousUserIdRef.current = currentUser.id;
      try {
        const userKey = `ahnupha_cart_${currentUser.id}`;
        const guestRaw = localStorage.getItem(GUEST_CART_KEY);
        const userRaw = localStorage.getItem(userKey);
        const guestArray = guestRaw ? (() => { try { const p = JSON.parse(guestRaw); return Array.isArray(p) ? p : []; } catch { return []; } })() : [];
        const userArray = userRaw ? (() => { try { const p = JSON.parse(userRaw); return Array.isArray(p) ? p : []; } catch { return []; } })() : [];
        const mergedCart = mergeDuplicateItems([...guestArray, ...userArray]);
        setCart(mergedCart);
        localStorage.setItem(userKey, JSON.stringify(mergedCart));
        localStorage.removeItem(GUEST_CART_KEY);
        localStorage.removeItem(LEGACY_CART_KEY);
      } catch (error) {
        console.error("Failed to load/merge cart on login", error);
        setCart([]);
      }
    } else {
      // Not logged in (guest or just logged out)
      if (previousUserIdRef.current != null) {
        // Just logged out: save current (user's) cart to guest so it persists
        try {
          if (cart.length > 0) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
        } catch (_) {}
        previousUserIdRef.current = null;
      }
      try {
        const guestRaw = localStorage.getItem(GUEST_CART_KEY);
        const legacyRaw = localStorage.getItem(LEGACY_CART_KEY);
        const guestArray = guestRaw ? (() => { try { const p = JSON.parse(guestRaw); return Array.isArray(p) ? p : []; } catch { return []; } })() : [];
        const legacyArray = legacyRaw ? (() => { try { const p = JSON.parse(legacyRaw); return Array.isArray(p) ? p : []; } catch { return []; } })() : [];
        const merged = mergeDuplicateItems([...legacyArray, ...guestArray]);
        setCart(merged);
        if (merged.length > 0) {
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(merged));
          localStorage.removeItem(LEGACY_CART_KEY);
        }
      } catch (error) {
        console.error("Failed to load guest cart", error);
        setCart([]);
      }
    }
  }, [currentUser?.id, authLoading]);

  // Persist cart to localStorage whenever it changes (guest and logged-in)
  useEffect(() => {
    if (authLoading) return;
    try {
      if (currentUser?.id) {
        localStorage.setItem(`ahnupha_cart_${currentUser.id}`, JSON.stringify(cart));
      } else {
        if (cart.length > 0) {
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
        } else {
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to save cart", error);
    }
  }, [cart, currentUser?.id, authLoading]);

  const addToCart = (product, quantity = 1) => {
    if (!product || typeof product !== 'object') return;
    const productName = product.title || product.name || 'Item';
    const requestedQty = Math.max(1, Number(quantity) || 1);
    const stockLimit = Number(product?.stock);
    // Normalize isFreeItem to boolean (true or false, never undefined)
    const isFreeItem = product.isFreeItem === true;

    setCart((prevCart) => {
      const safePrevCart = prevCart || [];
      
      // Normalize existing items' isFreeItem property for consistent comparison
      const normalizedCart = safePrevCart.map(item => ({
        ...item,
        isFreeItem: item.isFreeItem === true
      }));
      
      // For free items, check if the same product already exists (prevent duplicates of same product)
      if (isFreeItem) {
        const existingFreeItem = normalizedCart.find(item => item.id === product.id && item.isFreeItem === true);
        if (existingFreeItem) {
          // Update quantity instead of adding duplicate
          const nextCart = normalizedCart.map((item) =>
            item.id === product.id && item.isFreeItem === true
              ? { ...item, quantity: (item.quantity || 0) + requestedQty }
              : item
          );
          // Defer toast to avoid render warning
          setTimeout(() => {
            toast({
              title: "Free item updated",
              description: `${productName} quantity updated.`,
              duration: 3000,
            });
          }, 0);
          return nextCart;
        }
      }
      
      // For personalised products: same cart line only if same key (id, nameOnBar, base, seeds, instructions)
      const productKey = getCartLineKey({ ...product, isFreeItem });
      const sameLine = (item) => getCartLineKey(item) === productKey;
      const existingItem = normalizedCart.find(sameLine);
      const existingQty = existingItem?.quantity || 0;

      // No stock cap → behave like normal.
      if (!Number.isFinite(stockLimit)) {
        const nextCart = existingItem
          ? normalizedCart.map((item) =>
              sameLine(item) ? { ...item, quantity: item.quantity + requestedQty } : item
            )
          : [...normalizedCart, { ...product, quantity: requestedQty, isFreeItem }];

        // Defer toast to avoid render warning
        setTimeout(() => {
          toast({
            title: isFreeItem ? "Free item added" : "Added to cart",
            description: isFreeItem 
              ? `${productName} added as your free gift.`
              : `${requestedQty > 1 ? `${requestedQty} × ` : ''}${productName} added to your cart.`,
            duration: 3000,
          });
        }, 0);

        return nextCart;
      }

      const remaining = Math.max(0, stockLimit - existingQty);
      const allowedToAdd = Math.min(requestedQty, remaining);

      if (allowedToAdd <= 0) {
        // Out of stock (or already at limit)
        setTimeout(() => {
          toast({
            title: "Out of stock",
            description: `${productName} is currently out of stock.`,
            duration: 2000,
          });
        }, 0);
        return normalizedCart;
      }

      const nextCart = existingItem
        ? normalizedCart.map((item) =>
            sameLine(item) ? { ...item, quantity: item.quantity + allowedToAdd } : item
          )
        : [...normalizedCart, { ...product, quantity: allowedToAdd, isFreeItem }];

      // Defer toast to avoid render warning
      setTimeout(() => {
        toast({
          title: "Added to cart",
          description: `${allowedToAdd > 1 ? `${allowedToAdd} × ` : ''}${productName} added to your cart.`,
          duration: 3000,
        });

        if (allowedToAdd < requestedQty) {
          toast({
            title: "Stock limit",
            description: `Only ${remaining} left. Added ${allowedToAdd} to your cart.`,
            duration: 2200,
          });
        }
      }, 0);

      return nextCart;
    });
  };

  const removeFromCart = (idOrItem) => {
    setCart((prevCart) => {
      const safePrevCart = prevCart || [];
      const isItem = idOrItem != null && typeof idOrItem === 'object';
      const keyToRemove = isItem ? getCartLineKey(idOrItem) : null;
      const updatedCart = safePrevCart.filter((item) => {
        if (isItem && keyToRemove) return getCartLineKey(item) !== keyToRemove;
        return item.id !== idOrItem;
      });
      
      // Recalculate eligible free items after removal
      const paidItems = updatedCart.filter(item => !item.isFreeItem);
      const totalPaidItems = paidItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const eligibleFreeItems = Math.floor(totalPaidItems / 2);
      
      // Remove excess free items if user no longer qualifies
      const freeItems = updatedCart.filter(item => item.isFreeItem === true);
      const totalFreeItems = freeItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      
      if (totalFreeItems > eligibleFreeItems) {
        // User has more free items than eligible - remove excess
        let freeItemsToKeep = eligibleFreeItems;
        const excessCount = totalFreeItems - eligibleFreeItems;
        const finalCart = updatedCart.filter((item) => {
          if (item.isFreeItem === true) {
            if (freeItemsToKeep > 0) {
              freeItemsToKeep--;
              return true;
            }
            return false; // Remove excess free items
          }
          return true; // Keep all paid items
        });
        
        // Defer toast to avoid render warning
        if (excessCount > 0) {
          setTimeout(() => {
            toast({
              title: "Free Item Removed",
              description: `You no longer qualify for ${excessCount} free item(s).`,
              variant: "destructive",
              duration: 3000,
            });
          }, 0);
        }
        
        return finalCart;
      }
      
      return updatedCart;
    });
  };

  const updateQuantity = (idOrItem, delta) => {
    setCart((prevCart) => {
      const safePrevCart = prevCart || [];
      const isItem = idOrItem != null && typeof idOrItem === 'object';
      const keyToUpdate = isItem ? getCartLineKey(idOrItem) : null;
      const updatedCart = safePrevCart.map((item) => {
        const matches = isItem && keyToUpdate ? getCartLineKey(item) === keyToUpdate : item.id === idOrItem;
        if (matches) {
          // Don't allow quantity changes for free items
          if (item.isFreeItem === true) {
            return item; // Keep free items at quantity 1
          }
          const stockLimit = Number(item?.stock);
          const rawNext = Math.max(1, (item.quantity || 0) + delta);
          const newQuantity = Number.isFinite(stockLimit) ? Math.min(stockLimit, rawNext) : rawNext;
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      
      // After updating quantity, check if user still qualifies for free items
      const paidItems = updatedCart.filter(item => !item.isFreeItem);
      const totalPaidItems = paidItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const eligibleFreeItems = Math.floor(totalPaidItems / 2);
      
      // Remove excess free items if user no longer qualifies
      const freeItems = updatedCart.filter(item => item.isFreeItem === true);
      const totalFreeItems = freeItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      
      if (totalFreeItems > eligibleFreeItems) {
        // User has more free items than eligible - remove excess
        let freeItemsToKeep = eligibleFreeItems;
        const excessCount = totalFreeItems - eligibleFreeItems;
        const finalCart = updatedCart.filter((item) => {
          if (item.isFreeItem === true) {
            if (freeItemsToKeep > 0) {
              freeItemsToKeep--;
              return true;
            }
            return false; // Remove excess free items
          }
          return true; // Keep all paid items
        });
        
        // Defer toast to avoid render warning
        if (excessCount > 0) {
          setTimeout(() => {
            toast({
              title: "Free Item Removed",
              description: `You no longer qualify for ${excessCount} free item(s).`,
              variant: "destructive",
              duration: 3000,
            });
          }, 0);
        }
        
        return finalCart;
      }
      
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // Ensure cart is an array before reducing
  const safeCart = Array.isArray(cart) ? cart : [];
  const GIFT_WRAP_PRICE = 20;
  const cartTotal = safeCart.reduce((total, item) => {
    const itemTotal = (item.price || 0) * (item.quantity || 0);
    const wrapTotal = item.giftWrap ? GIFT_WRAP_PRICE * (item.quantity || 0) : 0;
    return total + itemTotal + wrapTotal;
  }, 0);
  const cartCount = safeCart.reduce((count, item) => count + (item.quantity || 0), 0);


  return (
    <CartContext.Provider value={{ cart: safeCart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, getCartLineKey }}>
      {children}
    </CartContext.Provider>
  );
};