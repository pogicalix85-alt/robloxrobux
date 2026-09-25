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
    <section className="px-4 mb-16 select-none">
      <h2 className="text-xl sm:text-2xl font-bold text-[#191b22] tracking-tight mb-3.5">
        FAQ
      </h2>

      <div className="space-y-2.5">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div
              key={faq.id}
              id={`faq-item-${faq.id}`}
              className="bg-white rounded-xl overflow-hidden transition-colors border border-[#e4e7ec] shadow-2xs"
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-bold text-sm sm:text-[15px] text-[#191b22] hover:bg-[#f9fafb] transition-colors cursor-pointer select-none"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#191b22] transition-transform duration-200 shrink-0 ml-3 ${
                    isOpen ? 'rotate-180' : ''
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
                    <div className="px-5 pb-4 text-xs sm:text-sm text-[#4b5162] leading-relaxed border-t border-[#f0f2f5] pt-3">
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

