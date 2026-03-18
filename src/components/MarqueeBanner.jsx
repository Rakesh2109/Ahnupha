import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Truck, Star, Heart } from 'lucide-react';

const ITEMS = [
  { icon: Gift,     text: 'Delivery available all over India'         },
  { icon: Sparkles, text: 'Handcrafted with Love'                     },
  { icon: Truck,    text: 'Free delivery in Suryapet · ₹100 elsewhere' },
  { icon: Star,     text: 'Premium quality ingredients'               },
  { icon: Heart,    text: 'Custom chocolates for every occasion'       },
];

const MarqueeBanner = () => (
  <div className="relative w-full overflow-hidden border-b border-rose-200/50 bg-gradient-to-r from-rose-50 via-amber-50/60 to-rose-50">
    {/* edge fades */}
    <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-rose-50 to-transparent z-10 pointer-events-none" />
    <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-rose-50 to-transparent z-10 pointer-events-none" />

    <div className="py-3">
      <motion.div
        className="flex whitespace-nowrap items-center"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
      >
        {[1, 2].map((set) => (
          <div key={set} className="flex items-center shrink-0">
            {[...Array(3)].map((_, rep) =>
              ITEMS.map(({ icon: Icon, text }) => (
                <span
                  key={`${set}-${rep}-${text}`}
                  className="inline-flex items-center gap-3 mx-8 font-bold text-sm"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-sm shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-700 to-amber-600">
                    {text}
                  </span>
                  <span className="text-rose-300/70 text-base select-none">◆</span>
                </span>
              ))
            )}
          </div>
        ))}
      </motion.div>
    </div>
  </div>
);

export default MarqueeBanner;
