import React from 'react';

interface PryleafIconProps {
  className?: string;
  size?: number;
}

export const PryleafIcon: React.FC<PryleafIconProps> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Modern leaf icon */}
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
    </svg>
  );
};

export default PryleafIcon;