import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { PayPalIcon, RobuxIcon, RobloxLogo } from './Icons';
import confetti from 'canvas-confetti';

export interface CheckoutItem {
  title: string;
  robux: number;
  price: number;
  formattedPrice: string;
  isItem?: boolean;
  image?: string;
}

interface PayPalModalProps {
  isOpen: boolean;
  item: CheckoutItem | null;
  onClose: () => void;
  onSuccess: (robuxAdded: number) => void;
}

type CheckoutStep = 'review' | 'processing' | 'success';

export const PayPalModal: React.FC<PayPalModalProps> = ({
  isOpen,
  item,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<CheckoutStep>('review');
  const [paypalEmail, setPaypalEmail] = useState('pogicalix85@gmail.com');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('review');
      setIsEditingEmail(false);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handlePay = () => {
    setStep('processing');

    // Simulate authentic network latency
    setTimeout(() => {
      setStep('success');
      
      // Fire confetti celebration
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#0074e0', '#00c3ff', '#ffd700', '#ffffff'],
        });
      } catch (e) {
        // Safe fallback
      }

      // Add robux after short delay
      setTimeout(() => {
        onSuccess(item.robux);
      }, 1400);
    }, 1800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === 'processing' ? undefined : onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md bg-[#181a20] border-t sm:border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden text-white z-10"
        >
          {/* Grab Handle for mobile */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <PayPalIcon className="w-5 h-5" />
              <span className="font-bold text-sm tracking-wide text-white">
                PayPal Checkout
              </span>
            </div>
            {step !== 'processing' && (
              <button
                id="close-paypal-modal-btn"
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Body Content depending on step */}
          <div className="p-5">
            {step === 'review' && (
              <div>
                {/* Item Details Block */}
                <div className="flex items-center justify-between gap-3 p-3.5 bg-black/30 rounded-xl border border-white/[0.06] mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0074e0] flex items-center justify-center overflow-hidden shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <RobloxLogo className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-white/60">Roblox Corporation</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-base sm:text-lg text-white">
                      {item.formattedPrice}
                    </span>
                  </div>
                </div>

                {/* Purchase Protection banner */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0074e0]/10 border border-[#0074e0]/20 rounded-lg text-xs text-blue-300 font-medium mb-4">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>PayPal Purchase Protection is enabled for this transaction.</span>
                </div>

                {/* Payment Method - Strictly PayPal as requested */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-2">
                    Payment Method (PayPal Only)
                  </label>

                  <div className="p-3 bg-[#232733] rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#003087]/30 border border-[#0079C1]/30 flex items-center justify-center">
                        <PayPalIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white">PayPal</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#0079C1]/20 text-[#00c3ff] rounded">
                            Verified
                          </span>
                        </div>
                        {isEditingEmail ? (
                          <input
                            type="email"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            onBlur={() => setIsEditingEmail(false)}
                            autoFocus
                            className="text-xs bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-white outline-none focus:border-blue-400 mt-1"
                          />
                        ) : (
                          <span 
                            onClick={() => setIsEditingEmail(true)}
                            className="text-xs text-white/70 hover:text-white cursor-pointer underline underline-offset-2"
                            title="Click to change email"
                          >
                            {paypalEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(!isEditingEmail)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      {isEditingEmail ? 'Done' : 'Change'}
                    </button>
                  </div>
                </div>

                {/* Terms Notice */}
                <p className="text-[11px] text-white/50 leading-relaxed mb-5">
                  By clicking Buy with PayPal, you authorize PayPal to process this order. The Privacy Notice describes how your data is handled.
                </p>

                {/* Primary Action Button */}
                <button
                  id="confirm-paypal-buy-btn"
                  type="button"
                  onClick={handlePay}
                  className="w-full py-3.5 px-4 bg-[#0074e0] hover:bg-[#0065c7] active:scale-[0.99] transition-all text-white font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#0074e0]/30"
                >
                  <PayPalIcon className="w-5 h-5" />
                  <span>Buy with PayPal</span>
                </button>
              </div>
            )}

            {step === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                {/* Circular Loader with Lock inside matching Screenshot 6 */}
                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-[#0074e0] animate-spin" />
                  <div className="w-16 h-16 rounded-full bg-[#202533] border border-white/10 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-white/90 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-white mb-1">
                  Processing
                </h3>
                <p className="text-sm text-white/60">
                  Connecting to PayPal secure checkout...
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                {/* Blue checkmark circle matching Screenshot 7 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-[#0074e0] flex items-center justify-center mb-5 shadow-xl shadow-[#0074e0]/40"
                >
                  <Check className="w-10 h-10 text-white stroke-[3]" />
                </motion.div>

                <h3 className="text-2xl font-black text-white mb-2">
                  Payment successful
                </h3>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#202533] rounded-full border border-white/10 mt-1 mb-4">
                  <RobuxIcon className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">
                    +{item.robux.toLocaleString()} Robux added!
                  </span>
                </div>

                <p className="text-xs text-white/50 max-w-xs mb-6">
                  Your updated Robux balance has been immediately applied to your account.
                </p>

                <button
                  id="paypal-done-btn"
                  type="button"
                  onClick={() => onSuccess(item.robux)}
                  className="w-full py-3 px-4 bg-[#292d3a] hover:bg-[#353b4d] text-white font-bold text-sm rounded-xl transition-colors border border-white/10"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
