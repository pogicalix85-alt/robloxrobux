import React from 'react';
import { RobuxIcon } from './Icons';
import { ArrowUp } from 'lucide-react';

interface RobloxHeaderProps {
  balance: number;
  onOpenSendModal: () => void;
  onOpenCustomModal: () => void;
}

export const RobloxHeader: React.FC<RobloxHeaderProps> = ({
  balance,
  onOpenSendModal,
  onOpenCustomModal,
}) => {
  return (
    <header className="w-full bg-white py-3 sm:py-4 select-none">
      <div className="max-w-[840px] mx-auto px-4 flex items-center justify-end">
        {/* Unified Robux Balance & Send Pill matching Screenshot 1 */}
        <div className="flex items-center bg-[#f0f2f5] border border-[#e2e5eb] rounded-full p-1 shadow-2xs">
          {/* Balance Pill */}
          <div
            id="header-balance-pill"
            onClick={onOpenCustomModal}
            className="flex items-center gap-1.5 px-3 py-1 cursor-pointer select-none text-[#191b22] hover:text-black transition-colors"
            title="Click to adjust Robux balance"
          >
            <RobuxIcon className="w-4 h-4 text-[#191b22]" />
            <span className="font-bold text-sm text-[#191b22]">
              {balance.toLocaleString()}
            </span>
          </div>

          {/* Send Button Pill */}
          <button
            type="button"
            id="header-send-btn"
            onClick={onOpenSendModal}
            className="flex items-center gap-1 bg-[#e4e7ec] hover:bg-[#d8dce4] active:scale-[0.98] text-[#191b22] text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer select-none shadow-2xs ml-1"
            title="Send Robux"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[#191b22] stroke-[2.5]" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </header>
  );
};
