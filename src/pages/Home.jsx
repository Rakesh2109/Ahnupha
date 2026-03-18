import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import CircleChocolateCards from '@/components/CircleChocolateCards';
import { Star, Truck, Shield, Gift, ChevronRight, Sparkles, ArrowRight, Package, Heart, CheckCircle, Paintbrush } from 'lucide-react';

const DRY_FRUIT_LADDU_IMAGE = 'https://live.staticflickr.com/65535/55132706673_38ccef67a6_b.jpg';
const CHOCOLATE_HERO_IMAGE   = 'https://live.staticflickr.com/65535/55069718467_166f15ce71_b.jpg';
const ADMIN_EMAIL = "info@ahnupha.com";

/* ─── shared motion helpers ──────────────────────────────────────── */
const fadeUp  = (delay = 0) => ({ hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } } });
const fadeIn  = (delay = 0) => ({ hidden: { opacity: 0 },         show: { opacity: 1,       transition: { duration: 0.6, delay } } });
const scaleIn = (delay = 0) => ({ hidden: { opacity: 0, scale: 0.88 }, show: { opacity: 1, scale: 1, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } } });

/* ─── decorative animated blob ───────────────────────────────────── */
const Blob = ({ className, delay = 0, d = 9 }) => (
  <motion.div
    className={`absolute rounded-full blur-[80px] pointer-events-none ${className}`}
    animate={{ y: [0, -22, 0], scale: [1, 1.07, 1] }}
    transition={{ duration: d, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

/* ─── step card ───────────────────────────────────────────────────── */
const Step = ({ num, icon: Icon, title, desc, delay }) => (
  <motion.div
    variants={fadeUp(delay)}
    className="group relative flex flex-col items-center text-center px-6 py-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-rose-50/0 to-amber-50/0 group-hover:from-rose-50/70 group-hover:to-amber-50/40 transition-all duration-400 rounded-3xl" />
    <div className="relative z-10">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-xl mx-auto group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-extrabold flex items-center justify-center shadow-md">
          {num}
        </span>
      </div>
      <h3 className="text-base font-extrabold text-gray-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

/* ════════════════════════════════════════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useSupabaseAuth();

  const goToChocolateProduct = (e) => {
    e?.preventDefault?.();
    navigate('/candy-chocolate?product=prod-dry-fruit-laddu');
  };

  const features = [
    { icon: Star,    label: 'Premium Quality',    sub: 'Finest ingredients'   },
    { icon: Gift,    label: 'Fully Customizable',  sub: 'Your name on the bar' },
    { icon: Truck,   label: 'Pan India Delivery',  sub: 'Free in 508213'       },
    { icon: Shield,  label: '100% Homemade',       sub: 'Made fresh every time'},
  ];

  const steps = [
    { num: '1', icon: Package,    title: 'Browse Collection',  desc: 'Explore our full range of handcrafted chocolates and homemade treats.' },
    { num: '2', icon: Paintbrush, title: 'Customize Your Bar', desc: 'Add your name, a message, or pick your perfect flavour combination.' },
    { num: '3', icon: Heart,      title: 'Delivered with Love',desc: 'We pack every order with care and deliver fresh right to your door.' },
  ];

  return <>
    <Helmet>
      <title>Ahnupha | Handmade Chocolates</title>
      <meta name="description" content="Welcome to Ahnupha. Discover premium handcrafted chocolates and truffles. Free delivery for pincode 508213; ₹100 shipping charge for other pincodes." />
    </Helmet>

    {/* ════════════════════════════════════════════════════════════════
        HERO — cinematic full-height split screen
    ════════════════════════════════════════════════════════════════ */}
    <section className="relative overflow-hidden min-h-[88vh] flex items-center">
      {/* rich layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50/80" />

      {/* animated colour blobs */}
      <Blob className="w-[500px] h-[500px] bg-rose-300/35  -top-32  -left-32"  delay={0}   d={10} />
      <Blob className="w-[420px] h-[420px] bg-amber-200/30 -bottom-40 -right-28" delay={2.5} d={11} />
      <Blob className="w-[260px] h-[260px] bg-rose-200/25  top-1/3   right-1/4"  delay={4}   d={8}  />

      {/* subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #e11d48 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 py-16 md:py-0">
        <div className="flex flex-col md:flex-row md:items-center md:gap-10 lg:gap-16">

          {/* ── Left: text ───────────────────────────────── */}
          <motion.div
            initial="hidden" animate="show"
            className="flex-1 text-center md:text-left"
          >
            {/* eyebrow pill */}
            <motion.div variants={fadeUp(0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-rose-200/80 text-rose-700 text-xs font-bold uppercase tracking-[0.12em] mb-6 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              Handcrafted · Premium · Personalised
            </motion.div>

            {/* headline */}
            <motion.h1 variants={fadeUp(0.08)}
              className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
            >
              Pure Chocolate,{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500">
                  Crafted
                </span>
              </span>
              <br />
              <span className="text-gray-800">Just For You.</span>
            </motion.h1>

            {/* subtext */}
            <motion.p variants={fadeUp(0.16)}
              className="text-lg md:text-xl text-gray-500 font-medium max-w-lg mx-auto md:mx-0 leading-relaxed mb-8"
            >
              Handmade chocolates you can customise with your name, a message, or your favourite flavours — delivered all over India.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUp(0.24)} className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/candy-chocolate"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-base shadow-xl shadow-rose-300/40 hover:shadow-2xl hover:shadow-rose-400/50 hover:from-rose-700 hover:to-rose-600 transition-all duration-300 group"
              >
                Shop Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link to="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-rose-200 text-rose-600 font-bold text-base hover:bg-rose-50 hover:border-rose-300 transition-all duration-300 bg-white/70 backdrop-blur-sm"
              >
                Customize Your Bar
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Right: product image ─────────────────────── */}
          <motion.div
            variants={scaleIn(0.2)} initial="hidden" animate="show"
            className="flex-shrink-0 flex justify-center mt-12 md:mt-0"
          >
            <div className="relative">
              {/* outer decorative rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-6 rounded-full border-2 border-dashed border-rose-200/60 pointer-events-none"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-12 rounded-full border border-amber-200/50 pointer-events-none"
              />

              {/* glow halo */}
              <div className="absolute -inset-8 bg-gradient-to-br from-rose-400/25 to-amber-400/20 rounded-full blur-3xl" />

              {/* main image circle */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-4 border-white shadow-[0_30px_80px_rgba(244,63,94,0.25)] ring-4 ring-rose-200/50">
                <img
                  src={CHOCOLATE_HERO_IMAGE}
                  alt="Premium Handmade Chocolate"
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-110"
                  onError={(e) => { e.target.src = "https://horizons-cdn.hostinger.com/a120f215-a5a4-4e6b-834f-b5712b2ce12c/6d449b88b5b634066c16f0e372c6d43c.jpg"; }}
                />
                {/* subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-rose-900/10 to-transparent" />
              </div>

              {/* floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5, ease: [0.22,1,0.36,1] }}
                className="absolute -bottom-4 -left-6 bg-white rounded-2xl px-4 py-2.5 shadow-2xl border border-rose-100 flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-900 leading-none">Personalizable</p>
                  <p className="text-xs text-gray-400 leading-none mt-0.5">Your name on every bar</p>
                </div>
              </motion.div>

              {/* floating badge 2 */}
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.85, duration: 0.5, ease: [0.22,1,0.36,1] }}
                className="absolute -top-4 -right-6 bg-white rounded-2xl px-4 py-2.5 shadow-2xl border border-amber-100 flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-400 flex items-center justify-center shadow">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-900 leading-none">100% Homemade</p>
                  <p className="text-xs text-gray-400 leading-none mt-0.5">Made fresh every order</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none">
        <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" fill="white" />
        </svg>
      </div>
    </section>

    {/* ════════════════════════════════════════════════════════════════
        FEATURES STRIP
    ════════════════════════════════════════════════════════════════ */}
    <section className="bg-white py-5 border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {features.map(({ icon: Icon, label, sub }) => (
            <motion.div key={label} variants={fadeUp(0)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/80 to-amber-50/50 border border-rose-100/60 hover:border-rose-200 hover:shadow-md transition-all duration-300 cursor-default group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-gray-900 leading-tight">{label}</p>
                <p className="text-xs text-gray-500 leading-tight">{sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* ════════════════════════════════════════════════════════════════
        CHOCOLATE COLLECTION BANNER
    ════════════════════════════════════════════════════════════════ */}
    <section className="py-10 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <CircleChocolateCards />
      </div>
    </section>

    {/* ════════════════════════════════════════════════════════════════
        HOW IT WORKS
    ════════════════════════════════════════════════════════════════ */}
    <section className="relative overflow-hidden py-16 md:py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 to-white" />
      <Blob className="w-80 h-80 bg-rose-200/20 -top-20 -right-20" delay={0} d={10} />
      <Blob className="w-72 h-72 bg-amber-200/15 -bottom-20 -left-20" delay={3} d={9} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* section heading */}
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={fadeUp(0)}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            Simple &amp; Delightful
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            How It{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-500">
              Works
            </span>
          </h2>
          <p className="mt-3 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Ordering your perfect chocolate has never been easier.
          </p>
        </motion.div>

        {/* step cards */}
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {steps.map((s, i) => <Step key={s.num} {...s} delay={i * 0.12} />)}
        </motion.div>

        {/* connector line on desktop */}
        <div className="hidden md:flex absolute top-[calc(50%+20px)] left-1/2 -translate-x-1/2 w-[55%] items-center justify-between pointer-events-none" aria-hidden>
          {/* just decorative — visual spacing handled by cards */}
        </div>
      </div>
    </section>

    {/* ════════════════════════════════════════════════════════════════
        NEWLY LAUNCHED — DRY FRUIT LADDU  (cinematic feature section)
    ════════════════════════════════════════════════════════════════ */}
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* deep warm background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-rose-50/30 to-white" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
      />
      <Blob className="w-96 h-96 bg-amber-300/25 -top-16  right-0"    delay={1}   d={10} />
      <Blob className="w-72 h-72 bg-rose-300/20  bottom-0 -left-16"   delay={3.5} d={9}  />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* label */}
        <div className="flex justify-center mb-10">
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
            className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-sm font-extrabold uppercase tracking-widest shadow-xl shadow-rose-300/40"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Newly Launched
          </motion.span>
        </div>

        {/* two-column content */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
            className="w-full lg:w-5/12 flex-shrink-0"
          >
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              {/* decorative glow */}
              <div className="absolute -inset-6 bg-gradient-to-br from-amber-300/30 to-rose-200/20 rounded-3xl blur-2xl" />
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.35 }}
                className="relative rounded-3xl overflow-hidden shadow-2xl ring-2 ring-amber-200/60"
              >
                <img
                  src={DRY_FRUIT_LADDU_IMAGE}
                  alt="Dry Fruit Laddu"
                  className="w-full h-auto object-contain bg-amber-50"
                  loading="lazy"
                />
                {/* badge overlay */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                    <CheckCircle className="w-3.5 h-3.5" /> Homemade
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* text */}
          <motion.div
            initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
            className="flex-1 text-center lg:text-left"
          >
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Homemade · Premium</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
              Dry Fruit<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-rose-500">
                Laddu
              </span>
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              Lovingly handcrafted with a generous blend of premium dry fruits. Ideal as a wholesome gift or a festive treat for every celebration.
            </p>

            {/* weight + price chips */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
              {[{ w: '150g', p: '₹169' }, { w: '300g', p: '₹339' }, { w: '450g', p: '₹509' }].map(({ w, p }) => (
                <div key={w} className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white border-2 border-amber-200 shadow-md hover:border-amber-400 hover:shadow-lg transition-all duration-200 cursor-default min-w-[80px]">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{w}</span>
                  <span className="text-lg font-extrabold text-amber-600">{p}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/candy-chocolate?product=prod-dry-fruit-laddu"
                onClick={goToChocolateProduct}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-extrabold text-base shadow-xl shadow-rose-300/40 hover:shadow-2xl hover:from-rose-700 hover:to-rose-600 transition-all duration-300 cursor-pointer select-none group"
                style={{ touchAction: 'manipulation' }}
              >
                Order Now
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <p className="mt-4 text-gray-400 text-sm">Delivered fresh all over India.</p>
          </motion.div>
        </div>
      </div>
    </section>

    {/* ════════════════════════════════════════════════════════════════
        BRAND STORY / FOUNDER  (editorial magazine layout)
    ════════════════════════════════════════════════════════════════ */}
    <section className="relative overflow-hidden py-16 md:py-24 bg-white">
      {/* subtle corner aura */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-rose-50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-50 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl opacity-60 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

          {/* portrait — desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
            className="hidden lg:block shrink-0 relative"
          >
            {/* layered rings behind image */}
            <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-rose-200/40 to-amber-200/30 blur-2xl" />
            <div className="absolute -inset-3 rounded-[36px] border-2 border-rose-100/60" />

            <div className="relative w-72 xl:w-80 aspect-[3/4] rounded-[32px] overflow-hidden border-4 border-white shadow-[0_40px_100px_rgba(244,63,94,0.18)] ring-2 ring-rose-100/50 hover:shadow-[0_50px_120px_rgba(244,63,94,0.25)] hover:scale-[1.015] transition-all duration-500">
              <img
                src="https://horizons-cdn.hostinger.com/a120f215-a5a4-4e6b-834f-b5712b2ce12c/whatsapp-image-2026-01-16-at-18.32.16-YBsBt.jpeg"
                alt="Founder of Ahnupha"
                className="w-full h-full object-cover object-[center_top]"
                loading="lazy" decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-900/15 to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="absolute -bottom-6 -right-6 bg-white rounded-2xl px-6 py-3 shadow-2xl border-2 border-rose-100 z-10"
            >
              <p className="text-sm font-extrabold text-rose-600">Founder, Ahnupha</p>
            </motion.div>
          </motion.div>

          {/* text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
            className="flex-1"
          >
            {/* mobile: inline portrait */}
            <div className="flex items-center gap-5 lg:hidden mb-7">
              <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-xl ring-2 ring-rose-100/60 shrink-0">
                <img
                  src="https://horizons-cdn.hostinger.com/a120f215-a5a4-4e6b-834f-b5712b2ce12c/whatsapp-image-2026-01-16-at-18.32.16-YBsBt.jpeg"
                  alt="Founder"
                  className="w-full h-full object-cover object-[center_top]"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Founder</p>
                <p className="font-extrabold text-gray-900 text-lg">Ahnupha</p>
              </div>
            </div>

            <p className="text-xs font-bold text-rose-500 uppercase tracking-[0.14em] mb-4">Our Brand Story</p>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8">
              Built on Love,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-500">
                Crafted with Purpose.
              </span>
            </h2>

            {/* pull quote */}
            <div className="relative pl-6 mb-6 border-l-4 border-gradient-to-b">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-rose-500 to-amber-500" />
              <p className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed italic">
                "Ahnupha is built on quality, customization, and emotional connection — every product tells a story."
              </p>
            </div>

            <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-lg">
              We are a multi-category brand offering handcrafted products and personalized services. From premium chocolates to homemade sweets, everything we create reflects our commitment to quality and care.
            </p>

            <div className="mt-8">
              <Link to="/about"
                className="inline-flex items-center gap-2 text-rose-600 font-bold text-base hover:text-rose-700 group transition-colors"
              >
                Read Our Full Story
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>

    {/* ════════════════════════════════════════════════════════════════
        BOTTOM CTA BANNER
    ════════════════════════════════════════════════════════════════ */}
    <section className="relative overflow-hidden py-16 md:py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500" />
      {/* noise overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }}
      />
      <Blob className="w-96 h-96 bg-white/10 -top-24 -left-24"   delay={0}   d={9}  />
      <Blob className="w-72 h-72 bg-white/10 -bottom-20 -right-20" delay={2.5} d={11} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Ready to treat yourself?
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
            Order Your Perfect<br />Chocolate Today
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            Customise it with your name, pick your flavours, and we'll deliver it fresh to your door — all over India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/candy-chocolate"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-rose-600 font-extrabold text-base shadow-2xl hover:shadow-white/30 hover:scale-105 transition-all duration-300 group"
            >
              Shop Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/60 text-white font-bold text-base hover:bg-white/10 transition-all duration-300"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  </>;
};

export default Home;
