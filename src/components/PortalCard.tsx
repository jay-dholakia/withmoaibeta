
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PortalCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  variant: 'admin' | 'coach' | 'client';
}

export const PortalCard: React.FC<PortalCardProps> = ({
  title,
  description,
  icon: Icon,
  to,
  variant
}) => {
  const getGradientClasses = () => {
    switch (variant) {
      case 'admin':
        return 'portal-gradient-admin border-admin/10 hover:border-admin/20';
      case 'coach':
        return 'portal-gradient-coach border-coach/10 hover:border-coach/20';
      case 'client':
        return 'portal-gradient-client border-client/10 hover:border-client/20';
      default:
        return '';
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case 'admin':
        return 'text-admin bg-admin/5 border-admin/10';
      case 'coach':
        return 'text-coach bg-coach/5 border-coach/10';
      case 'client':
        return 'text-client bg-client/5 border-client/10';
      default:
        return '';
    }
  };

  // Define login URLs based on variant
  const getLoginUrl = () => {
    switch (variant) {
      case 'admin':
        return '/login'; // Using the same login page but with admin variant
      case 'coach':
        return '/coach-login'; // Using the coach-specific login page
      case 'client':
        return '/login'; // Using client login page
      default:
        return '/login';
    }
  };

  return (
    <motion.div
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      className={`glass-card rounded-xl overflow-hidden ${getGradientClasses()} p-4 transition-all duration-300 w-full`}
    >
      <Link to={getLoginUrl()} className="block h-full">
        <div className="flex flex-col h-full">
          <div className={`${getIconClasses()} w-12 h-12 rounded-lg flex items-center justify-center border mb-4`}>
            <Icon size={24} />
          </div>
          
          <h3 className="text-xl font-medium mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground flex-grow">{description}</p>
          
          <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-sm font-medium">Login</span>
            <motion.div
              whileHover={{ x: 5 }}
              className="w-6 h-6 flex items-center justify-center rounded-full"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M3.33337 8H12.6667M12.6667 8L8.00004 3.33333M12.6667 8L8.00004 12.6667" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
