import React, { useEffect } from 'react';
import Header from './Header';
import MarqueeBanner from '@/components/MarqueeBanner';
import { ShoppingCart, Instagram, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import AhnuphaLogo from './AhnuphaLogo';
import customSupabaseClient from '@/context/SupabaseAuthContext';

const STOCK_STORAGE_KEY = 'ahnupha_product_stock';
const PRODUCT_STOCK_TABLE = 'product_stock';
const STOCK_FETCH_CACHE_MS = 60 * 1000;
let lastStockFetchAt = 0;

const Layout = ({ children }) => {
  // Fix: Destructure 'cart' instead of 'cartItems' as that is what Context provides.
  // Also adding safety check as requested to prevent undefined errors.
  const { cart } = useCart();
  const cartItems = cart || [];
  const location = useLocation();

  // Sync product stock from Supabase to localStorage (cached so nav is fast)
  useEffect(() => {
    const now = Date.now();
    if (now - lastStockFetchAt < STOCK_FETCH_CACHE_MS) return;
    lastStockFetchAt = now;
    let mounted = true;
    customSupabaseClient.from(PRODUCT_STOCK_TABLE).select('product_id, stock').then(({ data, error }) => {
      if (!mounted || error || !data || data.length === 0) return;
      const fromServer = {};
      data.forEach((row) => {
        const id = row.product_id;
        const val = Number(row.stock);
        if (id != null && Number.isFinite(val)) fromServer[id] = val;
      });
      if (Object.keys(fromServer).length === 0) return;
      try {
        const s = localStorage.getItem(STOCK_STORAGE_KEY);
        const existing = s ? JSON.parse(s) : {};
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify({ ...existing, ...fromServer }));
      } catch (_) {}
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Calculate count safely with null checks
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Handle click on same page link - scroll to top only when path and search match (so footer "Chocolates" from /candy-chocolate?product=xxx goes to main chocolate page)
  const handleLinkClick = (path) => (e) => {
    const samePath = location.pathname === path;
    const noSearch = !location.search || location.search === '';
    if (samePath && noSearch) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      
      {/* Marquee Banner - Offers valid upto Feb 14 */}
      <MarqueeBanner />
      
      <main className="flex-1 w-full relative">
        {children}
      </main>

      {/* Floating Cart Button - hidden on cart page so it doesn't overlap the sticky "Proceed to Checkout" bar */}
      {location.pathname !== '/cart' && (
        <Link to="/cart" className="fixed bottom-6 right-6 z-50 group" aria-label={cartCount > 0 ? `View cart (${cartCount} items)` : 'View cart'}>
          <Button size="icon" className="h-16 w-16 rounded-full bg-rose-600 hover:bg-rose-500 shadow-xl hover:shadow-2xl relative transition-all duration-300 hover:scale-110">
            <ShoppingCart className="h-6 w-6 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-lg">
                {cartCount}
              </span>
            )}
          </Button>
        </Link>
      )}

      <footer className="relative overflow-hidden bg-gray-950 text-white">
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/50 via-gray-950 to-amber-950/30 pointer-events-none" />
        {/* dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #f43f5e 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        {/* gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />

        {/* ── Pre-footer CTA strip ─────────────────────── */}
        <div className="relative border-b border-white/8 py-10 z-10">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Ready to order?</p>
                <h3 className="text-xl md:text-2xl font-extrabold text-white">
                  Get your perfect chocolate — delivered fresh.
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link to="/candy-chocolate"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-xl shadow-rose-900/40 hover:from-rose-600 hover:to-amber-600 hover:shadow-2xl transition-all duration-300 group"
                >
                  Shop Now
                  <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </Link>
                <Link to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-white/20 text-white/80 font-bold text-sm hover:bg-white/8 hover:text-white transition-all duration-300"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="relative container px-4 sm:px-6 lg:px-8 z-10 py-14 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12">
            <div className="space-y-5">
              <Link to="/" className="inline-block transition-transform duration-300 hover:scale-105" onClick={handleLinkClick("/")}>
                <AhnuphaLogo className="h-24 md:h-28 lg:h-32 w-auto brightness-0 invert" />
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">Handcrafted with love, delivered with care.</p>
              <div className="flex items-center gap-3">
                <a href="https://instagram.com/ahnupha_bites/" target="_blank" rel="noopener noreferrer"
                  className="text-gray-500 hover:text-rose-400 transition-all duration-200 p-2 rounded-lg hover:bg-rose-500/10 hover:scale-110"
                  aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://wa.me/919515404195" target="_blank" rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-400 transition-all duration-200 p-2 rounded-lg hover:bg-green-500/10 hover:scale-110"
                  aria-label="WhatsApp">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-white mb-5 text-sm tracking-widest uppercase">Shop</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/candy-chocolate"
                    className="text-gray-400 hover:text-rose-400 transition-all duration-200 hover:translate-x-1.5 inline-flex items-center gap-1.5 font-medium touch-manipulation"
                    onClick={handleLinkClick("/candy-chocolate")} aria-label="Go to Chocolates page">
                    Chocolates
                  </Link>
                </li>
                <li>
                  <Link to="/customize"
                    className="inline-flex items-center gap-1.5 font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400 hover:from-rose-300 hover:to-amber-300 transition-all duration-200 hover:translate-x-1.5 touch-manipulation"
                    onClick={handleLinkClick("/customize")}>
                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-amber-400 animate-pulse shrink-0" />
                    Customize Chocolates
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-white mb-5 text-sm tracking-widest uppercase">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/about"
                    className="text-gray-400 hover:text-rose-400 transition-all duration-200 hover:translate-x-1.5 inline-flex items-center gap-1.5 font-medium touch-manipulation"
                    onClick={handleLinkClick("/about")}>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact"
                    className="text-gray-400 hover:text-rose-400 transition-all duration-200 hover:translate-x-1.5 inline-flex items-center gap-1.5 font-medium touch-manipulation"
                    onClick={handleLinkClick("/contact")}>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-white mb-5 text-sm tracking-widest uppercase">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/privacy-policy"
                    className="text-gray-400 hover:text-rose-400 transition-all duration-200 hover:translate-x-1.5 inline-flex items-center gap-1.5 font-medium touch-manipulation"
                    onClick={handleLinkClick("/privacy-policy")}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service"
                    className="text-gray-400 hover:text-rose-400 transition-all duration-200 hover:translate-x-1.5 inline-flex items-center gap-1.5 font-medium touch-manipulation"
                    onClick={handleLinkClick("/terms-of-service")}>
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/8 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500 font-medium">
              © {new Date().getFullYear()} Ahnupha. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">
              Handcrafted with <span className="text-rose-500">♥</span> in Suryapet, Telangana
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;