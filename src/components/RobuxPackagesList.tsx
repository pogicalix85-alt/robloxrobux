import React from 'react';
import { RobuxPackage } from '../types';
import { RobuxIcon } from './Icons';
import { SlidersHorizontal } from 'lucide-react';

interface RobuxPackagesListProps {
  packages: RobuxPackage[];
  promo25Percent?: boolean;
  onSelectPackage: (pkg: {
    title: string;
    robux: number;
    price: number;
    formattedPrice: string;
  }) => void;
  onOpenCustomModal: () => void;
}

export const RobuxPackagesList: React.FC<RobuxPackagesListProps> = ({
  packages,
  promo25Percent = false,
  onSelectPackage,
  onOpenCustomModal,
}) => {
  return (
    <section className="px-4 mb-8">
      {/* Section Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Robux packages
          </h2>
          <button
            id="custom-robux-calc-btn"
            type="button"
            onClick={onOpenCustomModal}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            title="Custom amount calculator"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Custom Amount</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm text-white/50 leading-relaxed mt-1">
          By purchasing Robux, you agree to our Terms of Use, including the arbitration clause and revocation policy.
        </p>
      </div>

      {/* Package Rows */}
      <div className="flex flex-col gap-2.5">
        {packages.map((pkg) => {
          const robuxCount = promo25Percent
            ? Math.round(pkg.robuxAmount * 1.1)
            : pkg.robuxAmount;
          const formattedPrice = pkg.formattedUSD;
          const priceVal = pkg.priceUSD;

          return (
            <div
              key={pkg.id}
              id={`package-row-${pkg.id}`}
              className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-[#181a20] hover:bg-[#1f222b] border border-white/[0.06] transition-colors"
            >
              {/* Left Side: Robux amount */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <RobuxIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-lg sm:text-xl text-white tracking-tight">
                    {robuxCount.toLocaleString()}
                  </span>

                  {promo25Percent && (
                    <span className="text-xs text-white/40 line-through">
                      {pkg.robuxAmount.toLocaleString()}
                    </span>
                  )}

                  {pkg.isForYou && (
                    <span className="text-[11px] font-bold text-white/90 bg-[#2b303d] px-2.5 py-0.5 rounded-full border border-white/10">
                      ★ For you
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Price Button in USD ($) */}
              <button
                id={`buy-btn-${pkg.id}`}
                type="button"
                onClick={() =>
                  onSelectPackage({
                    title: `${robuxCount.toLocaleString()} Robux`,
                    robux: robuxCount,
                    price: priceVal,
                    formattedPrice,
                  })
                }
                className={`min-w-[105px] sm:min-w-[125px] text-center font-bold text-sm sm:text-base px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-150 active:scale-95 shadow-sm ${
                  pkg.highlightButton
                    ? 'bg-[#0074e0] hover:bg-[#0060d6] text-white shadow-[#0074e0]/20'
                    : 'bg-[#292d3a] hover:bg-[#343a4a] text-white border border-white/10'
                }`}
              >
                {formattedPrice}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
