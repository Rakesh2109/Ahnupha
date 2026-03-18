# Ahnupha Website — WordPress + WooCommerce Migration Guide

This document provides all details needed to recreate the Ahnupha e-commerce website in WordPress + WooCommerce, including colors, pages, checkout flow, and business rules.

---

## Table of Contents

1. [Brand & Store Information](#1-brand--store-information)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Pages & Routes](#4-pages--routes)
5. [Checkout Flow & Payment](#5-checkout-flow--payment)
6. [Shipping & Delivery](#6-shipping--delivery)
7. [Product Categories & Features](#7-product-categories--features)
8. [Forms & Enquiry](#8-forms--enquiry)
9. [Header & Navigation](#9-header--navigation)
10. [Footer Structure](#10-footer-structure)
11. [Recommended Plugins](#11-recommended-plugins)
12. [Migration Checklist](#12-migration-checklist)

---

## 1. Brand & Store Information

| Field | Value |
|-------|-------|
| **Brand Name** | Ahnupha |
| **Tagline** | Personalised chocolate bars. Customise your chocolate. Handcrafted and homemade. Premium quality. |
| **Email** | info@ahnupha.com |
| **Phone** | +91 9515404195 |
| **WhatsApp** | +91 9515404195 (use `919515404195` in links) |
| **Address** | 1-6-141/43/A2/C, Sri Ram Nagar, Near New Vision School, Suryapet, Telangana 508213, India |
| **Business Hours** | Mon–Sat: 9:00 AM – 6:00 PM |
| **Instagram** | @ahnupha_bites |
| **Website** | https://ahnupha.com |
| **UPI ID** | videmuma@ybl |
| **Razorpay Key ID** | rzp_live_SCxeorHKCuq9F4 (public key) |

---

## 2. Color Palette

Use these exact colors in your WordPress theme (Customizer or CSS variables).

### Primary Colors (Rose & Amber)

| Color Name | Hex | Tailwind | Usage |
|------------|-----|----------|-------|
| **Primary Rose** | `#e11d48` | rose-600 | Buttons, links, accents, CTA |
| **Rose Light** | `#f43f5e` | rose-500 | Hover states, gradients |
| **Rose Dark** | `#be123c` | rose-700 | Active/pressed states |
| **Primary Amber** | `#f59e0b` | amber-500 | Secondary accent, gradients |
| **Amber Light** | `#fbbf24` | amber-400 | Highlights |
| **Amber Dark** | `#d97706` | amber-600 | Hover states |

### Background & Neutral

| Color Name | Hex | Usage |
|------------|-----|-------|
| **White** | `#ffffff` | Page background, cards |
| **Gray 50** | `#f9fafb` | Light backgrounds, cart page |
| **Gray 100** | `#f3f4f6` | Borders, subtle backgrounds |
| **Gray 200** | `#e5e7eb` | Input borders |
| **Gray 500** | `#6b7280` | Muted text |
| **Gray 700** | `#374151` | Body text, nav links |
| **Gray 900** | `#111827` | Headings |
| **Footer Dark** | `#030712` | gray-950 — footer background |

### Gradient Combinations

```
Primary gradient (buttons, CTAs):  linear-gradient(to right, #e11d48, #f59e0b)
Hero/background gradient:          linear-gradient(to bottom right, #fff1f2, #ffffff, #fffbeb)
Footer gradient overlay:           linear-gradient(to bottom right, rgba(88,28,135,0.5), #030712, rgba(120,53,15,0.3))
Footer top border:                 linear-gradient(to right, #e11d48, #f59e0b, #e11d48)
```

### Accent Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Green (success)** | `#16a34a` | Free items, success messages |
| **Red (error)** | `#dc2626` | Errors, destructive actions |
| **Pink (contact)** | `#ec4899` | Some contact icons |

---

## 3. Typography

| Element | Font | Weight | Notes |
|---------|------|--------|-------|
| **Body** | Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto | 400 | System font stack |
| **Headings** | Same as body | 700–800 (bold/extrabold) | `font-weight: bold` |
| **Buttons** | Same | 600–700 (semibold/bold) | `font-semibold` |
| **Nav links** | Same | 600–700 | `font-bold` |

**Google Fonts:** Import Inter: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap`

---

## 4. Pages & Routes

| Page | URL Path | Description |
|------|----------|-------------|
| **Home** | `/` | Hero, featured products, how it works |
| **Chocolate** | `/candy-chocolate` | Main product listing (chocolates, snacks) |
| **Customize** | `/customize` | Custom chocolate builder (highlighted in nav) |
| **Snacks** | `/snacks` | Homemade food products |
| **About Us** | `/about` | Company story, values, pillars |
| **Contact** | `/contact` | Contact info, WhatsApp, enquiry |
| **Login** | `/login` | User login (email/OTP) |
| **Signup** | `/signup` | User registration |
| **Cart** | `/cart` | Shopping cart with B2G1 free items |
| **Checkout** | `/checkout` | 2-step: Details → Payment |
| **Dashboard** | `/dashboard` | User account (protected) |
| **Handicraft** | `/handicraft` | Manual orders (admin only) |
| **Privacy Policy** | `/privacy-policy` | Legal page |
| **Terms of Service** | `/terms-of-service` | Legal page |
| **Reset Password** | `/reset-password` | Password reset form |

---

## 5. Checkout Flow & Payment

### Checkout Steps

1. **Step 1 — Details**
   - First name, Last name
   - Email
   - Phone (10–15 digits)
   - Delivery type: **Delivery** or **Pickup**
   - If Delivery: Address, City, District, State, Pincode
   - Checkbox: **Suryapet local** (free delivery)
   - Order instructions (optional)
   - If Pickup: Date/time (store hours 8 AM – 8 PM, 24h min advance)

2. **Step 2 — Payment**
   - Subtotal
   - Shipping (₹0 Suryapet local, ₹100 otherwise)
   - Coupon: `Welcome10` = 10% off
   - Gift wrap: +₹20 per item (optional)
   - Payment methods: **Razorpay** (cards/UPI) or **UPI** (QR/manual)

### Payment Methods

| Method | Details |
|--------|---------|
| **Razorpay** | Cards, UPI, netbanking. Key: `rzp_live_SCxeorHKCuq9F4` |
| **UPI** | UPI ID: `videmuma@ybl`. QR code for scan-to-pay. Deep link: `upi://pay?pa=videmuma@ybl&pn=Ahnupha&am={amount}&cu=INR` |

### Business Rules

- **No Cash on Delivery (COD)** — online payment only
- **No returns/refunds** for chocolates (perishable)
- **Platform fee:** 0% (GST removed)
- **Payment window:** 15 minutes after order creation
- **Gift wrap:** ₹20 per item

---

## 6. Shipping & Delivery

| Condition | Shipping Charge |
|-----------|-----------------|
| Suryapet local (pincode 508213) | **Free** |
| Outside Suryapet | **₹100** |
| Pickup | **₹0** |

**Indian states** for address dropdown: Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal, Andaman and Nicobar Islands, Chandigarh, Delhi, Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry.

---

## 7. Product Categories & Features

### Categories

- **Chocolate** — bars, truffles, assorted, kunafa, personalised
- **Snacks** — Dry Fruit Laddu, homemade food

### Product Features to Support

| Feature | Description |
|---------|-------------|
| **Weight options** | e.g. 150g / 300g / 450g with different prices |
| **Gift wrap** | +₹20 per item |
| **Custom name on bar** | Personalisation |
| **B2G1 (Buy 2 Get 1)** | "With Love Rose Chocolate" free when buying 2+ paid items |
| **Min order for delivery** | Some products (e.g. Kunafa Chocolate) min 10 for delivery |
| **Stock** | Product-level stock (synced from DB in current app) |

### Sample Products (from searchData)

| Product | Price | Weight | Notes |
|---------|-------|--------|-------|
| Kunafa Bar Chocolate | ₹599 | 240g | Featured |
| Assorted Chocolates | ₹119 | 125g | 12 chocolates |
| Dry Fruit Laddu | ₹169 / ₹339 / ₹509 | 150g / 300g / 450g | Weight options |
| Kunafa Chocolate | ₹49 | 16g | Min 10 for delivery |
| Truffle Temptation Box | ₹399 | 180g | |
| Valentine Photo Chocolates | ₹339 | 100g | |
| With Love Rose Chocolate | Free (B2G1) | — | Free with 2+ paid items |

---

## 8. Forms & Enquiry

### Contact Page

- Email, Phone, Instagram, WhatsApp, Delivery info, Business hours
- WhatsApp link: `https://wa.me/919515404195`
- Optional product prefill: `?product=prod-dry-fruit-laddu` for Dry Fruit Laddu enquiry

### Enquiry Form (if used)

- Name, Email, Phone, Message
- Submit to: info@ahnupha.com

### Login/Signup

- Email + OTP (magic link) or password
- Google OAuth (optional)
- Supabase Auth in current app → replace with WooCommerce/WordPress user system

---

## 9. Header & Navigation

### Desktop Nav Links

| Label | URL | Highlight |
|-------|-----|-----------|
| Home | `/` | No |
| Chocolate | `/candy-chocolate` | No |
| **Customize** | `/customize` | **Yes** (gradient pill, "New" badge) |
| Snacks | `/snacks` | No |
| About Us | `/about` | No |
| Contact | `/contact` | No |

### Header Elements

- **Logo** — Ahnupha logo (left)
- **Search** — Expandable, product search with dropdown
- **Wishlist** — Heart icon + badge count
- **Cart** — Cart icon + badge count
- **User avatar** — Dropdown: Dashboard, Manual Orders (admin), Log out
- **Login** — Rose button when logged out
- **Mobile menu** — Hamburger, full-width nav + search

### Header Styling

- Sticky, `bg-white/98`, `backdrop-blur`, `border-b border-gray-100`
- Height: ~80px (h-20)
- Customize link: `bg-gradient-to-r from-rose-500 to-amber-500` pill

---

## 10. Footer Structure

### Layout (4 columns on desktop)

1. **Column 1**
   - Logo (inverted/white)
   - Tagline: "Handcrafted with love, delivered with care."
   - Instagram, WhatsApp icons

2. **Column 2 — Shop**
   - Chocolates
   - Customize Chocolates (gradient text)

3. **Column 3 — Company**
   - About Us
   - Contact

4. **Column 4 — Legal**
   - Privacy Policy
   - Terms of Service

### Pre-footer CTA

- "Ready to order? Get your perfect chocolate — delivered fresh."
- Buttons: **Shop Now** (gradient), **Contact Us** (outline)

### Footer Styling

- Background: `#030712` (gray-950)
- Gradient overlay: `from-rose-950/50 via-gray-950 to-amber-950/30`
- Top border: `linear-gradient(to right, rose-600, amber-500, rose-600)`
- Text: white, gray-400 for links
- Hover: `text-rose-400`
- Copyright: "© {year} Ahnupha. All rights reserved."
- Subtext: "Handcrafted with ♥ in Suryapet, Telangana"

---

## 11. Recommended Plugins

| Plugin | Purpose |
|--------|---------|
| **WooCommerce** | E-commerce core |
| **YITH WooCommerce Wishlist** | Wishlist |
| **Razorpay for WooCommerce** | Payment gateway |
| **Contact Form 7** or **WPForms** | Contact form |
| **Elementor** or **Bricks** | Page builder |
| **Yoast SEO** or **Rank Math** | SEO |
| **LiteSpeed Cache** or **WP Super Cache** | Performance |
| **Wordfence** | Security |
| **WP Mail SMTP** | Reliable email |

### Theme Options

- **Astra** or **Kadence** — WooCommerce-ready, fast
- Customize colors via CSS variables or theme settings

---

## 12. Migration Checklist

```markdown
- [ ] Install WordPress + WooCommerce
- [ ] Set up theme (Astra/Kadence) with color palette
- [ ] Create pages: Home, Chocolate, Customize, Snacks, About, Contact, Cart, Checkout
- [ ] Install Razorpay + configure UPI
- [ ] Set shipping zones: Suryapet free, others ₹100
- [ ] Import products (CSV from searchData)
- [ ] Add products with weight options, gift wrap
- [ ] Install wishlist plugin
- [ ] Add header: logo, nav, search, cart, wishlist, user
- [ ] Add footer: 4 columns, CTA, links
- [ ] Create Privacy Policy, Terms of Service
- [ ] Set up contact form
- [ ] Configure B2G1 (Buy 2 Get 1) if WooCommerce supports
- [ ] Test checkout flow
- [ ] Set up redirects from old URLs
- [ ] Migrate users (if needed)
```

---

## Quick Reference

### CSS Variables (add to theme)

```css
:root {
  --color-rose-500: #f43f5e;
  --color-rose-600: #e11d48;
  --color-rose-700: #be123c;
  --color-amber-400: #fbbf24;
  --color-amber-500: #f59e0b;
  --color-amber-600: #d97706;
  --color-gray-50: #f9fafb;
  --color-gray-900: #111827;
  --color-footer: #030712;
  --gradient-primary: linear-gradient(to right, #e11d48, #f59e0b);
}
```

### Key URLs

- Home: `/`
- Shop: `/candy-chocolate` or `/shop`
- Cart: `/cart`
- Checkout: `/checkout`
- Contact: `/contact`
- WhatsApp: `https://wa.me/919515404195`
- Instagram: `https://instagram.com/ahnupha_bites/`

---

*Last updated: March 2025. Based on Ahnupha React + Vite + Supabase codebase.*
