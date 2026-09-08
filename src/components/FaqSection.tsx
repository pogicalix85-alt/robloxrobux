import React, { useState } from 'react';
import { FAQS } from '../data/robuxData';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="px-4 mb-16">
      <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mb-3">
        FAQ
      </h2>

      <div className="space-y-2">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div
              key={faq.id}
              id={`faq-item-${faq.id}`}
              className="bg-[#181a20] rounded-xl border border-white/[0.08] overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-sm sm:text-base text-white hover:bg-white/[0.02] transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/[0.04] pt-3">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
