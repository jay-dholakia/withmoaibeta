import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    {isActive('/leaderboard') && (
                      <div className="absolute inset-0 m-auto bg-client/10 dark:bg-blue-900/40 rounded-full" />
                    )}
                    <LayoutGrid className="h-5 w-5 relative z-10" strokeWidth={isActive('/leaderboard') ? 2.5 : 2} />
                  </div>
                  <span className="text-xs mt-1">Dashboard</span>
                </Link>
              </li>
              
              <li className="flex-1 flex justify-center">
                <Link 
                  to="/client-dashboard/workouts" 
                  className={`flex flex-col items-center py-3 ${isActive('/workouts') ? 'text-client dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    {isActive('/workouts') && (
                      <div className="absolute inset-0 m-auto bg-client/10 dark:bg-blue-900/40 rounded-full" />
                    )}
                    <DumbbellIcon className="h-5 w-5 relative z-10" strokeWidth={isActive('/workouts') ? 2.5 : 2} />
                  </div>
                  <span className="text-xs mt-1">Workouts</span>
                </Link>
              </li>
              
              <li className="flex-1 flex justify-center">
                <Link 
                  to="/client-dashboard/moai" 
                  className={`flex flex-col items-center py-3 ${isActive('/moai') ? 'text-client dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    {isActive('/moai') && (
                      <div className="absolute inset-0 m-auto bg-client/10 dark:bg-blue-900/40 rounded-full" />
                    )}
                    <Users2Icon className="h-5 w-5 relative z-10" strokeWidth={isActive('/moai') ? 2.5 : 2} />
                  </div>
                  <span className="text-xs mt-1 whitespace-nowrap">Your Moai</span>
                </Link>
              </li>
              
              <li className="flex-1 flex justify-center">
                <Link 
                  to="/client-dashboard/notes" 
                  className={`flex flex-col items-center py-3 ${isActive('/notes') ? 'text-client dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    {isActive('/notes') && (
                      <div className="absolute inset-0 m-auto bg-client/10 dark:bg-blue-900/40 rounded-full" />
                    )}
                    <BananaIcon className="h-5 w-5 relative z-10" strokeWidth={isActive('/notes') ? 2.5 : 2} />
                  </div>
                  <span className="text-xs mt-1">Nutrition</span>
                </Link>
              </li>
              
              <li className="flex-1 flex justify-center">
                <Link 
                  to="/client-dashboard/settings" 
                  className={`flex flex-col items-center py-3 ${isActive('/settings') ? 'text-client dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    {isActive('/settings') && (
                      <div className="absolute inset-0 m-auto bg-client/10 dark:bg-blue-900/40 rounded-full" />
                    )}
                    <Settings className="h-5 w-5 relative z-10" strokeWidth={isActive('/settings') ? 2.5 : 2} />
                  </div>
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
