import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calculator, ArrowRight, RotateCcw } from 'lucide-react';
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

  // Pricing formula in dollars:
  const calculatePrice = (amount: number) => {
    let rate = 0.0125;
    if (amount >= 20000) {
      rate = 0.0089;
    } else if (amount >= 5000) {
      rate = 0.0098;
    } else if (amount >= 1000) {
      rate = 0.0105;
    }

    const total = Math.max(0.99, Number((amount * rate).toFixed(2)));
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
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          className="relative w-full max-w-md bg-white border border-[#e4e7ec] rounded-3xl p-6 shadow-2xl text-[#191b22] z-10 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#2b5ef5]" />
              <h3 className="font-bold text-base sm:text-lg text-[#191b22]">
                Custom Robux Amount
              </h3>
            </div>
            <button
              id="close-custom-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-[#6e7382] hover:text-black hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Explanation */}
          <p className="text-xs text-[#6e7382] mb-4 leading-relaxed">
            Prices adapt dynamically based on your requested Robux volume. Larger quantities unlock tiered bulk discounts.
          </p>

          {/* Amount input */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#191b22] block mb-1.5">
              Enter Robux Amount
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5">
                <RobuxIcon className="w-5 h-5 text-[#191b22]" />
              </div>
              <input
                id="custom-robux-input"
                type="number"
                min="10"
                max="1000000"
                step="50"
                value={customRobux}
                onChange={(e) => setCustomRobux(Math.max(10, Number(e.target.value) || 0))}
                className="w-full bg-[#f8f9fa] border border-[#d6dae3] focus:border-[#2b5ef5] focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-11 pr-4 py-3 text-lg font-black text-[#191b22] outline-none transition-all"
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
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                  customRobux === chip
                    ? 'bg-[#e8f0fe] text-[#1a56db] border-[#2b5ef5]'
                    : 'bg-[#f0f2f5] text-[#191b22] border-[#d6dae3] hover:bg-[#e4e7ec]'
                }`}
              >
                +{chip.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Price Calculation Display Card */}
          <div className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#e4e7ec] mb-5 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#6e7382]">Dynamic Calculated Price:</span>
              <span className="text-xs font-bold text-[#1a56db] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                {currentPrice.discount}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-1.5">
                <RobuxIcon className="w-5 h-5 text-[#191b22]" />
                <span className="text-xl font-black text-[#191b22]">
                  {customRobux.toLocaleString()}
                </span>
              </div>
              <span className="text-2xl font-black text-[#191b22]">
                {currentPrice.formatted}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            id="proceed-custom-paypal-btn"
            type="button"
            onClick={handleCheckout}
            className="w-full py-3.5 bg-[#2b5ef5] hover:bg-[#204ecc] active:scale-[0.98] transition-all text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 mb-4 shadow-sm cursor-pointer"
          >
            <span>Checkout with Dollars</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Balance Adjustment / Reset Section */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-[#6e7382] mb-2">
              <span>Current Account Balance:</span>
              <span className="font-bold text-[#191b22] flex items-center gap-1">
                <RobuxIcon className="w-3.5 h-3.5 text-[#191b22]" />
                {currentBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Set balance directly..."
                value={manualBalanceInput}
                onChange={(e) => setManualBalanceInput(e.target.value)}
                className="flex-1 bg-[#f8f9fa] border border-[#d6dae3] focus:border-[#2b5ef5] rounded-lg px-3 py-1.5 text-xs text-[#191b22] outline-none"
              />
              <button
                type="button"
                onClick={handleDirectBalanceUpdate}
                disabled={!manualBalanceInput}
                className="px-3.5 py-1.5 bg-[#e4e7ec] hover:bg-[#d8dce4] disabled:opacity-40 text-[#191b22] text-xs font-bold rounded-lg border border-[#d6dae3] transition-colors cursor-pointer"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetBalanceDirectly(0);
                  onClose();
                }}
                className="p-1.5 bg-[#e4e7ec] hover:bg-red-50 text-[#6e7382] hover:text-red-600 rounded-lg border border-[#d6dae3] transition-colors cursor-pointer"
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
