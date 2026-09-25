import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check, ChevronRight } from 'lucide-react';
import { RobloxLogo } from './Icons';

export interface CheckoutItem {
  title: string;
  robux: number;
  price: number;
  formattedPrice: string;
  isItem?: boolean;
  image?: string;
}

interface GooglePlayModalProps {
  isOpen: boolean;
  item: CheckoutItem | null;
  onClose: () => void;
  onSuccess: (robuxAdded: number) => void;
}

type GooglePlayStep = 'review' | 'processing' | 'success';

// Authentic 4-color Google Play Points Diamond Icon
const GooglePlayPointsIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 12L12 22L21 12L12 2Z" fill="#34A853" opacity="0.2" />
    <path d="M12 2L3 12H12V2Z" fill="#4285F4" />
    <path d="M12 2L21 12H12V2Z" fill="#34A853" />
    <path d="M12 22L3 12H12V22Z" fill="#FBBC05" />
    <path d="M12 22L21 12H12V22Z" fill="#EA4335" />
  </svg>
);

// Authentic VISA Card Badge
const VisaBadge = () => (
  <div className="px-2 py-0.5 rounded bg-white text-[#1A1F71] font-black text-[10px] tracking-wider italic flex items-center justify-center border border-white/20 select-none">
    VISA
  </div>
);

export const GooglePlayModal: React.FC<GooglePlayModalProps> = ({
  isOpen,
  item,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<GooglePlayStep>('review');

  useEffect(() => {
    if (isOpen) {
      setStep('review');
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleBuy = () => {
    setStep('processing');

    setTimeout(() => {
      setStep('success');

      setTimeout(() => {
        onSuccess(item.robux);
        onClose();
      }, 1200);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Dimmed backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => step !== 'processing' && onClose()}
          className="absolute inset-0 bg-black/75 backdrop-blur-xs"
        />

        {/* Bottom Sheet Modal matching Screenshot */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-lg bg-[#1f2024] text-white rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden pb-6 pt-2"
        >
          {/* Sheet Handle */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-1 mb-2" />

          {/* Header Row: "Google Play" + Close Button */}
          <div className="flex items-center justify-between px-6 pt-1 pb-4">
            <h3 className="text-base font-semibold text-white/95 tracking-normal">
              Google Play
            </h3>

            {step !== 'processing' && step !== 'success' && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 -mr-1 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* VIEW 1: Review & Buy (matching Screenshot 4) */}
          {step === 'review' && (
            <div className="px-6 space-y-4">
              {/* Product Info Row */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#0074E0] flex items-center justify-center shrink-0 shadow-md">
                    <RobloxLogo className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white tracking-tight leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-white/60 font-normal">
                      Roblox Corporation
                    </p>
                  </div>
                </div>

                <span className="font-bold text-base sm:text-lg text-white shrink-0">
                  {item.formattedPrice}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.08]" />

              {/* Play Points Earning */}
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/90">
                <GooglePlayPointsIcon />
                <span>
                  Earning <strong className="text-[#3872ff] font-semibold">+5 points</strong>
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.08]" />

              {/* Payment Method */}
              <div className="flex items-center justify-between py-1 text-sm text-white/90 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="flex items-center gap-3">
                  <VisaBadge />
                  <span className="font-medium text-xs sm:text-sm text-white">
                    Visa - 2452
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/50" />
              </div>

              {/* Legal Disclaimer */}
              <p className="text-[11px] text-white/50 leading-relaxed pt-1">
                The{' '}
                <span className="text-white/70 underline cursor-pointer">
                  Privacy Notice
                </span>{' '}
                describes how your data is handled. Your refund rights vary by product type.{' '}
                <span className="text-white/70 underline cursor-pointer">
                  Google Play Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-white/70 underline cursor-pointer">
                  Refund Policy
                </span>
                .
              </p>

              {/* Buy Button: Authentic Google Play Green Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id="google-play-buy-btn"
                  onClick={handleBuy}
                  className="w-full bg-[#01875f] hover:bg-[#007352] active:scale-[0.99] text-white font-bold text-base py-3.5 rounded-full transition-all cursor-pointer shadow-lg select-none text-center"
                >
                  Buy
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: Processing (matching Screenshot 3) */}
          {step === 'processing' && (
            <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
              <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                {/* Circular progress track & spinning indicator */}
                <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin" />
                <Lock className="w-8 h-8 text-white stroke-[2.2]" />
              </div>

              <h4 className="text-base sm:text-lg font-semibold text-white tracking-normal">
                Processing
              </h4>
            </div>
          )}

          {/* VIEW 3: Payment Successful (matching Screenshot 2) */}
          {step === 'success' && (
            <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#1a73e8] flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/25">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <h4 className="text-base sm:text-lg font-semibold text-white tracking-normal">
                Payment successful
              </h4>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
