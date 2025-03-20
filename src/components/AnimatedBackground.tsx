
import React from 'react';

interface AnimatedBackgroundProps {
  variant?: 'admin' | 'coach' | 'client' | 'default';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  variant = 'default' 
}) => {
  let gradientClasses = '';
  
  switch (variant) {
    case 'admin':
      gradientClasses = 'bg-gradient-to-br from-admin-muted/30 via-background to-background';
      break;
    case 'coach':
      gradientClasses = 'bg-gradient-to-br from-coach-muted/30 via-background to-background';
      break;
    case 'client':
      gradientClasses = 'bg-gradient-to-br from-client-muted/30 via-background to-background';
      break;
    default:
      gradientClasses = 'bg-gradient-to-br from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background';
  }

  return (
    <div className="fixed inset-0 -z-10">
      <div className={`absolute inset-0 ${gradientClasses} animate-background-gradient bg-300%`} />
      
      {/* Animated shapes */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-4000" style={{ animationDelay: '4s' }} />
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiNmNWY3ZmEiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNNjAgMzBjMCAxNi41NjgtMTMuNDMyIDMwLTMwIDMwQzEzLjQzMiA2MCAwIDQ2LjU2OCAwIDMwIDAgMTMuNDMyIDEzLjQzMiAwIDMwIDBjMTYuNTY4IDAgMzAgMTMuNDMyIDMwIDMweiIgc3Ryb2tlPSIjZWVlZWVlIiBzdHJva2Utd2lkdGg9Ii41Ii8+PHBhdGggZD0iTTYwIDEyLjU2MmMwIDE2LjU2OC0xMy40MzIgMzAtMzAgMzAtMTYuNTY4IDAtMzAtMTMuNDMyLTMwLTMwQzAgLTQuMDA1IDEzLjQzMi0xNy41MzcgMzAtMTcuNTM3YzE2LjU2OCAwIDMwIDEzLjQzMiAzMCAzMC4wOTl6IiBzdHJva2U9IiNlZWVlZWUiIHN0cm9rZS13aWR0aD0iLjUiLz48cGF0aCBkPSJNNjAgNDcuNDM4YzAgMTYuNTY4LTEzLjQzMiAzMC0zMCAzMHMtMzAtMTMuNDMyLTMwLTMwYzAtMTYuNTY4IDEzLjQzMi0zMCAzMC0zMHMzMCAxMy40MzIgMzAgMzB6IiBzdHJva2U9IiNlZWVlZWUiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] opacity-5"
      />
    </div>
  );
};
