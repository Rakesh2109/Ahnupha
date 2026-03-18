import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Truck, Instagram, MessageCircle, ShoppingBag, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

const DRY_FRUIT_LADDU_IMAGE = 'https://live.staticflickr.com/65535/55132706673_38ccef67a6_b.jpg';

/* ─── motion helpers ─────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, delay, ease: [0.22,1,0.36,1] } },
});

/* ─── animated blob ──────────────────────────────────── */
const Blob = ({ className, delay = 0, d = 9 }) => (
  <motion.div
    className={`absolute rounded-full blur-[80px] pointer-events-none ${className}`}
    animate={{ y: [0, -22, 0], scale: [1, 1.07, 1] }}
    transition={{ duration: d, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

const Contact = () => {
  const [searchParams] = useSearchParams();
  const productParam     = searchParams.get('product');
  const showDryFruitLaddu = productParam === 'prod-dry-fruit-laddu';

  const whatsappOrderMessage = showDryFruitLaddu
    ? 'Hi, I would like to order Dry Fruit Laddu. Please let me know the size (150g / 300g / 450g) and availability.'
    : '';
  const whatsappLink = whatsappOrderMessage
    ? `https://wa.me/919515404195?text=${encodeURIComponent(whatsappOrderMessage)}`
    : 'https://wa.me/919515404195';

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      content: 'info@ahnupha.com',
      sub: 'We reply within a few hours',
      link: 'mailto:info@ahnupha.com',
      gradient: 'from-rose-500 to-pink-500',
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '+91 9515404195',
      sub: 'Mon–Sat, 9 AM – 6 PM',
      link: 'tel:919515404195',
      gradient: 'from-amber-500 to-orange-400',
    },
    {
      icon: Instagram,
      title: 'Instagram',
      content: '@ahnupha_bites',
      sub: 'Follow for updates & offers',
      link: 'https://instagram.com/ahnupha_bites/',
      gradient: 'from-rose-600 to-amber-500',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      content: '+91 9515404195',
      sub: 'Fastest way to reach us',
      link: 'https://wa.me/919515404195',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Truck,
      title: 'Delivery',
      content: 'Free in Suryapet town',
      sub: '₹100 shipping to all other pincodes',
      link: null,
      gradient: 'from-rose-500 to-amber-500',
    },
    {
      icon: Clock,
      title: 'Business Hours',
      content: 'Mon – Sat',
      sub: '9:00 AM – 6:00 PM',
      link: null,
      gradient: 'from-amber-400 to-rose-500',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us - AHNUPHA</title>
        <meta
          name="description"
          content="Get in touch with AHNUPHA. Contact us for inquiries about our handmade chocolates, delivery, or any other questions."
        />
      </Helmet>

      {/* ════════════════════════════════════════════════════════════════
          HERO — cinematic full-height
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[65vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/80 via-white to-amber-100/60" />

        <Blob className="w-[460px] h-[460px] bg-rose-300/30  -top-28 -left-28"   delay={0}   d={10} />
        <Blob className="w-[360px] h-[360px] bg-amber-200/25 -bottom-32 -right-20" delay={2.5} d={11} />
        <Blob className="w-[200px] h-[200px] bg-rose-200/20  top-1/2  right-1/4"  delay={4}   d={8}  />

        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #e11d48 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10 py-16 md:py-24 text-center w-full">
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp(0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-rose-200/80 text-rose-700 text-xs font-bold uppercase tracking-[0.12em] mb-6 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              We'd love to hear from you
            </motion.div>

            <motion.h1 variants={fadeUp(0.08)}
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
            >
              Get in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500">
                Touch
              </span>
            </motion.h1>

            <motion.p variants={fadeUp(0.16)}
              className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium mb-8"
            >
              Questions about our chocolates, delivery or customization? Reach out — we respond quickly and are always happy to help.
            </motion.p>

            <motion.div variants={fadeUp(0.24)} className="flex flex-wrap justify-center gap-3">
              <a href="https://wa.me/919515404195" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-sm shadow-xl shadow-green-300/30 hover:shadow-2xl hover:from-green-700 hover:to-green-600 transition-all duration-300 group"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="mailto:info@ahnupha.com"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 hover:border-rose-300 transition-all duration-300 bg-white/70 backdrop-blur-sm"
              >
                <Mail className="w-4 h-4" />
                Send an Email
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          DRY FRUIT LADDU order block (conditional)
      ════════════════════════════════════════════════════════════════ */}
      {showDryFruitLaddu && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-rose-100 overflow-hidden"
            >
              <div className="p-7 sm:p-9">
                <p className="text-xs font-extrabold text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Order this product
                </p>
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                  <div className="w-full sm:w-40 flex-shrink-0 rounded-2xl overflow-hidden bg-amber-50 ring-2 ring-amber-200 shadow-md">
                    <img src={DRY_FRUIT_LADDU_IMAGE} alt="Dry Fruit Laddu" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Dry Fruit Laddu</h2>
                    <p className="text-gray-500 text-sm sm:text-base mb-5 leading-relaxed">
                      Handcrafted with premium dry fruits. Perfect for gifting and celebrations.
                    </p>
                    <div className="flex flex-wrap gap-2.5 mb-5">
                      {[{ w: '150g', p: '₹169' }, { w: '300g', p: '₹339' }, { w: '450g', p: '₹509' }].map(({ w, p }) => (
                        <div key={w} className="px-4 py-2.5 rounded-xl bg-amber-50 border-2 border-amber-200 text-center">
                          <p className="text-xs font-bold text-gray-500">{w}</p>
                          <p className="text-sm font-extrabold text-amber-600">{p}</p>
                        </div>
                      ))}
                    </div>
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-xl hover:shadow-2xl transition-all"
                    >
                      <MessageCircle className="w-5 h-5" /> Order via WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════
          CONTACT CARDS — large editorial grid
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-white py-16 md:py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50/60 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50/60 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          {/* section heading */}
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={fadeUp(0)}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Ways to Reach Us
            </h2>
            <p className="mt-2 text-gray-500">Choose the channel that works best for you.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              const Wrapper = info.link ? 'a' : 'div';
              const linkProps = info.link ? { href: info.link, target: info.link.startsWith('http') ? '_blank' : undefined, rel: info.link.startsWith('http') ? 'noopener noreferrer' : undefined } : {};

              return (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22,1,0.36,1] }}
                  viewport={{ once: true }}
                  whileHover={{ y: -7, transition: { duration: 0.22 } }}
                  className="group"
                >
                  <Wrapper
                    {...linkProps}
                    className="relative flex flex-col bg-white rounded-3xl p-7 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100/70 hover:border-rose-100 overflow-hidden h-full block"
                  >
                    {/* hover wash */}
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50/0 to-amber-50/0 group-hover:from-rose-50/50 group-hover:to-amber-50/30 transition-all duration-400 rounded-3xl pointer-events-none" />

                    <div className="relative z-10">
                      <div className={`w-14 h-14 bg-gradient-to-br ${info.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{info.title}</p>
                      <p className={`text-base font-extrabold mb-1 leading-snug ${info.link ? 'text-gray-900 group-hover:text-rose-600 transition-colors' : 'text-gray-900'}`}>
                        {info.content}
                      </p>
                      <p className="text-sm text-gray-500">{info.sub}</p>
                    </div>
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PICKUP ADDRESS — full-width editorial card
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-rose-50/60" />
        <Blob className="w-72 h-72 bg-rose-200/25 top-0 right-0"     delay={1}   d={9}  />
        <Blob className="w-60 h-60 bg-amber-200/20 bottom-0 left-0"  delay={3}   d={8}  />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
            className="bg-white/85 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-2xl border border-rose-100/60"
          >
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl shrink-0">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Pickup Location</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
                  Pickup Address
                </h2>
                <p className="text-gray-700 font-medium leading-relaxed text-base md:text-lg">
                  1-6-141/43/A2/C, Sri Ram Nagar, Near New Vision School,<br className="hidden sm:inline" />
                  Suryapet, Telangana 508213
                </p>
                <p className="mt-2.5 text-sm text-gray-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Pickup ready within 24 hours of placing your order.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Contact;
