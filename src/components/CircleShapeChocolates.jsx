import React from 'react';
import { motion } from 'framer-motion';

const chocolateData = [
  {
    id: 1,
    name: 'Dark Chocolate Truffle',
    image: 'https://images.unsplash.com/photo-1687514853077-e7c896e3c2b8',
  },
  {
    id: 2,
    name: 'Milk Chocolate Delight',
    image: 'https://images.unsplash.com/photo-1549008090-b22ad7d5999f',
  },
  {
    id: 3,
    name: 'White Chocolate Dream',
    image: 'https://images.unsplash.com/photo-1606762397747-82b1837379a6',
  },
  {
    id: 4,
    name: 'Hazelnut Bliss',
    image: 'https://images.unsplash.com/photo-1700353763977-76d0d2c8f2a1',
  },
  {
    id: 5,
    name: 'Caramel Swirl',
    image: 'https://images.unsplash.com/photo-1694796446470-71f9874f73ed',
  },
  {
    id: 6,
    name: 'Mint Chocolate',
    image: 'https://images.unsplash.com/photo-1564460095818-fbadfe491f05',
  },
];

const CircleShapeChocolates = () => {
  return (
    <div className="w-full">
      <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 scrollbar-hide snap-x">
        {chocolateData.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-3 snap-center shrink-0 group"
          >
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-pink-200 to-pink-100 p-1 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer overflow-hidden ring-4 ring-white">
               {/* Image Container with Rose Gradient Background */}
               <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-300 to-pink-500 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-full mix-blend-overlay opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                  {/* Overlay for better text visibility (optional, mostly styling) */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
               </div>
            </div>
            
            <span className="text-sm font-medium text-gray-600 text-center max-w-[120px] group-hover:text-rose-500 transition-colors">
              {item.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CircleShapeChocolates;