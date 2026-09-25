import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check, ShieldCheck, CreditCard, Zap } from 'lucide-react';
import { PayPalIcon, RobuxIcon, RobloxLogo } from './Icons';

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
type PaymentMethod = 'paypal' | 'card' | 'instant';

export const PayPalModal: React.FC<PayPalModalProps> = ({
  isOpen,
  item,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<CheckoutStep>('review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('instant');
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

      // Add robux after short delay
      setTimeout(() => {
        onSuccess(item.robux);
      }, 1200);
    }, 1200);
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
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md bg-[#121319] border-t sm:border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden text-white z-10"
        >
          {/* Grab Handle for mobile */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#0e0f14]">
            <div className="flex items-center gap-2">
              <RobloxLogo className="w-4 h-4 text-white" />
              <span className="font-bold text-sm tracking-wide text-white">
                Buy Robux Checkout
              </span>
            </div>
            {step !== 'processing' && (
              <button
                id="close-paypal-modal-btn"
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                <div className="flex items-center justify-between gap-3 p-3.5 bg-[#181a22] rounded-xl border border-white/[0.06] mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#2f64e8] flex items-center justify-center overflow-hidden shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <RobuxIcon className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-white/60">Instant balance delivery</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-base sm:text-lg text-white">
                      {item.formattedPrice}
                    </span>
                  </div>
                </div>

                {/* Purchase Protection banner */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#2f64e8]/10 border border-[#2f64e8]/20 rounded-lg text-xs text-blue-300 font-medium mb-4">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Verified Purchase Protection enabled for this transaction.</span>
                </div>

                {/* Payment Method Selector */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-2">
                    Payment Method
                  </label>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('instant')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'instant'
                          ? 'bg-[#2f64e8]/20 border-[#2f64e8] text-white'
                          : 'bg-[#181a22] border-white/10 text-white/70 hover:bg-[#20232e]'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span>1-Click Buy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'paypal'
                          ? 'bg-[#2f64e8]/20 border-[#2f64e8] text-white'
                          : 'bg-[#181a22] border-white/10 text-white/70 hover:bg-[#20232e]'
                      }`}
                    >
                      <PayPalIcon className="w-4 h-4" />
                      <span>PayPal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-[#2f64e8]/20 border-[#2f64e8] text-white'
                          : 'bg-[#181a22] border-white/10 text-white/70 hover:bg-[#20232e]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Card</span>
                    </button>
                  </div>

                  {paymentMethod === 'paypal' && (
                    <div className="p-3 bg-[#181a22] rounded-xl border border-white/10 flex items-center justify-between">
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
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        {isEditingEmail ? 'Done' : 'Change'}
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="p-3 bg-[#181a22] rounded-xl border border-white/10 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-white block">Visa ending in •••• 4242</span>
                        <span className="text-xs text-white/60">Expires 12/28</span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'instant' && (
                    <div className="p-3 bg-[#181a22] rounded-xl border border-white/10 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-white block">1-Click Fast Checkout</span>
                        <span className="text-xs text-white/60">Instant credit to account balance</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms Notice */}
                <p className="text-[11px] text-white/50 leading-relaxed mb-5">
                  By confirming this order, you authorize Roblox to credit {item.robux.toLocaleString()} Robux to your balance immediately.
                </p>

                {/* Primary Action Button */}
                <button
                  id="confirm-paypal-buy-btn"
                  type="button"
                  onClick={handlePay}
                  className="w-full py-3.5 px-4 bg-[#2f64e8] hover:bg-[#2554c7] active:scale-[0.99] transition-all text-white font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  <RobuxIcon className="w-5 h-5 text-white" />
                  <span>Confirm & Buy for {item.formattedPrice}</span>
                </button>
              </div>
            )}

            {step === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                {/* Circular Loader with Lock inside */}
                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-[#2f64e8] animate-spin" />
                  <div className="w-16 h-16 rounded-full bg-[#181a22] border border-white/10 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-white/90 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-white mb-1">
                  Processing Order
                </h3>
                <p className="text-sm text-white/60">
                  Crediting Robux to your account...
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                {/* Blue checkmark circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-[#2f64e8] flex items-center justify-center mb-5 shadow-xl shadow-blue-500/40"
                >
                  <Check className="w-10 h-10 text-white stroke-[3]" />
                </motion.div>

                <h3 className="text-2xl font-black text-white mb-2">
                  Payment successful!
                </h3>

                <div className="flex items-center gap-2 px-4 py-2 bg-[#181a22] rounded-full border border-white/10 mt-1 mb-4">
                  <RobuxIcon className="w-5 h-5 text-white" />
                  <span className="text-base font-bold text-white">
                    +{item.robux.toLocaleString()} Robux added!
                  </span>
                </div>

                <p className="text-xs text-white/50 max-w-xs mb-6">
                  Your updated Robux balance has been immediately applied to your account. You can now spend or send it!
                </p>

                <button
                  id="paypal-done-btn"
                  type="button"
                  onClick={() => onSuccess(item.robux)}
                  className="w-full py-3 px-4 bg-[#222530] hover:bg-[#2c3040] text-white font-bold text-sm rounded-xl transition-colors border border-white/10 cursor-pointer"
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
