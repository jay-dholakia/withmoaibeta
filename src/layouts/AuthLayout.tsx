
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Logo } from '../components/Logo';
import { PageTransition } from '../components/PageTransition';

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: 'admin' | 'coach' | 'client' | 'default';
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  variant = 'default',
  title,
  subtitle
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <AnimatedBackground variant={variant} />
      
      <header className="w-full py-6 px-6 flex justify-between items-center z-10">
        <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} className="mr-2" />
          <span className="text-sm font-medium">Back to Portals</span>
        </Link>
        
        <Logo variant={variant} size="sm" />
      </header>
      
      <PageTransition>
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md mb-8 text-center">
            <h1 className="text-3xl font-semibold mb-2">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          {children}
        </main>
      </PageTransition>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Portal System. All rights reserved.</p>
      </footer>
    </div>
  );
};
