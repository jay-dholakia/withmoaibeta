
import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Mail, UserPlus, LogOut, 
  BarChart, Settings, ChevronDown, 
  UserSquare, CircleDashed
} from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminDashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ 
  children, 
  title 
}) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/admin-dashboard',
      icon: <BarChart className="w-5 h-5" />,
      exact: true
    },
    {
      name: 'Invitations',
      path: '/admin-dashboard/invitations',
      icon: <Mail className="w-5 h-5" />,
    },
    {
      name: 'Groups',
      path: '/admin-dashboard/groups',
      icon: <UserSquare className="w-5 h-5" />,
    },
    {
      name: 'Clients',
      path: '/admin-dashboard/clients',
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: 'Coaches',
      path: '/admin-dashboard/coaches',
      icon: <UserPlus className="w-5 h-5" />,
    },
  ];
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Helper function to check if a navigation item is active
  const isNavItemActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card hidden md:flex md:flex-col">
        <div className="p-4 border-b">
          <Logo variant="admin" />
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isNavItemActive(item)
                  ? 'bg-admin/10 text-admin' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background border-b p-4 flex justify-between items-center">
        <Logo variant="admin" size="sm" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Menu <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {navItems.map((item) => (
              <DropdownMenuItem key={item.path} asChild>
                <Link 
                  to={item.path} 
                  className={`flex items-center w-full ${isNavItemActive(item) ? 'text-admin font-medium' : ''}`}
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <PageTransition>
          <main className="flex-1 p-6 md:p-8 pt-20 md:pt-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            </header>
            
            {children}
          </main>
        </PageTransition>
      </div>
    </div>
  );
};
