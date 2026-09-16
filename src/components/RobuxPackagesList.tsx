import React from 'react';
import { RobuxPackage } from '../types';
import { RobuxIcon } from './Icons';

interface RobuxPackagesListProps {
  popularPackage: RobuxPackage;
  packages: RobuxPackage[];
  onSelectPackage: (pkg: {
    title: string;
    robux: number;
    price: number;
    formattedPrice: string;
  }) => void;
}

export const RobuxPackagesList: React.FC<RobuxPackagesListProps> = ({
  popularPackage,
  packages,
  onSelectPackage,
}) => {
  return (
    <div className="px-4 space-y-8 mb-8">
      {/* 1. POPULAR PICK SECTION (matching Screenshot 1) */}
      <section>
        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mb-3">
          Popular pick
        </h2>

        <div className="bg-[#121319] border border-white/[0.05] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          {/* Left: ⬡ 500  <s>⬡ 400</s> */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <RobuxIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {popularPackage.robuxAmount.toLocaleString()}
              </span>
            </div>

            {popularPackage.originalRobux && (
              <div className="relative flex items-center gap-1 text-white/50 select-none">
                <div className="flex items-center gap-1">
                  <RobuxIcon className="w-4 h-4 text-white/50" />
                  <span className="text-sm sm:text-base font-semibold">
                    {popularPackage.originalRobux.toLocaleString()}
                  </span>
                </div>
                {/* Horizontal strikethrough line across icon and number */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-white/50 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Right: Vibrant blue button */}
          <button
            type="button"
            id="popular-pick-buy-btn"
            onClick={() =>
              onSelectPackage({
                title: `${popularPackage.robuxAmount.toLocaleString()} Robux`,
                robux: popularPackage.robuxAmount,
                price: popularPackage.price,
                formattedPrice: popularPackage.formattedPrice,
              })
            }
            className="bg-[#2a68ff] hover:bg-[#1e58f0] text-white font-bold py-2.5 px-6 rounded-xl text-sm sm:text-base cursor-pointer select-none min-w-[130px] sm:min-w-[150px] text-center shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all"
          >
            {popularPackage.formattedPrice}
          </button>
        </div>
      </section>

      {/* 2. ROBUX PACKAGES SECTION (matching Screenshot 1 & 2) */}
      <section>
        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mb-3">
          Robux packages
        </h2>

        <div className="bg-[#121319] border border-white/[0.05] rounded-2xl p-3 sm:p-4 space-y-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              id={`package-row-${pkg.id}`}
              className="flex items-center justify-between p-2 sm:px-3 rounded-xl hover:bg-white/[0.02] transition-colors"
            >
              {/* Left: [RobuxIcon] Amount + Strikethrough Original + Bonus pill */}
              <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <RobuxIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {pkg.robuxAmount.toLocaleString()}
                  </span>
                </div>

                {pkg.originalRobux && (
                  <div className="relative flex items-center gap-1 text-white/45 select-none">
                    <div className="flex items-center gap-1">
                      <RobuxIcon className="w-3.5 h-3.5 text-white/45" />
                      <span className="text-xs sm:text-sm font-semibold">
                        {pkg.originalRobux.toLocaleString()}
                      </span>
                    </div>
                    {/* Horizontal strikethrough line */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-white/45 pointer-events-none" />
                  </div>
                )}

                {pkg.bonusText && (
                  <div className="bg-[#1c1d25] border border-white/[0.06] text-white text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full select-none shadow-xs">
                    {pkg.bonusText}
                  </div>
                )}
              </div>

              {/* Right: Dark grey button */}
              <button
                type="button"
                id={`buy-pkg-btn-${pkg.id}`}
                onClick={() =>
                  onSelectPackage({
                    title: `${pkg.robuxAmount.toLocaleString()} Robux`,
                    robux: pkg.robuxAmount,
                    price: pkg.price,
                    formattedPrice: pkg.formattedPrice,
                  })
                }
                className="bg-[#21232d] hover:bg-[#2b2e3b] text-white font-bold py-2 sm:py-2.5 px-4 rounded-xl text-sm sm:text-base cursor-pointer select-none min-w-[110px] text-center border border-white/[0.04] active:scale-[0.98] transition-all"
              >
                {pkg.formattedPrice}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
