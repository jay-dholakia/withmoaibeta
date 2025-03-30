
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, User } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Logo } from '../components/Logo';
import { PortalCard } from '../components/PortalCard';
import { PageTransition } from '../components/PageTransition';

const Index = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AnimatedBackground />
      
      <PageTransition>
        <header className="w-full py-10 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Logo size="lg" />
          </motion.div>
        </header>
        
        <main className="flex-1 px-4 max-w-screen-lg mx-auto w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-semibold mb-4">Choose your portal</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select the appropriate portal based on your role to access your personalized dashboard.
            </p>
          </motion.div>
          
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          >
            <motion.div variants={item} className="w-full">
              <PortalCard
                title="Admin Portal"
                description="Access administrative tools and manage system-wide settings and users."
                icon={Shield}
                to="/admin"
                variant="admin"
              />
            </motion.div>
            
            <motion.div variants={item} className="w-full">
              <PortalCard
                title="Coach Portal"
                description="Manage your clients, schedule sessions, and access coaching resources."
                icon={Users}
                to="/coach"
                variant="coach"
              />
            </motion.div>
            
            <motion.div variants={item} className="w-full">
              <PortalCard
                title="Member Portal"
                description="View your schedule, access resources, and manage your account settings."
                icon={User}
                to="/client"
                variant="client"
              />
            </motion.div>
          </motion.div>
        </main>
        
        <footer className="py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Moai. All rights reserved.</p>
        </footer>
      </PageTransition>
    </div>
  );
};

export default Index;
