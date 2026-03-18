import React, { useRef } from 'react';
import SEO from '@/components/SEO';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, MessageCircle, PenLine, Heart, Users,
  Type, Gift, Package, Star, CheckCircle, Layers, Palette,
  ChevronRight, Wand2,
} from 'lucide-react';
import { searchData } from '@/lib/searchData';

/* ══════════════════════════════════════════════════════════════════
   MOTION HELPERS
══════════════════════════════════════════════════════════════════ */
const ease = [0.22, 1, 0.36, 1];
const fadeUp = (d = 0) => ({
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, delay: d, ease } },
});

/* ══════════════════════════════════════════════════════════════════
   ANIMATED BLOB (depth layer)
══════════════════════════════════════════════════════════════════ */
const Blob = ({ className, delay = 0, d = 9 }) => (
  <motion.div
    className={`absolute rounded-full blur-[80px] pointer-events-none ${className}`}
    animate={{ y: [0, -24, 0], scale: [1, 1.08, 1] }}
    transition={{ duration: d, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

/* ══════════════════════════════════════════════════════════════════
   3-D TILT CARD
   Pure CSS perspective + Framer Motion mouse-tracking transforms.
   No WebGL / Three.js — zero extra bundle weight.
══════════════════════════════════════════════════════════════════ */
const TiltCard = ({ children, className = '', intensity = 10 }) => {
  const ref   = useRef(null);
  const rawX  = useMotionValue(0);
  const rawY  = useMotionValue(0);

  // spring-smooth the raw values so motion feels physical
  const springX = useSpring(rawX, { stiffness: 180, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 180, damping: 22 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-intensity, intensity]);

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width  - 0.5);
    rawY.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onLeave = () => { rawX.set(0); rawY.set(0); };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.025, transition: { duration: 0.25 } }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   FLOATING 3-D CHOCOLATE HERO ELEMENT
   Depth illusion via perspective + looping rotateX/Y animation.
══════════════════════════════════════════════════════════════════ */
const HeroChocolate = () => (
  <div style={{ perspective: '900px' }} className="relative flex items-center justify-center">
    {/* outer orbit ring 1 */}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
      className="absolute w-[380px] h-[380px] md:w-[440px] md:h-[440px] rounded-full border-2 border-dashed border-rose-300/40 pointer-events-none"
    />
    {/* outer orbit ring 2 */}
    <motion.div
      animate={{ rotate: -360 }}
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      className="absolute w-[310px] h-[310px] md:w-[360px] md:h-[360px] rounded-full border border-amber-300/30 pointer-events-none"
    />

    {/* ambient glow */}
    <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-rose-400/30 to-amber-400/20 blur-3xl pointer-events-none" />

    {/* main 3-D spinning image */}
    <motion.div
      animate={{ rotateY: [0, 10, 0, -10, 0], rotateX: [0, -6, 0, 6, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformStyle: 'preserve-3d' }}
      className="relative z-10"
    >
      <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white shadow-[0_30px_80px_rgba(244,63,94,0.28),0_8px_30px_rgba(0,0,0,0.12)] ring-4 ring-rose-200/50">
        <img
          src="https://live.staticflickr.com/65535/55077670852_dff2fce361_b.jpg"
          alt="Premium Custom Chocolate"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/10 to-transparent" />
      </div>

      {/* depth layer — floats "above" the circle */}
      <motion.div
        style={{ translateZ: 40 }}
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-5 -right-6 bg-white rounded-2xl px-4 py-2.5 shadow-2xl border border-rose-100 flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow">
          <PenLine className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-gray-900 leading-none">Your Name</p>
          <p className="text-xs text-gray-400 leading-none mt-0.5">on every bar</p>
        </div>
      </motion.div>

      <motion.div
        style={{ translateZ: 30 }}
        animate={{ y: [4, -4, 4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-4 -left-6 bg-white rounded-2xl px-4 py-2.5 shadow-2xl border border-amber-100 flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-400 flex items-center justify-center shadow">
          <Palette className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-gray-900 leading-none">Dark / Milk</p>
          <p className="text-xs text-gray-400 leading-none mt-0.5">choose your base</p>
        </div>
      </motion.div>
    </motion.div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   PRODUCT CARD (with 3-D tilt + glare)
══════════════════════════════════════════════════════════════════ */
const typeLabel = (p) => {
  if (p.twoNames)               return { label: 'Couple Names',  color: 'from-rose-500 to-pink-500',   icon: Users  };
  if (p.firstLettersCouple)     return { label: 'Couple Initials', color: 'from-amber-500 to-rose-500', icon: Heart  };
  if (p.customNameOnBar)        return { label: 'Name on Bar',   color: 'from-rose-600 to-amber-500',  icon: PenLine};
  if (p.birthdayWishes)         return { label: 'Birthday Wish', color: 'from-amber-500 to-orange-400',icon: Star   };
  if (p.customTextOnChocolate)  return { label: 'Custom Message',color: 'from-rose-500 to-amber-400',  icon: Type   };
  if (p.smallBitesWithWrap)     return { label: 'Small Bites',   color: 'from-rose-500 to-amber-500',  icon: Package};
  if (p.giftWrapOnly)           return { label: 'Gift Wrap',     color: 'from-amber-400 to-rose-500',  icon: Gift   };
  return                               { label: 'Custom',        color: 'from-rose-500 to-amber-500',  icon: Sparkles};
};

const ProductCard3D = ({ product, index }) => {
  const tag   = typeLabel(product);
  const TagIcon = tag.icon;
  const link  = `/candy-chocolate?product=${product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.65, delay: (index % 3) * 0.1, ease }}
    >
      <TiltCard intensity={8}>
        <Link to={link} className="block group">
          <div
            className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_64px_rgba(244,63,94,0.18),0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-400 border border-gray-100/80 hover:border-rose-100"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* image */}
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/80 to-amber-50/50" style={{ aspectRatio: '4/3' }}>
              <img
                src={product.image}
                alt={product.imageAlt || product.title}
                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* glare overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/0 group-hover:via-white/10 group-hover:to-white/5 transition-all duration-500" />

              {/* type badge — floats above (z depth illusion) */}
              <div
                style={{ transform: 'translateZ(20px)' }}
                className="absolute top-3 left-3"
              >
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${tag.color} text-white text-xs font-extrabold shadow-lg`}>
                  <TagIcon className="w-3 h-3" />
                  {tag.label}
                </span>
              </div>

              {product.isNew && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow">
                    <Sparkles className="w-2.5 h-2.5" /> NEW
                  </span>
                </div>
              )}
            </div>

            {/* info */}
            <div className="p-5">
              <h3 className="font-extrabold text-gray-900 text-base leading-snug mb-1.5 group-hover:text-rose-600 transition-colors">
                {product.title}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">
                {product.description?.split('\n')[0]}
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-extrabold text-gray-900">₹{product.price}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="ml-2 text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white text-xs font-bold shadow-md shadow-rose-200/50 group-hover:from-rose-700 group-hover:to-rose-600 transition-all">
                  Customize
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>

            {/* bottom depth shadow line */}
            <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-rose-200/60 to-transparent" />
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   CAPABILITY TILE (what you can customize)
══════════════════════════════════════════════════════════════════ */
const CapTile = ({ icon: Icon, title, desc, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.55, delay, ease }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="group flex gap-4 items-start bg-white rounded-2xl p-5 shadow-md hover:shadow-xl border border-gray-100/70 hover:border-rose-100 transition-all duration-300"
  >
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="font-extrabold text-sm text-gray-900 mb-0.5">{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════
   STEP
══════════════════════════════════════════════════════════════════ */
const Step = ({ num, title, desc, last }) => (
  <div className="flex gap-4 md:gap-5">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white font-extrabold text-sm flex items-center justify-center shadow-lg flex-shrink-0">
        {num}
      </div>
      {!last && <div className="w-px flex-1 bg-gradient-to-b from-rose-300/60 to-transparent mt-2" />}
    </div>
    <div className="pb-8">
      <p className="font-extrabold text-gray-900 text-base mb-1">{title}</p>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
const CustomizeChocolates = () => {
  const premiumProducts = searchData.filter(
    (p) => p.type === 'Product' && p.category === 'Chocolate' && p.isPremiumCustom
  );

  const capabilities = [
    { icon: PenLine,  title: 'Name on the Bar',     desc: 'Your name or a loved one\'s — stamped right into the chocolate.',  gradient: 'from-rose-500 to-pink-500'   },
    { icon: Users,    title: 'Couple Names',         desc: 'Both names on one bar — perfect for anniversaries and weddings.', gradient: 'from-amber-500 to-orange-400' },
    { icon: Heart,    title: 'Couple Initials',      desc: 'Just the first letters — elegant, minimal, and personal.',        gradient: 'from-rose-600 to-amber-500'  },
    { icon: Type,     title: 'Custom Message',       desc: 'Write anything — "Thank You", "Congrats", or a secret note.',     gradient: 'from-rose-500 to-amber-400'  },
    { icon: Star,     title: 'Birthday Wishes',      desc: 'Your birthday wish printed on a premium handcrafted bar.',        gradient: 'from-amber-400 to-rose-500'  },
    { icon: Layers,   title: 'Choose Your Base',     desc: 'Dark chocolate or milk chocolate — you decide the foundation.',   gradient: 'from-rose-500 to-rose-700'   },
    { icon: Package,  title: 'Dry Fruits Loaded',    desc: 'Pick your favourite dry fruits — badam, kaju, pista, and more.',  gradient: 'from-amber-500 to-amber-700' },
    { icon: Gift,     title: 'Premium Gift Wrap',    desc: 'Beautifully wrapped for gifting — no extra effort needed.',       gradient: 'from-rose-400 to-amber-500'  },
  ];

  return (
    <>
      <SEO
        title="Customize Your Chocolate Bar — Names, Messages & Dry Fruits"
        description="Design personalised chocolate bars at Ahnupha: your name, couples names, custom text, dark or milk chocolate, dry fruit toppings. Handmade in India — Pan India delivery."
        path="/customize"
      />

      {/* ══════════════════════════════════════════════════════════════
          HERO — cinematic full-height split
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50/80" />

        {/* depth blobs */}
        <Blob className="w-[500px] h-[500px] bg-rose-300/30  -top-36 -left-36"   delay={0}   d={10} />
        <Blob className="w-[400px] h-[400px] bg-amber-200/25 -bottom-40 -right-28" delay={2.5} d={12} />
        <Blob className="w-[250px] h-[250px] bg-rose-200/20  top-1/4  right-1/3"  delay={4}   d={8}  />

        {/* dot mesh */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #e11d48 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 py-16 md:py-0 w-full">
          <div className="flex flex-col md:flex-row md:items-center md:gap-12 lg:gap-20">

            {/* left — text */}
            <motion.div
              initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
              className="flex-1 text-center md:text-left"
            >
              <motion.div variants={fadeUp(0)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-rose-200/80 text-rose-700 text-xs font-bold uppercase tracking-[0.12em] mb-6 shadow-sm"
              >
                <Wand2 className="w-3.5 h-3.5 text-rose-500" />
                Premium · Personalised · Handmade
              </motion.div>

              <motion.h1 variants={fadeUp(0.08)}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.04] mb-6"
              >
                Your Name,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500">
                  On Chocolate.
                </span>
              </motion.h1>

              <motion.p variants={fadeUp(0.16)}
                className="text-lg md:text-xl text-gray-500 font-medium max-w-lg mx-auto md:mx-0 leading-relaxed mb-8"
              >
                Design your perfect bar — add a name, a wish, or a secret message. Choose your chocolate base and dry fruit toppings. We handcraft it and deliver it fresh.
              </motion.p>

              <motion.div variants={fadeUp(0.24)} className="flex flex-wrap gap-3 justify-center md:justify-start">
                {['All from ₹299', 'Dark & Milk base', 'Pan India delivery'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-rose-100 shadow-sm text-sm font-semibold text-gray-700">
                    <CheckCircle className="w-3.5 h-3.5 text-rose-500" /> {t}
                  </span>
                ))}
              </motion.div>

              <motion.div variants={fadeUp(0.32)} className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mt-8">
                <a
                  href="#products"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-extrabold text-base shadow-xl shadow-rose-300/40 hover:from-rose-700 hover:to-rose-600 hover:shadow-2xl transition-all duration-300 group"
                >
                  See All Designs
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="https://wa.me/919515404195?text=Hi, I'd like to customize a chocolate bar."
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-green-200 text-green-700 font-bold text-base hover:bg-green-50 hover:border-green-300 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </a>
              </motion.div>
            </motion.div>

            {/* right — 3D chocolate */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease }}
              className="flex-shrink-0 mt-14 md:mt-0 flex justify-center"
            >
              <HeroChocolate />
            </motion.div>

          </div>
        </div>

        {/* wave */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHAT CAN YOU CUSTOMIZE
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-20 bg-white overflow-hidden">
        <Blob className="w-80 h-80 bg-rose-100/60 top-0 right-0"  delay={0} d={10} />
        <Blob className="w-72 h-72 bg-amber-100/50 bottom-0 left-0" delay={3} d={9}  />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={fadeUp(0)}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
              <Layers className="w-3.5 h-3.5" /> Endless possibilities
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
              What Can You{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-500">
                Customise?
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              Every element of your chocolate bar can be tailored to your taste and occasion.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {capabilities.map((c, i) => (
              <CapTile key={c.title} {...c} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRODUCT GRID — 3-D TILT CARDS
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="products"
        className="relative py-16 md:py-20 overflow-hidden"
        style={{ perspective: '1200px' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-rose-50/30 to-white" />
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #e11d48 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <Blob className="w-96 h-96 bg-rose-200/20 -top-20 -right-20" delay={1}   d={11} />
        <Blob className="w-80 h-80 bg-amber-200/15 -bottom-20 -left-20" delay={3.5} d={10} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={fadeUp(0)}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> All handcrafted
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-500">
                Design
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              Hover over any card to feel the depth. Click to customise and add to your order.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
            {premiumProducts.map((p, i) => (
              <ProductCard3D key={p.id} product={p} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3, ease }}
            className="mt-10 text-center"
          >
            <Link to="/candy-chocolate"
              className="inline-flex items-center gap-2 text-rose-600 font-bold text-base hover:text-rose-700 group transition-colors"
            >
              Browse the full chocolate collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW TO ORDER — vertical steps + side visual
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white to-rose-50/40" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex flex-col lg:flex-row gap-14 lg:gap-20 items-start">

            {/* steps */}
            <div className="flex-1">
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp(0)}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-widest mb-5 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" /> Simple process
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-10">
                  How to Order Your<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-500">
                    Custom Chocolate
                  </span>
                </h2>
              </motion.div>

              {[
                { num: '1', title: 'Pick Your Design', desc: 'Choose from our range of premium custom options — name bar, couple names, birthday wishes, and more.' },
                { num: '2', title: 'Customise It',     desc: 'Enter your name, message, or initials. Select your chocolate base (dark or milk) and dry fruit add-ons.' },
                { num: '3', title: 'Add to Cart',      desc: 'Review your customisation, add a gift wrap (+₹20), and proceed to checkout.' },
                { num: '4', title: 'We Craft & Deliver', desc: 'We handcraft your personalised bar fresh and deliver it anywhere in India.', last: true },
              ].map((s) => (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: Number(s.num) * 0.1, ease }}
                >
                  <Step {...s} />
                </motion.div>
              ))}
            </div>

            {/* side visual — 3D stacked cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.8, ease }}
              className="hidden lg:flex flex-shrink-0 w-72 xl:w-80 items-center justify-center"
              style={{ perspective: '800px' }}
            >
              <div className="relative w-64 h-80">
                {/* stacked cards depth effect */}
                {[
                  { img: 'https://live.staticflickr.com/65535/55092912929_23b607c864_b.jpg', r: '-8deg', tx: '-8px', ty: '16px', z: 0 },
                  { img: 'https://live.staticflickr.com/65535/55084177241_8a99367932_b.jpg', r: '4deg',  tx: '6px',  ty: '8px',  z: 1 },
                  { img: 'https://live.staticflickr.com/65535/55104643353_a8f81e2cc1_b.jpg', r: '0deg',  tx: '0px',  ty: '0px',  z: 2 },
                ].map(({ img, r, tx, ty, z }, i) => (
                  <div
                    key={i}
                    style={{ transform: `rotate(${r}) translate(${tx}, ${ty})`, zIndex: z }}
                    className="absolute inset-0 rounded-2xl overflow-hidden border-4 border-white shadow-xl"
                  >
                    <img src={img} alt="" className="w-full h-full object-contain bg-rose-50/60 p-4" loading="lazy" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM CTA — full-width gradient
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }}
        />
        <Blob className="w-96 h-96 bg-white/10 -top-24 -left-24"    delay={0}   d={9}  />
        <Blob className="w-80 h-80 bg-white/8  -bottom-20 -right-20" delay={2.5} d={11} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-5">
              <MessageCircle className="w-3.5 h-3.5" /> Order via WhatsApp
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Have a special request?<br />We'll make it happen.
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              Want a completely unique design? Chat with us on WhatsApp and we'll personalise every detail just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/919515404195?text=Hi, I'd like to customize a chocolate bar."
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-rose-600 font-extrabold text-base shadow-2xl hover:scale-105 hover:shadow-white/30 transition-all duration-300 group"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link to="/candy-chocolate"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/60 text-white font-bold text-base hover:bg-white/10 transition-all duration-300"
              >
                Browse All Chocolates
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default CustomizeChocolates;
