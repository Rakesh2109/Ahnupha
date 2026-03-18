import React, { useState, useEffect, useRef, useMemo } from 'react';
import SEO from '@/components/SEO';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, ShoppingBag, Lock, Store, MapPin, Phone, CheckCircle2, Sparkles, Heart, ArrowRight, Loader2, Tag, X, Gift, Info, HelpCircle, AlertCircle, Calendar, Clock, ChevronDown } from 'lucide-react';
import { searchData } from '@/lib/searchData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { FunctionsHttpError } from '@supabase/supabase-js';

// ===== STORE INFORMATION =====
const STORE_INFO = {
  name: "Ahnupha",
  phone: "+919515404195",
  whatsapp: "919515404195", // WhatsApp number (without + sign for URL)
  address: "1-6-141/43/A2/C, Sri Ram nagar, Near new vision school, Suryapet, 508213",
  businessHours: "Mon-Sat: 9:00 AM - 6:00 PM",
  email: "info@ahnupha.com"
};
// =============================

// ===== SHIPPING: SURYAPET LOCAL = FREE, OTHERWISE ₹100 =====
const DELIVERY_CHARGE_OUTSIDE_SURYAPET = 100; // ₹100 when not Suryapet local
const getShippingCharge = (deliveryType, suryapetLocal) => {
  if (deliveryType !== 'delivery') return 0;
  return suryapetLocal ? 0 : DELIVERY_CHARGE_OUTSIDE_SURYAPET;
};

// Indian states for delivery address
const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];
const normalizeZip = (zip) => String(zip ?? '').trim();

// Phone: digits only, 10–15 digits (India 10, international up to 15)
const getPhoneDigits = (phone) => String(phone ?? '').replace(/\D/g, '');
const isValidPhone = (phone) => {
  const digits = getPhoneDigits(phone);
  return digits.length >= 10 && digits.length <= 15;
};
// Email: standard format (local@domain.tld)
const isValidEmail = (email) => {
  const trimmed = String(email ?? '').trim();
  return trimmed.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};
// =================================================

// ===== ORDER NUMBER: sequential (0001, 0002, ...) from DB; fallback if RPC missing =====
const ORDER_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generateOrderNumberFallback = () => {
  let s = '';
  for (let i = 0; i < 4; i++) s += ORDER_CHARS[Math.floor(Math.random() * ORDER_CHARS.length)];
  return s;
};
// =======================================================================================

// ===== ADMIN EMAIL =====
const ADMIN_EMAIL = "info@ahnupha.com";
// ========================

// Razorpay Key ID (public, safe in frontend – secret is in Supabase Edge Function only)
const RAZORPAY_KEY_ID = 'rzp_live_SCxeorHKCuq9F4';

// ===== PLATFORM FEE (customer pays) – GST removed =====
const PLATFORM_FEE_PERCENT = 0;   // e.g. 2 for 2%
// ==============================================

const STOCK_STORAGE_KEY = 'ahnupha_product_stock';
const PRODUCT_STOCK_TABLE = 'product_stock';

const Checkout = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart, cartTotal, clearCart, addToCart, removeFromCart } = useCart();
  const { currentUser, session, supabase, isLoading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const payOrderId = searchParams.get('o');
  const payRpOrderId = searchParams.get('r');
  const isPayFromQr = Boolean(payOrderId && payRpOrderId);
  const [payFromQrStatus, setPayFromQrStatus] = useState(isPayFromQr ? 'opening' : 'idle'); // 'idle' | 'opening' | 'success' | 'error'
  const [payFromQrError, setPayFromQrError] = useState('');
  const payFromQrOpened = useRef(false);

  // Return from Razorpay full-page redirect: show success or failure and clear URL
  const orderSuccessFromUrl = searchParams.get('order_success') === '1';
  const orderNumberFromUrl = searchParams.get('order_number') || '';
  const paymentFailedFromUrl = searchParams.get('payment_failed') === '1';
  const failedOrderIdFromUrl = searchParams.get('order_id') || '';
  useEffect(() => {
    if (orderSuccessFromUrl && orderNumberFromUrl) {
      setOrderSuccess(true);
      setOrderNumber(orderNumberFromUrl);
      clearCart();
      setSearchParams({});
    }
  }, [orderSuccessFromUrl, orderNumberFromUrl, clearCart, setSearchParams]);
  const [showPaymentFailedBanner, setShowPaymentFailedBanner] = useState(false);
  const paymentFailedHandledRef = useRef(false);
  useEffect(() => {
    if (!paymentFailedFromUrl || paymentFailedHandledRef.current) return;
    paymentFailedHandledRef.current = true;
    setShowPaymentFailedBanner(true);
    const orderId = failedOrderIdFromUrl?.trim();
    if (orderId && supabase && addToCart) {
      supabase.from('orders').select('items').eq('id', orderId).single()
        .then(({ data: order, error }) => {
          if (!error && order?.items?.length) {
            order.items.forEach((item) => {
              const qty = Math.max(1, Number(item.quantity) || 1);
              addToCart({ id: item.id, title: item.title || item.name, name: item.name || item.title, price: item.price, nameOnBar: item.nameOnBar, customInstructions: item.customInstructions, selectedBase: item.selectedBase, selectedSeedsLabels: item.selectedSeedsLabels }, qty);
            });
            toast({ title: 'Payment failed', description: 'Items have been added back to your cart. You can try again.', variant: 'destructive' });
          } else {
            toast({ title: 'Payment failed or was cancelled', description: 'Please try again or use another payment method.', variant: 'destructive' });
          }
        })
        .catch(() => toast({ title: 'Payment failed or was cancelled', description: 'Please try again or use another payment method.', variant: 'destructive' }))
        .finally(() => setSearchParams({}));
    } else {
      toast({ title: 'Payment failed or was cancelled', description: 'Please try again or use another payment method.', variant: 'destructive' });
      setSearchParams({});
    }
  }, [paymentFailedFromUrl, failedOrderIdFromUrl, supabase, addToCart, setSearchParams, toast]);

  const [loading, setLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' or 'pickup'
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Details, 2: Payment
  
  // Form State - MUST be declared before any early returns
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    district: '',
    state: '',
    zip: '',
    suryapetLocal: false,
    phone: '',
    orderInstructions: '',
    pickupDateTime: '',
  });

  // Form validation errors - inline field errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [razorpayKeyId] = useState(RAZORPAY_KEY_ID);
  const isRazorpayAvailable = Boolean(RAZORPAY_KEY_ID);
  
  // Clear field error when user starts typing
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const [paymentMethod, setPaymentMethod] = useState(isRazorpayAvailable ? 'Razorpay' : 'UPI');
  const [payQrUrl, setPayQrUrl] = useState(''); // After starting payment: URL for QR (desktop only)
  const paymentStartedAtRef = useRef(null);   // Timestamp when Pay was clicked (for 15-min limit)
  const pendingOrderRef = useRef({ id: null, order_number: null });
  const PAYMENT_TIME_LIMIT_MS = 15 * 60 * 1000; // 15-minute payment window
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(null); // seconds left, null when not in payment flow
  const [isMobileView, setIsMobileView] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [paymentNotice, setPaymentNotice] = useState(null); // { title, description, variant }
  
  // ===== Coupon Code =====
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const paymentSectionRef = useRef(null);
  const [highlightPayment, setHighlightPayment] = useState(false);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const subtotal = Number(cartTotal) || 0;
    if (appliedCoupon === 'Welcome10') {
      return Math.round(subtotal * 0.1); // 10% discount
    }
    return 0;
  }, [appliedCoupon, cartTotal]);

  // Pickup: 24 hours from now, store hours 8 AM – 8 PM. Refresh "now" every minute so min date is current.
  const [pickupNow, setPickupNow] = useState(() => Date.now());
  useEffect(() => {
    if (deliveryType !== 'pickup') return;
    const t = setInterval(() => setPickupNow(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, [deliveryType]);

  const PICKUP_START = 8;   // 8 AM
  const PICKUP_END = 20;    // 8 PM (inclusive)
  const PICKUP_STEP_MIN = 30;

  // First allowed pickup moment: 24h from now, clamped to store hours
  const minPickupMoment = useMemo(() => {
    const d = new Date(pickupNow + 24 * 60 * 60 * 1000);
    const h = d.getHours();
    const min = d.getMinutes();
    if (h < PICKUP_START) {
      d.setHours(PICKUP_START, 0, 0, 0);
    } else if (h > PICKUP_END || (h === PICKUP_END && (min > 0))) {
      d.setDate(d.getDate() + 1);
      d.setHours(PICKUP_START, 0, 0, 0);
    } else {
      const step = PICKUP_STEP_MIN;
      const totalMin = h * 60 + min;
      const rounded = Math.ceil(totalMin / step) * step;
      d.setHours(Math.floor(rounded / 60), rounded % 60, 0, 0);
    }
    return d.getTime();
  }, [pickupNow]);

  const minPickupDateStr = useMemo(() => {
    const d = new Date(minPickupMoment);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [minPickupMoment]);

  const minPickupTimeStr = useMemo(() => {
    const d = new Date(minPickupMoment);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, [minPickupMoment]);

  // All time slots in store hours (8 AM – 8 PM), 30-min steps
  const allPickupTimeSlots = useMemo(() => {
    const slots = [];
    for (let h = PICKUP_START; h <= PICKUP_END; h++) {
      for (let m = 0; m < 60; m += PICKUP_STEP_MIN) {
        if (h === PICKUP_END && m > 0) break;
        const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h < 12 ? 'AM' : 'PM';
        slots.push({ value, label: `${hour12}:${String(m).padStart(2, '0')} ${ampm}` });
      }
    }
    return slots;
  }, []);

  const getPickupTimeOptionsForDate = (dateStr) => {
    if (!dateStr) return allPickupTimeSlots;
    if (dateStr < minPickupDateStr) return allPickupTimeSlots;
    if (dateStr > minPickupDateStr) return allPickupTimeSlots;
    return allPickupTimeSlots.filter(({ value }) => value >= minPickupTimeStr);
  };

  const pickupDateValue = formData.pickupDateTime ? formData.pickupDateTime.slice(0, 10) : '';
  const pickupTimeValue = formData.pickupDateTime ? formData.pickupDateTime.slice(11, 16) : '';
  const pickupTimeOptions = getPickupTimeOptionsForDate(pickupDateValue);

  const setPickupDate = (newDate) => {
    const time = pickupTimeValue && pickupTimeOptions.some(o => o.value === pickupTimeValue) ? pickupTimeValue : (pickupTimeOptions[0]?.value || minPickupTimeStr);
    setFormData(prev => ({ ...prev, pickupDateTime: newDate ? `${newDate}T${time}:00` : '' }));
    if (fieldErrors.pickupDateTime) setFieldErrors(prev => ({ ...prev, pickupDateTime: '' }));
  };

  const setPickupTime = (newTime) => {
    const date = pickupDateValue || minPickupDateStr;
    setFormData(prev => ({ ...prev, pickupDateTime: date ? `${date}T${newTime}:00` : '' }));
    if (fieldErrors.pickupDateTime) setFieldErrors(prev => ({ ...prev, pickupDateTime: '' }));
  };

  // Check if step 1 (details) is complete – delivery = address etc; pickup = contact + pickup date/time >= 24h
  const isStep1Complete = useMemo(() => {
    const hasContactInfo = formData.firstName?.trim() && isValidPhone(formData.phone) && (formData.email === '' || isValidEmail(formData.email));
    const hasValidZip = formData.zip?.trim() && /^[0-9]{5,6}$/.test(normalizeZip(formData.zip));
    const hasDeliveryInfo = deliveryType === 'delivery' &&
      formData.address?.trim() && formData.city?.trim() && formData.district?.trim() && formData.state?.trim() && hasValidZip;
    const hasPickupInfo = deliveryType === 'pickup' && formData.pickupDateTime && (() => {
      const sel = new Date(formData.pickupDateTime);
      const t = sel.getHours() * 60 + sel.getMinutes();
      return sel.getTime() >= minPickupMoment && t >= PICKUP_START * 60 && t <= PICKUP_END * 60;
    })();
    return hasContactInfo && (hasDeliveryInfo || hasPickupInfo);
  }, [formData, deliveryType, minPickupMoment]);

  // Scan-to-pay: when checkout is opened with ?o=orderId&r=razorpayOrderId, open Razorpay and confirm on success (all in Checkout, no separate page)
  useEffect(() => {
    if (!isPayFromQr || !payOrderId || !payRpOrderId || !razorpayKeyId || !supabase || payFromQrOpened.current) return;
    payFromQrOpened.current = true;

    const run = async () => {
      try {
        const loadScript = () => new Promise((resolve, reject) => {
          if (window.Razorpay) { resolve(); return; }
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Script failed'));
          document.body.appendChild(s);
        });
        await loadScript();

        const options = {
          key: razorpayKeyId,
          order_id: payRpOrderId,
          name: STORE_INFO.name,
          description: 'Order payment',
          prefill: { email: (typeof window !== 'undefined' && document.querySelector('input[name="email"]')) ? document.querySelector('input[name="email"]')?.value : undefined, contact: (typeof window !== 'undefined' && document.querySelector('input[name="phone"]')) ? document.querySelector('input[name="phone"]')?.value?.replace(/\D/g, '').slice(-10) : undefined },
          // Payment methods: only UPI and Debit Card. Wallet, Netbanking, Credit Card commented out / not included.
          config: {
            display: {
              blocks: {
                upi_and_card: {
                  name: 'UPI or Debit Card',
                  instruments: [
                    { method: 'upi' },
                    { method: 'card', types: ['debit'] }
                    // { method: 'wallet' },      // commented out – not offered
                    // { method: 'netbanking' }, // commented out – not offered
                    // { method: 'card', types: ['credit'] } // commented out – not offered
                  ]
                }
              },
              sequence: ['block.upi_and_card'],
              preferences: { show_default_blocks: false }
            }
          },
          handler: async (res) => {
            try {
              const { data, error } = await supabase.functions.invoke('confirm-razorpay-order', {
                body: {
                  order_id: payOrderId,
                  razorpay_order_id: res.razorpay_order_id,
                  razorpay_payment_id: res.razorpay_payment_id,
                  razorpay_signature: res.razorpay_signature
                }
              });
              if (error || !data?.success) {
                setPayFromQrStatus('error');
                setPayFromQrError(data?.error || 'Payment verification failed');
                return;
              }
              setOrderNumber(data.order_number || '');
              setOrderSuccess(true);
              setPayFromQrStatus('success');
            } catch (e) {
              setPayFromQrStatus('error');
              setPayFromQrError(e?.message || 'Something went wrong');
            }
          },
          modal: { ondismiss: () => { setPayFromQrStatus('error'); setPayFromQrError('Payment cancelled'); } }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (e) {
        setPayFromQrStatus('error');
        setPayFromQrError(e?.message || 'Could not open payment');
      }
    };

    run();
  }, [isPayFromQr, payOrderId, payRpOrderId, razorpayKeyId, supabase]);

  const handleContinueToPayment = () => {
    const errors = {};
    if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
    if (formData.email?.trim() && !isValidEmail(formData.email)) errors.email = 'Please enter a valid email address';
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    else if (!isValidPhone(formData.phone)) errors.phone = 'Please enter a valid 10-digit phone number';
    if (deliveryType === 'delivery') {
      if (!formData.address?.trim()) errors.address = 'Address is required';
      if (!formData.city?.trim()) errors.city = 'City is required';
      if (!formData.district?.trim()) errors.district = 'District is required';
      if (!formData.state?.trim()) errors.state = 'State is required';
      if (!formData.zip?.trim()) errors.zip = 'Postal Code (PIN) is required';
      else if (!/^[0-9]{5,6}$/.test(normalizeZip(formData.zip))) errors.zip = 'Please enter a valid 5–6 digit pincode';
      // Delivery min order check for products with minOrderForDelivery
      const productById = (id) => searchData.find((p) => p.type === 'Product' && p.id === id);
      for (const item of cart) {
        const product = productById(item.id);
        const minDelivery = product?.minOrderForDelivery;
        if (minDelivery && (item.quantity || 0) < minDelivery) {
          toast({
            title: 'Minimum order for delivery',
            description: `${product.title} requires minimum ${minDelivery} pieces for delivery. Pickup has no minimum.`,
            variant: 'destructive'
          });
          return;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: "Please complete all required fields",
        description: "Fill in all the required information to continue.",
        variant: "destructive"
      });
      return;
    }

    setCheckoutStep(2);
    // Scroll to payment section
    setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    const currentCartTotal = Number(cartTotal) || 0;
    
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    // Check minimum cart value requirement (₹4000)
    if (currentCartTotal < 4000) {
      setCouponError(`Coupon can only be applied on orders of ₹4,000 or above. Your cart total is ₹${currentCartTotal.toLocaleString('en-IN')}.`);
      toast({
        title: "Minimum Order Required",
        description: `Coupon requires minimum order of ₹4,000. Add more items to your cart.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (code === 'WELCOME10') {
      setAppliedCoupon('Welcome10');
      toast({
        title: "🎉 Coupon Applied!",
        description: "You've got 10% off on your order!",
        duration: 3000,
      });
      
      // Scroll to payment section after applying coupon
      setTimeout(() => {
        if (paymentSectionRef.current) {
          // Highlight the payment section
          setHighlightPayment(true);
          
          paymentSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          
          // Remove highlight after animation
          setTimeout(() => {
            setHighlightPayment(false);
          }, 2000);
        }
      }, 300);
    } else {
      setCouponError('Invalid coupon code');
      toast({
        title: "Invalid Coupon",
        description: "The coupon code you entered is not valid.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your order.",
      duration: 2000,
    });
  };

  // ===== Loyalty offer (Chocolate) – count from profile when logged in, else localStorage =====
  const LOYALTY_KEY = 'ahnupha_chocolate_orders_completed';
  const [loyaltyChoice, setLoyaltyChoice] = useState(null); // '200' | '250' | null
  const [profileChocoCount, setProfileChocoCount] = useState(null); // null = not loaded, number = from profiles.chocolate_orders_completed

  React.useEffect(() => {
    if (!currentUser?.id || !supabase) return;
    supabase.from('profiles').select('chocolate_orders_completed').eq('id', currentUser.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setProfileChocoCount(0);
          return;
        }
        const n = data?.chocolate_orders_completed;
        setProfileChocoCount(Number.isFinite(n) ? Math.max(0, n) : 0);
      })
      .catch(() => setProfileChocoCount(0));
  }, [currentUser?.id, supabase]);

  const chocolateInCart = useMemo(
    () => (cart || []).some((item) => (item?.category || '').toLowerCase() === 'chocolate'),
    [cart]
  );

  const chocolateOrdersCompleted = useMemo(() => {
    if (currentUser && profileChocoCount !== null) return profileChocoCount;
    try {
      const raw = localStorage.getItem(LOYALTY_KEY);
      const n = parseInt(raw || '0', 10);
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    } catch {
      return 0;
    }
  }, [currentUser, profileChocoCount]);

  const is10thChocolateOrder = chocolateInCart && ((chocolateOrdersCompleted + 1) % 10 === 0);
  const loyaltyDiscount = useMemo(() => {
    if (!is10thChocolateOrder) return 0;
    if (loyaltyChoice === '200') return 200;
    if (loyaltyChoice === '250') return 250;
    return 0;
  }, [is10thChocolateOrder, loyaltyChoice]);

  const shippingCharge = useMemo(
    () => getShippingCharge(deliveryType, formData.suryapetLocal),
    [deliveryType, formData.suryapetLocal]
  );

  const { afterDiscount, platformFee, payableTotal } = useMemo(() => {
    const after = Math.max(0, (Number(cartTotal) || 0) - loyaltyDiscount - couponDiscount);
    const platform = PLATFORM_FEE_PERCENT ? Math.round(after * (PLATFORM_FEE_PERCENT / 100)) : 0;
    const shipping = getShippingCharge(deliveryType, formData.suryapetLocal);
    return { afterDiscount: after, platformFee: platform, payableTotal: after + platform + shipping };
  }, [cartTotal, loyaltyDiscount, couponDiscount, deliveryType, formData.suryapetLocal]);

  // Update form data when user loads
  React.useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser?.user_metadata?.name?.split(' ')[0] || '',
        lastName: currentUser?.user_metadata?.name?.split(' ')[1] || '',
        email: currentUser?.email || '',
        address: '',
        city: '',
        district: '',
        state: '',
        zip: '',
        suryapetLocal: false,
        phone: currentUser?.phone || '',
        orderInstructions: '',
        pickupDateTime: '',
      });
    }
  }, [currentUser]);

  // Clear pickup date/time when switching to delivery; when switching to pickup, default to first allowed slot
  useEffect(() => {
    if (deliveryType === 'delivery') {
      setFormData(prev => ({ ...prev, pickupDateTime: '' }));
      if (fieldErrors.pickupDateTime) setFieldErrors(prev => ({ ...prev, pickupDateTime: '' }));
    }
  }, [deliveryType]);

  // When user selects Pickup and field is empty, default to first allowed date & time (user-friendly)
  useEffect(() => {
    if (deliveryType !== 'pickup' || formData.pickupDateTime) return;
    setFormData(prev => ({
      ...prev,
      pickupDateTime: `${minPickupDateStr}T${minPickupTimeStr}:00`
    }));
  }, [deliveryType, minPickupDateStr, minPickupTimeStr]);

  // Detect mobile viewport – on phone we don't show QR (user pays on same device)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobileView(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // 15-minute payment countdown – when time's up, clear and allow Pay again
  useEffect(() => {
    if (!payQrUrl || paymentStartedAtRef.current == null) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - paymentStartedAtRef.current;
      const left = Math.max(0, Math.ceil((PAYMENT_TIME_LIMIT_MS - elapsed) / 1000));
      setPaymentTimeLeft(left);
      if (left <= 0) {
        setPayQrUrl('');
        setPaymentTimeLeft(null);
        paymentStartedAtRef.current = null;
        toast({ title: 'Payment time expired', description: 'Please click Pay again to continue.', variant: 'destructive' });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [payQrUrl, toast]);

  // Guest checkout option - show prompt but allow checkout
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  
  // Allow guest checkout – users can checkout without login; logged-in users can track orders

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  // Prevent admin from placing orders (only when logged in as admin)
  if (currentUser && isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-rose-100/50 max-w-md text-center">
          <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Account</h1>
          <p className="text-gray-600 mb-6">
            Admin accounts cannot place orders. Please use a customer account to make purchases.
          </p>
          <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }


  const formatOrderMessage = () => {
    let message = `🛒 *New Order - #${orderNumber || ''}*\n\n`;
    
    // Customer Information
    message += `*Customer Details:*\n`;
    message += `Name: ${formData.firstName} ${formData.lastName || ''}\n`;
    message += `Email: ${formData.email}\n`;
    message += `Phone: ${formData.phone}\n\n`;
    
    // Delivery Type
    message += `*Delivery Type:* ${deliveryType === 'delivery' ? '🚚 Home Delivery' : '🏪 Store Pickup'}\n\n`;
    
    if (deliveryType === 'delivery') {
      message += `*Delivery Address:*\n`;
      message += `${formData.address}\n`;
      message += `${[formData.city, formData.district, formData.state].filter(Boolean).join(', ')}${formData.zip?.trim() ? ` ${formData.zip.trim()}` : ''}\n\n`;
    } else {
      message += `*Pickup Location:*\n`;
      message += `${STORE_INFO.address}\n`;
      if (formData.pickupDateTime) {
        const pickupStr = new Date(formData.pickupDateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        message += `*Pickup Date & Time:* ${pickupStr}\n`;
      }
      message += `\n`;
    }
    
    // Order Items
    message += `*Order Items:*\n`;
    cart.forEach((item, index) => {
      const itemLineTotal = (item.price || 0) * (item.quantity || 0) + (item.giftWrap ? 20 * (item.quantity || 0) : 0);
      message += `${index + 1}. ${item.title}${item.nameOnBar ? ` (Name on bar: ${item.nameOnBar})` : ''}${item.giftWrap ? ' [Gift wrap +₹20]' : ''}${item.customInstructions ? ` (Instructions: ${item.customInstructions})` : ''}\n`;
      message += `   Qty: ${item.quantity} × ₹${(item.price || 0).toLocaleString('en-IN')}${item.giftWrap ? ` + Gift wrap ₹${(20 * (item.quantity || 0)).toLocaleString('en-IN')}` : ''} = ₹${itemLineTotal.toLocaleString('en-IN')}\n`;
    });
    message += `\n`;
    
    // Order Summary
    message += `*Order Summary:*\n`;
    message += `Subtotal: ₹${cartTotal.toLocaleString('en-IN')}\n`;
    message += `Shipping: ${shippingCharge === 0 ? 'Free' : `₹${shippingCharge.toLocaleString('en-IN')}`}\n`;
    if (couponDiscount > 0) {
      message += `Coupon Discount (${appliedCoupon}): -₹${couponDiscount.toLocaleString('en-IN')}\n`;
    }
    if (loyaltyDiscount > 0) {
      message += `Loyalty Reward: -₹${loyaltyDiscount.toLocaleString('en-IN')}\n`;
    }
    message += `*Grand Total: ₹${payableTotal.toLocaleString('en-IN')}*\n\n`;
    
    // Payment Details
    message += `*Payment Details:*\n`;
    message += `Payment Method: UPI (pending – confirm when received)\n\n`;
    
    // Order Instructions
    if (formData.orderInstructions) {
      message += `*Special Instructions:*\n`;
      message += `${formData.orderInstructions}\n\n`;
    }
    
    message += `---\n`;
    message += `Order placed on: ${new Date().toLocaleString('en-IN')}\n`;
    message += `Please confirm this order.`;
    
    return message;
  };


  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Please add items before checking out.", variant: "destructive" });
      return;
    }
    
    if (is10thChocolateOrder && !loyaltyChoice) {
      toast({
        title: "Choose your 10th order reward",
        description: "Get ₹200 off or get a free chocolate worth ₹250 on your 10th order. Choose one before confirming.",
        variant: "destructive"
      });
      return;
    }
    
    // Clear previous errors
    setFieldErrors({});
    let hasErrors = false;
    const newErrors = {};

    // Validation based on delivery type with inline errors
    if (deliveryType === 'delivery') {
      const requiredFields = ['firstName', 'address', 'city', 'district', 'state', 'zip', 'phone'];

      requiredFields.forEach(field => {
        if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
          newErrors[field] = field === 'zip' ? 'Postal Code (PIN) is required' : 'This field is required';
          hasErrors = true;
        }
      });

      if (formData.email?.trim() && !isValidEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
        hasErrors = true;
      }

      if (formData.phone && !isValidPhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
        hasErrors = true;
      }

      if (formData.zip?.trim() && !/^[0-9]{5,6}$/.test(normalizeZip(formData.zip))) {
        newErrors.zip = 'Please enter a valid 5–6 digit pincode';
        hasErrors = true;
      }

      // Delivery min order for products with minOrderForDelivery
      const productById = (id) => searchData.find((p) => p.type === 'Product' && p.id === id);
      for (const item of cart) {
        const product = productById(item.id);
        const minDelivery = product?.minOrderForDelivery;
        if (minDelivery && (item.quantity || 0) < minDelivery) {
          toast({
            title: 'Minimum order for delivery',
            description: `${product.title} requires minimum ${minDelivery} pieces for delivery. Pickup has no minimum.`,
            variant: 'destructive'
          });
          return;
        }
      }
    } else {
      const requiredFields = ['firstName', 'phone'];

      requiredFields.forEach(field => {
        if (!formData[field] || formData[field].trim() === '') {
          newErrors[field] = 'This field is required';
          hasErrors = true;
        }
      });

      if (formData.email?.trim() && !isValidEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
        hasErrors = true;
      }

      if (formData.phone && !isValidPhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
        hasErrors = true;
      }

      if (!formData.pickupDateTime || formData.pickupDateTime.trim() === '') {
        newErrors.pickupDateTime = 'Please select a pickup date and time.';
        hasErrors = true;
      } else {
        const selected = new Date(formData.pickupDateTime);
        const selectedTime = selected.getHours() * 60 + selected.getMinutes();
        if (selected.getTime() < minPickupMoment) {
          newErrors.pickupDateTime = 'Pickup must be at least 24 hours from now.';
          hasErrors = true;
        } else if (selectedTime < PICKUP_START * 60 || selectedTime > PICKUP_END * 60) {
          newErrors.pickupDateTime = 'Pickup time must be between 8 AM and 8 PM (store hours).';
          hasErrors = true;
        }
      }
    }

    if (hasErrors) {
      setFieldErrors(newErrors);
      toast({ 
        title: "Please check the form", 
        description: "Some required fields need your attention. See the fields marked below.", 
        variant: "destructive" 
      });
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.getElementById(`checkout-${firstErrorField}`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return;
    }

    const paymentTransactionId = paymentMethod === 'UPI' ? 'PENDING_UPI' : ''; // UPI: admin confirms when payment received

    if (!supabase) {
      toast({ title: "Connection issue", description: "Unable to save order. Please try again.", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      // Get next sequential order number (0001, 0002, ...) from DB
      let generatedOrderNumber = null;
      if (supabase) {
        const { data: nextNum, error: rpcError } = await supabase.rpc('get_next_order_number');
        if (!rpcError && nextNum != null) generatedOrderNumber = String(nextNum).trim();
      }
      if (generatedOrderNumber == null || generatedOrderNumber === '') generatedOrderNumber = generateOrderNumberFallback();

      // Use session from context (or null for guest checkout)
      const authenticatedUserId = session?.user?.id || null;
      
      if (!authenticatedUserId && !formData.phone?.trim()) {
        toast({ 
          title: "Phone required", 
          description: "Please enter your phone number for order updates.", 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }
      console.log("Using authenticated user ID from context:", authenticatedUserId || "Guest checkout");
      console.log("Session access token:", session?.access_token ? "exists" : "missing (guest checkout)");

      // Verify supabase client from context
      if (!supabase) {
        console.error("No Supabase client available from context");
        toast({ 
          title: "Connection issue", 
          description: "We couldn't save your order right now. Please check your connection and try again.", 
          variant: "destructive" 
        });
        return;
      }

      // Log session info
      console.log("Using Supabase client with session:", {
        hasSession: !!session,
        hasAccessToken: !!session.access_token,
        userId: authenticatedUserId,
        sessionUserId: session?.user?.id || null
      });

      // Verify the session on the client
      const { data: clientSession } = await supabase.auth.getSession();
      console.log("Client session check:", {
        hasClientSession: !!clientSession.session,
        clientUserId: clientSession.session?.user?.id,
        matchesContextSession: clientSession.session?.user?.id === (session?.user?.id || null)
      });

      // Format cart items properly for JSONB (include personalised bar details for admin/order view)
      const personalisedProduct = searchData.find(p => p.id === 'prod-personalised-bar');
      const seedsOptions = personalisedProduct?.seedsOptions || [];
      const formattedItems = cart.map(item => {
        const base = {
          id: item.id,
          title: item.title || item.name,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          image: item.image || null,
          category: item.category || null,
          giftWrap: item.giftWrap || false
        };
        if (item.id === 'prod-personalised-bar') {
          base.nameOnBar = item.nameOnBar || null;
          base.customInstructions = item.customInstructions || null;
          base.selectedBase = item.selectedBase ? { id: item.selectedBase.id, label: item.selectedBase.label } : null;
          const seedIds = item.selectedSeeds || [];
          base.selectedSeedsLabels = seedIds.map(id => seedsOptions.find(o => o.id === id)?.label || id).filter(Boolean);
        }
        if (item.firstName) base.firstName = item.firstName;
        if (item.secondName) base.secondName = item.secondName;
        if (item.firstLetters) base.firstLetters = item.firstLetters;
        if (item.customText) base.customText = item.customText;
        return base;
      });

      // Guest checkout is allowed - user_id can be null
      const customerNameUpi = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim() || null;
      // Prepare order data - user_id is null for guest checkout, authenticated user ID for logged-in users
      const orderData = {
        user_id: authenticatedUserId || null, // null for guest checkout, user ID for authenticated users
        order_number: generatedOrderNumber,
        email: formData.email,
        user_email: session?.user?.email || formData.email,
        customer_name: customerNameUpi,
        phone: formData.phone?.trim() || null,
        status: 'pending',
        total: parseFloat(payableTotal) || 0, // Ensure it's a number
        items: formattedItems, // JSONB format
        delivery_type: deliveryType,
        address: deliveryType === 'delivery' ? formData.address : null,
        city: deliveryType === 'delivery' ? formData.city : null,
        district: deliveryType === 'delivery' ? (formData.district?.trim() || null) : null,
        state: deliveryType === 'delivery' ? (formData.state?.trim() || null) : null,
        zip: deliveryType === 'delivery' ? (formData.zip?.trim() || null) : null,
        store_address: deliveryType === 'pickup' ? STORE_INFO.address : null,
        // delivery_time column not in orders table – pickup time is included in WhatsApp message
        transaction_id: paymentTransactionId,
        payment_status: 'pending',
        payment_method: 'UPI',
        payment_screenshot: null, // Screenshot removed
      };

      console.log("Order data prepared:", {
        user_id: orderData.user_id,
        authenticated_user_id: authenticatedUserId,
        session_user_id: session?.user?.id || null,
        match: orderData.user_id === authenticatedUserId,
        session_exists: !!session,
        user_authenticated: !!authenticatedUserId
      });

      // Save order to Supabase (with retry logic for duplicate order numbers)
      let insertedOrder = null;
      let dbError = null;
      let finalOrderNumber = generatedOrderNumber;
      let retryCount = 0;
      const maxRetries = 3;

      console.log("Saving order with data:", {
        order_number: finalOrderNumber,
        user_id: orderData.user_id,
        email: orderData.email,
        total: orderData.total,
        items_count: orderData.items?.length
      });

      while (retryCount < maxRetries) {
        orderData.order_number = finalOrderNumber;
        
        // Insert order with explicit error handling
        console.log("=== ATTEMPTING ORDER INSERT ===");
        console.log("Order data:", {
          user_id: orderData.user_id,
          order_number: orderData.order_number,
          email: orderData.email,
          total: orderData.total
        });
        console.log("Session info:", {
          has_session: !!session,
          session_user_id: session?.user?.id,
          has_access_token: !!session?.access_token
        });
        console.log("Client session info:", {
          has_client_session: !!clientSession.session,
          client_user_id: clientSession.session?.user?.id
        });
        console.log("================================");
        
        const result = await supabase
          .from('orders')
          .insert(orderData)
          .select();

        dbError = result.error;
        insertedOrder = result.data;

        // If no error, break out of retry loop
        if (!dbError) {
          console.log("Order saved successfully:", insertedOrder);
          break;
        }

        console.error("Order save error (attempt " + (retryCount + 1) + "):", {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          fullError: dbError
        });
        
        // Log the exact order data being sent
        console.error("Order data being sent:", JSON.stringify(orderData, null, 2));

        // If duplicate order number error, generate new one and retry
        if (dbError.code === '23505' && dbError.message?.includes('order_number')) {
          retryCount++;
          const { data: nextNum } = await supabase.rpc('get_next_order_number');
          finalOrderNumber = (nextNum != null ? String(nextNum).trim() : null) || generateOrderNumberFallback();
          orderData.order_number = finalOrderNumber;
          console.log(`Order number collision, retrying with: ${finalOrderNumber}`);
          continue;
        } else {
          // Other database errors - don't retry
          break;
        }
      }

      if (dbError) {
        console.error("Final database error:", dbError);
        
        let errorMessage = 'Failed to save order. ';
        
        // Provide specific error messages
        if (dbError.code === '23503') {
          errorMessage += "Database constraint error. Please check your information and try again.";
        } else if (dbError.code === '23505') {
          errorMessage += "Order number already exists. Please try again.";
        } else if (dbError.message?.includes('permission') || dbError.message?.includes('policy')) {
          errorMessage += "Permission denied. Please check your account permissions.";
        } else if (dbError.message?.includes('RLS')) {
          errorMessage += "Database policy error. Please contact support.";
        } else {
          errorMessage += dbError.message || "Check browser console for details.";
        }
        
        toast({ 
          title: "Order couldn't be saved", 
          description: errorMessage || "Please check your connection and try again.", 
          variant: "destructive",
          duration: 7000
        });
        throw new Error(errorMessage);
      }

      if (!insertedOrder || insertedOrder.length === 0) {
        console.error("Order insert returned no data");
        const errorMsg = 'Order was not saved. Please try again.';
        toast({ 
          title: "Order couldn't be saved", 
          description: errorMsg || "Please try again or contact us if the problem continues.", 
          variant: "destructive" 
        });
        throw new Error(errorMsg);
      }

      // Set the final order number
      finalOrderNumber = insertedOrder[0].order_number || finalOrderNumber;
      setOrderNumber(finalOrderNumber);

      // Send email notification to user
      try {
        const customerName = `${formData.firstName}${formData.lastName ? ' ' + formData.lastName : ''}`.trim() || 'Valued Customer';
        
        // Get access token - try multiple methods for guest and authenticated users
        let accessToken = session?.access_token;
        if (!accessToken) {
          // Try to get fresh session
          const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
          if (!sessionError && freshSession?.access_token) {
            accessToken = freshSession.access_token;
          }
        }
        
        // For guest checkout, we'll use anon key as fallback
        // The Edge Function should allow anonymous access for order emails
        // Get anon key from the same source as SupabaseAuthContext
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rritvztvwtikrrqphjlq.supabase.co';
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyaXR2enR2d3Rpa3JycXBoamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODU3NTYsImV4cCI6MjA4NDU2MTc1Nn0.0Yq_VLJEpPEk2gxdjvoUJLPN01KA6MDRV8qC36uqk-Y';
        
        // Ensure we have a valid token (anon key is always valid for Edge Functions with anonymous access enabled)
        if (!supabaseAnonKey) {
          console.error("Supabase anon key not found - cannot send email");
          // Don't block order placement, just skip email
        }
        
        const emailToSend = formData.email?.trim() && isValidEmail(formData.email) ? formData.email : null;
        if (!emailToSend) {
          // Skip email – optional; order still placed
        } else {
        const emailPayload = {
          to: emailToSend,
          orderNumber: finalOrderNumber,
          customerName: customerName,
          orderItems: cart.map(item => ({
            title: item.title || item.name || 'Product',
            quantity: parseInt(item.quantity) || 1,
            price: parseFloat(item.price) || parseFloat(item.offerPrice) || 0,
            total: (parseFloat(item.price) || parseFloat(item.offerPrice) || 0) * (parseInt(item.quantity) || 1),
            image: item.image || item.imageUrl || item.img || item.photo || item.thumbnail || '',
            imageUrl: item.image || item.imageUrl || item.img || item.photo || item.thumbnail || '',
            img: item.image || item.imageUrl || item.img || item.photo || item.thumbnail || ''
          })),
          subtotal: parseFloat(cartTotal) || 0,
          couponDiscount: parseFloat(couponDiscount) || 0,
          loyaltyDiscount: parseFloat(loyaltyDiscount) || 0,
          total: parseFloat(payableTotal) || 0,
          deliveryType: deliveryType,
          deliveryAddress: deliveryType === 'delivery' 
            ? [formData.address, formData.city, formData.district, formData.state, formData.zip].filter(Boolean).join(', ').trim()
            : STORE_INFO.address,
          billingAddress: deliveryType === 'delivery' 
            ? [formData.address, formData.city, formData.district, formData.state, formData.zip].filter(Boolean).join(', ').trim()
            : STORE_INFO.address,
          transactionId: 'Pending (UPI)',
          orderDate: new Date().toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: 'order_email'
        };

        // Use anon key for all requests (similar to custom-auth-email)
        // This works because the Edge Function should allow anonymous access
        // The function itself doesn't need user authentication - it just sends emails
        if (!supabaseAnonKey) {
          console.warn("Supabase anon key not available - skipping email notification");
          // Don't block order placement
        } else {
          // Use anon key in Authorization header (same approach as custom-auth-email)
          // This allows the function to work for both authenticated and guest users
          const response = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`, // Use anon key for all requests
            },
            body: JSON.stringify(emailPayload)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Email notification failed:", {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            // Don't show error to user - order was saved successfully
          } else {
            const emailData = await response.json().catch(() => ({}));
            console.log("✅ Order confirmation email sent successfully", emailData);
          }
        }
        }
      } catch (emailErr) {
        console.error("Email notification error:", emailErr);
        // Don't show error to user - order was saved successfully
      }

      // Loyalty is NOT incremented here – it increments only when the order is delivered (see UserDashboard sync).

      // Stock is NOT reduced here – it is reduced only when admin confirms payment (in Dashboard).
      // This avoids reducing stock for unpaid or fake orders.

      clearCart();
      // Order number already set above
      setOrderSuccess(true);
    } catch (error) {
      console.error("Order error:", error);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      
      toast({ 
        title: "Order didn't go through", 
        description: errorMessage || "Something went wrong. Please try again or contact us.", 
        variant: "destructive",
        duration: 7000
      });
    } finally {
      setLoading(false);
    }
  };

  // Razorpay: create OUR order (pending) first, then Razorpay order, open checkout. On payment success → confirm order → show "Order confirmed" automatically (no extra click).
  const handlePayWithRazorpay = async () => {
    if (!isRazorpayAvailable) {
      toast({ title: "Payment not available", description: "Razorpay is not configured. Please try again later.", variant: "destructive" });
      return;
    }
    if (!isStep1Complete) {
      toast({ title: "Complete details first", description: "Please fill delivery/contact details and continue to payment.", variant: "destructive" });
      return;
    }
    if (!supabase) {
      toast({ title: "Connection issue", description: "Unable to proceed. Please try again.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setPayQrUrl('');
    setPaymentNotice(null);
    try {
      const personalisedProduct = searchData.find(p => p.id === 'prod-personalised-bar');
      const seedsOptions = personalisedProduct?.seedsOptions || [];
      const formattedItems = cart.map(item => {
        const base = { id: item.id, title: item.title || item.name, price: parseFloat(item.price) || 0, quantity: parseInt(item.quantity) || 1, image: item.image || null, category: item.category || null, giftWrap: item.giftWrap || false };
        if (item.id === 'prod-personalised-bar') {
          base.nameOnBar = item.nameOnBar || null;
          base.customInstructions = item.customInstructions || null;
          base.selectedBase = item.selectedBase ? { id: item.selectedBase.id, label: item.selectedBase.label } : null;
          base.selectedSeedsLabels = (item.selectedSeeds || []).map(id => seedsOptions.find(o => o.id === id)?.label || id).filter(Boolean);
        }
        if (item.firstName) base.firstName = item.firstName;
        if (item.secondName) base.secondName = item.secondName;
        if (item.firstLetters) base.firstLetters = item.firstLetters;
        if (item.customText) base.customText = item.customText;
        return base;
      });
      const authenticatedUserId = session?.user?.id || null;
      // Get next sequential order number from DB
      let finalOrderNumber = null;
      const { data: nextNum, error: rpcError } = await supabase.rpc('get_next_order_number');
      if (!rpcError && nextNum != null) finalOrderNumber = String(nextNum).trim();
      if (finalOrderNumber == null || finalOrderNumber === '') finalOrderNumber = generateOrderNumberFallback();

      const customerName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim() || null;
      const orderPayload = {
        user_id: authenticatedUserId || null,
        order_number: finalOrderNumber,
        email: formData.email,
        user_email: session?.user?.email || formData.email,
        customer_name: customerName,
        phone: formData.phone?.trim() || null,
        status: 'pending',
        total: parseFloat(payableTotal) || 0,
        items: formattedItems,
        delivery_type: deliveryType,
        address: deliveryType === 'delivery' ? formData.address : null,
        city: deliveryType === 'delivery' ? formData.city : null,
        district: deliveryType === 'delivery' ? (formData.district?.trim() || null) : null,
        state: deliveryType === 'delivery' ? (formData.state?.trim() || null) : null,
        zip: deliveryType === 'delivery' ? (formData.zip?.trim() || null) : null,
        store_address: deliveryType === 'pickup' ? STORE_INFO.address : null,
        // delivery_time column not in orders table – pickup time is included in WhatsApp message
        transaction_id: '',
        payment_status: 'pending',
        payment_method: 'Razorpay',
        payment_screenshot: null
      };
      let insertedOrder = null;
      let dbError = null;
      let retryCount = 0;
      while (retryCount < 3) {
        const result = await supabase.from('orders').insert(orderPayload).select();
        dbError = result.error;
        insertedOrder = result.data;
        if (!dbError) break;
        if (dbError.code === '23505' && dbError.message?.includes('order_number')) {
          retryCount++;
          const { data: retryNum } = await supabase.rpc('get_next_order_number');
          finalOrderNumber = (retryNum != null ? String(retryNum).trim() : null) || generateOrderNumberFallback();
          orderPayload.order_number = finalOrderNumber;
          continue;
        }
        break;
      }
      if (dbError || !insertedOrder?.[0]) {
        toast({ title: "Could not create order", description: dbError?.message || "Please try again.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const ourOrderId = insertedOrder[0].id;
      const ourOrderNumber = insertedOrder[0].order_number;
      pendingOrderRef.current = { id: ourOrderId, order_number: ourOrderNumber };

      const createOrderBody = { amount: payableTotal, receipt: `ahnupha_${ourOrderNumber}` };
      const { data: createData, error: createErr } = await supabase.functions.invoke('razorpay-create-order', {
        body: createOrderBody
      });
      if (createErr || !createData?.order_id) {
        let errorMsg = createData?.error || createErr?.message || 'Please try again.';
        if (createErr instanceof FunctionsHttpError && createErr.context && typeof createErr.context.json === 'function') {
          try {
            const errBody = await createErr.context.json();
            if (errBody?.error) errorMsg = typeof errBody.error === 'string' ? errBody.error : (errBody.error?.description || errBody.error?.message || JSON.stringify(errBody.error));
          } catch (_) {}
        }
        console.error('Razorpay create-order failed:', errorMsg, { createErr, createData });
        toast({ title: "Could not start payment", description: errorMsg, variant: "destructive" });
        setPaymentNotice({ title: 'Payment could not start', description: errorMsg, variant: 'error' });
        setLoading(false);
        return;
      }
      if (createData?.config_applied === false) {
        // Silence config warnings in UI
      }
      const razorpayOrderId = createData.order_id;
      const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
      const amountPaise = Math.round(Number(payableTotal) * 100);

      const loadScript = () => new Promise((resolve, reject) => {
        if (window.Razorpay) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Razorpay script failed to load'));
        document.body.appendChild(s);
      });
      await loadScript();

      const options = {
        key: razorpayKeyId,
        amount: amountPaise,
        currency: 'INR',
        name: STORE_INFO.name,
        description: 'Order payment - Ahnupha',
        order_id: razorpayOrderId,
        prefill: {
          name: fullName || undefined,
          email: formData.email || undefined,
          contact: (formData.phone || '').replace(/\D/g, '').slice(-10) || undefined
        },
        notes: {
          order_number: ourOrderNumber
        },
        theme: {
          color: '#f43f5e'
        },
        handler: async (res) => {
          try {
            const { data, error } = await supabase.functions.invoke('confirm-razorpay-order', {
              body: {
                order_id: ourOrderId,
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature
              }
            });
            if (error || !data?.success) {
              toast({ title: 'Payment verification failed', description: data?.error || error?.message || 'Please try again.', variant: 'destructive' });
              setPaymentNotice({ title: 'Payment verification failed', description: data?.error || error?.message || 'Please try again.', variant: 'error' });
              setLoading(false);
              return;
            }
            setOrderNumber(data.order_number || ourOrderNumber);
            clearCart();
            setOrderSuccess(true);
          } catch (err) {
            toast({ title: 'Payment could not be verified', description: err?.message || 'Please try again.', variant: 'destructive' });
            setPaymentNotice({ title: 'Payment could not be verified', description: err?.message || 'Please try again.', variant: 'error' });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast({ title: 'Payment cancelled', description: 'You can try again anytime.', variant: 'destructive' });
            setPaymentNotice({ title: 'Payment cancelled', description: 'You can try again anytime.', variant: 'warning' });
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setLoading(false);
    } catch (e) {
      console.error('Card/UPI payment error:', e);
      toast({ title: "Payment could not start", description: e?.message || "Try again.", variant: "destructive" });
      setPaymentNotice({ title: 'Payment could not start', description: e?.message || 'Please try again.', variant: 'error' });
      setLoading(false);
    }
  };

  // Interesting thank you messages
  const interestingMessages = [
    "Your order is like a box of chocolates - full of sweet surprises! 🍫",
    "We're crafting your order with love, just like our handmade chocolates! ❤️",
    "Your taste buds are about to experience something magical! ✨",
    "Great choice! Your order is being prepared with extra care and sweetness! 🎁",
    "Thank you for choosing Ahnupha! Your order is our priority! 🌟"
  ];
  const randomMessage = interestingMessages[Math.floor(Math.random() * interestingMessages.length)];

  // Scan-to-pay: show loader or error when checkout opened with ?o=&r= (pay on phone)
  if (isPayFromQr && payFromQrStatus === 'opening') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-gray-600">Opening payment…</p>
        </div>
      </div>
    );
  }
  if (isPayFromQr && payFromQrStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-rose-100 p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{payFromQrError}</p>
          <Button onClick={() => setSearchParams({})} className="w-full">Back to checkout</Button>
        </div>
      </div>
    );
  }

  // Show success message
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50 flex items-center justify-center p-4">
        <SEO title="Order confirmed" description="Thank you for your Ahnupha order." path="/checkout" noindex />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-rose-100"
        >
          {/* Success Header */}
          <div className="bg-gradient-to-r from-rose-500 to-amber-500 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <Sparkles className="w-full h-full" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative z-10"
            >
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Order Confirmed! 🎉</h1>
              <p className="text-xl text-rose-50">Thank you for your purchase!</p>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 md:p-10 lg:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6 sm:mb-8"
            >
              <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-rose-50 text-rose-700 px-4 py-2.5 rounded-full mb-6">
                <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">Order #{orderNumber}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (orderNumber) {
                      navigator.clipboard.writeText(orderNumber).then(() => {
                        toast({ title: 'Copied!', description: 'Order number copied to clipboard.', duration: 2000 });
                      }).catch(() => {});
                    }
                  }}
                  className="ml-1 px-2 py-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-medium touch-manipulation"
                  aria-label="Copy order number"
                >
                  Copy
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-6 rounded-2xl mb-8 border border-rose-100">
                <Heart className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                <p className="text-lg text-gray-800 font-medium leading-relaxed">
                  {randomMessage}
                </p>
              </div>

              <div className="space-y-4 text-left bg-gray-50 p-6 rounded-xl mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">1.</span>
                    <span>We've received your order and payment confirmation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">2.</span>
                    <span>Our team will prepare your order with care</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">3.</span>
                    <span>You'll receive updates on your order status</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">4.</span>
                    <span>Your order will be delivered to your doorstep soon!</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons – touch-friendly on all devices */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Button
                onClick={() => {
                  setOrderSuccess(false);
                  navigate('/candy-chocolate');
                }}
                className="flex-1 min-h-[48px] sm:min-h-[52px] text-base py-3 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white shadow-lg touch-manipulation"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Order Again
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="flex-1 min-h-[48px] sm:min-h-[52px] text-base py-3 border-2 border-rose-200 hover:bg-rose-50 touch-manipulation"
              >
                View Orders
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-sm text-gray-500 mt-6"
            >
              Need help? Contact us at{" "}
              <a href="mailto:info@ahnupha.com" className="text-rose-600 hover:underline">
                info@ahnupha.com
              </a>
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
     return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Button onClick={() => navigate('/candy-chocolate')} className="bg-rose-600 hover:bg-rose-700">Start Shopping</Button>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50 py-12">
      <SEO title="Checkout" description="Complete your Ahnupha chocolate order with secure payment." path="/checkout" noindex />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              <span className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 flex-shrink-0" /> 
            <span>Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Checkout</span></span>
              </span>
          </h1>
            <p className="text-gray-600 ml-9 md:ml-9">Complete your order with secure payment</p>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-6 flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full transition-all ${
              checkoutStep >= 1 ? 'bg-rose-500' : 'bg-gray-200'
            }`} />
            <div className={`flex-1 h-2 rounded-full transition-all ${
              checkoutStep >= 2 ? 'bg-rose-500' : 'bg-gray-200'
            }`} />
            <div className={`flex-1 h-2 rounded-full transition-all ${
              checkoutStep >= 2 ? 'bg-rose-500' : 'bg-gray-200'
            }`} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className={checkoutStep >= 1 ? 'text-rose-600 font-medium' : ''}>Details</span>
            <span className={checkoutStep >= 2 ? 'text-rose-600 font-medium' : ''}>Payment</span>
            <span className={checkoutStep >= 2 ? 'text-rose-600 font-medium' : ''}>Place order</span>
          </div>
        </motion.div>

        {/* Payment failed banner – shown when user returns from Razorpay after failed/cancelled payment */}
        {showPaymentFailedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 sm:p-5 rounded-xl bg-red-50 border-2 border-red-200 flex flex-wrap items-center gap-3"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-900">Payment didn’t go through</p>
              <p className="text-sm text-red-800 mt-0.5">You can try again below or use a different payment method. Your cart is still here.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPaymentFailedBanner(false)}
              className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-medium text-sm touch-manipulation"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 gap-8">
          
          {/* Step 1: Details Section: Forms - Only show when step 1 is active */}
          {checkoutStep === 1 && (
            <div className="space-y-6">
              
              {/* Delivery/Pickup Selection */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-lg border-2 border-rose-100/50 bg-gradient-to-br from-white to-rose-50/20"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-rose-100 pb-4">
                 <Truck className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500" /> 
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">Delivery Options</span>
                 {deliveryType && (
                   <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                 )}
              </h2>
              {!deliveryType && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">Please select how you'd like to receive your order</p>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Delivery Type Selection */}
                <div className="space-y-3">
                  <div 
                    onClick={() => setDeliveryType('delivery')}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      deliveryType === 'delivery' 
                        ? 'border-rose-500 bg-gradient-to-r from-rose-50 to-amber-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-rose-200 hover:shadow-sm'
                    }`}
                  >
                    <Truck className={`w-5 h-5 ${deliveryType === 'delivery' ? 'text-rose-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Deliver this to an address</p>
                      <p className="text-sm text-gray-500">Tick "Suryapet local" for free delivery; otherwise a delivery charge of ₹100 applies.</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      deliveryType === 'delivery' 
                        ? 'border-rose-500 bg-gradient-to-r from-rose-500 to-amber-500' 
                        : 'border-gray-300'
                    }`}>
                      {deliveryType === 'delivery' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>

                  <div 
                    onClick={() => setDeliveryType('pickup')}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      deliveryType === 'pickup' 
                        ? 'border-rose-500 bg-gradient-to-r from-rose-50 to-amber-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-rose-200 hover:shadow-sm'
                    }`}
                  >
                    <Store className={`w-5 h-5 ${deliveryType === 'pickup' ? 'text-rose-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Pickup from store</p>
                      <p className="text-sm text-gray-500">Pickup from our store · Ready within 24 hrs</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      deliveryType === 'pickup' 
                        ? 'border-rose-500 bg-gradient-to-r from-rose-500 to-amber-500' 
                        : 'border-gray-300'
                    }`}>
                      {deliveryType === 'pickup' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Store Location + Pickup Date/Time (shown when pickup is selected) */}
                {deliveryType === 'pickup' && (
                  <div className="mt-4 p-5 bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl border-2 border-rose-200/50 shadow-sm space-y-5">
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
                          <Calendar className="w-4 h-4 text-rose-500" />
                          Pickup date & time <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-600 mb-3">Choose at least 24 hours from now. Store is open 8 AM – 8 PM.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="checkout-pickupDate" className="sr-only">Pickup date</label>
                            <div className="relative flex items-center">
                              <div className="absolute left-3 pointer-events-none z-10 text-gray-400">
                                <Calendar className="w-5 h-5" />
                              </div>
                              <Input
                                id="checkout-pickupDate"
                                type="date"
                                min={minPickupDateStr}
                                value={pickupDateValue}
                                onChange={(e) => setPickupDate(e.target.value || '')}
                                className={`w-full min-h-[52px] sm:min-h-[56px] pl-11 pr-4 py-3 text-base sm:text-lg border-2 rounded-xl touch-manipulation ${fieldErrors.pickupDateTime ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-rose-200/80 focus:border-rose-400 focus:ring-rose-200'}`}
                                aria-invalid={!!fieldErrors.pickupDateTime}
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="checkout-pickupTime" className="sr-only">Pickup time</label>
                            <div className="relative flex items-center">
                              <div className="absolute left-3 pointer-events-none z-10 text-gray-400">
                                <Clock className="w-5 h-5" />
                              </div>
                              <select
                                id="checkout-pickupTime"
                                value={!formData.pickupDateTime ? '' : (pickupTimeOptions.some(o => o.value === pickupTimeValue) ? pickupTimeValue : (pickupTimeOptions[0]?.value ?? ''))}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className={`w-full min-h-[52px] sm:min-h-[56px] pl-11 pr-10 py-3 text-base sm:text-lg border-2 rounded-xl touch-manipulation bg-white appearance-none cursor-pointer ${fieldErrors.pickupDateTime ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-rose-200/80 focus:border-rose-400 focus:ring-rose-200'}`}
                                aria-invalid={!!fieldErrors.pickupDateTime}
                              >
                                <option value="">Select time</option>
                                {pickupTimeOptions.map(({ value, label }) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden />
                            </div>
                          </div>
                        </div>
                        <p id="pickup-datetime-hint" className="text-xs text-gray-500 mt-2">Pick a date and time slot. Only times between 8 AM and 8 PM are available.</p>
                        {fieldErrors.pickupDateTime && (
                          <p id="pickup-datetime-error" className="text-sm text-red-600 mt-2 flex items-center gap-1.5" role="alert">
                            <X className="w-4 h-4 shrink-0" /> {fieldErrors.pickupDateTime}
                          </p>
                        )}
                    </div>
                    <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500" />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">Store Location</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{STORE_INFO.name}</p>
                          <a href={`tel:${STORE_INFO.phone.replace(/\s/g, '')}`} className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600 hover:underline font-medium">
                            {STORE_INFO.phone}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{STORE_INFO.address}</p>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Check with store if pickup is available today</p>
                        <Button
                          onClick={() => window.open(`tel:${STORE_INFO.phone.replace(/\s/g, '')}`, '_self')}
                          className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-lg shadow-rose-200"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Store
                        </Button>
                      </div>
                    </div>
                    </div>
                    </div>
                  </div>
                )}

                {/* Contact Info (always shown) */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    Contact Information
                    {formData.firstName && formData.phone && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">We'll use this to confirm your order and delivery details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="checkout-firstName" className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        First Name <span className="text-red-500">*</span>
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                          <span className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Enter your first name as it appears on your ID
                          </span>
                        </div>
                      </label>
                      <Input 
                        id="checkout-firstName" 
                        name="firstName" 
                        value={formData.firstName} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g., Rakesh"
                        autoFocus
                        className={fieldErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
                        aria-invalid={!!fieldErrors.firstName}
                        aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
                      />
                      {fieldErrors.firstName && (
                        <p id="firstName-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                          <X className="w-3 h-3" /> {fieldErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="checkout-lastName" className="text-sm font-medium text-gray-600">Last Name <span className="text-xs text-gray-400">(Optional)</span></label>
                      <Input 
                        id="checkout-lastName" 
                        name="lastName" 
                        value={formData.lastName} 
                        onChange={handleChange}
                        placeholder="e.g., Kumar"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="checkout-email" className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        Email <span className="text-gray-400 font-normal">(optional – for order details)</span>
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                          <span className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            We'll send order confirmation to this email if provided
                          </span>
                        </div>
                      </label>
                      <Input 
                        id="checkout-email" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        placeholder="your.email@example.com"
                        className={fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                      />
                      {fieldErrors.email && (
                        <p id="email-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                          <X className="w-3 h-3" /> {fieldErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="checkout-phone" className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        Phone Number <span className="text-red-500">*</span>
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                          <span className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            We'll use this to confirm your order. Pickup orders need a date & time; delivery does not.
                          </span>
                        </div>
                      </label>
                      <Input 
                        id="checkout-phone" 
                        name="phone" 
                        type="tel"
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        placeholder="+91 98765 43210"
                        className={fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
                        aria-invalid={!!fieldErrors.phone}
                        aria-describedby={fieldErrors.phone ? 'phone-error' : 'phone-hint'}
                      />
                      {!fieldErrors.phone && <p id="phone-hint" className="text-xs text-gray-500 mt-1">10-digit mobile number</p>}
                      {fieldErrors.phone && (
                        <p id="phone-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                          <X className="w-3 h-3" /> {fieldErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Address Form (shown when delivery is selected) */}
                {deliveryType === 'delivery' && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      Delivery Address
                      {formData.address && formData.city?.trim() && formData.district?.trim() && formData.state?.trim() && formData.zip?.trim() && /^[0-9]{5,6}$/.test(normalizeZip(formData.zip)) && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">Tick the box if you are in Suryapet local area for free delivery; otherwise delivery charges apply.</p>
                    {/* Suryapet local checkbox: tick = free delivery */}
                    <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-rose-200 bg-gray-50/50 mb-4 cursor-pointer touch-manipulation">
                      <input type="checkbox" name="suryapetLocal" checked={formData.suryapetLocal} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                      <span className="text-sm font-medium text-gray-800">Suryapet local – free delivery</span>
                      {!formData.suryapetLocal && <span className="text-xs text-amber-700 font-medium">(Delivery charge ₹{DELIVERY_CHARGE_OUTSIDE_SURYAPET} will apply)</span>}
                    </label>
                    {!formData.address && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-800">Please provide your complete delivery address</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <label htmlFor="checkout-address" className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          Street Address <span className="text-red-500">*</span>
                          <div className="group relative">
                            <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                            <span className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              Include house number, street name, and landmark
                            </span>
                          </div>
                        </label>
                        <Input 
                          id="checkout-address" 
                          name="address" 
                          value={formData.address} 
                          onChange={handleChange} 
                          required 
                          placeholder="e.g., 123 Main Street, Near Park"
                          className={fieldErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
                          aria-invalid={!!fieldErrors.address}
                          aria-describedby={fieldErrors.address ? 'address-error' : undefined}
                        />
                        {fieldErrors.address && (
                          <p id="address-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                            <X className="w-3 h-3" /> {fieldErrors.address}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="checkout-city" className="text-sm font-medium text-gray-600">City <span className="text-red-500">*</span></label>
                        <Input 
                          id="checkout-city" 
                          name="city" 
                          value={formData.city} 
                          onChange={handleChange} 
                          required 
                          placeholder="e.g., Suryapet"
                          className={fieldErrors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
                          aria-invalid={!!fieldErrors.city}
                          aria-describedby={fieldErrors.city ? 'city-error' : undefined}
                        />
                        {fieldErrors.city && (
                          <p id="city-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                            <X className="w-3 h-3" /> {fieldErrors.city}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="checkout-district" className="text-sm font-medium text-gray-600">District <span className="text-red-500">*</span></label>
                        <Input 
                          id="checkout-district" 
                          name="district" 
                          value={formData.district} 
                          onChange={handleChange} 
                          required 
                          placeholder="e.g., Nalgonda"
                          className={fieldErrors.district ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
                          aria-invalid={!!fieldErrors.district}
                          aria-describedby={fieldErrors.district ? 'district-error' : undefined}
                        />
                        {fieldErrors.district && (
                          <p id="district-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                            <X className="w-3 h-3" /> {fieldErrors.district}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="checkout-state" className="text-sm font-medium text-gray-600">State <span className="text-red-500">*</span></label>
                        <select
                          id="checkout-state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          required
                          className={`w-full min-h-[42px] max-w-full rounded-lg border-2 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 ${fieldErrors.state ? 'border-red-500' : 'border-gray-200'}`}
                          aria-invalid={!!fieldErrors.state}
                          aria-describedby={fieldErrors.state ? 'state-error' : undefined}
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {fieldErrors.state && (
                          <p id="state-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                            <X className="w-3 h-3" /> {fieldErrors.state}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="checkout-zip" className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          Postal Code (PIN) <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          id="checkout-zip" 
                          name="zip" 
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={formData.zip} 
                          onChange={handleChange} 
                          required
                          placeholder="e.g., 508213"
                          className={fieldErrors.zip ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
                          aria-invalid={!!fieldErrors.zip}
                          aria-describedby={fieldErrors.zip ? 'zip-error' : undefined}
                        />
                        {fieldErrors.zip && (
                          <p id="zip-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                            <X className="w-3 h-3" /> {fieldErrors.zip}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Instructions */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="checkout-orderInstructions" className="text-sm font-medium text-gray-600">Order Instructions</label>
                    <span className="text-xs text-gray-400">Optional</span>
                  </div>
                  <Input 
                    id="checkout-orderInstructions"
                    name="orderInstructions" 
                    value={formData.orderInstructions} 
                    onChange={handleChange} 
                    placeholder="Any special instructions for your order"
                  />
                </div>

                {/* Continue to Payment Button */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <Button
                    type="button"
                    onClick={handleContinueToPayment}
                    disabled={!isStep1Complete}
                    className="w-full h-14 text-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue to Payment
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  {!isStep1Complete && (
                    <p className="text-sm text-center text-gray-500 mt-3">
                      Please complete all required fields above to continue
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
            </div>
          )}

          {/* Step 2: Payment Section - Only show when step 2 is active */}
          {checkoutStep === 2 && (
            <div className="space-y-6">
                {/* Apply Coupon Code section commented out per request */}

                {/* Loyalty Offer (10th chocolate order) - Before Payment */}
                {is10thChocolateOrder && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="bg-white p-6 rounded-xl shadow-lg border-2 border-rose-100/50 bg-gradient-to-br from-white to-rose-50/20"
             >
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-rose-100 pb-4">
                  <Sparkles className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">🎁 Loyalty Offer</span>
               </h2>
                
                <div className="mb-4 p-4 rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50/40 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-base font-extrabold text-gray-900">10th Order Reward</p>
                      <p className="text-sm text-gray-600 mt-1">Get ₹200 off or get a free chocolate worth ₹250 on your 10th order. Choose one.</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-white px-3 py-1 rounded-full border border-rose-200">
                      Eligible
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setLoyaltyChoice('200')}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        loyaltyChoice === '200'
                          ? 'border-rose-400 bg-rose-100 shadow-md'
                          : 'border-gray-200 bg-white hover:border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-extrabold text-gray-900">₹200 OFF</p>
                          <p className="text-sm text-gray-600">Instant discount on this order</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          loyaltyChoice === '200' 
                            ? 'border-rose-500 bg-rose-500' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {loyaltyChoice === '200' && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLoyaltyChoice('250')}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        loyaltyChoice === '250'
                          ? 'border-rose-400 bg-rose-100 shadow-md'
                          : 'border-gray-200 bg-white hover:border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-extrabold text-gray-900">Free chocolate worth ₹250</p>
                          <p className="text-sm text-gray-600">Applied as ₹250 reward value</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          loyaltyChoice === '250' 
                            ? 'border-rose-500 bg-rose-500' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {loyaltyChoice === '250' && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
                )}

                {/* Payment Section */}
                <motion.div 
          ref={paymentSectionRef}
          tabIndex={-1}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: highlightPayment ? [1, 1.02, 1] : 1,
            boxShadow: highlightPayment ? [
              '0 0 0 0 rgba(225, 29, 72, 0)',
              '0 0 0 8px rgba(225, 29, 72, 0.1)',
              '0 0 0 0 rgba(225, 29, 72, 0)'
            ] : undefined
          }}
          transition={{ 
            duration: 0.5,
            scale: { duration: 0.6, repeat: 0 },
            boxShadow: { duration: 0.6, repeat: 0 }
          }}
          className={`mt-6 bg-white p-6 rounded-xl shadow-lg border-2 transition-all duration-300 ${
            highlightPayment || appliedCoupon
              ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-amber-50 shadow-xl shadow-rose-200/50' 
              : 'border-rose-100/50 bg-gradient-to-br from-white to-amber-50/20'
          } focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2`}
        >
          {/* Order Summary – shown first, then payment */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">Order Summary</span>
            </h3>
               <div className="space-y-4 max-h-[280px] sm:max-h-[300px] overflow-y-auto overflow-x-hidden mb-6 pr-2 -mr-2 custom-scrollbar overscroll-contain">
                 {cart.map((item) => (
                   <div key={`${item.id}-${item.nameOnBar || ''}-${(item.customInstructions || '').slice(0, 20)}`} className="flex gap-4 items-start">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0">
                         <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</h4>
                        {item.nameOnBar && <p className="text-xs text-rose-600 font-semibold mt-0.5">Name on bar: {item.nameOnBar}</p>}
                        {item.giftWrap && <p className="text-xs text-rose-600 font-medium mt-0.5">Gift wrap +₹20</p>}
                        {item.customInstructions && <p className="text-xs text-gray-600 mt-0.5">Instructions: {item.customInstructions}</p>}
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-gray-900">₹{((item.price || 0) * (item.quantity || 0) + (item.giftWrap ? 20 * (item.quantity || 0) : 0)).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            {appliedCoupon && (
              <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-800">{appliedCoupon}</p>
                    <p className="text-xs text-green-600">10% discount applied</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 hover:bg-green-100 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-green-600" />
                  </button>
                </div>
              </div>
            )}
               <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
                 <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                 </div>
                 <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className={shippingCharge === 0 ? 'text-green-600 font-medium' : ''}>
                      {deliveryType === 'pickup' ? '—' : shippingCharge === 0 ? 'Free' : `₹${shippingCharge.toLocaleString('en-IN')}`}
                    </span>
                 </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm font-semibold text-green-700">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Coupon Discount ({appliedCoupon})
                  </span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm font-semibold text-rose-700">
                  <span>Loyalty Reward</span>
                  <span>-₹{loyaltyDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {platformFee > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform fee</span>
                  <span>₹{platformFee.toLocaleString('en-IN')}</span>
                </div>
              )}
                 <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t mt-2">
                    <span>Total</span>
                <span>₹{payableTotal.toLocaleString('en-IN')}</span>
              </div>
                 </div>
          </div>

          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-rose-100 pb-4">
             <ShieldCheck className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500" /> 
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">Payment</span>
          </h2>
          {paymentNotice && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                paymentNotice.variant === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : paymentNotice.variant === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-blue-200 bg-blue-50 text-blue-900'
              }`}
              role="status"
            >
              <p className="font-semibold">{paymentNotice.title}</p>
              {paymentNotice.description && (
                <p className="mt-1 text-xs sm:text-sm leading-relaxed">{paymentNotice.description}</p>
              )}
            </div>
          )}
          {/* When Razorpay is available: one Pay button, redirect to Razorpay then back here. */}
          {isRazorpayAvailable && (
            <>
              <p className="mb-3 text-sm text-gray-600">Pay securely – your order is confirmed automatically after payment.</p>
              <p className="mb-3 text-sm text-gray-500">No COD (Cash on Delivery). Pay online only.</p>
            </>
          )}
          <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 mb-1">How it works</p>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {isMobileView
                    ? 'Tap Pay below. You’ll go to a payment page – choose UPI and open your UPI app (GPay, PhonePe, Paytm, etc.) to pay – you’ll return here and see your order confirmation.'
                    : 'Click the Pay button below. You’ll go to a secure Razorpay page. Pay with UPI (GPay, PhonePe) or debit card – then you’ll return here and your order will be confirmed.'}
                </p>
              </div>
            </div>
          </div>
          {isRazorpayAvailable ? (
            <div className="mb-6">
              <button
                type="button"
                onClick={handlePayWithRazorpay}
                disabled={loading || cart.length === 0}
                aria-busy={loading}
                aria-label={loading ? 'Opening secure payment…' : `Pay ₹${payableTotal.toLocaleString('en-IN')} – UPI or Debit Card`}
                className="w-full min-h-[52px] sm:min-h-[56px] py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-gray-400 disabled:active:scale-100 text-white font-semibold text-base sm:text-lg shadow-lg transition-all flex items-center justify-center gap-3 touch-manipulation select-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin flex-shrink-0" aria-hidden />
                    <span>Taking you to secure payment…</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden />
                    <span>Pay ₹{payableTotal.toLocaleString('en-IN')} – UPI or Debit Card</span>
                  </>
                )}
              </button>
              {payQrUrl && paymentTimeLeft != null && paymentTimeLeft > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <p className="text-sm font-semibold text-amber-900">
                    Complete payment within <span className="tabular-nums font-bold">{Math.floor(paymentTimeLeft / 60)}:{String(paymentTimeLeft % 60).padStart(2, '0')}</span>
                  </p>
                  <p className="text-xs text-amber-800 mt-1">Finish payment before time runs out.</p>
                  <button
                    type="button"
                    onClick={() => { setPayQrUrl(''); setPaymentTimeLeft(null); paymentStartedAtRef.current = null; }}
                    className="mt-2 text-xs font-medium text-amber-700 underline hover:no-underline"
                  >
                    Cancel and pay again
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 p-6 rounded-xl border-2 border-amber-200 bg-amber-50 text-center">
              <p className="text-base font-semibold text-amber-900 mb-2">Payment by Razorpay only</p>
              <p className="text-sm text-amber-800">Checkout uses Razorpay for secure payment. No COD (Cash on Delivery).</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                 {/* UPI Place Order not used – Razorpay-only checkout; order created after payment */}
               
            <div className="flex flex-col gap-1 items-center justify-center text-xs text-gray-500 text-center pt-2 pb-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span>Secure payment</span>
                  </div>
                  <p>Razorpay – payment is secure. Order is confirmed automatically after successful payment.</p>
            </div>
               </div>
             </motion.div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Checkout;