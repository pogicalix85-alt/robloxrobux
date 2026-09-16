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
      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3.5">
        FAQ
      </h2>

      <div className="space-y-2.5">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div
              key={faq.id}
              id={`faq-item-${faq.id}`}
              className="bg-[#14151b] rounded-xl overflow-hidden transition-colors border border-transparent hover:border-white/[0.04]"
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-bold text-sm sm:text-[15px] text-white hover:bg-white/[0.015] transition-colors cursor-pointer select-none"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-white/80 transition-transform duration-200 shrink-0 ml-3 ${
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
                    <div className="px-5 pb-4 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/[0.04] pt-3">
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

