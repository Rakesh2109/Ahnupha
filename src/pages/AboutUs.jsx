import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';
import { Heart, Users, Award, Sparkles, ShieldCheck, Home as HomeIcon, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InsuranceFormsModal from '@/components/InsuranceFormsModal';
import HomeLoansFormsModal from '@/components/HomeLoansFormsModal';

/* ─── motion helpers ─────────────────────────────────── */
const fadeUp  = (delay = 0) => ({
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, delay, ease: [0.22,1,0.36,1] } },
});
const slideLeft  = (delay = 0) => ({
  hidden: { opacity: 0, x: -50 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.75, delay, ease: [0.22,1,0.36,1] } },
});
const slideRight = (delay = 0) => ({
  hidden: { opacity: 0, x: 50 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.75, delay, ease: [0.22,1,0.36,1] } },
});

/* ─── animated blob ──────────────────────────────────── */
const Blob = ({ className, delay = 0, d = 9 }) => (
  <motion.div
    className={`absolute rounded-full blur-[80px] pointer-events-none ${className}`}
    animate={{ y: [0, -22, 0], scale: [1, 1.07, 1] }}
    transition={{ duration: d, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

const AboutUs = () => {
  const [activeModal, setActiveModal] = useState(null);

  const values = [
    {
      icon: Heart,
      title: 'Crafted with Love',
      description: 'Each creation is meticulously handcrafted with dedication and precision. We invest time, skill, and genuine care into every single piece.',
      gradient: 'from-rose-500 to-pink-500',
      lightBg: 'bg-rose-50',
    },
    {
      icon: Users,
      title: 'Your Trust Matters',
      description: 'We build lasting relationships by understanding your unique preferences. Your happiness drives everything we do.',
      gradient: 'from-amber-500 to-orange-500',
      lightBg: 'bg-amber-50',
    },
    {
      icon: Award,
      title: 'Excellence in Detail',
      description: 'We select only premium-grade materials and finest ingredients, applying rigorous quality control at every stage.',
      gradient: 'from-rose-600 to-amber-500',
      lightBg: 'bg-rose-50',
    },
    {
      icon: Sparkles,
      title: 'Artisan Heritage',
      description: 'We honor time-honored techniques while embracing contemporary innovation — preserving traditional artistry.',
      gradient: 'from-amber-400 to-rose-500',
      lightBg: 'bg-amber-50',
    },
  ];

  const pillars = [
    'Pan India delivery',
    'Free delivery in 508213',
    'Personalised products',
    'Premium ingredients',
    'Handmade with care',
    'Trusted by families',
  ];

  return <>
    <SEO
      title="About Ahnupha — Handcrafted Chocolates & Snacks"
      description="Ahnupha Bites: handmade chocolates and snacks from Suryapet, Telangana. Premium ingredients, personalisation, Pan India delivery, free delivery in 508213."
      path="/about"
    />

    {/* ════════════════════════════════════════════════════════════════
        HERO — full-height cinematic
    ════════════════════════════════════════════════════════════════ */}
    <section className="relative overflow-hidden min-h-[72vh] flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50/80" />

      <Blob className="w-[480px] h-[480px] bg-rose-300/30  -top-32 -left-32"   delay={0}   d={10} />
      <Blob className="w-[380px] h-[380px] bg-amber-200/25 -bottom-36 -right-24" delay={2.5} d={11} />
      <Blob className="w-[220px] h-[220px] bg-rose-200/20  top-1/3 right-1/3"   delay={4}   d={8}  />

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
            <Heart className="w-3.5 h-3.5 text-rose-500" fill="currentColor" />
            Our Story &amp; Mission
          </motion.div>

          <motion.h1 variants={fadeUp(0.08)}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
          >
            We Create Products{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500">
              People Love.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp(0.16)}
            className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium mb-10"
          >
            Ahnupha is a multi-category brand built with one simple vision — to create meaningful products and trusted services that people can emotionally connect with.
          </motion.p>

          {/* pillar chips */}
          <motion.div variants={fadeUp(0.24)} className="flex flex-wrap justify-center gap-2.5">
            {pillars.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-rose-100 shadow-sm text-sm font-semibold text-gray-700">
                <CheckCircle className="w-3.5 h-3.5 text-rose-500" />
                {p}
              </span>
            ))}
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
        OUR STORY — editorial two-column
    ════════════════════════════════════════════════════════════════ */}
    <section className="relative bg-white py-20 md:py-28 overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-50/80 rounded-full translate-x-1/2 -translate-y-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-50/80 rounded-full -translate-x-1/2 translate-y-1/3 blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex flex-col lg:flex-row gap-14 lg:gap-20 items-center">

          {/* image */}
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={slideLeft(0)}
            className="w-full lg:w-5/12 flex-shrink-0"
          >
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              <div className="absolute -inset-8 rounded-[44px] bg-gradient-to-br from-rose-200/35 to-amber-200/25 blur-3xl" />
              <div className="absolute -inset-3 rounded-[40px] border-2 border-rose-100/50" />
              <div className="relative rounded-[32px] overflow-hidden shadow-[0_40px_100px_rgba(244,63,94,0.15)] ring-2 ring-rose-100/50 aspect-[3/4] max-h-[500px] hover:shadow-[0_50px_120px_rgba(244,63,94,0.22)] transition-shadow duration-500">
                <img
                  className="w-full h-full object-cover object-[center_top]"
                  alt="Founder of AHNUPHA"
                  src="https://horizons-cdn.hostinger.com/a120f215-a5a4-4e6b-834f-b5712b2ce12c/1000645879-ACabI.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rose-900/12 to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* text */}
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={slideRight(0.1)}
            className="flex-1"
          >
            <span className="text-xs font-bold text-rose-500 uppercase tracking-[0.14em]">Since the beginning</span>
            <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8">
              Our Story
            </h2>

            <div className="space-y-5 text-gray-500 leading-relaxed text-base lg:text-lg">
              <p>
                AHNUPHA began as a small passion project, born from a deep love for traditional craftsmanship and the desire to share unique, handmade treasures with the world. What started in a small home workshop has blossomed into a thriving business.
              </p>
              <p>
                Our journey is rooted in the belief that every product should tell a story. Whether premium chocolates crafted with the finest ingredients, or homemade sweets for every occasion — each item reflects our commitment to quality and authenticity.
              </p>
              <p>
                Today, AHNUPHA is more than a business — it's a community of artisans, chocolatiers, and passionate creators. We offer <strong className="text-rose-500">free delivery for pincode 508213</strong>, and ship all over India for just ₹100.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[['🍫','Chocolates'], ['🍬','Sweets'], ['🎁','Gift Hampers']].map(([emoji, label]) => (
                <span key={label} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 border border-rose-100 text-sm font-bold text-rose-700">
                  {emoji} {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* ════════════════════════════════════════════════════════════════
        FINANCIAL SERVICES CTA
    ════════════════════════════════════════════════════════════════ */}
    <section className="relative overflow-hidden py-14 md:py-18">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/70" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={fadeUp(0)}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-widest mb-5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            Financial Services
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
            Insurance &amp; Home Loans
          </h2>
          <p className="text-gray-500 leading-relaxed text-base md:text-lg mb-8">
            Apart from building Ahnupha, our founder also works in the financial services space, helping families with insurance and home loans.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => setActiveModal('insurance')}
              className="bg-rose-600 hover:bg-rose-500 text-white gap-2 h-13 py-4 px-8 text-base shadow-xl shadow-rose-300/30 hover:shadow-2xl hover:shadow-rose-400/40 transition-all duration-300 rounded-2xl font-bold"
            >
              <ShieldCheck className="w-5 h-5" />
              Insurance Forms
            </Button>
            <Button
              onClick={() => setActiveModal('homeloan')}
              className="bg-amber-500 hover:bg-amber-400 text-white gap-2 h-13 py-4 px-8 text-base shadow-xl shadow-amber-300/30 hover:shadow-2xl hover:shadow-amber-400/40 transition-all duration-300 rounded-2xl font-bold"
            >
              <HomeIcon className="w-5 h-5" />
              Home Loans Forms
            </Button>
          </div>
        </motion.div>
      </div>
    </section>

    {/* ════════════════════════════════════════════════════════════════
        OUR VALUES — large editorial grid
    ════════════════════════════════════════════════════════════════ */}
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/50" />
      <Blob className="w-96 h-96 bg-rose-200/20 top-0 left-0"    delay={0}   d={11} />
      <Blob className="w-80 h-80 bg-amber-200/18 bottom-0 right-0" delay={3}   d={10} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={fadeUp(0)}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
            <Award className="w-3.5 h-3.5" />
            What drives us
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Our Core Values
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            The beliefs that guide every product we make and every relationship we build.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: index * 0.1, ease: [0.22,1,0.36,1] }}
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group relative flex gap-6 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100/70 hover:border-rose-100 overflow-hidden"
              >
                {/* hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/0 to-amber-50/0 group-hover:from-rose-50/60 group-hover:to-amber-50/40 transition-all duration-400 rounded-3xl" />
                <div className="relative z-10 shrink-0">
                  <div className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-extrabold text-gray-900 mb-2 tracking-tight">{value.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm md:text-base">{value.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    {/* Modals */}
    <InsuranceFormsModal isOpen={activeModal === 'insurance'} onClose={() => setActiveModal(null)} />
    <HomeLoansFormsModal isOpen={activeModal === 'homeloan'} onClose={() => setActiveModal(null)} />
  </>;
};

export default AboutUs;
