import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { Loader2, CreditCard, User, ShoppingBag, Package, Truck, MapPin, Store, Users, CheckCircle2, XCircle, RefreshCw, Box, PackageCheck, Navigation, RotateCcw, PackageX, Edit2, Save, FileText, Download, ShieldCheck, Home, ChevronDown, ChevronUp, Trash2, AlertTriangle, Banknote, X, Lock, MessageCircle, Instagram, Clock, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { searchData } from '@/lib/searchData';
import SEO from '@/components/SEO';

// ===== ADMIN EMAIL - UPDATE WITH YOUR OWNER EMAIL =====
const ADMIN_EMAIL = "info@ahnupha.com"; // Change this to your owner/admin email
// ======================================================

// Indian states for address form
const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

// Manual orders: parcel = ₹100 shipping; delivery = no shipping
const MANUAL_ORDER_PARCEL_SHIPPING = 100;

// ===== ORDER STATUS STAGES =====
// Delivered = green; all other statuses = light red (easy to spot non-delivered)
const ORDER_STATUS_COLOR = (status) => status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700 border border-red-100';
const ORDER_STATUSES = {
  pending: { label: 'Pending', color: ORDER_STATUS_COLOR('pending'), icon: Package, description: 'Customer placed order but payment not confirmed' },
  processing: { label: 'Processing', color: ORDER_STATUS_COLOR('processing'), icon: RefreshCw, description: 'Payment confirmed & order being prepared' },
  packed: { label: 'Packed', color: ORDER_STATUS_COLOR('packed'), icon: Box, description: 'Order ready for shipment' },
  shipped: { label: 'Shipped', color: ORDER_STATUS_COLOR('shipped'), icon: Truck, description: 'Order handed to courier' },
  out_for_delivery: { label: 'Out for Delivery', color: ORDER_STATUS_COLOR('out_for_delivery'), icon: Navigation, description: 'Courier is delivering' },
  ready_to_pickup: { label: 'Ready to Pickup', color: ORDER_STATUS_COLOR('ready_to_pickup'), icon: Store, description: 'Order ready for store pickup' },
  delivered: { label: 'Delivered', color: ORDER_STATUS_COLOR('delivered'), icon: CheckCircle2, description: 'Customer received the order' },
  cancelled: { label: 'Cancelled', color: ORDER_STATUS_COLOR('cancelled'), icon: XCircle, description: 'Order cancelled' },
  returned: { label: 'Returned', color: ORDER_STATUS_COLOR('returned'), icon: RotateCcw, description: 'Order returned' }
};

// Status progression flow (next valid statuses)
const STATUS_FLOW = {
  pending: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: []
};

// Pickup orders: skip shipped & out_for_delivery; use ready_to_pickup
const PICKUP_STATUS_FLOW = {
  pending: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['ready_to_pickup', 'cancelled'],
  ready_to_pickup: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: []
};
// ======================================================

// Supabase client will be used from context

const UserDashboard = () => {
  const { currentUser, supabase: supabaseClient, ensureProfile } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const showSetPassword = searchParams.get('setPassword') === '1';

  const [setPasswordNew, setSetPasswordNew] = useState('');
  const [setPasswordConfirm, setSetPasswordConfirm] = useState('');
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);

  // Get current section from URL hash - no default so sections close when hash is empty
  const currentSection = location.hash.replace('#', '');
  
  // Scroll to section when hash changes
  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.replace('#', '');
      const element = document.getElementById(sectionId) || document.getElementById(`section-${sectionId}`);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }, [location.hash]);
  
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // All orders for admin
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(isAdmin ? 'all' : 'my'); // Admin only sees 'all', regular users see 'my'
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  // Repay modal (user retry payment for failed/pending orders)
  const [repayModalOrder, setRepayModalOrder] = useState(null);
  const [repayTransactionId, setRepayTransactionId] = useState('');
  const [repaySubmitting, setRepaySubmitting] = useState(false);
  // Expand one order to view full details (order id or null)
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedManualOrderId, setExpandedManualOrderId] = useState(null);
  const [ordersLoadingRefresh, setOrdersLoadingRefresh] = useState(false);

  // Loyalty (Chocolate) – counted only when order is delivered
  const LOYALTY_KEY = 'ahnupha_chocolate_orders_completed';
  const LOYALTY_COUNTED_IDS_KEY = 'ahnupha_loyalty_counted_order_ids';
  const [chocoOrders, setChocoOrders] = useState(0);

  // Stock Management (Admin only) – persisted to Supabase so all users see same stock
  // Table: product_stock (product_id TEXT PK, stock INTEGER)
  // If you get 403 RLS error, run in Supabase SQL Editor:
  //   DROP POLICY IF EXISTS "Allow read product_stock" ON product_stock;
  //   DROP POLICY IF EXISTS "Allow all product_stock" ON product_stock;
  //   CREATE POLICY "Allow read product_stock" ON product_stock FOR SELECT TO anon, authenticated USING (true);
  //   CREATE POLICY "Allow all product_stock" ON product_stock FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  const STOCK_STORAGE_KEY = 'ahnupha_product_stock';
  const PRODUCT_STOCK_TABLE = 'product_stock';
  const [products, setProducts] = useState([]);
  const [stockValues, setStockValues] = useState({});
  const [editingProductId, setEditingProductId] = useState(null);
  const [tempStockValue, setTempStockValue] = useState('');

  // Manual Orders (Admin only) – Insta/WhatsApp orders; status updated here
  const [manualOrders, setManualOrders] = useState([]);
  const [updatingManualOrderId, setUpdatingManualOrderId] = useState(null);
  const [manualOrderStatusFilter, setManualOrderStatusFilter] = useState('all');

  // Online orders – sort by status (admin + user)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Forms Management (Admin only)
  const [insuranceForms, setInsuranceForms] = useState([]);
  const [homeLoanForms, setHomeLoanForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [activeFormsTab, setActiveFormsTab] = useState('insurance'); // 'insurance' or 'homeloan'
  const [selectedInsuranceMonth, setSelectedInsuranceMonth] = useState('all'); // 'all' or 'YYYY-MM'
  const [selectedHomeLoanMonth, setSelectedHomeLoanMonth] = useState('all'); // 'all' or 'YYYY-MM'

  // Profile (optional details e.g. address)
  const [profileData, setProfileData] = useState(null);
  const [profileAddress, setProfileAddress] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addrFirstName, setAddrFirstName] = useState('');
  const [addrLastName, setAddrLastName] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrCountry, setAddrCountry] = useState('India');
  const [addrPhone, setAddrPhone] = useState('');

  // Remove collapsible state - now using URL hash for navigation

  // Fetch forms data (Admin only) - memoized with useCallback
  const fetchFormsData = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingForms(true);
    try {
      // Fetch insurance forms - admin should see ALL forms
      const { data: insuranceData, error: insuranceError } = await supabaseClient
        .from('insurance_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (insuranceError) {
        console.error('Error fetching insurance forms:', insuranceError);
        // Check if it's an RLS/permission error
        if (insuranceError.message?.includes('permission') || insuranceError.message?.includes('policy') || insuranceError.code === '42501') {
          toast({
            title: "Admin Access Required",
            description: "RLS policies may be blocking access. Please ensure admin can read all insurance_forms.",
            variant: "destructive",
            duration: 5000
          });
        }
        setInsuranceForms([]);
      } else {
        console.log(`Fetched ${insuranceData?.length || 0} insurance forms`);
        setInsuranceForms(insuranceData || []);
      }

      // Fetch home loan forms - admin should see ALL forms
      const { data: homeLoanData, error: homeLoanError } = await supabaseClient
        .from('home_loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (homeLoanError) {
        console.error('Error fetching home loan forms:', homeLoanError);
        // Check if it's an RLS/permission error
        if (homeLoanError.message?.includes('permission') || homeLoanError.message?.includes('policy') || homeLoanError.code === '42501') {
          toast({
            title: "Admin Access Required",
            description: "RLS policies may be blocking access. Please ensure admin can read all home_loans.",
            variant: "destructive",
            duration: 5000
          });
        }
        setHomeLoanForms([]);
      } else {
        console.log(`Fetched ${homeLoanData?.length || 0} home loan forms`);
        setHomeLoanForms(homeLoanData || []);
      }
    } catch (error) {
      console.error("Error fetching forms data:", error);
      toast({
        title: "Error Loading Forms",
        description: error.message || "Could not load forms data. Please check console for details.",
        variant: "destructive"
      });
    } finally {
      setLoadingForms(false);
    }
  }, [isAdmin, supabaseClient, toast]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !supabaseClient) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch orders from 'orders' table (includes payment info)
        const { data: ordersData, error: ordersError } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          toast({
            title: "Error Loading Orders",
            description: ordersError.message || "Failed to fetch orders. Please try again.",
            variant: "destructive"
          });
          setOrders([]);
          setLoading(false);
          return;
        }

        // If admin, fetch all orders
        let allOrdersData = [];
        if (isAdmin) {
          const { data: allOrders, error: allOrdersError } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

          if (allOrdersError) {
            console.error('Error fetching all orders:', allOrdersError);
            // If RLS blocks, show message
            if (allOrdersError.message?.includes('permission') || allOrdersError.message?.includes('policy')) {
              toast({
                title: "Admin Access Required",
                description: "Please run ADMIN_ACCESS_SETUP.sql in Supabase to enable admin access.",
                variant: "destructive"
              });
            }
          } else {
            allOrdersData = allOrders || [];
          }
        }

        setOrders(ordersData || []);
        setAllOrders(allOrdersData);

        // If admin, also fetch forms data and manual orders
        if (isAdmin) {
          await fetchFormsData();
          const { data: manualOrdersData, error: manualOrdersError } = await supabaseClient
            .from('manual_orders')
            .select('*')
            .order('created_at', { ascending: false });
          if (!manualOrdersError) setManualOrders(manualOrdersData || []);
          else setManualOrders([]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error Loading Dashboard",
          description: error.message || "Failed to fetch data. Please check your connection and try again.",
          variant: "destructive"
        });
        setOrders([]);
        setAllOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, isAdmin, supabaseClient, fetchFormsData]);

  // Export to CSV function
  const exportToCSV = (data, filename, headers) => {
    if (!data || data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export.",
        variant: "destructive"
      });
      return;
    }

    // Create CSV content
    const csvHeaders = headers.map(h => h.label).join(',');
    const csvRows = data.map(row => {
      return headers.map(h => {
        const value = row[h.key] || '';
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ CSV Exported",
      description: `${filename} has been downloaded successfully.`,
      duration: 3000,
    });
  };

  // Get available months from forms data
  const getAvailableMonths = (forms) => {
    const months = new Set();
    forms.forEach(form => {
      if (form.created_at) {
        const date = new Date(form.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      }
    });
    return Array.from(months).sort().reverse(); // Most recent first
  };

  // Filter forms by month
  const filterFormsByMonth = (forms, monthFilter) => {
    if (monthFilter === 'all') return forms;
    return forms.filter(form => {
      if (!form.created_at) return false;
      const date = new Date(form.created_at);
      const formMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return formMonth === monthFilter;
    });
  };

  // Insurance forms CSV export
  const exportInsuranceForms = () => {
    const filteredForms = filterFormsByMonth(insuranceForms, selectedInsuranceMonth);
    const monthSuffix = selectedInsuranceMonth === 'all' 
      ? 'all' 
      : selectedInsuranceMonth.replace('-', '_');
    
    const headers = [
      { key: 'full_name', label: 'Full Name' },
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'mobile_number', label: 'Mobile Number' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Address' },
      { key: 'insurance_type', label: 'Insurance Type' },
      { key: 'coverage_amount', label: 'Coverage Amount' },
      { key: 'created_at', label: 'Submitted Date' }
    ];
    exportToCSV(filteredForms, `insurance_forms_${monthSuffix}.csv`, headers);
  };

  // Home loan forms CSV export
  const exportHomeLoanForms = () => {
    const filteredForms = filterFormsByMonth(homeLoanForms, selectedHomeLoanMonth);
    const monthSuffix = selectedHomeLoanMonth === 'all' 
      ? 'all' 
      : selectedHomeLoanMonth.replace('-', '_');
    
    const headers = [
      { key: 'full_name', label: 'Full Name' },
      { key: 'father_spouse_name', label: 'Father/Spouse Name' },
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'mobile_number', label: 'Mobile Number' },
      { key: 'alternate_mobile_number', label: 'Alternate Mobile Number' },
      { key: 'email', label: 'Email' },
      { key: 'residential_address', label: 'Residential Address' },
      { key: 'village_mandal_district', label: 'Village/Mandal/District' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'loan_amount', label: 'Loan Amount' },
      { key: 'monthly_income', label: 'Monthly Income' },
      { key: 'created_at', label: 'Submitted Date' }
    ];
    exportToCSV(filteredForms, `home_loan_forms_${monthSuffix}.csv`, headers);
  };

  // Products CSV export with images, weight, and pricing
  const exportProductsCSV = () => {
    if (!products || products.length === 0) {
      toast({
        title: "No Data",
        description: "No products available to export.",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      { key: 'image', label: 'Image URL' },
      { key: 'title', label: 'Product Name' },
      { key: 'weight', label: 'Weight' },
      { key: 'price', label: 'Price (₹)' }
    ];

    const csvData = products.map(product => ({
      image: product.image || '',
      title: product.title || '',
      weight: product.weight || 'N/A',
      price: product.price || 0
    }));

    exportToCSV(csvData, 'products_list_with_images.csv', headers);
  };

  // Format month for display
  const formatMonthDisplay = (monthKey) => {
    if (monthKey === 'all') return 'All Months';
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Loyalty count: from profile when logged in (incremented when order is delivered), else localStorage
  useEffect(() => {
    if (currentUser?.id && supabaseClient) {
      supabaseClient.from('profiles').select('chocolate_orders_completed').eq('id', currentUser.id).maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            setChocoOrders(0);
            return;
          }
          const n = data?.chocolate_orders_completed;
          setChocoOrders(Number.isFinite(n) ? Math.max(0, n) : 0);
        })
        .catch(() => setChocoOrders(0));
    } else {
      try {
        const raw = localStorage.getItem(LOYALTY_KEY);
        const n = parseInt(raw || '0', 10);
        setChocoOrders(Number.isFinite(n) ? Math.max(0, n) : 0);
      } catch {
        setChocoOrders(0);
      }
    }
  }, [currentUser?.id, supabaseClient]);

  // Fetch profile for Profile section (optional address)
  useEffect(() => {
    if (!currentUser?.id || !supabaseClient) return;
    supabaseClient.from('profiles').select('full_name, email, address').eq('id', currentUser.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) return;
        setProfileData(data || null);
        setProfileAddress(data?.address ?? '');
      });
  }, [currentUser?.id, supabaseClient]);

  const handleSaveName = async () => {
    if (!currentUser?.id || !supabaseClient) return;
    const name = tempName.trim();
    setNameSaving(true);
    const { error } = await supabaseClient.from('profiles').update({ full_name: name || null, updated_at: new Date().toISOString() }).eq('id', currentUser.id);
    setNameSaving(false);
    if (error) {
      toast({ title: 'Could not save name', description: error.message, variant: 'destructive' });
      return;
    }
    setProfileData(prev => ({ ...(prev || {}), full_name: name || null }));
    setEditingName(false);
    toast({ title: 'Name saved', description: 'Your name has been updated.' });
  };

  const openAddressModal = () => {
    const raw = profileAddress?.trim() || '';
    if (raw.startsWith('{')) {
      try {
        const o = JSON.parse(raw);
        setAddrFirstName(o.firstName ?? '');
        setAddrLastName(o.lastName ?? '');
        setAddrLine1(o.address1 ?? '');
        setAddrLine2(o.address2 ?? '');
        setAddrCity(o.city ?? '');
        setAddrState(o.state ?? '');
        setAddrPincode(o.pincode ?? '');
        setAddrCountry(o.country ?? 'India');
        setAddrPhone(o.phone ?? '');
      } catch {
        setAddrFirstName(''); setAddrLastName(''); setAddrLine1(''); setAddrLine2(''); setAddrCity(''); setAddrState(''); setAddrPincode(''); setAddrCountry('India'); setAddrPhone('');
      }
    } else if (raw.includes('\n')) {
      const lines = raw.split('\n').map(s => s.trim());
      const nameParts = (lines[0] || '').split(/\s+/);
      setAddrFirstName(nameParts[0] ?? '');
      setAddrLastName(nameParts.slice(1).join(' ') ?? '');
      setAddrLine1(lines[1] ?? '');
      setAddrLine2(lines[2] ?? '');
      setAddrCity(lines[3] ?? '');
      setAddrState('');
      setAddrPincode('');
      setAddrCountry(lines[4] ?? 'India');
      setAddrPhone(lines[5] ?? '');
    } else {
      setAddrFirstName(profileData?.full_name?.split(/\s+/)[0] ?? currentUser?.user_metadata?.name?.split(/\s+/)[0] ?? '');
      setAddrLastName(profileData?.full_name?.split(/\s+/)?.slice(1).join(' ') ?? currentUser?.user_metadata?.name?.split(/\s+/)?.slice(1).join(' ') ?? '');
      setAddrLine1(''); setAddrLine2(''); setAddrCity(''); setAddrState(''); setAddrPincode(''); setAddrCountry('India'); setAddrPhone('');
    }
    setAddressModalOpen(true);
  };

  const formatAddressDisplay = (str) => {
    if (!str?.trim()) return null;
    if (str.trim().startsWith('{')) {
      try {
        const o = JSON.parse(str);
        const lines = [
          [o.firstName, o.lastName].filter(Boolean).join(' '),
          o.address1,
          o.address2,
          o.city && (o.pincode || o.state) ? [o.city, o.state, o.pincode].filter(Boolean).join(' ') : o.city,
          o.country,
          o.phone
        ].filter(Boolean);
        return lines.join('\n');
      } catch {
        return str;
      }
    }
    return str;
  };

  const saveAddressFromModal = async () => {
    if (!currentUser?.id || !supabaseClient) return;
    const payload = {
      firstName: addrFirstName.trim(),
      lastName: addrLastName.trim(),
      address1: addrLine1.trim(),
      address2: addrLine2.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      pincode: addrPincode.trim(),
      country: addrCountry.trim() || 'India',
      phone: addrPhone.trim()
    };
    const stored = JSON.stringify(payload);
    setProfileSaving(true);
    const { error } = await supabaseClient.from('profiles').update({ address: stored, updated_at: new Date().toISOString() }).eq('id', currentUser.id);
    setProfileSaving(false);
    if (error) {
      toast({ title: 'Could not save address', description: error.message, variant: 'destructive' });
      return;
    }
    setProfileData(prev => ({ ...(prev || {}), address: stored }));
    setProfileAddress(stored);
    setAddressModalOpen(false);
    setEditingAddress(false);
    toast({ title: 'Address saved', description: 'Your address has been updated.' });
  };

  // When orders load (guests only): count delivered orders with chocolate and sync to localStorage
  useEffect(() => {
    if (currentUser || !orders || orders.length === 0) return;
    try {
      const countedRaw = localStorage.getItem(LOYALTY_COUNTED_IDS_KEY);
      const counted = new Set(Array.isArray(JSON.parse(countedRaw || '[]')) ? JSON.parse(countedRaw || '[]') : []);
      const hasChocolate = (order) => (order?.items || []).some((item) => (String(item?.category || '').toLowerCase() === 'chocolate'));
      const deliveredWithChocolate = orders.filter((o) => o?.status === 'delivered' && hasChocolate(o));
      let current = parseInt(localStorage.getItem(LOYALTY_KEY) || '0', 10);
      let changed = false;
      deliveredWithChocolate.forEach((order) => {
        if (order?.id && !counted.has(order.id)) {
          counted.add(order.id);
          current = Math.max(0, current + 1);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(LOYALTY_KEY, String(current));
        localStorage.setItem(LOYALTY_COUNTED_IDS_KEY, JSON.stringify([...counted]));
        setChocoOrders(current);
      }
    } catch (_) {}
  }, [currentUser, orders]);

  // Load products and stock for admin (from Supabase first so all users see same stock)
  useEffect(() => {
    if (!isAdmin) return;
    const chocolateProducts = searchData.filter(item => item.type === 'Product' && item.category === 'Chocolate');
    setProducts(chocolateProducts);

    (async () => {
      try {
        const { data: serverRows, error } = await supabaseClient.from(PRODUCT_STOCK_TABLE).select('product_id, stock');
        const parsed = (() => {
          try {
            const s = localStorage.getItem(STOCK_STORAGE_KEY);
            return s ? JSON.parse(s) : {};
          } catch {
            return {};
          }
        })();
        const merged = {};
        chocolateProducts.forEach((product) => {
          const fromServer = !error && serverRows?.length
            ? serverRows.find((r) => r.product_id === product.id)
            : null;
          const serverVal = fromServer != null && Number.isFinite(Number(fromServer.stock)) ? Number(fromServer.stock) : undefined;
          const saved = parsed[product.id];
          merged[product.id] = serverVal !== undefined
            ? serverVal
            : (saved !== undefined && saved !== null && Number.isFinite(Number(saved)))
              ? Number(saved)
              : (Number(product.stock) || 10);
        });
        setStockValues(merged);
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(merged));

        // Sync to Supabase in background so dashboard stays fast
        const rows = chocolateProducts.map((product) => ({
          product_id: product.id,
          stock: merged[product.id] ?? Number(product.stock) ?? 10
        }));
        supabaseClient.from(PRODUCT_STOCK_TABLE).upsert(rows, { onConflict: 'product_id' }).then(() => {}, () => {});
      } catch (error) {
        console.error('Error loading stock:', error);
        const initialStock = {};
        chocolateProducts.forEach((product) => {
          const s = Number(product.stock);
          initialStock[product.id] = Number.isFinite(s) ? s : 10;
        });
        setStockValues(initialStock);
        try {
          localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(initialStock));
        } catch (_) {}
      }
    })();
  }, [isAdmin, supabaseClient]);

  // When stock is updated in another tab (e.g. after an order), refresh admin stock list
  useEffect(() => {
    if (!isAdmin) return;
    const onStorage = (e) => {
      if (e.key === STOCK_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setStockValues(parsed);
        } catch (_) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isAdmin]);

  // Save stock update – instant UI update, then sync to Supabase in background (fast & user-friendly)
  const handleSaveStock = (productId) => {
    const newValue = parseInt(tempStockValue, 10);
    if (isNaN(newValue) || newValue < 0) {
      toast({
        title: "Invalid stock",
        description: "Please enter 0 or a positive number.",
        variant: "destructive"
      });
      return;
    }

    const saved = localStorage.getItem(STOCK_STORAGE_KEY);
    const current = saved ? JSON.parse(saved) : {};
    current[productId] = newValue;
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(current));
    setStockValues((prev) => ({ ...prev, [productId]: newValue }));
    setEditingProductId(null);
    setTempStockValue('');
    toast({ title: "Stock updated", description: "Saved. Syncing to server…", variant: "default" });

    const promise = supabaseClient.from(PRODUCT_STOCK_TABLE).upsert(
      { product_id: productId, stock: newValue },
      { onConflict: 'product_id' }
    );
    if (promise && typeof promise.then === 'function') {
      promise.then(
        ({ error }) => {
          if (error) {
            console.error('Supabase stock save:', error);
            toast({
              title: "Saved locally",
              description: "Could not sync to server. Check connection and try saving again.",
              variant: "destructive"
            });
          }
        },
        () => {
          toast({
            title: "Saved locally",
            description: "Could not sync to server. Check connection and try saving again.",
            variant: "destructive"
          });
        }
      );
    }
  };

  // Start editing stock
  const handleEditStock = (productId, currentStock) => {
    setEditingProductId(productId);
    setTempStockValue(currentStock.toString());
  };

  const nextRewardAt = (Math.floor(chocoOrders / 10) + 1) * 10;
  const progressInCycle = chocoOrders % 10;

  // Function to update payment status
  const updatePaymentStatus = async (orderId, newStatus, currentOrderStatus = 'pending') => {
    if (!isAdmin) return;

    setUpdatingOrderId(orderId);
    try {
      // Map 'confirmed' to 'success' to match database constraint
      const mappedStatus = newStatus === 'confirmed' ? 'success' : newStatus;

      // Fetch current order so we only reduce stock when first confirming payment (not if already success)
      const { data: orderBeforeUpdate } = await supabaseClient
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single();
      const previousPaymentStatus = orderBeforeUpdate?.payment_status;

      // When payment is confirmed, automatically move to 'processing' if still pending
      const updateData = {
        payment_status: mappedStatus
      };
      
      if (mappedStatus === 'success' && (currentOrderStatus === 'pending' || !currentOrderStatus)) {
        updateData.status = 'processing';
      }

      const { error } = await supabaseClient
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Get order details for email notification
      const { data: updatedOrder } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      // Reduce stock only when payment is first confirmed (not when already success)
      const shouldReduceStock = mappedStatus === 'success' && previousPaymentStatus !== 'success' && updatedOrder?.items?.length > 0;
      if (shouldReduceStock) {
        try {
          const productIds = [...new Set((updatedOrder.items || []).map((i) => i.id).filter(Boolean))];
          if (productIds.length === 0) return;

          const { data: serverRows } = await supabaseClient.from(PRODUCT_STOCK_TABLE).select('product_id, stock').in('product_id', productIds);
          const chocolateProducts = searchData.filter((item) => item.type === 'Product' && item.category === 'Chocolate');
          const getDefaultStock = (productId) => {
            const p = chocolateProducts.find((x) => x.id === productId);
            return Number(p?.stock) ?? 10;
          };
          const currentStock = {};
          (serverRows || []).forEach((r) => { currentStock[r.product_id] = Number(r.stock); });
          const newStock = { ...currentStock };
          (updatedOrder.items || []).forEach((item) => {
            const id = item.id;
            if (!id) return;
            const qty = parseInt(item.quantity, 10) || 0;
            const num = currentStock[id] !== undefined && Number.isFinite(currentStock[id])
              ? currentStock[id]
              : (() => {
                  try {
                    const s = localStorage.getItem(STOCK_STORAGE_KEY);
                    const parsed = s ? JSON.parse(s) : {};
                    const v = parsed[id];
                    return (v !== undefined && v !== null && Number.isFinite(Number(v))) ? Number(v) : getDefaultStock(id);
                  } catch {
                    return getDefaultStock(id);
                  }
                })();
            newStock[id] = Math.max(0, (newStock[id] ?? num) - qty);
          });

          const toUpsert = Object.entries(newStock).map(([product_id, stockVal]) => ({ product_id, stock: stockVal }));
          if (toUpsert.length > 0) {
            await supabaseClient.from(PRODUCT_STOCK_TABLE).upsert(toUpsert, { onConflict: 'product_id' });
            const saved = localStorage.getItem(STOCK_STORAGE_KEY);
            const local = saved ? JSON.parse(saved) : {};
            toUpsert.forEach(({ product_id, stock: stockVal }) => { local[product_id] = stockVal; });
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(local));
            setStockValues((prev) => ({ ...prev, ...Object.fromEntries(toUpsert.map(({ product_id, stock }) => [product_id, stock])) }));
          }
        } catch (e) {
          console.error('Error reducing stock on payment confirm:', e);
        }
      }

      // Send email notification to user about payment status update
      if (updatedOrder && (updatedOrder.email || updatedOrder.user_email)) {
        const userEmail = updatedOrder.email || updatedOrder.user_email;
        // Extract customer name from email or use a default
        const customerName = userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Valued Customer';
        
        try {
          const { error: emailError } = await supabaseClient.functions.invoke('send-order-email', {
            body: {
              to: userEmail,
              orderNumber: updatedOrder.order_number || 'N/A',
              customerName: customerName,
              paymentStatus: mappedStatus,
              orderStatus: updateData.status || updatedOrder.status || 'pending',
              type: 'payment_update'
            }
          });
          if (emailError) {
            console.error("Email notification failed:", emailError);
            // Don't show error to admin - email is optional
          } else {
            console.log("✅ Payment status update email sent successfully");
          }
        } catch (emailErr) {
          console.error("Email notification error:", emailErr);
          // Don't show error to admin - email is optional
        }
      }

      toast({
        title: "Payment Status Updated",
        description: `Payment status changed to ${newStatus}`,
        variant: "default"
      });

      // Refresh orders
      const { data: ordersData } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (isAdmin) {
        const { data: allOrders } = await supabaseClient
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        setAllOrders(allOrders || []);
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update payment status",
        variant: "destructive"
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Function to get next valid statuses for an order
  const getNextValidStatuses = (currentStatus, paymentStatus, deliveryType) => {
    if (!currentStatus) currentStatus = 'pending';
    const isPickup = deliveryType === 'pickup';
    // Map shipped/out_for_delivery to ready_to_pickup for pickup orders (legacy)
    const mapped = isPickup && (currentStatus === 'shipped' || currentStatus === 'out_for_delivery') ? 'ready_to_pickup' : currentStatus;
    const flow = isPickup ? PICKUP_STATUS_FLOW : STATUS_FLOW;
    const next = flow[mapped] || flow[currentStatus] || [];
    const isPaymentConfirmed = paymentStatus === 'success' || paymentStatus === 'paid' || paymentStatus === 'confirmed';
    if (!isPaymentConfirmed && currentStatus === 'pending') {
      return isAdmin ? ['cancelled'] : [];
    }
    return next;
  };

  // Function to normalize status from database (handle both formats)
  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    // Handle both hyphen and underscore formats
    return status.replace(/-/g, '_');
  };

  const [updatingOrderTrackingId, setUpdatingOrderTrackingId] = useState(null);
  const [orderTrackingInputs, setOrderTrackingInputs] = useState({});
  const updateOrderTracking = async (orderId, tracking_number) => {
    if (!isAdmin || !supabaseClient) return;
    setUpdatingOrderTrackingId(orderId);
    try {
      const { error } = await supabaseClient
        .from('orders')
        .update({ tracking_number: tracking_number?.trim() || null })
        .eq('id', orderId);
      if (error) throw error;
      toast({ title: 'Tracking updated', description: 'Tracking number saved.', variant: 'default' });
      await refreshOrdersList();
      if (isAdmin) {
        const { data: allOrders } = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
        setAllOrders(allOrders || []);
      }
      setOrderTrackingInputs((prev) => ({ ...prev, [orderId]: undefined }));
    } catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to save tracking', variant: 'destructive' });
    } finally {
      setUpdatingOrderTrackingId(null);
    }
  };

  // Function to update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!isAdmin) return;

    setUpdatingOrderId(orderId);
    try {
      // Try the status as-is first
      let { error } = await supabaseClient
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      // If failed, try with hyphen instead of underscore
      if (error && newStatus.includes('_')) {
        const hyphenStatus = newStatus.replace(/_/g, '-');
        const retryResult = await supabaseClient
          .from('orders')
          .update({ status: hyphenStatus })
          .eq('id', orderId);
        error = retryResult.error;
      }

      if (error) {
        throw error;
      }

      // Get order details for email notification and loyalty
      const { data: updatedOrder } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      // When order is marked delivered: increment Loyalty (chocolate_orders_completed) for that user
      if (updatedOrder && (newStatus === 'delivered' || newStatus === 'delivered'.replace(/_/g, '-'))) {
        supabaseClient.functions.invoke('increment-loyalty-on-delivered', { body: { order_id: orderId } })
          .then(() => {})
          .catch(() => {});
      }

      // Send email notification to user about order status update
      if (updatedOrder && (updatedOrder.email || updatedOrder.user_email)) {
        const userEmail = updatedOrder.email || updatedOrder.user_email;
        // Extract customer name from email or use a default
        const customerName = userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Valued Customer';
        
        try {
          const { error: emailError } = await supabaseClient.functions.invoke('send-order-email', {
            body: {
              to: userEmail,
              orderNumber: updatedOrder.order_number || 'N/A',
              customerName: customerName,
              orderStatus: newStatus,
              statusLabel: ORDER_STATUSES[newStatus]?.label || newStatus,
              statusDescription: ORDER_STATUSES[newStatus]?.description || '',
              type: 'status_update'
            }
          });
          if (emailError) {
            console.error("Email notification failed:", emailError);
            // Don't show error to admin - email is optional
          } else {
            console.log("✅ Order status update email sent successfully");
          }
        } catch (emailErr) {
          console.error("Email notification error:", emailErr);
          // Don't show error to admin - email is optional
        }
      }

      const statusLabel = ORDER_STATUSES[newStatus]?.label || newStatus;
      toast({
        title: "Order Status Updated",
        description: `Order status changed to ${statusLabel}`,
        variant: "default"
      });

      // Refresh orders
      const { data: ordersData } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (isAdmin) {
        const { data: allOrders } = await supabaseClient
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        setAllOrders(allOrders || []);
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update order status",
        variant: "destructive"
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Refresh orders list (user + admin)
  const refreshOrdersList = useCallback(async () => {
    if (!currentUser || !supabaseClient) return;
    setOrdersLoadingRefresh(true);
    try {
      const { data: ordersData } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      setOrders(ordersData || []);
      if (isAdmin) {
        const { data: allOrders } = await supabaseClient
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        setAllOrders(allOrders || []);
      }
    } finally {
      setOrdersLoadingRefresh(false);
    }
  }, [currentUser?.id, supabaseClient, isAdmin]);

  const refreshManualOrders = useCallback(async () => {
    if (!isAdmin || !supabaseClient) return;
    const { data } = await supabaseClient.from('manual_orders').select('*').order('created_at', { ascending: false });
    setManualOrders(data || []);
  }, [isAdmin, supabaseClient]);

  const updateManualOrderStatus = async (id, status) => {
    if (!isAdmin || !supabaseClient) return;
    setUpdatingManualOrderId(id);
    try {
      const { error } = await supabaseClient.from('manual_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Status updated', description: 'Manual order status updated.', variant: 'default' });
      await refreshManualOrders();
    } catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to update status', variant: 'destructive' });
    } finally {
      setUpdatingManualOrderId(null);
    }
  };

  const [updatingManualTrackingId, setUpdatingManualTrackingId] = useState(null);
  const [manualTrackingInputs, setManualTrackingInputs] = useState({});
  const updateManualOrderTracking = async (id, tracking_number) => {
    if (!isAdmin || !supabaseClient) return;
    setUpdatingManualTrackingId(id);
    try {
      const { error } = await supabaseClient.from('manual_orders').update({ tracking_number: tracking_number?.trim() || null, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Tracking updated', description: 'Tracking number saved.', variant: 'default' });
      await refreshManualOrders();
      setManualTrackingInputs((prev) => ({ ...prev, [id]: undefined }));
    } catch (err) {
      toast({ title: 'Error', description: err?.message || 'Failed to save tracking', variant: 'destructive' });
    } finally {
      setUpdatingManualTrackingId(null);
    }
  };

  // User: cancel own order (only when payment failed or pending)
  const cancelOrderForUser = async (orderId) => {
    if (!currentUser || !supabaseClient) return;
    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabaseClient
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      toast({ title: 'Order cancelled', description: 'Your order has been cancelled.', variant: 'default' });
      await refreshOrdersList();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Could not cancel order',
        description: error.message || 'Please try again or contact support.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // User: repay – submit new transaction ID for failed/pending order
  const openRepayModal = (order) => {
    setRepayModalOrder(order);
    setRepayTransactionId('');
  };
  const closeRepayModal = () => {
    setRepayModalOrder(null);
    setRepayTransactionId('');
  };
  const submitRepayOrder = async () => {
    if (!repayModalOrder || !repayTransactionId?.trim() || !supabaseClient) return;
    const tid = repayTransactionId.trim();
    if (tid.length < 8) {
      toast({ title: 'Invalid Transaction ID', description: 'Please enter your Transaction ID (at least 8 characters).', variant: 'destructive' });
      return;
    }
    setRepaySubmitting(true);
    try {
      const { data: existingOrder } = await supabaseClient
        .from('orders')
        .select('id')
        .eq('transaction_id', tid)
        .maybeSingle();

      if (existingOrder && existingOrder.id !== repayModalOrder.id) {
        toast({
          title: 'Transaction ID already used',
          description: 'This Transaction ID was already used for another order. Please enter a different ID or make a new payment.',
          variant: 'destructive',
          duration: 6000
        });
        setRepaySubmitting(false);
        return;
      }

      const { error } = await supabaseClient
        .from('orders')
        .update({ transaction_id: tid, payment_status: 'pending' })
        .eq('id', repayModalOrder.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      toast({
        title: 'Payment details updated',
        description: 'We’ll confirm your payment shortly. You can check back here for status.',
        variant: 'default'
      });
      closeRepayModal();
      await refreshOrdersList();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'You may not have permission to update this order. Try again or contact support.',
        variant: 'destructive'
      });
    } finally {
      setRepaySubmitting(false);
    }
  };

  // Two-card profile content: name/email (left), addresses (right on desktop)
  const profileCardsContent = (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 text-left hover:shadow-xl transition-shadow">
        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-3">Account</p>
        <div className="flex items-center justify-between gap-2">
          {editingName ? (
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Your name"
                className="flex-1 min-w-[160px] rounded-lg border border-gray-200 px-3 py-2 text-base font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName} disabled={nameSaving || !tempName.trim()} className="bg-blue-600 hover:bg-blue-700">
                {nameSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
              <button type="button" onClick={() => { setEditingName(false); setTempName(''); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          ) : (
            <>
              <p className="text-gray-900 font-semibold text-lg">{profileData?.full_name || currentUser?.user_metadata?.name || '—'}</p>
              <button type="button" onClick={() => { setEditingName(true); setTempName(profileData?.full_name || currentUser?.user_metadata?.name || ''); }} className="text-blue-600 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50 transition-colors" aria-label="Edit name">
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-4">Email</p>
        <p className="text-gray-900 font-medium mt-0.5">{currentUser?.email || profileData?.email || '—'}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 text-left hover:shadow-xl transition-shadow">
        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-3">Addresses</p>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Default address</span>
          <button type="button" onClick={openAddressModal} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">+ Add</button>
        </div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm text-gray-500">Add or edit your delivery address</p>
          <button type="button" onClick={openAddressModal} className="text-blue-600 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50 transition-colors" aria-label="Edit address">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        <div className="text-gray-900 text-sm mt-2 whitespace-pre-line leading-relaxed">{formatAddressDisplay(profileAddress) || 'No address added yet.'}</div>
      </div>
    </>
  );

  useEffect(() => {
    if (currentUser?.id && ensureProfile && showSetPassword) {
      ensureProfile(currentUser);
    }
  }, [currentUser?.id, ensureProfile, showSetPassword]);

  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (setPasswordNew.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (setPasswordNew !== setPasswordConfirm) {
      toast({ title: "Passwords don't match", description: 'Please re-enter.', variant: 'destructive' });
      return;
    }
    setSetPasswordLoading(true);
    try {
      const { error } = await supabaseClient.auth.updateUser({ password: setPasswordNew });
      if (error) throw error;
      toast({ title: 'Password set', description: "You can use it next time to sign in.", duration: 3000 });
      setSearchParams({}, { replace: true });
    } catch (err) {
      toast({ title: 'Could not set password', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSetPasswordLoading(false);
    }
  };

  const handleSetPasswordSkip = () => {
    setSearchParams({}, { replace: true });
  };

  if (loading) {
    return (
      <>
        <SEO title="My account" description="Ahnupha account dashboard." path="/dashboard" noindex />
        <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-rose-600" /></div>
      </>
    );
  }

  if (showSetPassword && currentUser) {
    return (
      <>
        <SEO title="Account setup" description="Ahnupha account." path="/dashboard" noindex />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-200"
        >
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Create a password</h2>
            <p className="text-sm text-gray-500 mt-1">Use it next time to sign in quickly. You can skip and set it later.</p>
          </div>
          <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input type="password" value={setPasswordNew} onChange={(e) => setSetPasswordNew(e.target.value)} placeholder="At least 6 characters" className="h-11" minLength={6} autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <Input type="password" value={setPasswordConfirm} onChange={(e) => setSetPasswordConfirm(e.target.value)} placeholder="Re-enter password" className="h-11" autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full h-11 bg-rose-600 hover:bg-rose-700" disabled={setPasswordLoading}>
              {setPasswordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Save & continue</>}
            </Button>
            <button type="button" onClick={handleSetPasswordSkip} className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2 block">Skip for now</button>
          </form>
        </motion.div>
      </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50 py-4 sm:py-6 overflow-x-hidden">
      <SEO title="My orders & account" description="View your Ahnupha orders and profile." path="/dashboard" noindex />
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
        <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 bg-white p-4 sm:p-5 rounded-xl shadow-lg border-2 border-rose-100/50 bg-gradient-to-br from-white to-rose-50/20 flex flex-col sm:flex-row items-center sm:items-center gap-4 text-center sm:text-left"
        >
          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <User className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">{currentUser?.user_metadata?.name || 'User'}</span>!
            </h1>
            <p className="text-sm sm:text-base text-gray-500 truncate max-w-full">{currentUser?.email}</p>
          </div>
        </motion.div>

        {/* Quick jump to sections - touch-friendly tap targets */}
        <nav className="flex flex-wrap gap-2 sm:gap-3 mb-4" aria-label="Dashboard sections">
          <a href="#profile" className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation">
            Profile
          </a>
          <a href="#orders" className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 rounded-xl bg-rose-100 text-rose-700 font-medium text-sm hover:bg-rose-200 active:bg-rose-300 transition-colors touch-manipulation">
            Orders
          </a>
          {isAdmin && (
            <>
              <a href="#stock" className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation">
                Stock
              </a>
              <a href="#forms" className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation">
                Forms
              </a>
              <a href="#manual-orders" className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation">
                Manual Orders
              </a>
            </>
          )}
        </nav>

        {/* Profile Section - hidden when Orders is selected so Orders view is clean */}
        {currentSection !== 'orders' && (
        <motion.div
          id="profile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="mb-4 bg-white rounded-xl shadow-lg border-2 border-rose-100/50 bg-gradient-to-br from-white to-rose-50/20 overflow-hidden"
        >
          <button
            onClick={() => navigate(currentSection === 'profile' ? '/dashboard' : '/dashboard#profile')}
            aria-expanded={currentSection === 'profile'}
            className="w-full flex items-center justify-between min-h-[56px] p-4 sm:p-5 hover:bg-rose-50/50 active:bg-rose-50 transition-colors cursor-pointer touch-manipulation text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <User className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Profile</h2>
                <p className="text-xs sm:text-sm text-gray-500">View your details and optional address</p>
              </div>
            </div>
            <span className="shrink-0 text-rose-600 ml-2" aria-hidden>{currentSection === 'profile' ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6 text-gray-600" />}</span>
          </button>

          {currentSection === 'profile' && (
            <div className="px-4 sm:px-5 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-4xl text-left items-start">{profileCardsContent}</div>
            </div>
          )}
        </motion.div>
        )}

        {/* Loyalty Offer - Hidden for admin */}
        {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-4 bg-white p-4 sm:p-5 rounded-xl shadow-lg border-2 border-rose-100/50 bg-gradient-to-br from-white to-amber-50/20"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">🎁 Loyalty Offer</h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Get <span className="font-bold text-gray-900">₹200 off</span> or get a <span className="font-bold text-gray-900">free chocolate worth ₹250</span> on your <span className="font-bold text-gray-900">10th order</span>.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Reward selection happens automatically at checkout on your eligible order.
              </p>
            </div>

            <div className="md:text-right">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 text-sm font-extrabold text-rose-700">
                {progressInCycle}/10
              </div>
              <div className="text-xs font-bold text-gray-600 mt-2">
                Next reward at #{nextRewardAt}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-rose-100 bg-white">
              <p className="text-xs font-semibold text-gray-500 uppercase">Completed</p>
              <p className="text-lg font-extrabold text-gray-900">{chocoOrders}</p>
            </div>
            <div className="p-4 rounded-lg border border-rose-100 bg-white">
              <p className="text-xs font-semibold text-gray-500 uppercase">This cycle</p>
              <p className="text-lg font-extrabold text-gray-900">{progressInCycle} / 10</p>
            </div>
            <div className="p-4 rounded-lg border border-rose-100 bg-white">
              <p className="text-xs font-semibold text-gray-500 uppercase">Remaining</p>
              <p className="text-lg font-extrabold text-gray-900">{10 - progressInCycle}</p>
            </div>
          </div>
        </motion.div>
        )}

        {/* Stock Management Section - Admin Only */}
        {isAdmin && (
          <motion.div
            id="stock"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mb-4 bg-white rounded-xl shadow-lg border-2 border-rose-100/50 bg-gradient-to-br from-white to-rose-50/20 overflow-hidden"
          >
            <button
              onClick={() => navigate(currentSection === 'stock' ? '/dashboard' : '/dashboard#stock')}
              aria-expanded={currentSection === 'stock'}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-rose-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <PackageX className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900">Stock Management</h2>
                  <p className="text-sm text-gray-500">Update product stock levels</p>
                </div>
              </div>
              <ChevronDown className="h-6 w-6 text-gray-600" />
            </button>
            
            {currentSection === 'stock' && (
              <div className="px-6 pb-6">
                <div className="flex items-center justify-end mb-4">
                  <Button
                    onClick={exportProductsCSV}
                    disabled={products.length === 0}
                    className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Products to CSV
                  </Button>
                </div>
                <div className="space-y-3">
              {products.map((product) => {
                const currentStock = (stockValues[product.id] !== undefined && stockValues[product.id] !== null)
                  ? Number(stockValues[product.id])
                  : (Number(product.stock) || 0);
                const isEditing = editingProductId === product.id;
                const isLowStock = currentStock <= 3;
                const isOutOfStock = currentStock === 0;

                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isOutOfStock
                        ? 'bg-red-50 border-red-200'
                        : isLowStock
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.imageAlt || product.title}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{product.title}</h3>
                          <p className="text-sm text-gray-500">{product.category}</p>
                          <p className="text-xs text-gray-400 mt-0.5">ID: {product.id} — set each row to 0 for “Out of stock” on site</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(e.target.value)}
                              className="w-24 px-3 py-2 border-2 border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-center font-bold"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveStock(product.id);
                                }
                              }}
                            />
                            <Button
                              onClick={() => handleSaveStock(product.id)}
                              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white"
                              size="sm"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingProductId(null);
                                setTempStockValue('');
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="text-right">
                              <div className={`text-2xl font-extrabold ${
                                isOutOfStock
                                  ? 'text-red-700'
                                  : isLowStock
                                    ? 'text-amber-700'
                                    : 'text-gray-900'
                              }`}>
                                {currentStock}
                              </div>
                              <div className="text-xs font-semibold text-gray-500 uppercase">
                                {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleEditStock(product.id, currentStock)}
                              variant="outline"
                              size="sm"
                              className="border-rose-300 text-rose-600 hover:bg-rose-50"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Forms Management Section - Admin Only */}
        {isAdmin && (
          <motion.div
            id="forms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.09 }}
            className="mb-4 bg-white rounded-xl shadow-lg border-2 border-rose-100/50 bg-gradient-to-br from-white to-rose-50/20 overflow-hidden"
          >
            <button
              onClick={() => navigate(currentSection === 'forms' ? '/dashboard' : '/dashboard#forms')}
              aria-expanded={currentSection === 'forms'}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-blue-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900">Forms Management</h2>
                  <p className="text-sm text-gray-500">View and export insurance and home loan forms</p>
                </div>
              </div>
              <ChevronDown className="h-6 w-6 text-gray-600" />
            </button>
            
            {currentSection === 'forms' && (
              <div className="px-6 pb-6">
                <div className="flex items-center justify-end mb-6">
                  <Button
                    onClick={fetchFormsData}
                    disabled={loadingForms}
                    variant="outline"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingForms ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveFormsTab('insurance')}
                className={`px-4 py-2 font-semibold text-sm transition-all ${
                  activeFormsTab === 'insurance'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 inline mr-2" />
                Insurance Forms ({insuranceForms.length})
              </button>
              <button
                onClick={() => setActiveFormsTab('homeloan')}
                className={`px-4 py-2 font-semibold text-sm transition-all ${
                  activeFormsTab === 'homeloan'
                    ? 'border-b-2 border-emerald-500 text-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Home Loan Forms ({homeLoanForms.length})
              </button>
            </div>

            {/* Forms Table */}
            {loadingForms ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeFormsTab === 'insurance' ? (
                  <div>
                    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700">Filter by Month:</label>
                        <select
                          value={selectedInsuranceMonth}
                          onChange={(e) => setSelectedInsuranceMonth(e.target.value)}
                          className="px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                        >
                          <option value="all">All Months</option>
                          {getAvailableMonths(insuranceForms).map(month => (
                            <option key={month} value={month}>
                              {formatMonthDisplay(month)}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-600">
                          ({filterFormsByMonth(insuranceForms, selectedInsuranceMonth).length} forms)
                        </span>
                      </div>
                      <Button
                        onClick={exportInsuranceForms}
                        disabled={insuranceForms.length === 0}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export {selectedInsuranceMonth === 'all' ? 'All' : formatMonthDisplay(selectedInsuranceMonth)} to CSV
                      </Button>
                    </div>
                    {insuranceForms.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No insurance forms submitted yet</p>
                      </div>
                    ) : filterFormsByMonth(insuranceForms, selectedInsuranceMonth).length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No forms found for selected month</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                              <th className="border border-gray-200 px-4 py-3 text-center text-sm font-bold text-gray-700 w-16">S.No</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Full Name</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Date of Birth</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Gender</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Mobile</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Email</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Address</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Submitted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterFormsByMonth(insuranceForms, selectedInsuranceMonth).map((form, index) => (
                              <tr key={form.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700 text-center font-semibold">{index + 1}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">{form.full_name || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.date_of_birth ? new Date(form.date_of_birth).toLocaleDateString() : '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.gender || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.mobile_number || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.email || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={form.address}>{form.address || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.created_at ? new Date(form.created_at).toLocaleString() : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700">Filter by Month:</label>
                        <select
                          value={selectedHomeLoanMonth}
                          onChange={(e) => setSelectedHomeLoanMonth(e.target.value)}
                          className="px-4 py-2 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 font-medium"
                        >
                          <option value="all">All Months</option>
                          {getAvailableMonths(homeLoanForms).map(month => (
                            <option key={month} value={month}>
                              {formatMonthDisplay(month)}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-600">
                          ({filterFormsByMonth(homeLoanForms, selectedHomeLoanMonth).length} forms)
                        </span>
                      </div>
                      <Button
                        onClick={exportHomeLoanForms}
                        disabled={homeLoanForms.length === 0}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export {selectedHomeLoanMonth === 'all' ? 'All' : formatMonthDisplay(selectedHomeLoanMonth)} to CSV
                      </Button>
                    </div>
                    {homeLoanForms.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No home loan forms submitted yet</p>
                      </div>
                    ) : filterFormsByMonth(homeLoanForms, selectedHomeLoanMonth).length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No forms found for selected month</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50">
                              <th className="border border-gray-200 px-4 py-3 text-center text-sm font-bold text-gray-700 w-16">S.No</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Full Name</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Father/Spouse</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Mobile</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Email</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">District</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Loan Amount</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Monthly Income</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-700">Submitted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterFormsByMonth(homeLoanForms, selectedHomeLoanMonth).map((form, index) => (
                              <tr key={form.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50 transition-colors`}>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700 text-center font-semibold">{index + 1}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">{form.full_name || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.father_spouse_name || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.mobile_number || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.email || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.village_mandal_district || '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.loan_amount ? `₹${Number(form.loan_amount).toLocaleString('en-IN')}` : '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.monthly_income ? `₹${Number(form.monthly_income).toLocaleString('en-IN')}` : '-'}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{form.created_at ? new Date(form.created_at).toLocaleString() : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
              </div>
            )}
          </motion.div>
        )}

        {/* Manual Orders Section - Admin Only: status update here */}
        {isAdmin && (
          <motion.div
            id="manual-orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 bg-white rounded-xl shadow-lg border-2 border-rose-100/50 bg-gradient-to-br from-white to-rose-50/20 overflow-hidden"
          >
            <button
              onClick={() => navigate(currentSection === 'manual-orders' ? '/dashboard' : '/dashboard#manual-orders')}
              aria-expanded={currentSection === 'manual-orders'}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-rose-50/50 transition-colors cursor-pointer touch-manipulation"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900">Manual Orders</h2>
                  <p className="text-sm text-gray-500">Insta/WhatsApp orders – update status here</p>
                </div>
              </div>
              <ChevronDown className="h-6 w-6 text-gray-600" />
            </button>
            {currentSection === 'manual-orders' && (
              <div className="px-4 sm:px-6 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>Sort by status:</span>
                    <select
                      value={manualOrderStatusFilter}
                      onChange={(e) => setManualOrderStatusFilter(e.target.value)}
                      className="min-h-[44px] rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-rose-200 focus:border-rose-300 bg-white"
                      aria-label="Filter manual orders by status"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="ready">Ready</option>
                      <option value="shipping">Shipping</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  <Button variant="outline" size="sm" onClick={refreshManualOrders} className="border-rose-200 text-rose-600 hover:bg-rose-50 min-h-[44px] touch-manipulation">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh orders
                  </Button>
                </div>
                {(() => {
                  const filteredManual = manualOrderStatusFilter === 'all'
                    ? manualOrders
                    : manualOrders.filter((mo) => (mo.status || 'pending') === manualOrderStatusFilter);
                  if (filteredManual.length === 0) {
                    return (
                      <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-rose-100/50 text-center">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">
                          {manualOrders.length === 0 ? 'No manual orders found' : `No manual orders with status "${manualOrderStatusFilter}"`}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {manualOrders.length === 0 ? 'Add orders from the Manual Orders (Handicraft) page.' : 'Try a different status filter.'}
                        </p>
                      </div>
                    );
                  }
                  // Permanent order number by creation order: first order MO-001, second MO-002, etc.
                  const sortedByCreated = [...manualOrders].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
                  const orderIdToSeq = {};
                  sortedByCreated.forEach((mo, idx) => { orderIdToSeq[mo.id] = String(idx + 1).padStart(3, '0'); });
                  return (
                  <div className="space-y-3">
                    {filteredManual.map((mo, index) => {
                      const items = Array.isArray(mo?.items) ? mo.items : [];
                      const subtotal = items.length ? items.reduce((s, i) => s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0), 0) : (Number(mo.unit_price) || 0) * (Number(mo.quantity) || 1);
                      const shippingRaw = Number(mo.shipping_amount);
                      const shipping = Number.isFinite(shippingRaw) ? shippingRaw : (mo.collecting_type === 'parcel' ? MANUAL_ORDER_PARCEL_SHIPPING : 0);
                      const total = Number(mo.total) ?? (subtotal + shipping);
                      const seq = orderIdToSeq[mo.id] || String(index + 1).padStart(3, '0');
                      const sourceIcon = (mo.source || '').toLowerCase().includes('instagram') ? Instagram : MessageCircle;
                      // Delivered = green; all other = light red (easy to see which are not yet delivered)
                      const statusClass = mo.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700 border border-red-100';
                      const isExpanded = expandedManualOrderId === mo.id;
                      const STORE_ADDRESS = '1-6-141/43/A2/C, Sri Ram nagar, Near new vision school, Suryapet, 508213';
                      return (
                        <div key={mo.id} className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-colors ${isExpanded ? 'border-rose-300 bg-rose-50/30 shadow-rose-100' : 'border-rose-100/50'}`}>
                          {/* Summary row: left = expand, right = status update in heading */}
                          <div className="flex flex-wrap items-center gap-2 min-h-[52px] p-4">
                            <button
                              type="button"
                              onClick={() => setExpandedManualOrderId(isExpanded ? null : mo.id)}
                              className="flex flex-wrap items-center gap-3 flex-1 min-w-0 text-left hover:bg-rose-50/30 active:bg-rose-50/50 rounded-lg transition-colors touch-manipulation py-1 -my-1 px-1 -mx-1"
                              aria-expanded={isExpanded}
                              aria-controls={`manual-order-details-${mo.id}`}
                              id={`manual-order-summary-${mo.id}`}
                            >
                              <span className="font-bold text-gray-900">#MO-{seq}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {sourceIcon === Instagram ? <Instagram className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
                                {mo.source === 'instagram' ? 'Instagram' : mo.source === 'whatsapp' ? 'WhatsApp' : mo.source || '—'}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${mo.collecting_type === 'pickup' ? 'bg-amber-100 text-amber-800' : mo.collecting_type === 'parcel' ? 'bg-violet-100 text-violet-800' : mo.collecting_type === 'rapido' ? 'bg-rose-100 text-rose-800' : 'bg-green-100 text-green-800'}`}>
                                {mo.collecting_type === 'pickup' ? 'Pickup' : mo.collecting_type === 'parcel' ? 'Parcel' : mo.collecting_type === 'rapido' ? 'Rapido' : 'Delivery'}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusClass}`} title="Order status">
                                {(mo.status || 'pending').charAt(0).toUpperCase() + (mo.status || 'pending').slice(1)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {mo.created_at ? new Date(mo.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                              </span>
                              <span className="text-rose-600 ml-auto sm:ml-0" aria-hidden>{isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</span>
                            </button>
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 flex-shrink-0">
                              <select
                                value={mo.status || 'pending'}
                                onChange={(e) => updateManualOrderStatus(mo.id, e.target.value)}
                                disabled={updatingManualOrderId === mo.id}
                                className="min-h-[40px] min-w-[120px] rounded-lg border-2 border-gray-200 px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-rose-200 focus:border-rose-300 touch-manipulation bg-white"
                                aria-label={`Update status for order ${mo.id}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="ready">Ready</option>
                                <option value="shipping">Shipping</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              {updatingManualOrderId === mo.id && <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />}
                              <Button type="button" variant="outline" size="sm" className="min-h-[40px] px-3 border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => navigate('/handicraft', { state: { editManualOrder: mo } })} aria-label="Edit order">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Full details – compact, source already in heading */}
                          <div id={`manual-order-details-${mo.id}`} role="region" aria-labelledby={`manual-order-summary-${mo.id}`} className={isExpanded ? '' : 'hidden'}>
                            <div className="px-4 sm:px-6 pb-4 pt-2 border-t border-rose-100 space-y-4">
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Order items</h4>
                                <div className="space-y-2">
                                  {items.length > 0 ? items.map((it, idx) => {
                                    const name = it.chocolate_type === 'Other' ? (it.chocolate_details || 'Other') : it.chocolate_type;
                                    const cust = it.customization && typeof it.customization === 'object' ? it.customization : {};
                                    const productImage = it.chocolate_type && searchData.find((p) => p.title === it.chocolate_type)?.image;
                                    return (
                                      <div key={idx} className="flex items-start gap-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {productImage ? (
                                          <img src={productImage} alt={name} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                        ) : (
                                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-gray-200 bg-rose-100/50 flex items-center justify-center flex-shrink-0">
                                            <Package className="w-6 h-6 text-rose-400" />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <span className="font-medium text-gray-800">{name}</span>
                                          <span className="text-gray-500 ml-1">× {it.quantity || 0}</span>
                                          {(cust.nameOnBar || cust.firstName || cust.secondName || cust.firstLetter1 || cust.firstLetter2 || cust.customText || cust.customInstructions || cust.selectedBase?.label) && (
                                            <div className="mt-1.5 pt-1.5 border-t border-gray-200 space-y-0.5 text-xs text-gray-600">
                                              {cust.selectedBase?.label && <p>Chocolate: {cust.selectedBase.label}</p>}
                                              {cust.nameOnBar && <p><span className="font-medium text-rose-600">Name on bar:</span> {cust.nameOnBar}</p>}
                                              {(cust.firstName || cust.secondName) && <p><span className="font-medium text-rose-600">Names:</span> {[cust.firstName, cust.secondName].filter(Boolean).join(' & ')}</p>}
                                              {(cust.firstLetter1 || cust.firstLetter2) && <p><span className="font-medium text-rose-600">Initials:</span> {cust.firstLetter1 || ''}&{cust.firstLetter2 || ''}</p>}
                                              {cust.customText && <p><span className="font-medium text-rose-600">Custom text:</span> {cust.customText}</p>}
                                              {cust.customInstructions && <p>Instructions: {cust.customInstructions}</p>}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }) : (
                                    (() => {
                                      const legacyImage = mo.chocolate_type && searchData.find((p) => p.title === mo.chocolate_type)?.image;
                                      return (
                                        <div className="flex items-start gap-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                                          {legacyImage ? (
                                            <img src={legacyImage} alt={mo.chocolate_type || 'Chocolate'} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                          ) : (
                                            <div className="w-14 h-14 rounded-lg border border-gray-200 bg-rose-100/50 flex items-center justify-center flex-shrink-0">
                                              <Package className="w-6 h-6 text-rose-400" />
                                            </div>
                                          )}
                                          <div className="flex-1">
                                            <span className="font-medium text-gray-800">{mo.chocolate_type || '—'}</span>
                                            <span className="text-gray-500 ml-1">× {mo.quantity || 0}</span>
                                          </div>
                                        </div>
                                      );
                                    })()
                                  )}
                                </div>
                              </div>

                              {/* Contact + Address in one compact block (source already in heading) */}
                              <div className="flex flex-wrap items-start gap-3 p-2.5 bg-rose-50/50 rounded-lg border border-rose-100 text-sm">
                                <User className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <p className="text-xs font-semibold text-gray-500 uppercase">Contact</p>
                                  {mo.customer_name && <p className="text-gray-800">Name: {mo.customer_name}</p>}
                                  <p className="text-gray-800">Phone: {mo.phone ? <a href={`tel:${mo.phone}`} className="text-rose-600 hover:underline">{mo.phone}</a> : '—'}</p>
                                  {mo.delivery_time && <p className="text-gray-600">{mo.collecting_type === 'pickup' ? 'Pickup: ' : mo.collecting_type === 'parcel' ? 'Parcel: ' : mo.collecting_type === 'rapido' ? 'Rapido: ' : 'Deliver by: '}{mo.delivery_time}</p>}
                                  {/* Tracking: show after Shipping, for Parcel or Rapido only (no tracking for Pickup) */}
                                  {(mo.status === 'shipping' || mo.status === 'delivered') && (mo.collecting_type === 'parcel' || mo.collecting_type === 'rapido') && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border-2 border-rose-100 space-y-1">
                                      <p className="text-xs font-semibold text-gray-600 uppercase">
                                        {mo.collecting_type === 'parcel' ? 'Parcel tracking' : 'Rapido tracking'}
                                      </p>
                                      {updatingManualTrackingId === mo.id ? (
                                        <RefreshCw className="w-4 h-4 inline animate-spin text-rose-600" />
                                      ) : (
                                        <>
                                          <input
                                            type="text"
                                            value={manualTrackingInputs[mo.id] !== undefined ? manualTrackingInputs[mo.id] : (mo.tracking_number || '')}
                                            onChange={(e) => setManualTrackingInputs((prev) => ({ ...prev, [mo.id]: e.target.value }))}
                                            onBlur={() => {
                                              const v = (manualTrackingInputs[mo.id] !== undefined ? manualTrackingInputs[mo.id] : mo.tracking_number || '').trim();
                                              if (v !== (mo.tracking_number || '')) updateManualOrderTracking(mo.id, v);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const v = (manualTrackingInputs[mo.id] !== undefined ? manualTrackingInputs[mo.id] : mo.tracking_number || '').trim();
                                                if (v !== (mo.tracking_number || '')) updateManualOrderTracking(mo.id, v);
                                              }
                                            }}
                                            placeholder={mo.collecting_type === 'parcel' ? 'Enter parcel tracking number' : 'Enter Rapido tracking / rider details'}
                                            className="w-full min-h-[44px] px-3 py-2 text-sm font-medium border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-300 touch-manipulation"
                                          />
                                          <p className="text-xs text-gray-500">Press Enter to save · You can update anytime</p>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {mo.source_identifier && <p className="text-gray-600">{mo.source === 'instagram' ? 'Instagram: ' : 'WhatsApp: '}{mo.source_identifier}</p>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
                                  {mo.collecting_type === 'pickup' ? (
                                    <p className="text-gray-700 text-xs sm:text-sm">{STORE_ADDRESS}</p>
                                  ) : (
                                    <p className="text-gray-700">{[mo.address, mo.city, mo.district, mo.state, mo.pincode].filter(Boolean).join(', ') || '—'}</p>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">Manual order · No payment tracking</p>

                              {mo.notes && <p className="text-sm text-gray-600">Notes: {mo.notes}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}

        {/* Data Management Section - Admin Only - REMOVED */}
        {false && (
          <motion.div
            id="section-data"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mb-4 bg-white rounded-xl shadow-lg border-2 border-red-100/50 bg-gradient-to-br from-white to-red-50/20 overflow-hidden"
          >
            <button
              onClick={() => navigate('/dashboard#data')}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-red-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900">Data Management</h2>
                  <p className="text-sm text-gray-500">Delete all user data (Orders, Forms, etc.)</p>
                </div>
              </div>
              <ChevronDown className="h-6 w-6 text-gray-600" />
            </button>
            
            {currentSection === 'data' && (
              <div className="px-6 pb-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Warning: Destructive Action</h3>
                      <p className="text-sm text-red-700 leading-relaxed">
                        This will permanently delete <strong>ALL</strong> user data including:
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-700 mt-3 space-y-1">
                        <li>All orders from all users</li>
                        <li>All insurance forms</li>
                        <li>All home loan forms</li>
                      </ul>
                      <p className="text-sm font-bold text-red-900 mt-4">
                        This action cannot be undone!
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    const confirmed = window.confirm(
                      '⚠️ WARNING: This will delete ALL user data including:\n\n' +
                      '• All orders\n' +
                      '• All insurance forms\n' +
                      '• All home loan forms\n\n' +
                      'This action CANNOT be undone!\n\n' +
                      'Click OK to proceed with confirmation.'
                    );
                    
                    if (!confirmed) return;
                    
                    const userInput = window.prompt('Type "DELETE ALL" to confirm deletion:');
                    if (userInput !== 'DELETE ALL') {
                      toast({
                        title: "Cancelled",
                        description: "Deletion cancelled. Data is safe.",
                        variant: "default"
                      });
                      return;
                    }

                    try {
                      setLoading(true);
                      
                      // Delete all orders - using gte (greater than or equal) on created_at to match all records
                      const { error: ordersError } = await supabaseClient
                        .from('orders')
                        .delete()
                        .gte('created_at', '1970-01-01');
                      
                      if (ordersError) {
                        console.error('Error deleting orders:', ordersError);
                        throw ordersError;
                      }

                      // Delete all insurance forms
                      const { error: insuranceError } = await supabaseClient
                        .from('insurance_forms')
                        .delete()
                        .gte('created_at', '1970-01-01');
                      
                      if (insuranceError) {
                        console.error('Error deleting insurance forms:', insuranceError);
                        throw insuranceError;
                      }

                      // Delete all home loan forms
                      const { error: homeLoanError } = await supabaseClient
                        .from('home_loans')
                        .delete()
                        .gte('created_at', '1970-01-01');
                      
                      if (homeLoanError) {
                        console.error('Error deleting home loan forms:', homeLoanError);
                        throw homeLoanError;
                      }

                      // Refresh data
                      await fetchOrders();
                      await fetchFormsData();

                      toast({
                        title: "✅ Success",
                        description: "All user data has been deleted successfully.",
                        variant: "default"
                      });
                    } catch (error) {
                      console.error('Error deleting data:', error);
                      toast({
                        title: "❌ Error",
                        description: error.message || "Failed to delete data. Please try again.",
                        variant: "destructive"
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-6 shadow-xl hover:shadow-2xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete All User Data
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Orders Management Section */}
        <motion.div
          id="orders"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 bg-white rounded-xl shadow-lg border-2 border-rose-100/50 bg-gradient-to-br from-white to-rose-50/20 overflow-hidden"
        >
          <button
            onClick={() => navigate(currentSection === 'orders' ? '/dashboard' : '/dashboard#orders')}
            aria-expanded={currentSection === 'orders'}
            className="w-full flex items-center justify-between min-h-[56px] p-4 sm:p-5 hover:bg-rose-50/50 active:bg-rose-50 transition-colors cursor-pointer touch-manipulation text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {isAdmin ? 'Orders Management' : 'My Orders'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {isAdmin ? 'View and manage all orders' : 'View your order history'}
                </p>
              </div>
            </div>
            <span className="shrink-0 ml-2"><ChevronDown className="h-6 w-6 text-gray-600" /></span>
          </button>
          
          {currentSection === 'orders' && (
            <div className="px-4 sm:px-6 pb-6">
              {/* Admin: view toggle + Sort by status + Refresh */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                {isAdmin && (
                  <div className="flex rounded-xl border-2 border-rose-200 p-1 bg-rose-50/50">
                    <button
                      type="button"
                      onClick={() => setViewMode('my')}
                      className={`min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors touch-manipulation ${viewMode === 'my' ? 'bg-white text-rose-700 shadow' : 'text-gray-600 hover:text-rose-600 active:bg-rose-100'}`}
                    >
                      My orders
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('all')}
                      className={`min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors touch-manipulation ${viewMode === 'all' ? 'bg-white text-rose-700 shadow' : 'text-gray-600 hover:text-rose-600 active:bg-rose-100'}`}
                    >
                      All orders
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>Sort by status:</span>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="min-h-[44px] rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-rose-200 focus:border-rose-300 bg-white"
                    aria-label="Filter orders by status"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="ready_to_pickup">Ready to Pickup</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshOrdersList()}
                  disabled={ordersLoadingRefresh}
                  className="ml-auto"
                >
                  {ordersLoadingRefresh ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh orders
                </Button>
              </div>

              {(() => {
              const currentOrders = viewMode === 'all' ? allOrders : orders;
              let displayOrders = currentOrders.filter((o) => o.payment_status === 'success' || o.payment_status === 'paid');
              if (orderStatusFilter !== 'all') {
                displayOrders = displayOrders.filter((o) => {
                  const s = normalizeStatus(o.status);
                  if (orderStatusFilter === 'ready_to_pickup') {
                    return s === 'ready_to_pickup' || (o.delivery_type === 'pickup' && (s === 'shipped' || s === 'out_for_delivery'));
                  }
                  return s === orderStatusFilter;
                });
              }
              if (displayOrders.length === 0) {
                const totalPaid = currentOrders.filter((o) => o.payment_status === 'success' || o.payment_status === 'paid').length;
                return (
                  <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-rose-100/50 text-center">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      {orderStatusFilter !== 'all' && totalPaid > 0 ? `No orders with status "${ORDER_STATUSES[orderStatusFilter]?.label || orderStatusFilter}"` : 'No orders found'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {orderStatusFilter !== 'all' && totalPaid > 0 ? 'Try a different status filter.' : !isAdmin ? 'Paid orders will appear here. Complete payment to see your orders.' : isAdmin && viewMode === 'all' ? 'No orders from any customer yet.' : 'Your orders will appear here once you place them.'}
                    </p>
                  </div>
                );
              }
              return (
            <div className="space-y-3">
              {displayOrders.map((order) => {
                const currentStatus = normalizeStatus(order.status);
                const statusConfig = ORDER_STATUSES[currentStatus] || ORDER_STATUSES.pending;
                const StatusIcon = statusConfig.icon || Package;
                const isExpanded = expandedOrderId === order.id;
                return (
                <div key={order.id} className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-colors ${isExpanded ? 'border-rose-300 bg-rose-50/30 shadow-rose-100' : 'border-rose-100/50'}`}>
                  {/* Compact summary row – always visible */}
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 min-h-[52px] p-4 text-left hover:bg-rose-50/30 active:bg-rose-50/50 transition-colors touch-manipulation"
                    aria-expanded={isExpanded}
                    aria-controls={`order-details-${order.id}`}
                    id={`order-summary-${order.id}`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-gray-900">#{order.order_number || order.id.slice(-8).toUpperCase()}</span>
                      {isAdmin && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{order.email || order.user_email || '—'}</span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-rose-600">₹{order.total?.toLocaleString('en-IN') || '0'}</span>
                      <span className="text-rose-600" aria-hidden>{isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</span>
                    </div>
                  </button>

                  {/* Full order details – expandable */}
                  <div id={`order-details-${order.id}`} role="region" aria-labelledby={`order-summary-${order.id}`} className={isExpanded ? '' : 'hidden'}>
                    <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-rose-100 space-y-5">
                      {/* Order items */}
                      {order.items && order.items.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Order items</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => {
                                const itemImage = item.image || (item.id && searchData.find((p) => p.id === item.id))?.image;
                                return (
                              <div key={idx} className="flex items-start gap-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                                {itemImage ? (
                                  <img src={itemImage} alt={item.title || item.name || 'Chocolate'} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                ) : (
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-gray-200 bg-rose-100/50 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-6 h-6 text-rose-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-gray-800">{item.title || item.name}</span>
                                  <span className="text-gray-500 ml-1">× {item.quantity}</span>
                                  {(item.nameOnBar || item.customInstructions || item.selectedBase || (item.selectedSeedsLabels && item.selectedSeedsLabels.length > 0) || item.firstName || item.secondName || item.firstLetters || item.customText || item.giftWrap) && (
                                    <div className="mt-1.5 pt-1.5 border-t border-gray-200 space-y-0.5 text-xs text-gray-600">
                                      {item.nameOnBar && <p><span className="font-medium text-rose-600">Name on bar:</span> {item.nameOnBar}</p>}
                                      {item.selectedBase?.label && <p>Chocolate: {item.selectedBase.label}</p>}
                                      {item.selectedSeedsLabels?.length > 0 && <p>Dry fruits: {item.selectedSeedsLabels.join(', ')}</p>}
                                      {item.customInstructions && <p>Instructions: {item.customInstructions}</p>}
                                      {item.firstName && <p><span className="font-medium text-rose-600">First name:</span> {item.firstName}</p>}
                                      {item.secondName && <p><span className="font-medium text-rose-600">Second name:</span> {item.secondName}</p>}
                                      {item.firstLetters && <p><span className="font-medium text-rose-600">Initials:</span> {item.firstLetters}</p>}
                                      {item.customText && <p><span className="font-medium text-rose-600">Custom text:</span> {item.customText}</p>}
                                      {item.giftWrap && <p><span className="font-medium text-rose-600">Gift wrap:</span> +₹20</p>}
                                    </div>
                                  )}
                                </div>
                                <span className="font-semibold text-gray-900 flex-shrink-0">₹{(((item.price || 0) * (item.quantity || 1)) + (item.giftWrap ? 20 * (item.quantity || 1) : 0)).toLocaleString('en-IN')}</span>
                              </div>
                                );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Customer contact – name, email, phone (all orders) */}
                      <div className="flex flex-wrap items-start gap-2 p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                        <User className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase">Customer contact</p>
                          {order.customer_name && <p className="text-sm text-gray-800"><span className="font-medium">Name:</span> {order.customer_name}</p>}
                          <p className="text-sm text-gray-800"><span className="font-medium">Email:</span> {order.email || order.user_email || '—'}</p>
                          <p className="text-sm text-gray-800"><span className="font-medium">Phone:</span> {order.phone ? <a href={`tel:${order.phone}`} className="text-rose-600 hover:underline">{order.phone}</a> : '—'}</p>
                        </div>
                      </div>

                      {/* Delivery & Payment in two columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          {order.delivery_type === 'pickup' ? (
                            <>
                              <Store className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Pickup</p>
                                <p className="text-sm text-gray-700">{order.store_address || 'Store Pickup'}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Delivery address</p>
                                <p className="text-sm text-gray-700">{[order.address, order.city, order.district, order.state, order.zip].filter(Boolean).join(', ') || '—'}</p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <CreditCard className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Payment</p>
                            <p className="text-sm text-gray-700 font-mono break-all">{order.transaction_id || order.razorpay_payment_id || '—'}</p>
                            {order.payment_status && (
                              <span className={`inline-block mt-1 text-xs font-semibold uppercase px-2 py-0.5 rounded ${order.payment_status === 'success' || order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : order.payment_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {order.payment_status}
                              </span>
                            )}
                            {isAdmin && order.transaction_id && (order.payment_status === 'pending' || order.payment_status === 'failed') && (
                              <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1">Verify this Transaction ID before confirming.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tracking number – when status is shipped or later (admin); hidden for pickup (no shipping) */}
                      {isAdmin && order.delivery_type !== 'pickup' && (normalizeStatus(order.status) === 'shipped' || normalizeStatus(order.status) === 'out_for_delivery' || normalizeStatus(order.status) === 'delivered') && (
                        <div className="flex flex-wrap items-start gap-2 p-4 bg-indigo-50/50 rounded-lg border-2 border-indigo-100">
                          <Truck className="h-4 w-4 text-indigo-500 mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Courier tracking number</p>
                            {updatingOrderTrackingId === order.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={orderTrackingInputs[order.id] !== undefined ? orderTrackingInputs[order.id] : (order.tracking_number || '')}
                                  onChange={(e) => setOrderTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                  onBlur={() => {
                                    const v = (orderTrackingInputs[order.id] !== undefined ? orderTrackingInputs[order.id] : order.tracking_number || '').trim();
                                    if (v !== (order.tracking_number || '')) updateOrderTracking(order.id, v);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const v = (orderTrackingInputs[order.id] !== undefined ? orderTrackingInputs[order.id] : order.tracking_number || '').trim();
                                      if (v !== (order.tracking_number || '')) updateOrderTracking(order.id, v);
                                    }
                                  }}
                                  placeholder="Enter courier tracking number"
                                  className="w-full max-w-md min-h-[44px] px-3 py-2 text-sm font-medium border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-300 touch-manipulation"
                                />
                                <p className="text-xs text-gray-500 mt-1">Press Enter to save · You can update anytime</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order progress bar (Amazon-style) – shown when expanded */}
                      {(() => {
                        const isPickup = order.delivery_type === 'pickup';
                        const allStatuses = isPickup ? ['pending', 'processing', 'packed', 'ready_to_pickup', 'delivered'] : ['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
                        let orderStatus = normalizeStatus(order.status);
                        if (isPickup && (orderStatus === 'shipped' || orderStatus === 'out_for_delivery')) orderStatus = 'ready_to_pickup';
                        const currentIndex = allStatuses.indexOf(orderStatus);
                        const isCancelledOrReturned = orderStatus === 'cancelled' || orderStatus === 'returned';
                        return (
                          <div className="pt-4 border-t border-rose-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Progress</p>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              {allStatuses.map((status, idx) => {
                                const sConfig = ORDER_STATUSES[status];
                                const SIcon = sConfig?.icon || Package;
                                const isCompleted = !isCancelledOrReturned && idx <= currentIndex;
                                const isCurrent = !isCancelledOrReturned && idx === currentIndex;
                                return (
                                  <React.Fragment key={status}>
                                    {idx > 0 && (
                                      <div className={`flex-1 min-w-[8px] max-w-[24px] h-0.5 rounded ${idx <= (isCancelledOrReturned ? -1 : currentIndex) ? 'bg-rose-400' : 'bg-gray-200'}`} aria-hidden />
                                    )}
                                    <div
                                      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg min-w-0 ${isCurrent ? 'bg-rose-100 ring-1 ring-rose-300' : isCompleted ? 'bg-rose-50' : 'bg-gray-50'}`}
                                      title={sConfig?.label || status}
                                    >
                                      <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-rose-500 text-white' : isCurrent ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        <SIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      </div>
                                      <span className={`text-[10px] sm:text-xs font-medium truncate max-w-[4rem] sm:max-w-none text-center ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {sConfig?.label?.replace(' ', '\u00A0') || status}
                                      </span>
                                      {isCurrent && <span className="text-[10px] text-rose-600 font-semibold">Current</span>}
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                            {isCancelledOrReturned && (
                              <p className="mt-2 text-sm font-semibold text-red-600">{ORDER_STATUSES[orderStatus]?.label || orderStatus}</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* User: Repay / Cancel */}
                      {!isAdmin && order.status !== 'cancelled' && normalizeStatus(order.status) !== 'cancelled' &&
                        (order.payment_status === 'failed' || order.payment_status === 'pending') && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-rose-100">
                          <Button size="sm" onClick={() => openRepayModal(order)} disabled={updatingOrderId === order.id} className="bg-rose-600 hover:bg-rose-700 text-white">
                            <Banknote className="w-3 h-3 mr-1" /> Repay
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => cancelOrderForUser(order.id)} disabled={updatingOrderId === order.id} className="text-red-600 border-red-200 hover:bg-red-50">
                            {updatingOrderId === order.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />} Cancel order
                          </Button>
                        </div>
                      )}

                      {/* Admin actions */}
                      {isAdmin && (
                        <div className="pt-4 border-t border-rose-100">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Actions</p>
                          <div className="flex flex-wrap gap-2">
                            {order.payment_method === 'Razorpay' && (order.payment_status === 'success' || order.payment_status === 'paid') && (
                              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">Paid (Razorpay)</span>
                            )}
                            {order.payment_status !== 'success' && order.payment_status !== 'paid' && order.payment_method !== 'Razorpay' && (
                              <Button size="sm" onClick={() => updatePaymentStatus(order.id, 'confirmed', order.status)} disabled={updatingOrderId === order.id} className="bg-green-600 hover:bg-green-700 text-white text-xs">
                                {updatingOrderId === order.id ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />} Confirm payment
                              </Button>
                            )}
                            {order.payment_status === 'pending' && (
                              <Button size="sm" variant="destructive" onClick={() => updatePaymentStatus(order.id, 'failed', order.status)} disabled={updatingOrderId === order.id} className="text-xs">
                                <XCircle className="w-3 h-3 mr-1" /> Mark failed
                              </Button>
                            )}
                            {(() => {
                              const nextStatuses = getNextValidStatuses(normalizeStatus(order.status), order.payment_status, order.delivery_type);
                              if (nextStatuses.length === 0) return null;
                              return (
                                <div className="flex flex-wrap gap-2">
                                  {nextStatuses.map((nextStatus) => {
                                    const cfg = ORDER_STATUSES[nextStatus];
                                    const Icon = cfg?.icon || Package;
                                    return (
                                      <Button key={nextStatus} size="sm" variant={nextStatus === 'cancelled' ? 'destructive' : 'outline'} onClick={() => updateOrderStatus(order.id, nextStatus)} disabled={updatingOrderId === order.id} className="text-xs">
                                        {updatingOrderId === order.id ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Icon className="w-3 h-3 mr-1" />}
                                        {cfg?.label || nextStatus}
                                      </Button>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
              );
            })()}
            </div>
          )}
        </motion.div>
        </>
      </div>

      {/* Add address modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/20 sm:bg-black/30" onClick={() => setAddressModalOpen(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-200 max-w-md w-full max-h-[92vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Add address</h2>
              <button type="button" onClick={() => setAddressModalOpen(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 touch-manipulation" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveAddressFromModal(); }} className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country/region</label>
                <select value={addrCountry} onChange={(e) => setAddrCountry(e.target.value)} className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 touch-manipulation">
                  <option>India</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input type="text" value={addrFirstName} onChange={(e) => setAddrFirstName(e.target.value)} className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 touch-manipulation" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input type="text" value={addrLastName} onChange={(e) => setAddrLastName(e.target.value)} className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 touch-manipulation" placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 touch-manipulation" placeholder="Street address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apartment, suite, etc.</label>
                <input type="text" value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 touch-manipulation" placeholder="Optional" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 touch-manipulation" placeholder="City" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select value={addrState} onChange={(e) => setAddrState(e.target.value)} className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 touch-manipulation">
                    <option value="">Select</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN code</label>
                  <input type="text" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 touch-manipulation" placeholder="PIN" maxLength={6} inputMode="numeric" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 touch-manipulation" placeholder="+91 9515404195" inputMode="tel" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setAddressModalOpen(false)} className="min-h-[44px] px-4 text-sm font-medium text-blue-600 hover:text-blue-700 touch-manipulation">Cancel</button>
                <Button type="submit" disabled={profileSaving} className="min-h-[44px] bg-blue-600 hover:bg-blue-700 touch-manipulation">
                  {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay modal – user enters new transaction ID for failed/pending order */}
      {repayModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeRepayModal}>
          <div className="bg-white rounded-2xl shadow-xl border-2 border-rose-100 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Repay for order #{repayModalOrder.order_number}</h3>
            <p className="text-sm text-gray-600 mb-4">Enter your new Transaction ID after making the payment. We’ll confirm and update the order.</p>
            <input
              type="text"
              value={repayTransactionId}
              onChange={(e) => setRepayTransactionId(e.target.value)}
              placeholder="e.g. 989389894893"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button onClick={submitRepayOrder} disabled={repaySubmitting || !repayTransactionId.trim()} className="flex-1 bg-rose-600 hover:bg-rose-700">
                {repaySubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit'}
              </Button>
              <Button variant="outline" onClick={closeRepayModal} disabled={repaySubmitting}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;