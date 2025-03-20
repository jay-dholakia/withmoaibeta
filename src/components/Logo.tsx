
import React from 'react';

interface LogoProps {
  variant?: 'admin' | 'coach' | 'client' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'default',
  size = 'md'
}) => {
  const getColor = () => {
    switch (variant) {
      case 'admin': return 'text-admin';
      case 'coach': return 'text-coach';
      case 'client': return 'text-client';
      default: return 'text-primary';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm': return 'text-xl';
      case 'lg': return 'text-4xl';
      default: return 'text-2xl';
    }
  };

  return (
    <div className="flex items-center">
      <div className={`${getSize()} font-bold ${getColor()}`}>
        Moai
      </div>
    </div>
  );
};
