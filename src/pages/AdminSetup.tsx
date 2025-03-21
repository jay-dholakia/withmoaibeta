
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, FormControl, FormField, FormItem, 
  FormLabel, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Form schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SetupFormValues = z.infer<typeof formSchema>;

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(true);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const navigate = useNavigate();
  
  // Form setup
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Check if admin setup is needed
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        // Check if any admin users exist
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_type', 'admin')
          .limit(1);
        
        if (error) throw error;
        
        // If admins exist, redirect to login
        if (data && data.length > 0) {
          setSetupNeeded(false);
          navigate('/admin');
        } else {
          setSetupNeeded(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast.error('Error checking admin status');
      } finally {
        setCheckingSetup(false);
      }
    };
    
    checkAdminExists();
  }, [navigate]);
  
  // Handle form submission
  const onSubmit = async (values: SetupFormValues) => {
    setLoading(true);
    
    try {
      // Create admin user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            user_type: 'admin'
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      if (!signUpData.user) {
        throw new Error('Failed to create admin account');
      }
      
      // Update the user in profiles table to be admin
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: signUpData.user.id,
          user_type: 'admin',
        });
      
      if (profileError) throw profileError;
      
      toast.success('Admin account created successfully! Please log in.');
      navigate('/admin');
      
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(`Setup failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (checkingSetup) {
    return (
      <AuthLayout 
        title="Checking Setup" 
        variant="admin"
      >
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }
  
  if (!setupNeeded) {
    return null; // This will be redirected in the useEffect
  }
  
  return (
    <AuthLayout 
      title="Initial Admin Setup"
      subtitle="Create the first admin account"
      variant="admin"
    >
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 flex items-start">
        <AlertCircle className="w-5 h-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">One-time setup</p>
          <p>This page is only available for initial setup. Once an admin account exists, this page will redirect to the login screen.</p>
        </div>
      </div>
      
      <div className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Admin Account
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
};

export default AdminSetup;
