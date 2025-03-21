
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Home, Dumbbell, Users, BarChart3, Award, Heart, FileText } from 'lucide-react';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

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
    return location.pathname.includes(path);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-coach">Coach Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
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
          <nav className="container border-t border-border/40">
            <div className="flex overflow-x-auto py-2 gap-1">
              <Link to="/coach-dashboard" className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm rounded-md",
                isActiveRoute("/coach-dashboard") && !isActiveRoute("/coach-dashboard/workouts") ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}>
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/coach-dashboard/workouts" className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm rounded-md",
                isActiveRoute("/coach-dashboard/workouts") ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}>
                <Dumbbell className="h-4 w-4" />
                <span>Workouts</span>
              </Link>
              <Link to="/coach-dashboard/clients" className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm rounded-md",
                isActiveRoute("/coach-dashboard/clients") ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}>
                <Users className="h-4 w-4" />
                <span>Clients</span>
              </Link>
              <Link to="/coach-dashboard/performance" className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm rounded-md",
                isActiveRoute("/coach-dashboard/performance") ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}>
                <BarChart3 className="h-4 w-4" />
                <span>Performance</span>
              </Link>
              <Link to="/coach-dashboard/leaderboards" className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm rounded-md",
                isActiveRoute("/coach-dashboard/leaderboards") ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}>
                <Award className="h-4 w-4" />
                <span>Leaderboards</span>
              </Link>
              <Link to="/coach-dashboard/health" className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm rounded-md",
                isActiveRoute("/coach-dashboard/health") ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}>
                <Heart className="h-4 w-4" />
                <span>Health</span>
              </Link>
              <Link to="/coach-dashboard/profile" className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm rounded-md",
                isActiveRoute("/coach-dashboard/profile") ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}>
                <FileText className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </div>
    </PageTransition>
  );
};
