import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { searchData } from '@/lib/searchData';
import ProductCard from '@/components/ProductCard';

const HomemadeFood = () => {
  const products = searchData.filter(item => item.type === 'Product' && (item.category === 'Homemade Food' || item.category === 'Snacks'));

  return (
    <>
      <Helmet>
        <title>Snacks - Ahnupha</title>
        <meta name="description" content="Taste the love in our snacks collection. Dry fruit laddus, homemade treats and more." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-amber-50/30">
        <div className="max-w-7xl mx-auto pt-8 pb-16 md:pt-12 md:pb-20">
          {/* Hero heading – same style as Chocolate page */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10 md:mb-14 relative px-4 sm:px-6"
          >
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div className="h-0.5 sm:h-1 w-12 sm:w-16 bg-gradient-to-r from-transparent via-rose-500 to-amber-500 rounded-full" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 shadow-lg" />
              <div className="h-0.5 sm:h-1 w-12 sm:w-16 bg-gradient-to-l from-transparent via-amber-500 to-rose-500 rounded-full" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-5 tracking-tight leading-tight relative inline-block">
              <span className="relative z-10">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 drop-shadow-sm">
                  Snacks
                </span>
              </span>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="absolute bottom-1 left-0 h-1.5 sm:h-2 bg-gradient-to-r from-rose-400/30 via-amber-400/30 to-rose-400/30 rounded-full -z-0"
              />
            </h1>

            <div className="max-w-xl sm:max-w-2xl mx-auto">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-base sm:text-lg md:text-xl text-gray-600 font-medium leading-relaxed"
              >
                From our kitchen to yours. Handcrafted dry fruit laddus and homemade treats, prepared with fresh, natural ingredients.
              </motion.p>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-5">
              <div className="h-0.5 sm:h-1 w-12 sm:w-16 bg-gradient-to-r from-transparent via-amber-500 to-rose-500 rounded-full" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 shadow-lg" />
              <div className="h-0.5 sm:h-1 w-12 sm:w-16 bg-gradient-to-l from-transparent via-rose-500 to-amber-500 rounded-full" />
            </div>
          </motion.div>

          {/* Products section – same card style as Chocolate page */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="px-4 sm:px-6 lg:px-8"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5, ease: "easeOut" }}
                  whileHover={{ y: -8 }}
                  className="h-full"
                >
                  <ProductCard product={product} priority={index < 3} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        </div>
      </div>
    </>
  );
};

export default HomemadeFood;