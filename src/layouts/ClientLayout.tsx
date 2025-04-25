import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  DumbbellIcon, 
  LayoutDashboard,
  LayoutGrid,
  Users2,
  Users2Icon,
  Utensils,
  UtensilsCrossed,
  Settings,
  Settings2,
  Mountain,
  MountainIcon,
  Banana,
  BananaIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/PageTransition';
import { Toaster } from 'sonner';
import { Logo } from '@/components/Logo';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <Toaster position="top-center" richColors />
      
      <header className="bg-card shadow-sm border-b border-border py-4">
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Logo variant="client" size="md" />
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow py-6 mb-16 w-full overflow-visible">
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 overflow-visible">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-md z-[100]">
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6">
          <nav className="flex justify-center">
            <ul className="flex justify-evenly w-full max-w-screen-xl mx-auto">
              <li className="flex-1 flex justify-center">
                <Link 
                  to="/client-dashboard/leaderboard" 
                  className={`flex flex-col items-center py-3 ${isActive('/leaderboard') ? 'text-client dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {isActive('/leaderboard') ? (
                    <LayoutGrid className="h-5 w-5" />
                  ) : (
                    <LayoutDashboard className="h-5 w-5" />
                  )}
                  <span className="text-xs mt-1">Dashboard</span>
                </Link>
              </li>
              
              <li className="flex-1 flex justify-center">
                <Link 
                  to="/client-dashboard/workouts" 
                  className={`flex flex-col items-center py-3 ${isActive('/workouts') ? 'text-client dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {isActive('/workouts') ? (
                    <DumbbellIcon className="h-5 w-5 fill-current" />
                  ) : (
                    <Dumbbell className="h-5 w-5" />
                  )}
                  <span className="text-xs mt-1">Workouts</span>
                </Link>
              </li>
              
              <li className="flex-1 flex justify-center">
                <Link 
                  to="/client-dashboard/moai" 
                  className={`flex flex-col items-center py-3 ${isActive('/moai') ? 'text-client dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {isActive('/moai') ? (
                    <Users2Icon className="h-5 w-5 fill-current" />
                  ) : (
                    <Users2 className="h-5 w-5" />
                  )}
                  <span className="text-xs mt-1 whitespace-nowrap">Your Moai</span>
                </Link>
              </li>
              
              <li className="flex-1 flex justify-center">
                <Link 
                  to="/client-dashboard/notes" 
                  className={`flex flex-col items-center py-3 ${isActive('/notes') ? 'text-client dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {isActive('/notes') ? (
                    <BananaIcon className="h-5 w-5 fill-current" />
                  ) : (
                    <Banana className="h-5 w-5" />
                  )}
                  <span className="text-xs mt-1">Nutrition</span>
                </Link>
              </li>
              
              <li className="flex-1 flex justify-center">
                <Link 
                  to="/client-dashboard/settings" 
                  className={`flex flex-col items-center py-3 ${isActive('/settings') ? 'text-client dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {isActive('/settings') ? (
                    <Settings2 className="h-5 w-5 fill-current" />
                  ) : (
                    <Settings className="h-5 w-5" />
                  )}
                  <span className="text-xs mt-1">Settings</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
};
