import React, { useState } from 'react';
import { SUBSCRIPTIONS } from '../data/robuxData';
import { Tag, Gamepad2, Upload, ChevronRight } from 'lucide-react';
import { RobuxIcon } from './Icons';

interface RobloxPlusCardsProps {
  onSelectSubscription: (sub: {
    title: string;
    robux: number;
    price: number;
    formattedPrice: string;
  }) => void;
}

export const RobloxPlusCards: React.FC<RobloxPlusCardsProps> = ({
  onSelectSubscription,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const getPerkIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Tag className="w-4 h-4 text-white/80 shrink-0" />;
      case 1:
        return <Gamepad2 className="w-4 h-4 text-white/80 shrink-0" />;
      case 2:
        return <Upload className="w-4 h-4 text-white/80 shrink-0" />;
      default:
        return <RobuxIcon className="w-4 h-4 text-white/80 shrink-0" />;
    }
  };

  return (
    <section className="px-4 mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-black text-xs text-white">
            P
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            New on Roblox
          </h2>
        </div>
        <button
          type="button"
          className="text-xs sm:text-sm font-semibold text-white/70 hover:text-white flex items-center gap-0.5 transition-colors"
        >
          <span>Learn more</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
        {SUBSCRIPTIONS.map((sub) => {
          const price = `$${sub.priceUSD}`;
          const priceVal = sub.priceUSD;

          return (
            <div
              key={sub.id}
              id={`subscription-card-${sub.id}`}
              className="snap-start shrink-0 w-[88%] sm:w-[320px] bg-[#181a20] rounded-2xl border border-white/[0.08] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {sub.title}
                  </h3>
                  <span className="text-sm sm:text-base font-extrabold text-white">
                    {price}
                  </span>
                </div>

                {/* Perks list */}
                <div className="space-y-3 mb-6">
                  {sub.perks.map((perk, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-3">
                      <div className="mt-0.5">{getPerkIcon(pIdx)}</div>
                      <span className="text-xs sm:text-sm text-white/80 leading-snug">
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscribe button */}
              <button
                id={`sub-btn-${sub.id}`}
                type="button"
                onClick={() =>
                  onSelectSubscription({
                    title: `${sub.title} (Monthly)`,
                    robux: sub.robuxMonthly || 0,
                    price: priceVal,
                    formattedPrice: `${price}/month`,
                  })
                }
                className="w-full bg-[#292d3a] hover:bg-[#343a4a] text-white font-bold text-sm py-2.5 rounded-xl border border-white/10 transition-colors text-center active:scale-[0.98]"
              >
                {price}/month
              </button>
            </div>
          );
        })}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center items-center gap-1.5 mt-3">
        {SUBSCRIPTIONS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveSlide(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              activeSlide === i ? 'bg-white w-4' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
