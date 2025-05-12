
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface AdminToolsContextType {
  showAdminTools: boolean;
  toggleAdminTools: () => void;
  isAdmin: boolean;
}

const AdminToolsContext = createContext<AdminToolsContextType | undefined>(undefined);

export const AdminToolsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useIsAdmin();
  const [showAdminTools, setShowAdminTools] = useState<boolean>(false);

  // Initialize admin tools visibility based on URL
  useEffect(() => {
    if (isAdmin && window.location.pathname.includes('/admin-tools')) {
      setShowAdminTools(true);
    }
  }, [isAdmin]);

  // Setup keyboard shortcut (Shift + A)
  useEffect(() => {
    if (!isAdmin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'A' && e.shiftKey) {
        setShowAdminTools(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  const toggleAdminTools = () => {
    if (isAdmin) {
      setShowAdminTools(prev => !prev);
    }
  };

  return (
    <AdminToolsContext.Provider value={{ showAdminTools, toggleAdminTools, isAdmin }}>
      {children}
    </AdminToolsContext.Provider>
  );
};

export const useAdminTools = () => {
  const context = useContext(AdminToolsContext);
  if (context === undefined) {
    throw new Error('useAdminTools must be used within an AdminToolsProvider');
  }
  return context;
};
