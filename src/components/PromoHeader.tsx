import React from 'react';

export const PromoHeader: React.FC = () => {
  return (
    <div className="relative pt-8 pb-7 px-4 overflow-hidden text-center select-none bg-white">
      {/* 3D Wave / Topographic contour wireframe lines matching Screenshot 1 */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 70% 60% at 50% 10%, #000000 0%, transparent 70%),
            repeating-radial-gradient(circle at 50% -20%, transparent 0, transparent 24px, #000000 25px, transparent 26px)
          `,
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
        }}
      />
      
      {/* SVG Mesh curves for organic contour lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none"
        viewBox="0 0 1000 300"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0,80 Q250,20 500,80 T1000,80" stroke="#000000" strokeWidth="1" />
        <path d="M0,110 Q250,50 500,110 T1000,110" stroke="#000000" strokeWidth="1" />
        <path d="M0,140 Q250,80 500,140 T1000,140" stroke="#000000" strokeWidth="1" />
        <path d="M0,170 Q250,110 500,170 T1000,170" stroke="#000000" strokeWidth="1" />
        <path d="M0,200 Q250,140 500,200 T1000,200" stroke="#000000" strokeWidth="1" />
      </svg>
      
      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
        <h1 
          id="main-page-title"
          className="text-4xl sm:text-[46px] font-black tracking-tight text-[#191b22] font-sans leading-[1.1]"
          style={{ letterSpacing: '-0.035em' }}
        >
          Enjoy up to 25%
          <br />
          more Robux
        </h1>
      </div>
    </div>
  );
};

