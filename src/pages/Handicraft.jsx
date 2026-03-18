import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { searchData } from '@/lib/searchData';
import {
  MessageCircle,
  Instagram,
  Package,
  Truck,
  MapPin,
  Clock,
  Phone,
  Plus,
  Pencil,
  Trash2,
  ShieldX,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Search,
} from 'lucide-react';

const ADMIN_EMAIL = 'info@ahnupha.com';

const chocolateProducts = searchData.filter((i) => i.category === 'Chocolate');
const titleToPrice = new Map();
const titleToProduct = new Map();
chocolateProducts.forEach((p) => {
  if (!titleToPrice.has(p.title) && p.price != null) titleToPrice.set(p.title, Number(p.price));
  if (!titleToProduct.has(p.title)) titleToProduct.set(p.title, p);
});
const chocolateOptions = [...new Set(chocolateProducts.map((i) => i.title))].sort();

const getPriceForTitle = (title) => (title && title !== 'Other' ? titleToPrice.get(title) ?? null : null);
const getProductByTitle = (title) => (title && title !== 'Other' ? titleToProduct.get(title) ?? null : null);

// Parcel: fixed ₹100 shipping. Delivery & Rapido: no shipping (free).
const PARCEL_SHIPPING = 100;
const getShippingForManualOrder = (collectingType) => (collectingType === 'parcel' ? PARCEL_SHIPPING : 0);

// Time: hour 1–12, minutes 00/15/30/45, AM/PM
const TIME_HOURS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const TIME_MINUTES = [
  { value: '00', label: '00' },
  { value: '15', label: '15' },
  { value: '30', label: '30' },
  { value: '45', label: '45' },
];
const TIME_AMPM = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

function parseDeliveryTime(str) {
  if (!str || typeof str !== 'string') return {};
  const [datePart, timePart] = str.split(/, (.+)/).map((s) => s?.trim());
  if (!datePart || !timePart) return { deliveryTime: str };
  const dateMatch = datePart.match(/^\d{4}-\d{2}-\d{2}$/);
  const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (dateMatch && timeMatch) {
    return {
      deliveryDate: datePart,
      deliveryHour: timeMatch[1],
      deliveryMinute: timeMatch[2] || '00',
      deliveryAmPm: timeMatch[3].toUpperCase(),
      deliveryTime: str,
    };
  }
  return { deliveryTime: str };
}

const emptyCustomization = () => ({
  selectedBase: null,
  selectedSeeds: [],
  nameOnBar: '',
  firstName: '',
  secondName: '',
  firstLetter1: '',
  firstLetter2: '',
  customText: '',
  customInstructions: '',
});

const emptyItem = () => ({
  chocolateType: '',
  chocolateDetails: '',
  quantity: 1,
  unitPrice: null,
  customization: emptyCustomization(),
});

const emptyOrder = () => ({
  source: '',
  sourceIdentifier: '',
  collectingType: '',
  address: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  deliveryTime: '',
  deliveryDate: '',
  deliveryHour: '',
  deliveryMinute: '00',
  deliveryAmPm: 'AM',
  phone: '',
  customerName: '',
  notes: '',
  status: 'pending',
  trackingNumber: '',
  items: [emptyItem()],
});

const DRAFT_KEY = 'ahnupha_manual_order_draft';

const normalizeDraft = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const items = Array.isArray(raw.items) && raw.items.length > 0
    ? raw.items.map((it) => ({
        chocolateType: it.chocolateType ?? '',
        chocolateDetails: it.chocolateDetails ?? '',
        quantity: it.quantity ?? 1,
        unitPrice: it.unitPrice ?? null,
        customization: it.customization && typeof it.customization === 'object'
          ? { ...emptyCustomization(), ...it.customization }
          : emptyCustomization(),
      }))
    : [emptyItem()];
  return {
    source: raw.source ?? '',
    sourceIdentifier: raw.sourceIdentifier ?? '',
    collectingType: raw.collectingType ?? '',
    address: raw.address ?? '',
    city: raw.city ?? '',
    district: raw.district ?? '',
    state: raw.state ?? '',
    pincode: raw.pincode ?? '',
    deliveryTime: raw.deliveryTime ?? '',
    deliveryDate: raw.deliveryDate ?? '',
    deliveryHour: raw.deliveryHour ?? '',
    deliveryMinute: raw.deliveryMinute ?? '00',
    deliveryAmPm: raw.deliveryAmPm ?? 'AM',
    phone: raw.phone ?? '',
    customerName: raw.customerName ?? '',
    notes: raw.notes ?? '',
    status: raw.status ?? 'pending',
    trackingNumber: raw.trackingNumber ?? '',
    items,
  };
};

const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch (_) {}
};

const Handicraft = () => {
  const { currentUser, isLoading, supabase } = useSupabaseAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [form, setForm] = useState(emptyOrder());
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCustomizeIndex, setShowCustomizeIndex] = useState(null);
  const [openProductSelect, setOpenProductSelect] = useState(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const updateManualOrderStatus = async (id, status) => {
    if (!supabase) return;
    setUpdatingStatusId(id);
    try {
      const { error } = await supabase.from('manual_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await fetchOrders();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const [updatingTrackingId, setUpdatingTrackingId] = useState(null);
  const [lastOrderTrackingInput, setLastOrderTrackingInput] = useState('');
  const updateManualOrderTracking = async (id, tracking_number) => {
    if (!supabase) return;
    setUpdatingTrackingId(id);
    try {
      const { error } = await supabase.from('manual_orders').update({ tracking_number: tracking_number?.trim() || null, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await fetchOrders();
    } finally {
      setUpdatingTrackingId(null);
    }
  };

  const fetchOrders = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('manual_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data ?? []);
    } catch (err) {
      console.error('Error fetching manual orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      clearDraft(); // After refresh don't show old data
    }
  }, [isAdmin, supabase]);

  // Open edit form when navigated from Dashboard with editManualOrder in state
  useEffect(() => {
    const editOrderFromState = location.state?.editManualOrder;
    if (isAdmin && editOrderFromState) {
      setForm(fromDbRow(editOrderFromState));
      setEditingId(editOrderFromState.id);
      setShowForm(true);
      navigate(location.pathname, { replace: true, state: {} }); // clear state so refresh doesn't re-open
    }
  }, []);

  useEffect(() => {
    if (orders.length > 0) setLastOrderTrackingInput(orders[0].tracking_number ?? '');
  }, [orders.length, orders[0]?.id, orders[0]?.tracking_number]);

  // Persist form to sessionStorage only while form is open (so accidental close can recover)
  useEffect(() => {
    if (!isAdmin || !showForm) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch (_) {}
  }, [isAdmin, showForm, form]);

  const updateForm = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const addItem = () => {
    setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  };

  const removeItem = (index) => {
    setForm((f) => {
      const items = f.items.filter((_, i) => i !== index);
      if (items.length === 0) return f;
      return { ...f, items };
    });
  };

  const updateItem = (index, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      const it = { ...items[index], [field]: value };
      if (field === 'chocolateType') {
        it.unitPrice = getPriceForTitle(value) ?? it.unitPrice;
        const prod = getProductByTitle(value);
        if (prod) {
          const cust = { ...emptyCustomization() };
          if (prod.baseOptions?.length) cust.selectedBase = prod.baseOptions[0];
          if (prod.seedsOptions?.length) {
            cust.selectedSeeds = prod.seedsOptions.filter((o) => o.mandatory).map((o) => o.id);
          }
          it.customization = cust;
        } else {
          it.customization = emptyCustomization();
        }
      }
      items[index] = it;
      return { ...f, items };
    });
  };

  const updateItemCustomization = (index, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[index] = {
        ...items[index],
        customization: { ...(items[index].customization || emptyCustomization()), [field]: value },
      };
      return { ...f, items };
    });
  };

  const updateItemSeeds = (index, seedId, add) => {
    setForm((f) => {
      const items = [...f.items];
      const it = items[index];
      const cust = it.customization || emptyCustomization();
      const seeds = [...(cust.selectedSeeds || [])];
      const prod = getProductByTitle(it.chocolateType);
      if (!prod?.seedsOptions) return f;
      const opt = prod.seedsOptions.find((o) => o.id === seedId);
      if (opt?.mandatory) return f;
      if (add) {
        const optionalCount = seeds.filter((id) => !prod.seedsOptions.find((o) => o.id === id)?.mandatory).length;
        if (optionalCount >= 3) return f;
        if (!seeds.includes(seedId)) seeds.push(seedId);
      } else {
        const idx = seeds.indexOf(seedId);
        if (idx >= 0) seeds.splice(idx, 1);
      }
      items[index] = { ...it, customization: { ...cust, selectedSeeds: seeds } };
      return { ...f, items };
    });
  };

  const toDbRow = () => {
    const dbItems = form.items
      .filter((it) => it.chocolateType)
      .map((it) => {
        const unitPrice = it.chocolateType === 'Other' ? null : (it.unitPrice ?? getPriceForTitle(it.chocolateType));
        const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
        const cust = it.customization || emptyCustomization();
        const hasCustData =
          cust.selectedBase ||
          (cust.selectedSeeds?.length > 0) ||
          cust.nameOnBar ||
          cust.firstName ||
          cust.secondName ||
          (cust.firstLetter1 || cust.firstLetter2) ||
          cust.customText ||
          cust.customInstructions;
        return {
          chocolate_type: it.chocolateType,
          chocolate_details: it.chocolateDetails || null,
          quantity: qty,
          unit_price: unitPrice,
          customization: hasCustData ? cust : null,
        };
      });

    let subtotal = 0;
    dbItems.forEach((it) => {
      if (it.unit_price != null && it.quantity) subtotal += it.unit_price * it.quantity;
    });
    subtotal = Number(subtotal.toFixed(2));
    const shippingAmount = getShippingForManualOrder(form.collectingType);
    const total = Number((subtotal + shippingAmount).toFixed(2));
    const needsAddress = form.collectingType === 'delivery' || form.collectingType === 'parcel' || form.collectingType === 'rapido';

    // Populate top-level chocolate_type/chocolate_details/quantity/unit_price from first item (table columns; avoid nulls)
    const first = dbItems[0] || null;
    const chocolate_type = first?.chocolate_type ?? null;
    const chocolate_details = first?.chocolate_details ?? null;
    const quantity = first?.quantity ?? 1;
    const unit_price = first?.unit_price ?? null;

    return {
      source: form.source,
      source_identifier: form.sourceIdentifier?.trim() || null,
      collecting_type: form.collectingType,
      address: needsAddress ? form.address?.trim() || null : null,
      city: needsAddress ? form.city?.trim() || null : null,
      district: needsAddress ? (form.district?.trim() || null) : null,
      state: needsAddress ? (form.state?.trim() || null) : null,
      pincode: needsAddress ? (form.pincode?.trim() || null) : null,
      delivery_time: (form.deliveryDate && form.deliveryHour)
        ? `${form.deliveryDate}, ${form.deliveryHour}:${form.deliveryMinute || '00'} ${form.deliveryAmPm || 'AM'}`
        : (form.deliveryTime || null),
      phone: form.phone || null,
      customer_name: form.customerName || null,
      status: form.status || 'pending',
      notes: form.notes || null,
      tracking_number: (form.collectingType === 'parcel' || form.collectingType === 'rapido') ? (form.trackingNumber?.trim() || null) : null,
      chocolate_type,
      chocolate_details,
      quantity,
      unit_price,
      items: dbItems,
      total,
      shipping_amount: shippingAmount,
      updated_at: new Date().toISOString(),
    };
  };

  const fromDbRow = (row) => {
    if (row.items && Array.isArray(row.items) && row.items.length > 0) {
      const items = row.items.map((it) => {
        const raw = it.customization && typeof it.customization === 'object' ? it.customization : {};
        const firstLetters = raw.firstLetters || '';
        const [f1, f2] = firstLetters.includes('&') ? firstLetters.split('&') : [firstLetters, ''];
        return {
          chocolateType: it.chocolate_type ?? '',
          chocolateDetails: it.chocolate_details ?? '',
          quantity: it.quantity ?? 1,
          unitPrice: it.unit_price ?? null,
          customization: {
            ...emptyCustomization(),
            ...raw,
            firstLetter1: raw.firstLetter1 ?? f1,
            firstLetter2: raw.firstLetter2 ?? f2,
          },
        };
      });
      const parsed = parseDeliveryTime(row.delivery_time ?? '');
      return {
        source: row.source ?? '',
        sourceIdentifier: row.source_identifier ?? '',
        collectingType: row.collecting_type ?? '',
        address: row.address ?? '',
        city: row.city ?? '',
        district: row.district ?? '',
        state: row.state ?? '',
        pincode: row.pincode ?? '',
        deliveryTime: parsed.deliveryTime ?? '',
        deliveryDate: parsed.deliveryDate ?? '',
        deliveryHour: parsed.deliveryHour ?? '',
        deliveryMinute: parsed.deliveryMinute ?? '00',
        deliveryAmPm: parsed.deliveryAmPm ?? 'AM',
        phone: row.phone ?? '',
        customerName: row.customer_name ?? '',
        notes: row.notes ?? '',
        status: row.status ?? 'pending',
        trackingNumber: row.tracking_number ?? '',
        items,
      };
    }
    const raw = row.customization && typeof row.customization === 'object' ? row.customization : {};
    const firstLetters = raw.firstLetters || '';
    const [f1, f2] = firstLetters.includes('&') ? firstLetters.split('&') : [firstLetters, ''];
    const cust = {
      ...emptyCustomization(),
      ...raw,
      firstLetter1: raw.firstLetter1 ?? f1,
      firstLetter2: raw.firstLetter2 ?? f2,
    };
    const parsed = parseDeliveryTime(row.delivery_time ?? '');
    return {
      source: row.source ?? '',
      sourceIdentifier: row.source_identifier ?? '',
      collectingType: row.collecting_type ?? '',
      address: row.address ?? '',
      city: row.city ?? '',
      district: row.district ?? '',
      state: row.state ?? '',
      pincode: row.pincode ?? '',
      deliveryTime: parsed.deliveryTime ?? '',
      deliveryDate: parsed.deliveryDate ?? '',
      deliveryHour: parsed.deliveryHour ?? '',
      deliveryMinute: parsed.deliveryMinute ?? '00',
      deliveryAmPm: parsed.deliveryAmPm ?? 'AM',
      phone: row.phone ?? '',
      customerName: row.customer_name ?? '',
      notes: row.notes ?? '',
      status: row.status ?? 'pending',
      trackingNumber: row.tracking_number ?? '',
      items: [
        {
          chocolateType: row.chocolate_type ?? '',
          chocolateDetails: row.chocolate_details ?? '',
          quantity: row.quantity ?? 1,
          unitPrice: row.unit_price ?? null,
          customization: cust,
        },
      ],
    };
  };

  const handleSave = async () => {
    const validItems = form.items.filter((it) => it.chocolateType);
    if (!form.source || validItems.length === 0) return;
    if (!supabase) return;
    setSaving(true);
    try {
      const row = toDbRow();
      if (editingId) {
        const { error } = await supabase.from('manual_orders').update(row).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('manual_orders').insert(row);
        if (error) throw error;
      }
      await fetchOrders();
      setForm(emptyOrder());
      setEditingId(null);
      setShowForm(false);
      clearDraft();
    } catch (err) {
      console.error('Error saving manual order:', err);
      alert(err?.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (o) => {
    setForm(fromDbRow(o));
    setEditingId(o.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!supabase) return;
    if (!confirm('Delete this order?')) return;
    try {
      const { error } = await supabase.from('manual_orders').delete().eq('id', id);
      if (error) throw error;
      await fetchOrders();
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyOrder());
        setShowForm(false);
        clearDraft();
      }
    } catch (err) {
      console.error('Error deleting manual order:', err);
      alert(err?.message || 'Failed to delete order');
    }
  };

  const handleCancel = () => {
    setForm(emptyOrder());
    setEditingId(null);
    setShowForm(false);
    clearDraft();
  };

  const handleClear = () => {
    setForm(emptyOrder());
    setEditingId(null);
    clearDraft();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Helmet>
          <title>Access Denied - Ahnupha</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-rose-100/50 max-w-md text-center">
            <ShieldX className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Only</h1>
            <p className="text-gray-600">This page is visible only to admins.</p>
          </div>
        </div>
      </>
    );
  }

  const subtotalPreview = form.items.reduce((sum, it) => {
    const up = it.chocolateType === 'Other' ? null : (it.unitPrice ?? getPriceForTitle(it.chocolateType));
    const q = Math.max(1, parseInt(it.quantity, 10) || 1);
    return sum + (up != null ? up * q : 0);
  }, 0);
  const shippingPreview = getShippingForManualOrder(form.collectingType);
  const totalPreview = subtotalPreview + shippingPreview;

  return (
    <>
      <Helmet>
        <title>Manual Orders - Admin | Ahnupha</title>
        <meta name="description" content="Admin dashboard to note and update orders from Instagram & WhatsApp." />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-[max(2rem,env(safe-area-inset-bottom))] min-h-[100dvh]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Manual Orders Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Note and update orders from Instagram & WhatsApp</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm(emptyOrder());
              setEditingId(null);
              setShowForm(true);
              clearDraft();
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 min-h-[52px] min-w-[160px] sm:min-w-[140px] bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 active:scale-[0.98] text-white rounded-xl font-medium shadow touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 text-base"
            aria-label="Add new order"
          >
            <Plus className="h-5 w-5 flex-shrink-0" />
            Add Order
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5">
              {editingId ? 'Update Order' : 'Add New Order'}
            </h2>

            <div className="space-y-6">
              {/* Order Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Order Source</label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <label className="flex items-center gap-3 cursor-pointer min-h-[52px] px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-rose-200 active:border-rose-300 transition-colors touch-manipulation flex-1 sm:flex-initial min-w-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rose-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none">
                    <input type="radio" name="source" checked={form.source === 'instagram'} onChange={() => updateForm('source', 'instagram')} className="sr-only" aria-hidden />
                    <Instagram className="h-6 w-6 text-pink-500 flex-shrink-0" />
                    <span className="text-base font-medium">Instagram</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer min-h-[52px] px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-rose-200 active:border-rose-300 transition-colors touch-manipulation flex-1 sm:flex-initial min-w-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rose-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none">
                    <input type="radio" name="source" checked={form.source === 'whatsapp'} onChange={() => updateForm('source', 'whatsapp')} className="sr-only" aria-hidden />
                    <MessageCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-base font-medium">WhatsApp</span>
                  </label>
                </div>
                {form.source && (
                  <div className="mt-4">
                    <label htmlFor="handicraft-source-id" className="block text-sm font-medium text-gray-700 mb-2">
                      {form.source === 'instagram' ? 'Instagram ID' : 'WhatsApp number'}
                    </label>
                    <input
                      id="handicraft-source-id"
                      type="text"
                      value={form.sourceIdentifier}
                      onChange={(e) => updateForm('sourceIdentifier', e.target.value)}
                      placeholder={form.source === 'instagram' ? 'e.g. @username or profile ID' : 'e.g. 9876543210'}
                      inputMode={form.source === 'whatsapp' ? 'tel' : 'text'}
                      className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation"
                    />
                  </div>
                )}
              </div>

              {/* Products */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <label className="block text-sm font-medium text-gray-700">Products</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-medium text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl min-h-[52px] min-w-[140px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                    aria-label="Add another product"
                  >
                    <Plus className="h-5 w-5 flex-shrink-0" />
                    Add product
                  </button>
                </div>

                {form.items.map((item, idx) => {
                  const prod = getProductByTitle(item.chocolateType);
                  const hasCustomOptions =
                    prod &&
                    (prod.baseOptions?.length > 0 ||
                      prod.seedsOptions?.length > 0 ||
                      prod.customNameOnBar ||
                      prod.twoNames ||
                      prod.firstLettersCouple ||
                      prod.birthdayWishes ||
                      prod.customTextOnChocolate);
                  const cust = item.customization || emptyCustomization();
                  const isCustomizeOpen = showCustomizeIndex === idx;

                  return (
                    <div key={idx} className="p-4 sm:p-5 bg-gray-50 rounded-xl border-2 border-gray-200 space-y-4 mb-4 last:mb-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-gray-600">Product {idx + 1}</span>
                        {form.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-3 text-rose-600 hover:bg-rose-100 active:bg-rose-200 rounded-xl min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                            aria-label={`Remove product ${idx + 1}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-600 mb-2">Chocolate / Product</label>
                          {openProductSelect === idx ? (
                            <>
                              <div className="flex items-center gap-2 min-h-[52px] px-4 py-2 border-2 border-rose-500 rounded-xl bg-white focus-within:ring-2 focus-within:ring-rose-500 focus-within:ring-offset-0">
                                <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                <input
                                  type="text"
                                  value={productSearchQuery}
                                  onChange={(e) => setProductSearchQuery(e.target.value)}
                                  onBlur={() => setTimeout(() => setOpenProductSelect(null), 200)}
                                  placeholder="Search product..."
                                  autoFocus
                                  className="flex-1 min-w-0 border-0 p-2 text-base focus:outline-none focus:ring-0"
                                  aria-label="Search product"
                                />
                              </div>
                              <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border-2 border-gray-200 rounded-xl shadow-lg py-1">
                                {(() => {
                                  const q = (productSearchQuery || '').trim().toLowerCase();
                                  const minLetters = 3;
                                  if (q.length < minLetters) {
                                    return (
                                      <p className="px-4 py-3 text-sm text-gray-500">
                                        Type at least {minLetters} letters to search
                                      </p>
                                    );
                                  }
                                  const filtered = chocolateOptions.filter((t) => t.toLowerCase().includes(q));
                                  const options = [...filtered, 'Other'];
                                  return options.length === 0 ? (
                                    <p className="px-4 py-3 text-sm text-gray-500">No match. Try different letters.</p>
                                  ) : (
                                    options.map((title) => (
                                      <button
                                        key={title}
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          updateItem(idx, 'chocolateType', title);
                                          setProductSearchQuery('');
                                          setOpenProductSelect(null);
                                        }}
                                        className="w-full text-left px-4 py-3 text-base hover:bg-rose-50 focus:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-none"
                                      >
                                        {title === 'Other' ? 'Other / Custom' : `${title}${titleToPrice.get(title) != null ? ` (₹${titleToPrice.get(title)})` : ''}`}
                                      </button>
                                    ))
                                  );
                                })()}
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenProductSelect(idx);
                                setProductSearchQuery(item.chocolateType === 'Other' ? '' : item.chocolateType || '');
                              }}
                              className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation bg-white text-left flex items-center justify-between gap-2"
                            >
                              <span className={item.chocolateType ? 'text-gray-900' : 'text-gray-500'}>
                                {item.chocolateType
                                  ? item.chocolateType === 'Other'
                                    ? 'Other / Custom'
                                    : `${item.chocolateType}${titleToPrice.get(item.chocolateType) != null ? ` (₹${titleToPrice.get(item.chocolateType)})` : ''}`
                                  : 'Search or select product'}
                              </span>
                              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                            className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation"
                          />
                          {item.unitPrice != null && (
                            <p className="mt-1 text-xs text-green-600">₹{item.unitPrice} × {item.quantity} = ₹{(item.unitPrice * (item.quantity || 1)).toFixed(2)}</p>
                          )}
                        </div>
                      </div>

                      {(item.chocolateType === 'Other' || item.chocolateDetails) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Custom Details</label>
                          <input
                            type="text"
                            value={item.chocolateDetails}
                            onChange={(e) => updateItem(idx, 'chocolateDetails', e.target.value)}
                            placeholder="Describe product"
                            className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation"
                          />
                        </div>
                      )}

                      {hasCustomOptions && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowCustomizeIndex(isCustomizeOpen ? null : idx)}
                            className="flex items-center justify-between w-full py-4 px-4 bg-white rounded-xl border-2 border-gray-200 text-left text-base font-medium min-h-[52px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 hover:border-rose-200 active:border-rose-300 transition-colors"
                            aria-expanded={isCustomizeOpen}
                            aria-controls={`customize-${idx}`}
                          >
                            <span>Customize bar options</span>
                            {isCustomizeOpen ? <ChevronUp className="h-5 w-5 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 flex-shrink-0" />}
                          </button>
                          {isCustomizeOpen && (
                            <div id={`customize-${idx}`} className="mt-4 p-4 bg-white rounded-xl border-2 border-gray-200 space-y-5">
                              {prod?.baseOptions?.length > 0 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-600 mb-2">Base</label>
                                  <div className="flex flex-wrap gap-3">
                                    {prod.baseOptions.map((opt) => {
                                      const isActive = cust.selectedBase?.id === opt.id;
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => updateItemCustomization(idx, 'selectedBase', opt)}
                                          className={`min-h-[48px] px-4 py-3 rounded-xl border-2 text-base font-medium touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 active:scale-[0.98] ${isActive ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-rose-200'}`}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {prod?.seedsOptions?.length > 0 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-600 mb-2">Dry fruits</label>
                                  <div className="flex flex-wrap gap-3">
                                    {prod.seedsOptions.map((opt) => {
                                      const isSelected = (cust.selectedSeeds || []).includes(opt.id);
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => opt.mandatory ? null : updateItemSeeds(idx, opt.id, !isSelected)}
                                          disabled={opt.mandatory}
                                          className={`min-h-[48px] px-4 py-3 rounded-xl border-2 text-base font-medium touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-90 disabled:cursor-default active:scale-[0.98] ${isSelected ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-rose-200'}`}
                                        >
                                          {opt.label}{opt.mandatory ? ' ✓' : ''}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {prod?.twoNames && (
                                <div className="grid grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    value={cust.firstName}
                                    onChange={(e) => updateItemCustomization(idx, 'firstName', (e.target.value || '').replace(/[^a-zA-Z\s]/g, ''))}
                                    placeholder="First name"
                                    className="min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation"
                                  />
                                  <input
                                    type="text"
                                    value={cust.secondName}
                                    onChange={(e) => updateItemCustomization(idx, 'secondName', (e.target.value || '').replace(/[^a-zA-Z\s]/g, ''))}
                                    placeholder="Second name"
                                    className="min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation"
                                  />
                                </div>
                              )}
                              {prod?.firstLettersCouple && (
                                <div className="flex items-center gap-3">
                                  <input
                                    type="text"
                                    maxLength={1}
                                    value={cust.firstLetter1}
                                    onChange={(e) => updateItemCustomization(idx, 'firstLetter1', (e.target.value || '').replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase())}
                                    className="w-14 h-14 min-w-[56px] text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 touch-manipulation"
                                    aria-label="First letter"
                                  />
                                  <span className="text-gray-500 font-medium text-lg">&</span>
                                  <input
                                    type="text"
                                    maxLength={1}
                                    value={cust.firstLetter2}
                                    onChange={(e) => updateItemCustomization(idx, 'firstLetter2', (e.target.value || '').replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase())}
                                    className="w-14 h-14 min-w-[56px] text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 touch-manipulation"
                                    aria-label="Second letter"
                                  />
                                </div>
                              )}
                              {(prod?.birthdayWishes || prod?.customTextOnChocolate) && (
                                <input
                                  type="text"
                                  value={cust.customText}
                                  onChange={(e) => updateItemCustomization(idx, 'customText', e.target.value || '')}
                                  placeholder={prod.birthdayWishes ? 'Birthday wish' : 'Custom text'}
                                  className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation"
                                />
                              )}
                              {prod?.customNameOnBar && !prod?.twoNames && (
                                <input
                                  type="text"
                                  value={cust.nameOnBar}
                                  onChange={(e) => updateItemCustomization(idx, 'nameOnBar', (e.target.value || '').replace(/[^a-zA-Z\s]/g, ''))}
                                  placeholder="Name on bar"
                                  className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {totalPreview > 0 && (
                  <div className="space-y-1">
                    {form.collectingType === 'parcel' && shippingPreview > 0 && (
                      <p className="text-sm text-gray-600">Subtotal ₹{subtotalPreview.toFixed(2)} + Shipping ₹{shippingPreview} = ₹{totalPreview.toFixed(2)}</p>
                    )}
                    <p className="text-lg font-semibold text-gray-900">Order total: ₹{totalPreview.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Collecting type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Collecting Type</label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <label className={`flex items-center gap-3 cursor-pointer min-h-[52px] px-5 py-4 rounded-xl border-2 transition-colors touch-manipulation flex-1 sm:flex-initial min-w-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none active:scale-[0.98] ${form.collectingType === 'pickup' ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-200'}`}>
                    <input type="radio" name="collecting" checked={form.collectingType === 'pickup'} onChange={() => updateForm('collectingType', 'pickup')} className="sr-only" aria-hidden />
                    <Package className="h-6 w-6 text-amber-500 flex-shrink-0" />
                    <span className="text-base font-medium">Pickup</span>
                  </label>
                  <label className={`flex items-center gap-3 cursor-pointer min-h-[52px] px-5 py-4 rounded-xl border-2 transition-colors touch-manipulation flex-1 sm:flex-initial min-w-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-green-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none active:scale-[0.98] ${form.collectingType === 'delivery' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                    <input type="radio" name="collecting" checked={form.collectingType === 'delivery'} onChange={() => updateForm('collectingType', 'delivery')} className="sr-only" aria-hidden />
                    <Truck className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-base font-medium">Delivery</span>
                  </label>
                  <label className={`flex items-center gap-3 cursor-pointer min-h-[52px] px-5 py-4 rounded-xl border-2 transition-colors touch-manipulation flex-1 sm:flex-initial min-w-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none active:scale-[0.98] ${form.collectingType === 'parcel' ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-200'}`}>
                    <input type="radio" name="collecting" checked={form.collectingType === 'parcel'} onChange={() => updateForm('collectingType', 'parcel')} className="sr-only" aria-hidden />
                    <Package className="h-6 w-6 text-violet-500 flex-shrink-0" />
                    <span className="text-base font-medium">Parcel</span>
                  </label>
                  <label className={`flex items-center gap-3 cursor-pointer min-h-[52px] px-5 py-4 rounded-xl border-2 transition-colors touch-manipulation flex-1 sm:flex-initial min-w-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rose-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none active:scale-[0.98] ${form.collectingType === 'rapido' ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:border-rose-200'}`}>
                    <input type="radio" name="collecting" checked={form.collectingType === 'rapido'} onChange={() => updateForm('collectingType', 'rapido')} className="sr-only" aria-hidden />
                    <Truck className="h-6 w-6 text-rose-500 flex-shrink-0" />
                    <span className="text-base font-medium">Rapido</span>
                  </label>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><Phone className="inline h-4 w-4 mr-1" /> Phone Number</label>
                <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="e.g. 9876543210" inputMode="tel" className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation" />
              </div>

              {/* Customer name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input type="text" value={form.customerName} onChange={(e) => updateForm('customerName', e.target.value)} placeholder="Optional" className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation" />
              </div>

              {/* Date (calendar) + Time (hr, mins 00/15/30/45, AM/PM) */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {form.collectingType === 'delivery' ? 'Delivery date & time' : form.collectingType === 'parcel' ? 'Parcel / dispatch time' : form.collectingType === 'rapido' ? 'Rapido delivery time' : 'Pickup time'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">Date</span>
                    <input
                      type="date"
                      value={form.deliveryDate}
                      onChange={(e) => updateForm('deliveryDate', e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation bg-white"
                      aria-label="Select date"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Hr</span>
                      <select
                        value={form.deliveryHour}
                        onChange={(e) => updateForm('deliveryHour', e.target.value)}
                        className="w-full min-h-[52px] px-3 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation bg-white"
                        aria-label="Hour"
                      >
                        <option value="">—</option>
                        {TIME_HOURS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Mins</span>
                      <select
                        value={form.deliveryMinute}
                        onChange={(e) => updateForm('deliveryMinute', e.target.value)}
                        className="w-full min-h-[52px] px-3 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation bg-white"
                        aria-label="Minutes"
                      >
                        {TIME_MINUTES.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">AM/PM</span>
                      <select
                        value={form.deliveryAmPm}
                        onChange={(e) => updateForm('deliveryAmPm', e.target.value)}
                        className="w-full min-h-[52px] px-3 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation bg-white"
                        aria-label="AM or PM"
                      >
                        {TIME_AMPM.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery / Parcel / Rapido address – same as Checkout (Street, City, Pincode), all optional */}
              {(form.collectingType === 'delivery' || form.collectingType === 'parcel' || form.collectingType === 'rapido') && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-500 flex-shrink-0" />
                    {form.collectingType === 'parcel' ? 'Parcel address' : form.collectingType === 'rapido' ? 'Rapido address' : 'Delivery Address'}
                    <span className="text-xs font-normal text-gray-500">(all optional)</span>
                  </h3>
                  {form.collectingType === 'delivery' && <p className="text-sm text-gray-500">Delivery is free (no shipping charge).</p>}
                  {form.collectingType === 'parcel' && <p className="text-sm text-gray-500">Parcel: Shipping ₹{PARCEL_SHIPPING}.</p>}
                  {form.collectingType === 'rapido' && <p className="text-sm text-gray-500">Rapido: No shipping charge.</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="handicraft-address" className="block text-sm font-medium text-gray-600 mb-2">Street Address</label>
                      <input
                        id="handicraft-address"
                        type="text"
                        value={form.address}
                        onChange={(e) => updateForm('address', e.target.value)}
                        placeholder="e.g., 123 Main Street, Near Park"
                        className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation"
                      />
                    </div>
                    <div>
                      <label htmlFor="handicraft-city" className="block text-sm font-medium text-gray-600 mb-2">City</label>
                      <input
                        id="handicraft-city"
                        type="text"
                        value={form.city}
                        onChange={(e) => updateForm('city', e.target.value)}
                        placeholder="e.g., Suryapet"
                        className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation"
                      />
                    </div>
                    {(form.collectingType === 'parcel' || form.collectingType === 'rapido') && (
                      <>
                        <div>
                          <label htmlFor="handicraft-district" className="block text-sm font-medium text-gray-600 mb-2">District</label>
                          <input
                            id="handicraft-district"
                            type="text"
                            value={form.district}
                            onChange={(e) => updateForm('district', e.target.value)}
                            placeholder="e.g., Suryapet"
                            className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation"
                          />
                        </div>
                        <div>
                          <label htmlFor="handicraft-state" className="block text-sm font-medium text-gray-600 mb-2">State</label>
                          <input
                            id="handicraft-state"
                            type="text"
                            value={form.state}
                            onChange={(e) => updateForm('state', e.target.value)}
                            placeholder="e.g., Telangana"
                            className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label htmlFor="handicraft-pincode" className="block text-sm font-medium text-gray-600 mb-2">Postal Code (PIN)</label>
                      <input
                        id="handicraft-pincode"
                        type="text"
                        value={form.pincode}
                        onChange={(e) => updateForm('pincode', e.target.value)}
                        placeholder="e.g., 508213"
                        maxLength={6}
                        inputMode="numeric"
                        className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Parcel / Rapido: Tracking number */}
              {(form.collectingType === 'parcel' || form.collectingType === 'rapido') && (
                <div>
                  <label htmlFor="handicraft-tracking" className="block text-sm font-medium text-gray-700 mb-2">Tracking number</label>
                  <input
                    id="handicraft-tracking"
                    type="text"
                    value={form.trackingNumber}
                    onChange={(e) => updateForm('trackingNumber', e.target.value)}
                    placeholder="e.g., courier AWB or tracking ID"
                    className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 focus:border-rose-500 touch-manipulation"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} placeholder="Any extra notes" className="w-full min-h-[52px] px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 touch-manipulation" />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-4 mt-8">
              <button
                type="button"
                onClick={handleSave}
                disabled={!form.source || !form.collectingType || !form.phone || !form.items.some((it) => it.chocolateType) || saving}
                className="flex-1 min-h-[56px] px-5 py-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white rounded-xl font-medium flex items-center justify-center gap-2 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 text-base"
              >
                {saving && <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />}
                {editingId ? 'Update Order' : 'Save Order'}
              </button>
              <button type="button" onClick={handleClear} disabled={saving} className="min-h-[56px] px-5 py-4 border-2 border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 active:scale-[0.98] rounded-xl font-medium touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 text-base">
                Clear
              </button>
              <button type="button" onClick={handleCancel} disabled={saving} className="min-h-[56px] px-5 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-[0.98] rounded-xl font-medium touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 text-base">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Last order only – same card as Dashboard */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Last order</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No orders yet. Click &quot;Add Order&quot; to note an order from Instagram or WhatsApp.
            </div>
          ) : (() => {
            const o = orders[0];
            // Permanent order number by creation order: first order MO-001, second MO-002, etc. (orders are newest-first, so last order = orders.length)
            const orderSeq = String(orders.length).padStart(3, '0');
            const items = o.items && Array.isArray(o.items) ? o.items : [{ chocolate_type: o.chocolate_type, chocolate_details: o.chocolate_details, quantity: o.quantity, unit_price: o.unit_price, customization: o.customization }];
            const STORE_ADDRESS = '1-6-141/43/A2/C, Sri Ram nagar, Near new vision school, Suryapet, 508213';
            return (
              <div className="bg-white rounded-xl shadow-md border-2 border-rose-100/50 overflow-hidden">
                {/* Heading: #MO-001, #MO-002, … by order added (creation order) */}
                <div className="flex flex-wrap items-center gap-3 min-h-[56px] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                    <span className="font-bold text-gray-900 text-base">#MO-{orderSeq}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {o.source === 'instagram' ? <Instagram className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                      {o.source === 'instagram' ? 'Instagram' : 'WhatsApp'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${o.collecting_type === 'pickup' ? 'bg-amber-100 text-amber-800' : o.collecting_type === 'parcel' ? 'bg-violet-100 text-violet-800' : o.collecting_type === 'rapido' ? 'bg-rose-100 text-rose-800' : 'bg-green-100 text-green-800'}`}>
                      {o.collecting_type === 'pickup' ? <Package className="h-3.5 w-3.5" /> : o.collecting_type === 'parcel' ? <Package className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                      {o.collecting_type === 'pickup' ? 'Pickup' : o.collecting_type === 'parcel' ? 'Parcel' : o.collecting_type === 'rapido' ? 'Rapido' : 'Delivery'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'cancelled' ? 'bg-red-100 text-red-700' : o.status === 'shipping' ? 'bg-indigo-100 text-indigo-700' : o.status === 'ready' ? 'bg-blue-100 text-blue-700' : o.status === 'processing' ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {(o.status || 'pending').charAt(0).toUpperCase() + (o.status || 'pending').slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <select
                      value={o.status || 'pending'}
                      onChange={(e) => updateManualOrderStatus(o.id, e.target.value)}
                      disabled={updatingStatusId === o.id}
                      className="min-h-[48px] min-w-[130px] rounded-xl border-2 border-gray-200 px-4 py-3 text-base font-medium focus:ring-2 focus:ring-rose-200 focus:border-rose-300 touch-manipulation bg-white"
                      aria-label="Update status"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="ready">Ready</option>
                      <option value="shipping">Shipping</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {updatingStatusId === o.id && <Loader2 className="w-5 h-5 animate-spin text-rose-600 flex-shrink-0" />}
                    <button type="button" onClick={() => handleEdit(o)} className="min-h-[48px] min-w-[48px] p-3 flex items-center justify-center text-amber-600 hover:bg-amber-50 active:bg-amber-100 rounded-xl touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2" aria-label="Edit order"><Pencil className="h-5 w-5" /></button>
                    <button type="button" onClick={() => handleDelete(o.id)} className="min-h-[48px] min-w-[48px] p-3 flex items-center justify-center text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2" aria-label="Delete order"><Trash2 className="h-5 w-5" /></button>
                  </div>
                </div>
                {/* Details – same as Dashboard: items with images, Contact, Address, no totals */}
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
                          const legacyImage = o.chocolate_type && searchData.find((p) => p.title === o.chocolate_type)?.image;
                          return (
                            <div className="flex items-start gap-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                              {legacyImage ? (
                                <img src={legacyImage} alt={o.chocolate_type || 'Chocolate'} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                              ) : (
                                <div className="w-14 h-14 rounded-lg border border-gray-200 bg-rose-100/50 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-6 h-6 text-rose-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <span className="font-medium text-gray-800">{o.chocolate_type || '—'}</span>
                                <span className="text-gray-500 ml-1">× {o.quantity || 0}</span>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start gap-3 p-2.5 bg-rose-50/50 rounded-lg border border-rose-100 text-sm">
                    <User className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Contact</p>
                      {o.customer_name && <p className="text-gray-800">Name: {o.customer_name}</p>}
                      <p className="text-gray-800">Phone: {o.phone ? <a href={`tel:${o.phone}`} className="text-rose-600 hover:underline">{o.phone}</a> : '—'}</p>
                      {o.delivery_time && <p className="text-gray-600">{o.collecting_type === 'pickup' ? 'Pickup: ' : o.collecting_type === 'parcel' ? 'Parcel: ' : 'Deliver by: '}{o.delivery_time}</p>}
                      {(o.collecting_type === 'parcel' || o.collecting_type === 'rapido') && (
                        <p className="text-gray-600 mt-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase">Tracking: </span>
                          {updatingTrackingId === o.id ? (
                            <Loader2 className="w-4 h-4 inline animate-spin" />
                          ) : (
                            <input
                              type="text"
                              value={lastOrderTrackingInput}
                              onChange={(e) => setLastOrderTrackingInput(e.target.value)}
                              onBlur={() => {
                                const v = lastOrderTrackingInput?.trim();
                                if (v !== (o.tracking_number || '')) updateManualOrderTracking(o.id, v);
                              }}
                              placeholder="Add tracking number"
                              className="mt-0.5 w-full max-w-xs min-h-[36px] px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
                            />
                          )}
                        </p>
                      )}
                      {o.source_identifier && <p className="text-gray-600">{o.source === 'instagram' ? 'Instagram: ' : 'WhatsApp: '}{o.source_identifier}</p>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
                      {o.collecting_type === 'pickup' ? (
                        <p className="text-gray-700 text-xs sm:text-sm">{STORE_ADDRESS}</p>
                      ) : (
                        <p className="text-gray-700">{[o.address, o.city, o.district, o.state, o.pincode].filter(Boolean).join(', ') || '—'}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Manual order · No payment tracking</p>
                  {o.notes && <p className="text-sm text-gray-600">Notes: {o.notes}</p>}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
};

export default Handicraft;