import React, { useRef } from 'react';
import { SUBSCRIPTIONS } from '../data/robuxData';
import { Tag, Gamepad2, Sparkles, ChevronRight, PiggyBank } from 'lucide-react';
import { RobuxIcon, RobloxPlusHexagonIcon } from './Icons';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'tag':
        return <Tag className="w-4 h-4 text-[#444857] shrink-0" />;
      case 'gamepad':
        return <Gamepad2 className="w-4 h-4 text-[#444857] shrink-0" />;
      case 'send':
        return <RobloxPlusHexagonIcon className="w-4 h-4 text-[#444857] shrink-0" />;
      case 'wand':
        return <Sparkles className="w-4 h-4 text-[#444857] shrink-0" />;
      case 'hexagon':
        return <RobloxPlusHexagonIcon className="w-4 h-4 text-[#444857] shrink-0" />;
      case 'robux':
        return <RobuxIcon className="w-4 h-4 text-[#444857] shrink-0" />;
      case 'piggy':
        return <PiggyBank className="w-4 h-4 text-[#444857] shrink-0" />;
      default:
        return <RobloxPlusHexagonIcon className="w-4 h-4 text-[#444857] shrink-0" />;
    }
  };

  return (
    <section className="px-4 mb-9 select-none">
      {/* Section Header matching Screenshot 2 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RobloxPlusHexagonIcon className="w-6 h-6 text-[#191b22]" />
          <h2 className="text-lg sm:text-xl font-bold text-[#191b22] tracking-tight">
            New on Roblox
          </h2>
        </div>
        <button
          type="button"
          className="text-xs sm:text-sm font-semibold text-[#191b22] hover:text-black underline transition-colors cursor-pointer"
        >
          Learn more
        </button>
      </div>

      {/* Cards Container with Right Scroll Arrow matching Screenshot 2 */}
      <div className="relative group">
        <div 
          ref={scrollRef}
          className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x pr-10"
        >
          {SUBSCRIPTIONS.map((sub) => (
            <div
              key={sub.id}
              id={`subscription-card-${sub.id}`}
              className="snap-start shrink-0 w-[230px] sm:w-[245px] bg-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-[#e4e7ec] shadow-2xs transition-all"
            >
              <div>
                {/* Header: Title + Price matching Screenshot 2 */}
                <div className="flex items-baseline justify-between gap-1 mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-[#191b22] tracking-tight leading-snug">
                    {sub.title}
                  </h3>
                  <div className="flex items-baseline gap-1 shrink-0">
                    {sub.originalPrice && (
                      <span className="text-[11px] text-[#848995] line-through font-semibold">
                        {sub.originalPrice}
                      </span>
                    )}
                    <span className="text-sm sm:text-base font-black text-[#191b22]">
                      {sub.formattedPrice}
                    </span>
                  </div>
                </div>

                {/* Perks list matching Screenshot 2 */}
                <div className="space-y-3 mb-6">
                  {sub.perks.map((perk, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2.5">
                      <div className="mt-0.5">{renderIcon(perk.icon)}</div>
                      <span className="text-xs sm:text-[13px] text-[#333745] leading-snug">
                        {perk.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Subscription button */}
              <button
                id={`sub-btn-${sub.id}`}
                type="button"
                onClick={() =>
                  onSelectSubscription({
                    title: `${sub.title} (Monthly)`,
                    robux: sub.robuxMonthly || 0,
                    price: sub.price,
                    formattedPrice: `${sub.formattedPrice}/month`,
                  })
                }
                className="w-full bg-[#e4e7ec] hover:bg-[#d8dce4] active:scale-[0.98] text-[#191b22] text-xs sm:text-sm font-semibold py-2.5 rounded-xl transition-colors cursor-pointer select-none text-center"
              >
                {sub.formattedPrice}/month
              </button>
            </div>
          ))}
        </div>

        {/* Carousel Next Arrow Button - Round Black Button matching Screenshot 2 */}
        <button
          type="button"
          onClick={handleScrollRight}
          className="flex absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#191b22] hover:bg-black text-white items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer z-10 select-none"
          title="Next"
        >
          <ChevronRight className="w-5 h-5 text-white stroke-[2.5]" />
        </button>
      </div>
    </section>
  );
};
