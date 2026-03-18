import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, Layers } from 'lucide-react';

const CARDS = [
  {
    to: '/candy-chocolate',
    image: 'https://live.staticflickr.com/65535/55069718467_166f15ce71_b.jpg',
    fallback: 'https://horizons-cdn.hostinger.com/a120f215-a5a4-4e6b-834f-b5712b2ce12c/6d449b88b5b634066c16f0e372c6d43c.jpg',
    label: 'Handcrafted Collection',
    Icon: Star,
    title: 'Premium\nChocolates',
    subtitle: 'Rich, handcrafted bars — ready to gift.',
    cta: 'Shop Now',
    gradient: 'from-rose-600 via-rose-500 to-amber-500',
    hoverGradient: 'group-hover:from-rose-700 group-hover:to-amber-600',
    ring1: 'border-white/30',
    ring2: 'border-white/15',
    blob: 'bg-amber-300/20',
    delay: 0,
  },
  {
    to: '/customize',
    image: 'https://live.staticflickr.com/65535/55069718467_166f15ce71_b.jpg',
    fallback: 'https://horizons-cdn.hostinger.com/a120f215-a5a4-4e6b-834f-b5712b2ce12c/6d449b88b5b634066c16f0e372c6d43c.jpg',
    label: 'Make It Yours',
    Icon: Sparkles,
    title: 'Customize\nChocolates',
    subtitle: 'Add names, messages & personal touches.',
    cta: 'Customize Now',
    gradient: 'from-amber-600 via-amber-500 to-rose-500',
    hoverGradient: 'group-hover:from-amber-700 group-hover:to-rose-600',
    ring1: 'border-white/30',
    ring2: 'border-white/15',
    blob: 'bg-rose-300/20',
    delay: 0.12,
  },
  {
    to: '/snacks',
    image: 'https://live.staticflickr.com/65535/55069718467_166f15ce71_b.jpg',
    fallback: 'https://horizons-cdn.hostinger.com/a120f215-a5a4-4e6b-834f-b5712b2ce12c/6d449b88b5b634066c16f0e372c6d43c.jpg',
    label: 'Healthy Bites',
    Icon: Layers,
    title: 'Snacks &\nDry Fruits',
    subtitle: 'Nutritious treats packed with flavour.',
    cta: 'Explore',
    gradient: 'from-rose-700 via-rose-600 to-amber-600',
    hoverGradient: 'group-hover:from-rose-800 group-hover:to-amber-700',
    ring1: 'border-white/30',
    ring2: 'border-white/15',
    blob: 'bg-amber-200/20',
    delay: 0.24,
  },
];

const CircleChocolateCards = () => (
  <div className="w-full max-w-6xl mx-auto py-4 px-4">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5 lg:gap-8">
      {CARDS.map(({ to, image, fallback, label, Icon, title, subtitle, cta, gradient, hoverGradient, ring1, ring2, blob, delay }) => (
        <Link to={to} key={to} className="block group focus:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
            className={`relative overflow-hidden rounded-3xl cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-rose-900/20 transition-shadow duration-500 flex flex-col items-center text-center p-7 bg-gradient-to-br ${gradient} ${hoverGradient}`}
          >
            {/* dot mesh */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            {/* bokeh blobs */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/15 transition-all duration-500" />
            <div className={`absolute -bottom-10 -right-10 w-40 h-40 ${blob} rounded-full blur-3xl pointer-events-none`} />

            {/* Circular image */}
            <div className="relative mb-5 shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className={`absolute -inset-3 rounded-full border-2 border-dashed ${ring1} pointer-events-none`}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className={`absolute -inset-6 rounded-full border ${ring2} pointer-events-none`}
              />
              <div className="absolute -inset-4 bg-white/15 rounded-full blur-xl" />

              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white/75 shadow-[0_12px_40px_rgba(0,0,0,0.28)] group-hover:scale-105 transition-transform duration-500">
                <img
                  src={image}
                  alt={title.replace('\n', ' ')}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { e.target.src = fallback; }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 to-transparent" />
              </div>
            </div>

            {/* Label */}
            <div className="flex items-center justify-center gap-1.5 mb-2 relative z-10">
              <Icon className="w-4 h-4 text-amber-200 animate-pulse" />
              <span className="text-amber-100 text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight mb-2 drop-shadow-sm whitespace-pre-line relative z-10">
              {title}
            </h3>

            {/* Subtitle */}
            <p className="text-white/75 text-sm font-medium mb-5 max-w-[180px] leading-snug relative z-10">
              {subtitle}
            </p>

            {/* CTA */}
            <motion.div
              whileHover={{ scale: 1.06 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-rose-600 font-extrabold text-sm shadow-xl hover:shadow-white/30 transition-all duration-300 group-hover:bg-rose-50 relative z-10"
            >
              {cta}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.div>
          </motion.div>
        </Link>
      ))}
    </div>
  </div>
);

export default CircleChocolateCards;
