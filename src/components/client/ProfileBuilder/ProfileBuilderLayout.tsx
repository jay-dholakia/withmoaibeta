import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { PageTransition } from '@/components/PageTransition';
import { Container } from '@/components/ui/container';

interface ProfileBuilderLayoutProps {
  children: ReactNode;
  step: number;
  totalSteps: number;
  title?: string; // Make title optional
}

export const ProfileBuilderLayout: React.FC<ProfileBuilderLayoutProps> = ({
  children,
  step,
  totalSteps,
  title = "Build Your Profile" // Default title
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-background to-background/80">
      <header className="w-full py-6 flex justify-center z-10 mt-10">
        <Container>
          <Logo variant="client" size="md" />
        </Container>
      </header>
      
      <PageTransition>
        <main className="flex-1 flex flex-col items-center justify-center">
          <Container>
            <div className="w-full">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Step {step} of {totalSteps}
                  </h2>
                  <span className="text-sm font-medium text-client">
                    {Math.round((step / totalSteps) * 100)}% Complete
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-client"
                    initial={{ width: `${((step - 1) / totalSteps) * 100}%` }}
                    animate={{ width: `${(step / totalSteps) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-card border rounded-xl shadow-sm p-4 w-full"
              >
                {title && <h1 className="text-2xl font-bold text-client mb-6 text-center">{title}</h1>}
                {children}
              </motion.div>
            </div>
          </Container>
        </main>
      </PageTransition>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <Container>
          <p>© {new Date().getFullYear()} Moai. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  );
};
