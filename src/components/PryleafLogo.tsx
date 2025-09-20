import React from 'react';

interface PryleafLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const PryleafLogo: React.FC<PryleafLogoProps> = ({ 
  className = "", 
  width = 120, 
  height = 32 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 120 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Modern leaf icon */}
      <g>
        <path 
          d="M8 24C8 24 4 20 4 14C4 8 8 4 14 4C20 4 24 8 24 14C24 20 20 24 14 24" 
          fill="currentColor" 
          fillOpacity="0.1" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M14 4L8 24" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        <circle cx="14" cy="14" r="2" fill="currentColor"/>
      </g>
      
      {/* Pryleaf text */}
      <g transform="translate(34, 8)">
        {/* P */}
        <path 
          d="M0 0V16M0 0H6C8.2 0 10 1.8 10 4C10 6.2 8.2 8 6 8H0" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        
        {/* R */}
        <path 
          d="M14 0V16M14 0H20C22.2 0 24 1.8 24 4C24 6.2 22.2 8 20 8H14M20 8L24 16" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        
        {/* Y */}
        <path 
          d="M28 0L32 8L36 0M32 8V16" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        
        {/* L */}
        <path 
          d="M40 0V16M40 16H46" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        
        {/* E */}
        <path 
          d="M50 0V16M50 0H56M50 8H54M50 16H56" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        
        {/* A */}
        <path 
          d="M60 16L64 0L68 16M61.5 12H66.5" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        
        {/* F */}
        <path 
          d="M72 0V16M72 0H78M72 8H76" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
      </g>
    </svg>
  );
};

export default PryleafLogo;