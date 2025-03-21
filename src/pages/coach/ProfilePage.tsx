
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCoachProfile, updateCoachProfile, uploadCoachAvatar, CoachProfile } from '@/services/client-service';
import { User, Camera, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// List of movement options with emojis
const MOVEMENT_OPTIONS = [
  "🏃 Running",
  "🚴 Cycling",
  "🏋️ Weightlifting",
  "🧘 Yoga",
  "🏊 Swimming",
  "🧗 Climbing",
  "🏄 Surfing",
  "🤸 Gymnastics",
  "🥊 Boxing",
  "🏐 Volleyball",
  "🏀 Basketball",
  "⚽ Soccer",
  "🎾 Tennis",
  "🏓 Table Tennis",
  "🏈 Football",
  "⛸️ Ice Skating",
  "🏂 Snowboarding",
  "⛷️ Skiing",
  "🚣 Rowing",
  "🚶 Walking",
  "💃 Dancing",
  "🤺 Fencing",
  "🥋 Martial Arts",
  "🧠 Meditation",
  "🚣 Kayaking",
  "🧨 HIIT",
  "🏇 Horseback Riding",
  "🛹 Skateboarding",
  "🧬 Pilates",
  "🤾 Handball"
];

interface ProfileFormValues {
  bio: string;
  favorite_movements: string[];
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      bio: '',
      favorite_movements: []
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const profileData = await fetchCoachProfile(user.id);
        setProfile(profileData);
        
        if (profileData) {
          form.reset({
            bio: profileData.bio || '',
            favorite_movements: profileData.favorite_movements || []
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, form]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const publicUrl = await uploadCoachAvatar(user.id, file);
      
      // Update profile with new avatar URL
      const updatedProfile = await updateCoachProfile(user.id, {
        avatar_url: publicUrl
      });
      
      setProfile(updatedProfile);
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    try {
      setSaving(true);
      const updatedProfile = await updateCoachProfile(user.id, {
        bio: values.bio,
        favorite_movements: values.favorite_movements
      });
      
      setProfile(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleMovement = (movement: string) => {
    const currentMovements = form.getValues('favorite_movements') || [];
    
    if (currentMovements.includes(movement)) {
      const updatedMovements = currentMovements.filter(m => m !== movement);
      form.setValue('favorite_movements', updatedMovements);
    } else {
      form.setValue('favorite_movements', [...currentMovements, movement]);
    }
  };

  // Get the first name and last initial for the avatar fallback
  const getInitials = () => {
    if (!user?.email) return 'C';
    const name = user.email.split('@')[0];
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <CoachLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="container mx-auto max-w-4xl py-6">
        <h1 className="text-3xl font-bold mb-6">Coach Profile</h1>
        
        <div className="grid gap-6">
          {/* Profile Photo Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>Upload a profile photo that your clients will see</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div 
                className="relative cursor-pointer group" 
                onClick={handleAvatarClick}
              >
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              <Button 
                variant="outline" 
                onClick={handleAvatarClick}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : 'Change Photo'}
              </Button>
            </CardContent>
          </Card>
          
          {/* Profile Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Coach Bio</CardTitle>
              <CardDescription>Tell your clients about yourself and your coaching philosophy</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your coaching experience, philosophy, and qualifications (max 300 words)"
                            className="min-h-[150px]"
                            maxLength={1500} // ~300 words
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your bio will be visible to your clients
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="favorite_movements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favorite Ways to Move</FormLabel>
                        <FormDescription>
                          Select your favorite types of movement
                        </FormDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {MOVEMENT_OPTIONS.map((movement) => {
                            const isSelected = field.value?.includes(movement);
                            return (
                              <Badge
                                key={movement}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer text-sm ${isSelected ? 'bg-primary' : ''}`}
                                onClick={() => toggleMovement(movement)}
                              >
                                {movement}
                              </Badge>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Profile'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </CoachLayout>
  );
};

export default ProfilePage;
