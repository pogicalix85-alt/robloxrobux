import React from 'react';
import { Sparkles, Info } from 'lucide-react';

interface PromoHeaderProps {
  promo25Percent: boolean;
}

export const PromoHeader: React.FC<PromoHeaderProps> = ({ promo25Percent }) => {
  return (
    <div className="relative pt-6 pb-4 px-4 overflow-hidden">
      {/* Subtle topographic wave grid in background */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 20%, #ffffff 1px, transparent 1px), linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)`,
          backgroundSize: '24px 24px, 16px 16px, 16px 16px',
        }}
      />
      
      <div className="relative z-10 flex flex-col items-start gap-1">
        <h1 
          id="main-page-title"
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
        >
          {promo25Percent ? 'Enjoy up to 25% more Robux' : 'Buy Robux'}
        </h1>
        
        {promo25Percent && (
          <p className="text-xs sm:text-sm text-blue-400 font-medium flex items-center gap-1.5 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            Limited time promotion applied to select packages & gift cards
          </p>
        )}
      </div>
    </div>
  );
};
