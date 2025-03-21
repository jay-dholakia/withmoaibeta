
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

interface CoachLayoutProps {
  children: React.ReactNode;
}

export const CoachLayout: React.FC<CoachLayoutProps> = ({ children }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
        </header>
        <main>{children}</main>
      </div>
    </PageTransition>
  );
};
