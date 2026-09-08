import React from 'react';
import { RobuxIcon, RobloxLogo } from './Icons';
import { 
  Menu, 
  ArrowUp
} from 'lucide-react';
import { motion } from 'motion/react';

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
    <header className="sticky top-0 z-40 w-full bg-[#111216]/95 backdrop-blur-md border-b border-white/[0.07] px-3 sm:px-6 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            id="header-nav-menu-btn"
            type="button"
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-white">
              <RobloxLogo className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline-block font-black tracking-wider text-lg text-white font-sans">
              ROBLOX
            </span>
          </div>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-5 ml-3 text-sm font-semibold text-white/70">
            <span className="hover:text-white cursor-pointer transition-colors">Charts</span>
            <span className="hover:text-white cursor-pointer transition-colors">Marketplace</span>
            <span className="hover:text-white cursor-pointer transition-colors">Create</span>
            <span className="text-white border-b-2 border-white pb-0.5 font-bold cursor-pointer">Robux</span>
          </nav>
        </div>

        {/* Right side controls: Balance + Send button + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Robux Balance Pill */}
          <motion.div
            id="header-robux-balance-container"
            key={balance}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center gap-1.5 bg-[#191c24] hover:bg-[#202530] border border-white/15 px-3 py-1.5 rounded-lg transition-colors cursor-pointer group"
            onClick={onOpenCustomModal}
            title="Click to calculate custom amount or adjust balance"
          >
            <RobuxIcon className="w-4 h-4 text-white" />
            <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              {balance.toLocaleString()}
            </span>
          </motion.div>

          {/* Send Robux Button (replaces +25% bonus and currency switchers) */}
          <button
            id="header-send-robux-btn"
            type="button"
            onClick={onOpenSendModal}
            className="flex items-center gap-1.5 bg-[#0074e0] hover:bg-[#0062c4] text-white text-xs sm:text-sm font-bold px-3 sm:px-3.5 py-1.5 rounded-lg shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            title="Send Robux to players by searching their username"
          >
            <ArrowUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            <span>Send</span>
          </button>

          {/* User Avatar Initial */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#0052cc] to-[#00a2ff] text-white font-black text-xs sm:text-sm flex items-center justify-center ring-2 ring-white/10 select-none">
            A
          </div>
        </div>
      </div>
    </header>
  );
};
