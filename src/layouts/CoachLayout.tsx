import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Home, Dumbbell, Users, BarChart3, Award, Heart, FileText, LayoutTemplate, Database, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/lib/hooks';

interface CoachLayoutProps {
  children: React.ReactNode;
}

export const CoachLayout: React.FC<CoachLayoutProps> = ({ children }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || 
           (path !== '/coach-dashboard' && location.pathname.startsWith(path));
  };

  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/coach-dashboard' },
    { icon: <Dumbbell className="w-5 h-5" />, label: 'Programs', path: '/coach-dashboard/workouts' },
    { icon: <LayoutTemplate className="w-5 h-5" />, label: 'Workout Templates', path: '/coach-dashboard/workout-templates' },
    { icon: <Users className="w-5 h-5" />, label: 'Clients', path: '/coach-dashboard/clients' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Client Stats', path: '/coach-dashboard/client-stats' },
    { icon: <Database className="w-5 h-5" />, label: 'Manage Exercises', path: '/coach-dashboard/exercise-management' },
    { icon: <Award className="w-5 h-5" />, label: 'Leaderboards', path: '/coach-dashboard/leaderboards' },
    { icon: <Heart className="w-5 h-5" />, label: 'Health', path: '/coach-dashboard/health' },
    { icon: <FileText className="w-5 h-5" />, label: 'Profile', path: '/coach-profile' },
  ];

  const isMobile = useIsMobile();

  const NavigationItems = () => (
    <div className={`flex ${isMobile ? 'flex-col' : 'overflow-x-auto'} gap-2`}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap
            ${isActiveRoute(item.path) ? 
              'bg-accent text-accent-foreground font-medium' : 
              'hover:bg-accent/50'
            }
          `}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6">
            <div className="flex h-16 items-center justify-between">
              <Link to="/coach-dashboard" className="font-bold text-xl text-coach hover:opacity-80 transition-opacity">
                Coach Portal
              </Link>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground hidden md:inline-block">
                    {user?.email}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut} 
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="bg-muted/20">
          <nav className="w-full max-w-screen-xl mx-auto px-4 md:px-6">
            {isMobile ? (
              <div className="py-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Menu className="h-4 w-4" />
                        Navigation Menu
                      </span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="top" className="w-full pt-10">
                    <NavigationItems />
                  </SheetContent>
                </Sheet>
              </div>
            ) : (
              <div className="py-4">
                <NavigationItems />
              </div>
            )}
          </nav>
        </div>
        
        <main className="w-full max-w-screen-xl mx-auto px-4 md:px-6 py-6">
          {children}
        </main>
        
        <footer className="py-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Moai. All rights reserved.</p>
        </footer>
      </div>
    </PageTransition>
  );
};
