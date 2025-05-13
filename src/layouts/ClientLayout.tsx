
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid,
  DumbbellIcon,
  Mountain,
  Globe,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Toaster } from 'sonner';
import { Logo } from '@/components/Logo';
import { PageTransition } from '@/components/PageTransition';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isChatRoute = location.pathname.includes('/chat');
  const isActiveWorkoutRoute = location.pathname.includes('/workouts/active/');

  const isActive = (path: string) => {
    // Special case for moai - also consider chat routes as part of moai
    if (path === '/moai' && (location.pathname.includes('/moai') || location.pathname.includes('/chat'))) {
      return true;
    }
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
      
      <main className={`flex-grow ${isChatRoute ? 'py-0 mb-14 flex h-[calc(100vh-8rem)]' : 'py-6 mb-14 flex'} w-full overflow-visible`}>
        <div className={`w-full max-w-screen-xl mx-auto ${isChatRoute ? 'px-0 md:px-0 h-full flex' : 'px-4 md:px-6'} overflow-visible`}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-md z-[100]">
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6">
          <nav>
            <ul className="flex justify-evenly items-center h-14">
              <li>
                <Link 
                  to="/client-dashboard/leaderboard" 
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg relative ${
                    isActive('/leaderboard') 
                      ? 'text-client dark:text-blue-300 bg-client/10 dark:bg-blue-900/40' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <LayoutGrid 
                    className="w-6 h-6" 
                    strokeWidth={isActive('/leaderboard') ? 2.5 : 2} 
                  />
                  <span className="text-xs font-medium">Dashboard</span>
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/client-dashboard/workouts" 
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg relative ${
                    isActive('/workouts') 
                      ? 'text-client dark:text-blue-300 bg-client/10 dark:bg-blue-900/40' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <DumbbellIcon 
                    className="w-6 h-6" 
                    strokeWidth={isActive('/workouts') ? 2.5 : 2} 
                  />
                  <span className="text-xs font-medium">Workouts</span>
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/client-dashboard/moai" 
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg relative ${
                    isActive('/moai') 
                      ? 'text-client dark:text-blue-300 bg-client/10 dark:bg-blue-900/40' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Mountain 
                    className="w-6 h-6" 
                    strokeWidth={isActive('/moai') ? 2.5 : 2} 
                  />
                  <span className="text-xs font-medium tracking-tighter whitespace-nowrap">Your Moai</span>
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/client-dashboard/activity-feed" 
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg relative ${
                    isActive('/activity-feed') 
                      ? 'text-client dark:text-blue-300 bg-client/10 dark:bg-blue-900/40' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Globe 
                    className="w-6 h-6" 
                    strokeWidth={isActive('/activity-feed') ? 2.5 : 2} 
                  />
                  <span className="text-xs font-medium">Community</span>
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/client-dashboard/settings" 
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg relative ${
                    isActive('/settings') 
                      ? 'text-client dark:text-blue-300 bg-client/10 dark:bg-blue-900/40' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Settings 
                    className="w-6 h-6" 
                    strokeWidth={isActive('/settings') ? 2.5 : 2} 
                  />
                  <span className="text-xs font-medium">Settings</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
};
