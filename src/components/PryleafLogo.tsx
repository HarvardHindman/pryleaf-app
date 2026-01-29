import React from 'react';
import Image from 'next/image';

interface PryleafLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const PryleafLogo: React.FC<PryleafLogoProps> = ({ 
  className = "", 
  width = 120, 
  height = 120 
}) => {
  return (
    <Image 
      src="/prylogo.png"
      alt="Pryleaf"
      width={width}
      height={height}
      className={className}
    />
  );
};

export default PryleafLogo;