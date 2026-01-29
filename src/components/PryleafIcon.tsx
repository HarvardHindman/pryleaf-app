import React from 'react';
import Image from 'next/image';

interface PryleafIconProps {
  className?: string;
  size?: number;
}

export const PryleafIcon: React.FC<PryleafIconProps> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <Image 
      src="/prylogo.png"
      alt="Pryleaf"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default PryleafIcon;