import React from 'react';
import { Gift } from 'lucide-react';

interface MoreWaysSectionProps {
  onSelectGiftCard: (giftCard: {
    title: string;
    robux: number;
    price: number;
    formattedPrice: string;
  }) => void;
}

export const MoreWaysSection: React.FC<MoreWaysSectionProps> = ({
  onSelectGiftCard,
}) => {
  const price = '$10.00';
  const priceVal = 10;
  const robuxAmount = 1000; // 800 + 25% bonus = 1000

  return (
    <section className="px-4 mb-8">
      <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mb-3">
        More ways to get Robux
      </h2>

      <div 
        id="gift-card-promo-container"
        className="bg-[#181a20] rounded-2xl border border-white/[0.08] p-5 flex flex-col justify-between shadow-lg"
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-5 h-5 text-red-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                Gift Card
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-white/70">
              Enjoy 25% more Robux on Roblox gift cards
            </p>
          </div>
        </div>

        <button
          id="buy-giftcard-btn"
          type="button"
          onClick={() =>
            onSelectGiftCard({
              title: 'Roblox Digital Gift Card (1,000 Robux)',
              robux: robuxAmount,
              price: priceVal,
              formattedPrice: price,
            })
          }
          className="w-full bg-[#292d3a] hover:bg-[#343a4a] text-white font-bold text-sm py-2.5 rounded-xl border border-white/10 transition-colors text-center active:scale-[0.98]"
        >
          Buy
        </button>
      </div>
    </section>
  );
};
