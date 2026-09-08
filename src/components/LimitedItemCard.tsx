import React from 'react';
import { LimitedItem } from '../types';
import { RobuxIcon, VerifiedBadge } from './Icons';

interface LimitedItemCardProps {
  item: LimitedItem;
  promo25Percent?: boolean;
  onSelectItem: (item: {
    title: string;
    robux: number;
    price: number;
    formattedPrice: string;
    isItem?: boolean;
    image?: string;
  }) => void;
}

export const LimitedItemCard: React.FC<LimitedItemCardProps> = ({
  item,
  promo25Percent = false,
  onSelectItem,
}) => {
  const currentRobux = promo25Percent ? 24000 : item.robuxAmount;
  const formattedPrice = item.formattedUSD;
  const priceVal = item.priceUSD;

  const handleClick = () => {
    onSelectItem({
      title: `${item.name} + ${currentRobux.toLocaleString()} Robux`,
      robux: currentRobux,
      price: priceVal,
      formattedPrice,
      isItem: true,
      image: item.image,
    });
  };

  return (
    <section className="px-4 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
          Limited-time avatar items
        </h2>
        <span className="px-3 py-1 text-xs font-bold text-white/90 bg-[#252833] rounded-full border border-white/10">
          {item.daysLeft} days left
        </span>
      </div>

      {/* Item Card */}
      <div 
        id="limited-item-card"
        className="bg-[#181a20] hover:bg-[#1c1f26] transition-all duration-200 rounded-2xl border border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between shadow-xl"
      >
        {/* Item Graphic / Render */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#15171e] via-[#101217] to-[#0d0e12] mb-4 p-4 group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,80,0.08)_0%,transparent_65%)] pointer-events-none" />
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full max-h-[190px] sm:max-h-[220px] object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-300 select-none"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Info */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
            {item.name}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-white/60 font-medium">
            <span>{item.creator}</span>
            <VerifiedBadge className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <RobuxIcon className="w-5 h-5 text-white" />
            <span className="font-extrabold text-lg sm:text-xl text-white">
              {currentRobux.toLocaleString()}
            </span>
            {promo25Percent && (
              <span className="text-xs sm:text-sm text-white/40 line-through">
                {item.robuxAmount.toLocaleString()}
              </span>
            )}
          </div>

          <button
            id="buy-limited-item-btn"
            type="button"
            onClick={handleClick}
            className="bg-[#2d3240] hover:bg-[#394052] active:scale-95 transition-all text-white font-bold text-sm sm:text-base px-6 py-2.5 rounded-xl border border-white/10 shadow-sm"
          >
            {formattedPrice}
          </button>
        </div>
      </div>
    </section>
  );
};
