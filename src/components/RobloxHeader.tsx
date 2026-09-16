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
    <header className="w-full bg-[#0b0c10] py-3 sm:py-4 select-none">
      <div className="max-w-[840px] mx-auto px-4 flex items-center justify-end gap-2.5">
        {/* Robux Balance Pill matching Screenshot 1 */}
        <div
          id="header-balance-pill"
          onClick={onOpenCustomModal}
          className="flex items-center gap-1.5 bg-[#1b1c24] hover:bg-[#242633] border border-white/[0.08] px-3 py-1 rounded-full cursor-pointer select-none transition-colors shadow-xs"
          title="Click to adjust balance"
        >
          <RobuxIcon className="w-4 h-4 text-white" />
          <span className="font-bold text-sm text-white">
            {balance.toLocaleString()}
          </span>
        </div>

        {/* Send Button Pill matching Screenshot 1 */}
        <button
          type="button"
          id="header-send-btn"
          onClick={onOpenSendModal}
          className="flex items-center gap-1.5 bg-[#1b1c24] hover:bg-[#242633] active:scale-[0.98] text-white text-sm font-bold px-3.5 py-1 rounded-full transition-all cursor-pointer select-none border border-white/[0.08] shadow-xs"
        >
          <ArrowUp className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          <span>Send</span>
        </button>
      </div>
    </header>
  );
};
