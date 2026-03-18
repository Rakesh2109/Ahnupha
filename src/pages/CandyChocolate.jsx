import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import SEO from '@/components/SEO';
import { getSiteUrl } from '@/lib/siteConfig';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Heart, Info, X, MessageSquare, Send, Loader2, Plus, Minus, ArrowRight, ArrowUp, PenLine, CheckCircle2, Truck, Share2, Gift, Package, Phone } from 'lucide-react';
import { searchData } from '@/lib/searchData';

const STORE_PHONE = '+919515404195';
const STORE_WHATSAPP = '919515404195';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const CandyChocolate = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { currentUser, supabase } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const products = useMemo(() => 
    searchData.filter(item => 
      item.type === 'Product' && item.category === 'Chocolate' && item.title !== 'With Love Rose Chocolate' && !item.isPremiumCustom
    ), []
  );
  // Ensure stock object exists in localStorage so admin-set 0 is available when reading
  const STOCK_STORAGE_KEY_INIT = 'ahnupha_product_stock';
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STOCK_STORAGE_KEY_INIT);
      if (!saved) {
        const chocolateProducts = searchData.filter(item => item.type === 'Product' && item.category === 'Chocolate');
        const initial = {};
        chocolateProducts.forEach((p) => {
          const s = Number(p.stock);
          initial[p.id] = Number.isFinite(s) ? s : 10;
        });
        localStorage.setItem(STOCK_STORAGE_KEY_INIT, JSON.stringify(initial));
      }
    } catch (_) {}
  }, []);

  const selectedProductId = searchParams.get('product');
  const selectedProduct = selectedProductId
    ? (products.find(p => p.id === selectedProductId) || searchData.find(p => p.id === selectedProductId))
    : null;
  const isWishlisted = selectedProduct ? isInWishlist(selectedProduct.id) : false;

  // When opening a product detail, scroll to top so user sees the start of the page
  useEffect(() => {
    if (selectedProductId) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [selectedProductId]);
  
  // Back to top scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Quantity state
  const [quantity, setQuantity] = useState(1);
  // Name on bar (single name or combined for display)
  const [nameOnBar, setNameOnBar] = useState('');
  // Two names (Premium custom: first & second, max 8 each)
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  // First letters couple (e.g. "A" & "B")
  const [firstLetter1, setFirstLetter1] = useState('');
  const [firstLetter2, setFirstLetter2] = useState('');
  // Custom text (birthday wishes / custom text on chocolate)
  const [customText, setCustomText] = useState('');
  // Gallery: which image is selected when product has multiple images
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Base selection for personalised bar
  const [selectedBase, setSelectedBase] = useState(null);
  // Seeds selection for personalised bar
  const [selectedSeeds, setSelectedSeeds] = useState([]);
  // Optional instructions from user (personalised bar)
  const [customInstructions, setCustomInstructions] = useState('');
  // Gift wrap add ₹20
  const [giftWrap, setGiftWrap] = useState(false);
  // Show "Shopping Cart" / "Continue Shopping" after adding to cart
  const [showPostAddToCart, setShowPostAddToCart] = useState(false);
  // Bump to re-read stock from localStorage (admin updates, other tabs)
  const [stockRevision, setStockRevision] = useState(0);
  // Weight selection for products with weightOptions (e.g. Kunafa Chocolate)
  const [selectedWeight, setSelectedWeight] = useState(null);
  // Small Bites with Wrap: chocolate type (kunafa/almond/cashew) and gram option
  const [selectedChocolateType, setSelectedChocolateType] = useState(null);
  const [selectedSmallBitesGram, setSelectedSmallBitesGram] = useState(null);

  // Reset quantity and name when product changes
  useEffect(() => {
    setQuantity(selectedProduct?.minOrderPacks ? selectedProduct.minOrderPacks : 1);
    setNameOnBar('');
    setFirstName('');
    setSecondName('');
    setFirstLetter1('');
    setFirstLetter2('');
    setCustomText('');
    setSelectedImageIndex(0);
    if (selectedProduct?.baseOptions?.length) {
      setSelectedBase(selectedProduct.baseOptions[0]);
      setSelectedImageIndex(selectedProduct.baseOptions[0]?.imageIndex || 0);
    } else {
      setSelectedBase(null);
    }
    if (selectedProduct?.seedsOptions?.length) {
      const mandatorySeeds = selectedProduct.seedsOptions
        .filter(opt => opt.mandatory)
        .map(opt => opt.id);
      setSelectedSeeds(mandatorySeeds);
    } else {
      setSelectedSeeds([]);
    }
    setGiftWrap(false);
    setShowPostAddToCart(false);
    if (selectedProduct?.weightOptions?.length) {
      setSelectedWeight(selectedProduct.weightOptions[0]);
    } else {
      setSelectedWeight(null);
    }
    if (selectedProduct?.smallBitesWithWrap && selectedProduct.chocolateTypeOptions?.length) {
      const firstType = selectedProduct.chocolateTypeOptions[0];
      setSelectedChocolateType(firstType);
      setSelectedSmallBitesGram(firstType.gramOptions?.[0] ?? null);
    } else {
      setSelectedChocolateType(null);
      setSelectedSmallBitesGram(null);
    }
  }, [selectedProductId]);
  
  // Get current quantity in cart for this product (for personalised bar, match by nameOnBar too)
  const normalizeSeeds = (seeds) => (seeds || []).slice().sort().join('|');

  const cartItem = selectedProduct ? cart.find(item => {
    if (item.id !== selectedProduct.id) return false;
    if (selectedProduct.twoNames && ((item.firstName || '') !== (firstName || '') || (item.secondName || '') !== (secondName || ''))) return false;
    if (selectedProduct.customNameOnBar && !selectedProduct.twoNames && (item.nameOnBar || '') !== (nameOnBar || '')) return false;
    if (selectedProduct.firstLettersCouple) {
      const current = (firstLetter1.trim().slice(0,1) + '&' + firstLetter2.trim().slice(0,1)).toUpperCase();
      if ((item.firstLetters || '') !== current) return false;
    }
    if ((selectedProduct.birthdayWishes || selectedProduct.customTextOnChocolate) && (item.customText || '') !== (customText || '')) return false;
    if (selectedProduct.baseOptions?.length && (item.selectedBase?.id || item.selectedBase) !== (selectedBase?.id || selectedBase)) return false;
    if (selectedProduct.seedsOptions?.length && normalizeSeeds(item.selectedSeeds) !== normalizeSeeds(selectedSeeds)) return false;
    if (selectedProduct.isPremiumCustom && !selectedProduct.minOrderPacks && (item.customInstructions || '') !== (customInstructions || '')) return false;
    if (selectedProduct.weightOptions?.length && (item.selectedWeight?.weight || item.selectedWeight) !== (selectedWeight?.weight || selectedWeight)) return false;
    if (selectedProduct.smallBitesWithWrap) {
      if ((item.selectedChocolateType?.id ?? item.selectedChocolateType) !== (selectedChocolateType?.id ?? selectedChocolateType)) return false;
      if ((item.selectedSmallBitesGram?.weight ?? item.selectedSmallBitesGram) !== (selectedSmallBitesGram?.weight ?? selectedSmallBitesGram)) return false;
    }
    if ((item.giftWrap || false) !== (giftWrap || false)) return false;
    return true;
  }) : null;
  const currentCartQuantity = cartItem ? cartItem.quantity : 0;

  // Stock (front-end cap) - Check localStorage override first
  const STOCK_STORAGE_KEY = 'ahnupha_product_stock';
  const stockLimit = useMemo(() => {
    if (!selectedProduct) return null;
    try {
      const savedStock = localStorage.getItem(STOCK_STORAGE_KEY);
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        // Allow 0: use saved value if key exists (including 0), else fallback
        if (Object.prototype.hasOwnProperty.call(parsed, selectedProduct.id)) {
          const val = Number(parsed[selectedProduct.id]);
          return Number.isFinite(val) ? val : null;
        }
      }
    } catch (error) {
      console.error('Error reading stock from localStorage:', error);
    }
    return Number.isFinite(Number(selectedProduct.stock)) ? Number(selectedProduct.stock) : null;
  }, [selectedProduct, stockRevision]);

  // Re-read stock when localStorage changes (e.g. admin set stock to 0) or window regains focus
  useEffect(() => {
    const onStorage = () => setStockRevision(r => r + 1);
    const onFocus = () => setStockRevision(r => r + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);
  const remainingStock = stockLimit !== null ? Math.max(0, stockLimit - currentCartQuantity) : null;
  const isLowStock = remainingStock !== null && remainingStock > 0 && remainingStock <= 3;
  const isOutOfStock = remainingStock !== null && remainingStock <= 0;

  // Handle add to cart - simple, no popups (for personalised bar include nameOnBar)
  const handleAddToCart = () => {
    if (!selectedProduct || isOutOfStock || selectedProduct.comingSoon) return;
    if (selectedProduct.baseOptions?.length && !selectedBase) {
      toast({
        title: 'Choose a base',
        description: 'Please select Dark or Milk chocolate.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedProduct.seedsOptions?.length) {
      const mandatorySeeds = selectedProduct.seedsOptions.filter(opt => opt.mandatory).map(opt => opt.id);
      const hasAllMandatory = mandatorySeeds.every(id => selectedSeeds.includes(id));
      if (!hasAllMandatory) {
        toast({
          title: 'Almond is required',
          description: 'Please include all mandatory dry fruits (Almond) before adding to cart.',
          variant: 'destructive',
        });
        return;
      }
    }
    const selectedSeedsLabels = (selectedProduct.seedsOptions || []).length
      ? (selectedSeeds || []).map(id => selectedProduct.seedsOptions.find(o => o.id === id)?.label || id).filter(Boolean)
      : [];
    const qty = selectedProduct.isPremiumCustom ? 1 : quantity;
    if (selectedProduct.twoNames) {
      const f = (firstName || '').trim().replace(/[^a-zA-Z\s]/g, '').slice(0, selectedProduct.nameOnBarMaxLength || 8);
      const s = (secondName || '').trim().replace(/[^a-zA-Z\s]/g, '').slice(0, selectedProduct.nameOnBarMaxLength || 8);
      if (!f || !s) {
        toast({
          title: 'Both names required',
          description: `Please enter first and second name (up to ${selectedProduct.nameOnBarMaxLength || 8} letters each).`,
          variant: 'destructive',
        });
        return;
      }
      addToCart({ ...selectedProduct, stock: stockLimit ?? selectedProduct.stock, firstName: f, secondName: s, nameOnBar: `${f} & ${s}`, selectedBase, selectedSeeds, selectedSeedsLabels, customInstructions: (customInstructions || '').trim(), giftWrap: !!giftWrap }, qty);
    } else if (selectedProduct.firstLettersCouple) {
      const l1 = (firstLetter1 || '').trim().slice(0, 1).toUpperCase();
      const l2 = (firstLetter2 || '').trim().slice(0, 1).toUpperCase();
      if (!l1 || !l2) {
        toast({ title: 'Both letters required', description: 'Please enter first letter of each name.', variant: 'destructive' });
        return;
      }
      addToCart({ ...selectedProduct, stock: stockLimit ?? selectedProduct.stock, firstLetters: `${l1}&${l2}`, selectedBase, customInstructions: (customInstructions || '').trim(), giftWrap: !!giftWrap }, qty);
    } else if (selectedProduct.birthdayWishes || selectedProduct.customTextOnChocolate) {
      const text = (customText || '').trim().slice(0, selectedProduct.customTextMaxLength || 30);
      if (!text) {
        toast({
          title: 'Text required',
          description: `Please enter your ${selectedProduct.birthdayWishes ? 'birthday wish' : 'custom text'} (up to ${selectedProduct.customTextMaxLength || 30} characters).`,
          variant: 'destructive',
        });
        return;
      }
      addToCart({ ...selectedProduct, stock: stockLimit ?? selectedProduct.stock, customText: text, selectedBase, customInstructions: (customInstructions || '').trim(), giftWrap: !!giftWrap }, qty);
    } else if (selectedProduct.customNameOnBar) {
      const trimmed = (nameOnBar || '').trim().slice(0, selectedProduct.nameOnBarMaxLength || 15);
      if (!trimmed) {
        toast({
          title: 'Name required',
          description: `Please enter the name to be printed on the bar (up to ${selectedProduct.nameOnBarMaxLength || 15} letters).`,
          variant: 'destructive',
        });
        return;
      }
      addToCart({ ...selectedProduct, stock: stockLimit ?? selectedProduct.stock, nameOnBar: trimmed, selectedBase, selectedSeeds, selectedSeedsLabels, customInstructions: (customInstructions || '').trim(), giftWrap: !!giftWrap }, qty);
    } else if (selectedProduct.weightOptions?.length && selectedWeight) {
      addToCart({ ...selectedProduct, price: selectedWeight.price, stock: stockLimit ?? selectedProduct.stock, selectedWeight, weight: selectedWeight.weight, giftWrap: !!giftWrap }, quantity);
    } else if (selectedProduct.smallBitesWithWrap) {
      const minPacks = selectedProduct.minOrderPacks || 20;
      if (quantity < minPacks) {
        toast({ title: 'Minimum order', description: `Minimum order is ${minPacks} packs. Please select at least ${minPacks} packs.`, variant: 'destructive' });
        return;
      }
      if (!selectedChocolateType || !selectedSmallBitesGram) {
        toast({ title: 'Selection required', description: 'Please choose chocolate type and size.', variant: 'destructive' });
        return;
      }
      const unitPrice = selectedSmallBitesGram.price;
      addToCart({
        ...selectedProduct,
        price: unitPrice,
        stock: stockLimit ?? selectedProduct.stock,
        selectedChocolateType,
        selectedSmallBitesGram,
        giftWrap: !!giftWrap
      }, quantity);
    } else if (selectedProduct.minOrderPacks) {
      const minPacks = selectedProduct.minOrderPacks || 14;
      if (quantity < minPacks) {
        toast({ title: 'Minimum order', description: `Minimum order is ${minPacks} packs. Please select at least ${minPacks} packs.`, variant: 'destructive' });
        return;
      }
      addToCart({ ...selectedProduct, stock: stockLimit ?? selectedProduct.stock, giftWrap: !!giftWrap }, quantity);
    } else {
      addToCart({ ...selectedProduct, stock: stockLimit ?? selectedProduct.stock, selectedBase, selectedSeeds, selectedSeedsLabels, customInstructions: selectedProduct.isPremiumCustom ? (customInstructions || '').trim() : undefined, giftWrap: !!giftWrap }, quantity);
    }
    setShowPostAddToCart(true);
  };

  // Review state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [averageRating, setAverageRating] = useState(selectedProduct?.rating || 0);

  // Fetch reviews when product is selected
  useEffect(() => {
    if (selectedProductId && supabase) {
      fetchReviews();
    } else {
      setReviews([]);
      setAverageRating(selectedProduct?.rating || 0);
    }
  }, [selectedProductId, supabase]);

  // Auto-update reviews: realtime subscription for this product's reviews
  useEffect(() => {
    if (!selectedProductId || !supabase) return;
    const channel = supabase
      .channel(`product_reviews:${selectedProductId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_reviews', filter: `product_id=eq.${selectedProductId}` },
        () => { fetchReviews(); }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedProductId, supabase]);

  // Refetch reviews when tab becomes visible (e.g. user returns or added review elsewhere)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedProductId && supabase) {
        fetchReviews();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [selectedProductId, supabase]);

  const fetchReviews = async () => {
    if (!selectedProductId || !supabase) return;
    
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', selectedProductId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        // If table doesn't exist, just set empty reviews
        if (error.code === '42P01') {
          setReviews([]);
          return;
        }
      } else {
        setReviews(data || []);
        // Calculate average rating
        if (data && data.length > 0) {
          const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
          setAverageRating(parseFloat(avg.toFixed(1)));
        } else {
          setAverageRating(selectedProduct?.rating || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Sign in to review",
        description: "Please sign in to leave a review.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!reviewComment.trim()) {
      toast({
        title: "Add your comment",
        description: "Please write a few words for your review.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingReview(true);
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: selectedProductId,
          user_id: currentUser.id,
          user_email: currentUser.email,
          user_name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Anonymous',
          rating: reviewRating,
          comment: reviewComment.trim()
        })
        .select();

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === '42P01') {
          toast({
            title: "Reviews unavailable",
            description: "Reviews aren't available right now. Please try again later.",
            variant: "destructive",
            duration: 5000
          });
          console.log(`
-- Run this SQL in Supabase SQL Editor to create the reviews table:
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all reviews
CREATE POLICY "Users can read reviews" ON product_reviews
  FOR SELECT USING (true);

-- Policy: Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
          `);
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to submit review. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      });

      // Reset form
      setReviewComment('');
      setReviewRating(5);
      
      // Refresh reviews
      await fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCloseDetail = () => {
    setSearchParams({});
  };

  const handleShareProduct = async () => {
    const url = window.location.href;
    const title = selectedProduct?.title || selectedProduct?.name || 'Chocolate';
    const text = `Check out ${title} on Ahnupha`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url, text });
        toast({ title: 'Shared', description: 'Thanks for sharing!' });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied', description: 'Product link copied to clipboard.' });
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          toast({ title: 'Link copied', description: 'Product link copied to clipboard.' });
        } catch {
          toast({ title: 'Share failed', description: 'Could not copy link.', variant: 'destructive' });
        }
      }
    }
  };

  const candySeo = useMemo(() => {
    const base = getSiteUrl();
    if (selectedProduct) {
      const raw = (selectedProduct.description || '').split('\n').filter(Boolean)[0] || selectedProduct.title;
      const plain = raw.replace(/\s+/g, ' ').trim().slice(0, 156);
      const desc =
        plain.length > 24
          ? `${plain}… Shop Ahnupha — handcrafted chocolate, India delivery.`
          : `Buy ${selectedProduct.title} online at Ahnupha. Handcrafted chocolates, free delivery 508213, Pan India.`;
      const path = `/candy-chocolate?product=${encodeURIComponent(selectedProduct.id)}`;
      const img =
        (selectedProduct.images && selectedProduct.images[selectedImageIndex]) ||
        selectedProduct.image;
      const canonical = `${base}${path}`;
      const ld = {
        '@type': 'Product',
        name: selectedProduct.title,
        description: desc.slice(0, 500),
        image: selectedProduct.images?.length ? selectedProduct.images : img ? [img] : [],
        brand: { '@type': 'Brand', name: 'Ahnupha' },
        sku: selectedProduct.id,
      };
      if (typeof selectedProduct.price === 'number' && selectedProduct.price > 0) {
        ld.offers = {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'INR',
          price: selectedProduct.price,
          availability: 'https://schema.org/InStock',
        };
      }
      return {
        title: `${selectedProduct.title} — Buy Online`,
        description: desc.slice(0, 160),
        path,
        image: img,
        type: 'website',
        jsonLd: ld,
      };
    }
    return {
      title: 'Premium Chocolates Shop',
      description:
        'Handcrafted chocolates, Kunafa bars, truffles & gift boxes. Free delivery pincode 508213; ₹100 outside Suryapet. Order from Ahnupha Bites.',
      path: '/candy-chocolate',
      image: undefined,
      type: 'website',
      jsonLd: null,
    };
  }, [selectedProduct, selectedImageIndex]);

  return (
    <>
      <SEO
        title={candySeo.title}
        description={candySeo.description}
        path={candySeo.path}
        image={candySeo.image}
        type={candySeo.type}
        jsonLd={candySeo.jsonLd}
      />
      {products.length > 0 && !selectedProduct && (
        <Helmet>
          <link rel="preload" as="image" href={products[0].image} fetchPriority="high" />
        </Helmet>
      )}

      <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative z-10">
          {selectedProduct ? (
            /* Product Detail View */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
              <Button
                variant="ghost"
                onClick={handleCloseDetail}
                className="mb-2 text-gray-600 hover:text-rose-500 hover:bg-rose-50/50 px-4 py-2 rounded-lg transition-all duration-200 font-medium group touch-target"
                aria-label="Go back to chocolates list"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="hidden sm:inline">Back to Chocolates</span>
                <span className="sm:hidden">Back</span>
              </Button>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 lg:gap-16">
                {/* Product Image */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative"
                >
                  <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-rose-100/50 shadow-2xl bg-white ring-4 ring-rose-50/50 transition-all duration-500 hover:shadow-3xl hover:ring-rose-100/70 hover:scale-[1.02] group">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50/0 to-amber-50/0 group-hover:from-rose-50/20 group-hover:to-amber-50/20 transition-all duration-500 z-10 pointer-events-none"></div>
                    {(() => {
                      const baseImages = selectedProduct.images && selectedProduct.images.length ? selectedProduct.images : [selectedProduct.image];
                      const boxImages = selectedProduct.id === 'prod-personalised-bar' && (selectedProduct.twoBarBoxImages || selectedProduct.twoBarBoxImage)
                        ? (selectedProduct.twoBarBoxImages || [selectedProduct.twoBarBoxImage]).filter(Boolean)
                        : [];
                      const galleryImages = [...baseImages, ...boxImages];
                      const currentSrc = galleryImages[selectedImageIndex] || galleryImages[0];
                      return (
                        <>
                          <img 
                            src={currentSrc} 
                            alt={selectedProduct.imageAlt || selectedProduct.title}
                            className={`w-full h-full ${selectedProduct.imageFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                            loading="eager"
                            decoding="async"
                            fetchpriority="high"
                            onError={(e) => {
                              if (!e.target.dataset.retried) {
                                e.target.dataset.retried = 'true';
                                e.target.src = `${currentSrc}?retry=${Date.now()}`;
                              } else {
                                e.target.src = 'https://via.placeholder.com/600x600/f3f4f6/9ca3af?text=Image+Not+Available';
                                e.target.onerror = null;
                              }
                            }}
                          />
                          {galleryImages.length > 1 && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
                              {galleryImages.map((img, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedImageIndex(idx)}
                                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${selectedImageIndex === idx ? 'border-rose-500 ring-2 ring-rose-300' : 'border-white/80 hover:border-rose-200'}`}
                                  aria-label={`View image ${idx + 1}`}
                                >
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Simple Round Badge on Image: Discount % or Special Offer */}
                    {selectedProduct.offerPrice && (selectedProduct.discount || selectedProduct.offerLabel) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
                        className="absolute top-6 left-6 z-20"
                      >
                        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full shadow-xl flex items-center justify-center">
                          <div className="text-center px-1">
                            {selectedProduct.discount ? (
                              <>
                                <div className="text-sm font-black leading-tight">{selectedProduct.discount}%</div>
                                <div className="text-xs font-bold leading-tight">OFF</div>
                              </>
                            ) : (
                              <div className="text-[10px] font-bold leading-tight">{selectedProduct.offerLabel}</div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Product Info */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {/* Title and Category */}
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="inline-block px-5 py-2 bg-gradient-to-r from-rose-50 to-amber-50 rounded-full text-xs font-bold text-rose-600 uppercase tracking-widest border-2 border-rose-100/70 shadow-sm backdrop-blur-sm"
                    >
                      {selectedProduct.category}
                    </motion.div>
                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.4 }}
                      className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight"
                    >
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600">
                        {selectedProduct.title}
                      </span>
                    </motion.h1>

                    {/* Stock Message - No numbers shown to users */}
                    {(stockLimit !== null || isOutOfStock) && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.42, duration: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-extrabold border-2 border-gray-300 bg-gray-100 text-gray-700 shadow-sm">
                            Out of stock
                          </span>
                        ) : isLowStock ? (
                          <motion.span
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold border shadow-sm bg-gradient-to-r from-red-50 to-rose-50 text-rose-700 border-rose-300"
                          >
                            <span className="animate-pulse">⚡</span>
                            Hurry, selling fast!
                          </motion.span>
                        ) : null}
                      </motion.div>
                    )}
                  </div>

                  {/* Rating and Price */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="flex items-center justify-between pb-6 border-b-2 border-gray-200/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex text-amber-400" aria-label={`Rating: ${averageRating > 0 ? averageRating.toFixed(1) : '0'} out of 5`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({averageRating > 0 ? averageRating.toFixed(1) : selectedProduct.rating}) · ({reviews.length || selectedProduct.reviews} reviews)
                      </span>
                    </div>
                    
                    {/* Enhanced Price Display */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      className="text-right"
                    >
                      {selectedProduct.offerPrice && (selectedProduct.discount || selectedProduct.offerLabel) ? (
                        <>
                          {/* Discount / Special Offer Badge */}
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                            className="inline-block mb-3"
                          >
                            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white text-sm font-extrabold px-4 py-2 rounded-full shadow-lg animate-pulse">
                              {selectedProduct.discount ? `🔥 ${selectedProduct.discount}% OFF` : `🔥 ${selectedProduct.offerLabel}`}
                            </span>
                          </motion.div>
                          
                          {/* Pricing Display */}
                          <div className="space-y-1">
                            <div className="text-lg text-gray-500 line-through">
                              <span className="font-medium">Original: </span>
                              ₹{selectedProduct.originalPrice.toLocaleString('en-IN')}
                            </div>
                            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-500 to-amber-600 drop-shadow-sm">
                              ₹{selectedProduct.offerPrice.toLocaleString('en-IN')}
                            </div>
                            {selectedProduct.weight && (
                              <div className="text-sm text-gray-600 font-semibold mt-2">
                                Weight: {selectedProduct.weight}
                              </div>
                            )}
                            <div className="text-sm text-green-600 font-semibold">
                              You save ₹{(selectedProduct.originalPrice - selectedProduct.offerPrice).toLocaleString('en-IN')}!
                            </div>
                          </div>
                        </>
                      ) : selectedProduct.comingSoon ? (
                        <div className="space-y-1">
                          <span className="text-3xl font-bold text-rose-600/90">Coming soon</span>
                          <p className="text-sm text-gray-500 mt-1">Prices will be available soon.</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
                            {selectedProduct.weightOptions?.length && selectedWeight ? (
                              `₹${selectedWeight.price.toLocaleString('en-IN')}`
                            ) : selectedProduct.smallBitesWithWrap && selectedSmallBitesGram ? (
                              `₹${selectedSmallBitesGram.price.toLocaleString('en-IN')}`
                            ) : selectedProduct.price !== undefined ? (
                              `₹${selectedProduct.price.toLocaleString('en-IN')}`
                            ) : (
                              <span className="text-green-600 font-bold">FREE</span>
                            )}
                          </span>
                          {(selectedProduct.weightOptions?.length && selectedWeight) ? (
                            <div className="text-sm text-gray-600 font-semibold mt-2">
                              Weight: {selectedWeight.weight}
                            </div>
                          ) : selectedProduct.smallBitesWithWrap && selectedSmallBitesGram ? (
                            <div className="text-sm text-gray-600 font-semibold mt-2">
                              {selectedChocolateType?.label} · {selectedSmallBitesGram.weight}
                            </div>
                          ) : selectedProduct.weight ? (
                            <div className="text-sm text-gray-600 font-semibold mt-2">
                              Weight: {selectedProduct.weight}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Customize your bar (personalised) or Quantity (other products) */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="bg-white p-6 md:p-8 rounded-2xl border-2 border-rose-100/80 shadow-lg space-y-8"
                  >
                    {selectedProduct.comingSoon ? (
                      <div className="py-4">
                        <p className="text-xl font-bold text-rose-600/90">Coming soon</p>
                        <p className="text-sm text-gray-500 mt-2">This product will be available soon. Check back later.</p>
                      </div>
                    ) : (
                    <>
                    {selectedProduct.giftWrapOnly ? (
                      <h3 className="text-xl font-bold text-gray-900 border-b border-rose-100 pb-3">Gift wrap</h3>
                    ) : selectedProduct.isPremiumCustom && !selectedProduct.minOrderPacks ? (
                      <h3 className="text-xl font-bold text-gray-900 border-b border-rose-100 pb-3">Customize your bar</h3>
                    ) : selectedProduct.smallBitesWithWrap ? (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 border-b border-rose-100 pb-3">Choose chocolate type & size</h3>
                        {selectedProduct.whatsappDesignContact && (
                          <div className="rounded-xl bg-amber-50 border-2 border-amber-200/80 p-4 space-y-2">
                            <p className="text-sm font-semibold text-gray-800">For custom wrap design, contact us on WhatsApp:</p>
                            <a
                              href={`https://wa.me/${STORE_WHATSAPP}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </div>
                        )}
                        {/* 1. Chocolate type */}
                        {selectedProduct.chocolateTypeOptions?.length > 0 && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">1. Choose chocolate type</label>
                            <div className="flex flex-wrap gap-2">
                              {selectedProduct.chocolateTypeOptions.map((opt) => {
                                const isActive = selectedChocolateType?.id === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedChocolateType(opt);
                                      setSelectedSmallBitesGram(opt.gramOptions?.[0] ?? null);
                                    }}
                                    className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 ${
                                      isActive ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-rose-200'
                                    }`}
                                    aria-pressed={isActive}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* 2. Gram size (based on chocolate type) */}
                        {selectedChocolateType?.gramOptions?.length > 0 && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">2. Choose size</label>
                            <div className="flex flex-wrap gap-2">
                              {selectedChocolateType.gramOptions.map((opt) => {
                                const isActive = selectedSmallBitesGram?.weight === opt.weight;
                                return (
                                  <button
                                    key={opt.weight}
                                    type="button"
                                    onClick={() => setSelectedSmallBitesGram(opt)}
                                    className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 ${
                                      isActive ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-rose-200'
                                    }`}
                                    aria-pressed={isActive}
                                  >
                                    <span className="block">{opt.weight}</span>
                                    <span className="block text-xs font-medium opacity-90 mt-0.5">₹{opt.price}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : selectedProduct.minOrderPacks ? (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 border-b border-rose-100 pb-3">Select packs</h3>
                        <div className="rounded-xl bg-amber-50 border-2 border-amber-200/80 p-4 space-y-2">
                          <p className="text-sm font-semibold text-gray-800">Send your design on WhatsApp or for more details call our number:</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href={`https://wa.me/${STORE_WHATSAPP}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              WhatsApp
                            </a>
                            <a
                              href={`tel:${STORE_PHONE.replace(/\s/g, '')}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              {STORE_PHONE}
                            </a>
                          </div>
                        </div>
                      </>
                    ) : (
                      <h3 className="text-xl font-bold text-gray-900 border-b border-rose-100 pb-3">Quantity</h3>
                    )}

                    {/* Weight options (e.g. Kunafa Chocolate 250g / 500g / 1kg) */}
                    {selectedProduct.weightOptions?.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Choose weight</label>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {selectedProduct.weightOptions.map((opt) => {
                            const isActive = selectedWeight?.weight === opt.weight;
                            return (
                              <button
                                key={opt.weight}
                                type="button"
                                onClick={() => setSelectedWeight(opt)}
                                className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 min-h-[44px] touch-target ${
                                  isActive ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-md' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-rose-200'
                                }`}
                                aria-pressed={isActive}
                              >
                                <span className="block">{opt.weight}</span>
                                <span className="block text-xs font-medium opacity-90 mt-0.5">₹{opt.price.toLocaleString('en-IN')}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 1. Base (or flowers/dry fruits for Birthday wishes) */}
                    {selectedProduct.baseOptions?.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{selectedProduct.baseOptionsLabel || '1. Choose your base'}</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.baseOptions.map((option) => {
                            const isActive = selectedBase?.id === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  setSelectedBase(option);
                                  if (typeof option.imageIndex === 'number') setSelectedImageIndex(option.imageIndex);
                                }}
                                className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 ${
                                  isActive ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-rose-200'
                                }`}
                                aria-pressed={isActive}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. Seeds */}
                    {selectedProduct.seedsOptions?.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">2. Dry fruits mix</label>
                        <p className="text-xs text-gray-500 mb-2">Almond is included. Pick up to 3 more.</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.seedsOptions.map((option) => {
                            const isSelected = selectedSeeds.includes(option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  if (option.mandatory) return;
                                  setSelectedSeeds((prev) => {
                                    const next = new Set(prev);
                                    const optionsMap = selectedProduct.seedsOptions.reduce((acc, opt) => { acc[opt.id] = opt; return acc; }, {});
                                    const optionalCount = Array.from(next).filter(id => !optionsMap[id]?.mandatory).length;
                                    if (next.has(option.id)) next.delete(option.id);
                                    else if (optionalCount >= 3) {
                                      toast({ title: 'Limit reached', description: 'Up to 3 extra dry fruits besides Almond.', variant: 'destructive' });
                                      return Array.from(next);
                                    } else next.add(option.id);
                                    return Array.from(next);
                                  });
                                }}
                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all focus:outline-none ${
                                  isSelected ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-rose-200'
                                } ${option.mandatory ? 'cursor-default opacity-90' : ''}`}
                                aria-pressed={isSelected}
                                aria-disabled={option.mandatory}
                              >
                                {option.label}{option.mandatory ? ' ✓' : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. Two names (Premium custom: first & second, max 8 each) */}
                    {selectedProduct.twoNames && (
                      <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">3. First name & Second name</label>
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <input
                              type="text"
                              maxLength={selectedProduct.nameOnBarMaxLength || 8}
                              value={firstName}
                              onChange={(e) => setFirstName((e.target.value || '').replace(/[^a-zA-Z\s]/g, '').slice(0, selectedProduct.nameOnBarMaxLength || 8))}
                              placeholder="First name"
                              className="w-full max-w-[180px] px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 placeholder:text-gray-400"
                              aria-label="First name on bar"
                            />
                            <p className="mt-1 text-xs text-gray-500">{ (firstName || '').length } / { selectedProduct.nameOnBarMaxLength || 8 }</p>
                          </div>
                          <div>
                            <input
                              type="text"
                              maxLength={selectedProduct.nameOnBarMaxLength || 8}
                              value={secondName}
                              onChange={(e) => setSecondName((e.target.value || '').replace(/[^a-zA-Z\s]/g, '').slice(0, selectedProduct.nameOnBarMaxLength || 8))}
                              placeholder="Second name"
                              className="w-full max-w-[180px] px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 placeholder:text-gray-400"
                              aria-label="Second name on bar"
                            />
                            <p className="mt-1 text-xs text-gray-500">{ (secondName || '').length } / { selectedProduct.nameOnBarMaxLength || 8 }</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3b. First letters couple */}
                    {selectedProduct.firstLettersCouple && (
                      <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">3. First letter of each name</label>
                        <div className="flex gap-4 items-center">
                          <input
                            type="text"
                            maxLength={1}
                            value={firstLetter1}
                            onChange={(e) => setFirstLetter1((e.target.value || '').replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase())}
                            placeholder=""
                            className="w-16 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                            aria-label="First letter"
                          />
                          <span className="text-gray-400 font-medium">&</span>
                          <input
                            type="text"
                            maxLength={1}
                            value={firstLetter2}
                            onChange={(e) => setFirstLetter2((e.target.value || '').replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase())}
                            placeholder=""
                            className="w-16 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                            aria-label="Second letter"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3c. Birthday wishes / Custom text */}
                    {(selectedProduct.birthdayWishes || selectedProduct.customTextOnChocolate) && (
                      <div>
                        <label htmlFor="custom-text-bar" className="block text-sm font-semibold text-gray-700 mb-2">
                          {selectedProduct.birthdayWishes ? 'Your birthday wish to' : 'Custom text on chocolate'}
                        </label>
                        <input
                          id="custom-text-bar"
                          type="text"
                          maxLength={selectedProduct.customTextMaxLength || 30}
                          value={customText}
                          onChange={(e) => setCustomText((e.target.value || '').slice(0, selectedProduct.customTextMaxLength || 30))}
                          placeholder=""
                          className="w-full max-w-sm px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 placeholder:text-gray-400"
                          aria-label="Custom text"
                        />
                        <p className="mt-1 text-xs text-gray-500">{ (customText || '').length } / { selectedProduct.customTextMaxLength || 30 }</p>
                      </div>
                    )}

                    {/* 3d. Single name on bar (one name, e.g. Dryfruits overloaded bar) */}
                    {selectedProduct.customNameOnBar && !selectedProduct.twoNames && (
                      <div>
                        <label htmlFor="name-on-bar" className="block text-sm font-semibold text-gray-700 mb-2">3. Name on bar</label>
                        <input
                          id="name-on-bar"
                          type="text"
                          maxLength={selectedProduct.nameOnBarMaxLength || 10}
                          value={nameOnBar}
                          onChange={(e) => setNameOnBar((e.target.value || '').replace(/[^a-zA-Z\s]/g, '').slice(0, selectedProduct.nameOnBarMaxLength || 10))}
                          placeholder=""
                          className="w-full max-w-sm px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 placeholder:text-gray-400"
                          aria-label="Name to print on chocolate bar (max 10 letters)"
                        />
                        <p className="mt-1 text-xs text-gray-500">{ (nameOnBar || '').length } / { selectedProduct.nameOnBarMaxLength || 10 } letters</p>
                      </div>
                    )}

                    {/* 4. Any instructions (optional) – hidden for wrap customization and giftWrapOnly */}
                    {selectedProduct.isPremiumCustom && !selectedProduct.minOrderPacks && !selectedProduct.giftWrapOnly && (
                      <div>
                        <label htmlFor="custom-instructions" className="block text-sm font-semibold text-gray-700 mb-2">4. Any instructions (optional)</label>
                        <textarea
                          id="custom-instructions"
                          value={customInstructions}
                          onChange={(e) => setCustomInstructions((e.target.value || '').slice(0, 500))}
                          placeholder="Optional"
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 placeholder:text-gray-400 resize-y min-h-[80px]"
                          aria-label="Any special instructions for your order"
                        />
                        <p className="mt-1 text-xs text-gray-500">{ (customInstructions || '').length } / 500 characters</p>
                      </div>
                    )}

                    {/* Gift wrap — Add ₹20 */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGiftWrap(!giftWrap)}
                        className={`flex items-center gap-3 w-full sm:w-auto px-4 py-3 rounded-xl border-2 transition-all text-left ${giftWrap ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:border-rose-200'}`}
                        aria-pressed={giftWrap}
                      >
                        <Package className={`w-5 h-5 shrink-0 ${giftWrap ? 'text-rose-600' : 'text-gray-500'}`} />
                        <span className="font-medium">Gift wrap</span>
                        <span className="text-sm text-gray-500">+ ₹20</span>
                        {giftWrap && <span className="ml-auto text-rose-600 font-semibold">Added</span>}
                      </button>
                    </div>

                    {/* Quantity – hidden for Premium Customize (except minOrderPacks e.g. wrap) */}
                    {(!selectedProduct.isPremiumCustom || selectedProduct.minOrderPacks) && (
                    <div className="pt-2 border-t border-rose-100">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        {selectedProduct.minOrderPacks ? `Select packs (min ${selectedProduct.minOrderPacks} packs)` : 'Select quantity'}
                      </p>
                      {selectedProduct.minOrderForDelivery && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                          Delivery: min {selectedProduct.minOrderForDelivery} pieces · Pickup: no minimum
                        </p>
                      )}
                      {(selectedProduct.minOrderPacks || selectedProduct.smallBitesWithWrap) && (
                        <p className="text-xs text-gray-600 mb-2">
                          ₹{(selectedProduct.smallBitesWithWrap && selectedSmallBitesGram
                            ? selectedSmallBitesGram.price
                            : (selectedProduct.pricePerPack ?? selectedProduct.price ?? 29)).toLocaleString('en-IN')} per pack
                        </p>
                      )}
                      {stockLimit !== null && isLowStock && !isOutOfStock && (
                        <p className="text-xs text-rose-600 font-medium mb-2 flex items-center gap-1"><span className="animate-pulse">⚡</span> Few left</p>
                      )}
                      <div className="flex items-center gap-4 md:gap-6">
                      <div className="flex items-center border-2 border-rose-300 rounded-xl overflow-hidden bg-white shadow-md">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(selectedProduct.minOrderPacks ? selectedProduct.minOrderPacks : 1, quantity - 1))}
                          disabled={quantity <= (selectedProduct.minOrderPacks || 1)}
                          className="p-3 md:p-4 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
                        </button>
                        <input
                          type="number"
                          min={selectedProduct.minOrderPacks || 1}
                          max={remainingStock !== null ? Math.max(selectedProduct.minOrderPacks || 1, remainingStock) : 99}
                          value={quantity}
                          onChange={(e) => {
                            const minQ = selectedProduct.minOrderPacks || 1;
                            const val = parseInt(e.target.value) || minQ;
                            const maxAllowed = remainingStock !== null ? Math.max(minQ, remainingStock) : 99;
                            setQuantity(Math.max(minQ, Math.min(maxAllowed, val)));
                          }}
                          className="w-20 md:w-24 text-center text-lg md:text-xl font-extrabold text-gray-900 border-0 focus:outline-none focus:ring-2 focus:ring-rose-200 bg-transparent touch-target min-h-[44px]"
                          aria-label="Quantity"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const minQ = selectedProduct.minOrderPacks || 1;
                            const maxAllowed = remainingStock !== null ? Math.max(minQ, remainingStock) : 99;
                            setQuantity(Math.min(maxAllowed, quantity + 1));
                          }}
                          disabled={remainingStock !== null ? quantity >= Math.max(selectedProduct.minOrderPacks || 1, remainingStock) : quantity >= 99}
                          className="p-3 md:p-4 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
                        </button>
                      </div>
                      <div className="flex-1">
                        {isOutOfStock ? (
                          <div className="bg-gray-900/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 font-bold">Out of stock</p>
                          </div>
                        ) : isLowStock ? (
                          <motion.div
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="bg-gradient-to-r from-red-50 to-rose-50 backdrop-blur-sm px-4 py-2 rounded-lg border border-rose-300"
                          >
                            <p className="text-sm text-rose-700 font-extrabold flex items-center gap-1">
                              <span className="animate-pulse">⚡</span>
                              Hurry, selling fast!
                            </p>
                          </motion.div>
                        ) : null}
                        {currentCartQuantity > 0 && (
                          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-rose-200">
                            <p className="text-sm text-gray-600 font-medium">
                              <span className="text-rose-600 font-bold">{currentCartQuantity}</span> already in cart
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    </div>
                    )}

                    {/* Add to Cart + Wishlist – right after quantity so no scrolling needed */}
                    <div className="mt-5 pt-5 border-t border-rose-100/60 space-y-4">
                      {(() => {
                        const qty = (selectedProduct.isPremiumCustom && !selectedProduct.minOrderPacks) ? 1 : quantity;
                        const unitPrice = selectedProduct.weightOptions?.length && selectedWeight
                          ? selectedWeight.price
                          : selectedProduct.smallBitesWithWrap && selectedSmallBitesGram
                            ? selectedSmallBitesGram.price
                            : (selectedProduct.offerPrice ?? selectedProduct.price ?? selectedProduct.originalPrice ?? 0);
                        const lineTotal = Number(unitPrice) * qty;
                        const unitLabel = selectedProduct.minOrderPacks ? 'packs' : (qty === 1 ? 'item' : 'items');
                        return !showPostAddToCart && !isOutOfStock && (
                          <p className="text-sm text-gray-600 font-medium">
                            Subtotal for {qty} {unitLabel}: <span className="font-bold text-gray-900">₹{lineTotal.toLocaleString('en-IN')}</span>
                          </p>
                        );
                      })()}
                      {showPostAddToCart ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden />
                            <p className="font-semibold text-base sm:text-lg">Added to your cart!</p>
                          </div>
                          <p className="text-sm text-gray-600">View cart or continue shopping.</p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <Button
                              onClick={() => navigate('/cart')}
                              className="h-12 sm:h-14 flex-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-base sm:text-lg shadow-lg rounded-xl"
                            >
                              <ShoppingCart className="w-5 h-5 mr-2" />
                              View Cart
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowPostAddToCart(false);
                                handleCloseDetail();
                              }}
                              className="h-12 sm:h-14 flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-base sm:text-lg rounded-xl"
                            >
                              Continue Shopping
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <Button
                              onClick={handleAddToCart}
                              disabled={isOutOfStock || (selectedProduct?.smallBitesWithWrap && (!selectedChocolateType || !selectedSmallBitesGram))}
                              className="flex-1 h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl font-bold tracking-wide disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-rose-600 disabled:hover:to-amber-600 touch-target"
                              aria-label={isOutOfStock ? 'Out of stock' : `Add ${quantity} ${selectedProduct.title} to cart`}
                            >
                              {isOutOfStock ? (
                                <>Out of stock</>
                              ) : (
                                <><ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart {(selectedProduct.minOrderPacks ? quantity : !selectedProduct.isPremiumCustom && quantity > 1) ? `(${quantity}${selectedProduct.minOrderPacks ? ' packs' : ''})` : ''}</>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => toggleWishlist(selectedProduct)}
                              className={`h-12 sm:h-14 px-4 sm:px-6 border-2 touch-target flex items-center justify-center gap-2 ${isWishlisted ? 'border-rose-500 text-rose-500 bg-rose-50' : 'border-gray-200'}`}
                              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                              <Heart className={`w-5 h-5 shrink-0 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                              <span className="hidden sm:inline text-sm font-medium">Save for later</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={handleShareProduct}
                              className="h-12 sm:h-14 px-4 sm:px-6 border-2 border-gray-200 touch-target flex items-center justify-center gap-2 hover:border-rose-300 hover:text-rose-600"
                              aria-label="Share product"
                            >
                              <Share2 className="w-5 h-5 shrink-0" />
                              <span className="hidden sm:inline text-sm font-medium">Share</span>
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" />
                            We're pleased to offer free delivery for 508213 (Suryapet). A nominal ₹100 shipping applies to other pincodes. Delivery within 48 hrs (Suryapet only).
                          </p>
                        </>
                      )}
                    </div>
                    </>
                    )}
                  </motion.div>

                  {/* Description (hidden for Premium Customize products) */}
                  {!selectedProduct.isPremiumCustom && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                      className="bg-white p-8 md:p-10 rounded-2xl border-2 border-rose-100/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-rose-200/70 backdrop-blur-sm"
                    >
                      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-md">
                          <Info className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">Description</span>
                      </h2>
                      <div className="pl-0 md:pl-[52px] space-y-4">
                        {selectedProduct.description.includes('\n') ? (
                          selectedProduct.description.split('\n').filter(p => p.trim()).map((paragraph, index) => (
                            <p key={index} className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg font-medium tracking-wide">
                              {paragraph.trim()}
                            </p>
                          ))
                        ) : (
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg font-medium tracking-wide">
                            {selectedProduct.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Reviews Section */}
                  <div className="bg-white p-8 rounded-2xl border-2 border-rose-100/50 shadow-xl mt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-md">
                        <Star className="w-5 h-5 text-white fill-white" />
                      </div>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">Reviews & Ratings</span>
                      <span className="text-sm font-semibold text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded-full">({reviews.length})</span>
                    </h2>

                    {/* Review Form */}
                    {currentUser ? (
                      <form onSubmit={handleSubmitReview} className="mb-6 p-6 bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl border-2 border-rose-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Your Rating</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setReviewRating(rating)}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    rating <= reviewRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label htmlFor="review-comment" className="text-sm font-medium text-gray-700 mb-2 block">Your Review</label>
                          <textarea
                            id="review-comment"
                            name="reviewComment"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience with this product..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                            rows="4"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={submittingReview || !reviewComment.trim()}
                          className="w-full h-12 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                        >
                          {submittingReview ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit Review
                            </>
                          )}
                        </Button>
                      </form>
                    ) : (
                      <div className="mb-6 p-6 bg-rose-50 rounded-xl border-2 border-rose-200/50 shadow-lg text-center">
                        <p className="text-sm text-gray-600 mb-3">Please login to write a review</p>
                        <Button
                          onClick={() => navigate('/login')}
                          variant="outline"
                          className="border-rose-300 text-rose-600 hover:bg-rose-100"
                        >
                          Login
                        </Button>
                      </div>
                    )}

                    {/* Reviews List */}
                    {loadingReviews ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                      </div>
                    ) : reviews.length === 0 ? null : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">
                                    {review.user_name || review.user_email?.split('@')[0] || 'Anonymous'}
                                  </span>
                                  <div className="flex text-amber-400">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            /* Product List View */
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center mb-10 md:mb-14 relative px-4 sm:px-6"
              >
                {/* Decorative top elements */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <div className="h-0.5 sm:h-1 w-12 sm:w-16 bg-gradient-to-r from-transparent via-rose-500 to-amber-500 rounded-full" />
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 shadow-lg" />
                  <div className="h-0.5 sm:h-1 w-12 sm:w-16 bg-gradient-to-l from-transparent via-amber-500 to-rose-500 rounded-full" />
                </div>

                {/* Main heading – smaller, responsive */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-5 tracking-tight leading-tight relative inline-block">
                  <span className="relative z-10">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 drop-shadow-sm">
                      Premium
                    </span>
                    {' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-rose-500 to-rose-600 drop-shadow-sm">
                      Chocolates
                    </span>
                  </span>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="absolute bottom-1 left-0 h-1.5 sm:h-2 bg-gradient-to-r from-rose-400/30 via-amber-400/30 to-rose-400/30 rounded-full -z-0"
                  />
                </h1>

                {/* Subtitle – clear, correct copy */}
                <div className="max-w-xl sm:max-w-2xl mx-auto">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-base sm:text-lg md:text-xl text-gray-600 font-medium leading-relaxed"
                  >
                    Handcrafted chocolates that turn simple moments into meaningful memories.
                  </motion.p>
                </div>

                {/* Decorative bottom */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-5">
                  <div className="h-0.5 sm:h-1 w-12 sm:w-16 bg-gradient-to-r from-transparent via-amber-500 to-rose-500 rounded-full" />
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 shadow-lg" />
                  <div className="h-0.5 sm:h-1 w-12 sm:w-16 bg-gradient-to-l from-transparent via-rose-500 to-amber-500 rounded-full" />
                </div>
              </motion.div>

              {/* Section: Chocolates – clear heading + subtext */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="px-4 sm:px-6 lg:px-8"
              >
                <div className="rounded-2xl bg-gradient-to-br from-rose-50/90 via-white to-rose-50/80 border-2 border-rose-200/60 shadow-lg shadow-rose-100/40 p-6 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-200/25 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-md mb-4">
                    <Gift className="w-3.5 h-3.5" />
                    Ready to gift
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 drop-shadow-sm">
                      Chocolates
                    </span>
                  </h2>
                  <div className="h-1 w-16 sm:w-20 rounded-full bg-gradient-to-r from-rose-400 to-amber-400 mb-4" />
                  <p className="text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
                    Ready-to-gift collection. Pick your favourite, choose quantity, and add to cart.
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
                >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.1 * index,
                      duration: 0.5,
                      ease: "easeOut"
                    }}
                    whileHover={{ y: -8 }}
                    className="h-full"
                  >
                  <ProductCard 
                    product={product} 
                    priority={index < 3} 
                  />
                  </motion.div>
                ))}
                </motion.div>
              </motion.section>
            </>
          )}
        </div>

        {/* Back to Top Button */}
        {showBackToTop && !selectedProduct && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-24 md:bottom-8 md:right-28 z-[9999] w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 border-4 border-white/50 backdrop-blur-sm"
            aria-label="Back to top"
            style={{ boxShadow: '0 10px 40px rgba(225, 29, 72, 0.4), 0 0 20px rgba(251, 146, 60, 0.3)' }}
          >
            <ArrowUp className="w-7 h-7 md:w-8 md:h-8" />
          </motion.button>
        )}
      </div>
    </>
  );
};

export default CandyChocolate;