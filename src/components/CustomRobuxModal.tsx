import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calculator, Sparkles, Sliders, ArrowRight, RotateCcw } from 'lucide-react';
import { RobuxIcon } from './Icons';

interface CustomRobuxModalProps {
  isOpen: boolean;
  currentBalance: number;
  onClose: () => void;
  onCheckoutCustom: (item: {
    title: string;
    robux: number;
    price: number;
    formattedPrice: string;
  }) => void;
  onSetBalanceDirectly: (newBalance: number) => void;
}

export const CustomRobuxModal: React.FC<CustomRobuxModalProps> = ({
  isOpen,
  currentBalance,
  onClose,
  onCheckoutCustom,
  onSetBalanceDirectly,
}) => {
  const [customRobux, setCustomRobux] = useState<number>(2500);
  const [manualBalanceInput, setManualBalanceInput] = useState<string>('');

  if (!isOpen) return null;

  // Pricing formula: prices of robux change depending on the robux amount (volume discounts)
  const calculatePrice = (amount: number) => {
    // Discount tier:
    // Under 1,000 Robux: $0.0125/Rbx
    // 1,000 - 4,999 Robux: $0.0105/Rbx
    // 5,000 - 19,999 Robux: $0.0098/Rbx
    // 20,000+ Robux: $0.0089/Rbx
    let rate = 0.0125;

    if (amount >= 20000) {
      rate = 0.0089;
    } else if (amount >= 5000) {
      rate = 0.0098;
    } else if (amount >= 1000) {
      rate = 0.0105;
    }

    const total = Math.max(0.49, Number((amount * rate).toFixed(2)));
    return {
      value: total,
      formatted: `$${total.toFixed(2)}`,
      discount: amount >= 5000 ? '20% Bulk Discount' : amount >= 1000 ? '12% Discount' : 'Standard Rate',
    };
  };

  const currentPrice = calculatePrice(customRobux);

  const presetChips = [500, 1500, 2500, 5000, 15000, 50000];

  const handleCheckout = () => {
    onCheckoutCustom({
      title: `${customRobux.toLocaleString()} Custom Robux`,
      robux: customRobux,
      price: currentPrice.value,
      formattedPrice: currentPrice.formatted,
    });
    onClose();
  };

  const handleDirectBalanceUpdate = () => {
    const val = parseInt(manualBalanceInput.replace(/,/g, ''), 10);
    if (!isNaN(val) && val >= 0) {
      onSetBalanceDirectly(val);
      setManualBalanceInput('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-md bg-[#181a20] border border-white/10 rounded-2xl p-5 shadow-2xl text-white z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Custom Robux Amount
              </h3>
            </div>
            <button
              id="close-custom-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Explanation */}
          <p className="text-xs text-white/60 mb-4 leading-relaxed">
            Prices adapt dynamically based on your requested Robux volume. Larger quantities unlock tiered bulk discounts.
          </p>

          {/* Amount input */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-white/70 block mb-1.5">
              Enter Robux Amount
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5">
                <RobuxIcon className="w-5 h-5 text-white" />
              </div>
              <input
                id="custom-robux-input"
                type="number"
                min="10"
                max="1000000"
                step="50"
                value={customRobux}
                onChange={(e) => setCustomRobux(Math.max(10, Number(e.target.value) || 0))}
                className="w-full bg-[#101115] border border-white/15 rounded-xl pl-11 pr-4 py-3 text-lg font-black text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {presetChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setCustomRobux(chip)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                  customRobux === chip
                    ? 'bg-[#0074e0] text-white border-[#0074e0]'
                    : 'bg-[#232733] text-white/80 border-white/10 hover:bg-[#2d3240]'
                }`}
              >
                +{chip.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Price Calculation Display Card */}
          <div className="p-4 bg-gradient-to-r from-[#1c2230] to-[#161a24] rounded-xl border border-blue-500/20 mb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/60">Dynamic Calculated Price:</span>
              <span className="text-xs font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                {currentPrice.discount}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-1.5">
                <RobuxIcon className="w-5 h-5 text-white" />
                <span className="text-xl font-black text-white">
                  {customRobux.toLocaleString()}
                </span>
              </div>
              <span className="text-2xl font-black text-white">
                {currentPrice.formatted}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            id="proceed-custom-paypal-btn"
            type="button"
            onClick={handleCheckout}
            className="w-full py-3 bg-[#0074e0] hover:bg-[#0065c7] active:scale-[0.99] transition-all text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 mb-4 shadow-lg shadow-[#0074e0]/25"
          >
            <span>Checkout with PayPal</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Balance Adjustment / Reset Section */}
          <div className="pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span>Current Account Balance:</span>
              <span className="font-bold text-white flex items-center gap-1">
                <RobuxIcon className="w-3.5 h-3.5" />
                {currentBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Set balance directly..."
                value={manualBalanceInput}
                onChange={(e) => setManualBalanceInput(e.target.value)}
                className="flex-1 bg-[#101115] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={handleDirectBalanceUpdate}
                disabled={!manualBalanceInput}
                className="px-3 py-1.5 bg-[#232733] hover:bg-[#2d3240] disabled:opacity-40 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetBalanceDirectly(0);
                  onClose();
                }}
                className="p-1.5 bg-[#232733] hover:bg-red-500/20 text-white/70 hover:text-red-400 rounded-lg border border-white/10 transition-colors"
                title="Reset balance to 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
