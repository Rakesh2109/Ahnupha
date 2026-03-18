import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = "info@ahnupha.com";

const LOYALTY_KEY = 'ahnupha_chocolate_orders_completed';

const WelcomeMessage = () => {
  const { currentUser, supabase } = useSupabaseAuth();
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const [chocoOrders, setChocoOrders] = React.useState(0);

  React.useEffect(() => {
    if (currentUser?.id && supabase) {
      supabase.from('profiles').select('chocolate_orders_completed').eq('id', currentUser.id).maybeSingle()
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
  }, [currentUser?.id, supabase]);

  const nextRewardAt = (Math.floor(chocoOrders / 10) + 1) * 10;
  const progressInCycle = chocoOrders % 10; // 0..9

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-white to-rose-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Layout (< md) */}
        <div className="md:hidden">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4"
          >
            <div className="inline-block px-3 py-1 bg-rose-50 text-rose-500 font-semibold rounded-full text-xs mb-2">
                Our Philosophy
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
                Welcome to Ahnupha
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 items-center">
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="aspect-square rounded-xl overflow-hidden shadow-lg bg-white p-1"
             >
                <img 
                  src="https://images.unsplash.com/flagged/photo-1572561701232-6c3bc9ef5aea" 
                  alt="Ahnupha Founder" 
                  className="w-full h-full object-cover rounded-lg" 
                />
             </motion.div>
             
             <motion.p 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-600 leading-snug"
             >
                Ahnupha is a multi-category brand offering handcrafted products and personalized services built on quality, customization, and emotional connection.
             </motion.p>
          </div>

          {/* Loyalty Offer (Mobile) - Hidden for admin */}
          {!isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="mt-6 p-4 rounded-2xl bg-white border-2 border-rose-100 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-gray-900">🎁 Chocolate Loyalty Offer</p>
                <p className="text-xs text-gray-600 mt-1">
                  Get ₹200 off or get a free chocolate worth ₹250 on your 10th order.
                </p>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 whitespace-nowrap">
                {progressInCycle}/10
              </span>
            </div>
            <div className="mt-3 text-xs font-bold text-gray-600">
              Next reward at order #{nextRewardAt}
            </div>
            <div className="mt-4">
              <Link to="/candy-chocolate">
                <Button className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-lg">
                  Shop Chocolates
                </Button>
              </Link>
            </div>
          </motion.div>
          )}
          
           <motion.div 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             className="mt-6"
           >
              <Link to="/about">
                 <Button variant="outline" className="w-full border-rose-50 text-rose-500">Read More</Button>
              </Link>
           </motion.div>
        </div>

        {/* Desktop Layout (md+) */}
        <div className="hidden md:grid grid-cols-2 gap-12 items-center">
            {/* Left Column: Image */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white p-2">
                <img 
                  src="https://images.unsplash.com/flagged/photo-1572561701232-6c3bc9ef5aea" 
                  alt="Ahnupha Founder Professional Portrait" 
                  className="w-full h-[500px] object-cover rounded-xl hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl pointer-events-none"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="font-bold text-lg">Passion & Precision</p>
                  <p className="text-sm text-white/90">The heart behind every creation</p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -z-10 top-10 -left-10 w-40 h-40 bg-rose-100 rounded-full blur-3xl opacity-60"></div>
              <div className="absolute -z-10 bottom-10 -right-10 w-40 h-40 bg-amber-100 rounded-full blur-3xl opacity-60"></div>
            </motion.div>

            {/* Right Column: Content */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-block px-4 py-1.5 bg-rose-50 text-rose-500 font-semibold rounded-full text-sm mb-2">
                Our Philosophy
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                Welcome to Ahnupha
              </h2>
              <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                <p>
                  At Ahnupha, we believe that true luxury lies in the details. Founded with a vision to merge traditional craftsmanship with modern elegance, we bring you a curated selection of handmade treasures that speak to the soul.
                </p>
                <p>
                  From our signature premium chocolates that melt in your mouth to our personalized beauty services that enhance your natural glow, every offering is a testament to our commitment to quality. We don't just sell products; we deliver experiences, wrapped in love and care.
                </p>
                <p className="font-medium text-rose-500">
                  Join us in celebrating the art of handmade perfection.
                </p>
              </div>

              {/* Loyalty Offer (Desktop) - Hidden for admin */}
              {!isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="p-5 rounded-2xl bg-white border-2 border-rose-100 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-extrabold text-gray-900">🎁 Chocolate Loyalty Offer</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Get <span className="font-bold text-gray-900">₹200 off</span> or get a <span className="font-bold text-gray-900">free chocolate worth ₹250</span> on your <span className="font-bold text-gray-900">10th order</span>.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 text-sm font-extrabold text-rose-700">
                      Progress: {progressInCycle}/10
                    </div>
                    <div className="text-xs font-bold text-gray-600 mt-2">
                      Next reward at order #{nextRewardAt}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Link to="/candy-chocolate">
                    <Button className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-lg px-6">
                      Shop Chocolates
                    </Button>
                  </Link>
                  <span className="text-xs text-gray-500 font-medium">
                    Reward applies on the 10th chocolate order at checkout.
                  </span>
                </div>
              </motion.div>
              )}
              
              <div className="pt-4">
                 <Link to="/about">
                   <Button variant="outline" className="border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-all px-8 py-6 rounded-full text-base font-bold">
                     Read More About Us
                   </Button>
                 </Link>
              </div>
            </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeMessage;