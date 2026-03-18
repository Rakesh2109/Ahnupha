import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { searchData } from '@/lib/searchData';
import ProductCard from '@/components/ProductCard';

const MakeupServices = () => {
  const products = searchData.filter(item => item.category === 'Makeup Services');

  return (
    <>
      <Helmet>
        <title>Makeup Services - Ahnupha</title>
        <meta name="description" content="Professional makeup artists and hair stylists for weddings, parties, and events." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="text-purple-600 font-semibold tracking-wide uppercase text-sm">Glow & Shine</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Beauty Services</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Look your best for any occasion. Book our professional makeup and hairstyling services today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </>
  );
};

export default MakeupServices;