
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Image, Loader2, Upload, User } from 'lucide-react';
import { ClientProfile, uploadClientAvatar } from '@/services/client-service';

interface ProfileBuilderStepOneProps {
  profile: Partial<ClientProfile>;
  onUpdate: (data: Partial<ClientProfile>) => void;
  onNext: () => void;
}

export const ProfileBuilderStepOne: React.FC<ProfileBuilderStepOneProps> = ({
  profile,
  onUpdate,
  onNext
}) => {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(profile.first_name || '');
  const [lastName, setLastName] = useState(profile.last_name || '');
  const [city, setCity] = useState(profile.city || '');
  const [state, setState] = useState(profile.state || '');
  const [birthday, setBirthday] = useState(profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : '');
  const [height, setHeight] = useState(profile.height || '');
  const [weight, setWeight] = useState(profile.weight || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    if (!file.type.includes('image')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const url = await uploadClientAvatar(profile.id as string, file);
      setAvatarUrl(url);
      onUpdate({ avatar_url: url });
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    // Save current data
    onUpdate({
      first_name: firstName,
      last_name: lastName,
      city,
      state,
      birthday: birthday ? new Date(birthday).toISOString() : null,
      height,
      weight
    });
    onNext();
  };

  const isFormValid = firstName && lastName && city && state && birthday && height && weight;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-client mb-2">Let's Get to Know You</h1>
        <p className="text-muted-foreground">Tell us a bit about yourself to help us personalize your experience</p>
      </div>

      <div className="flex flex-col items-center mb-6">
        <Avatar className="w-24 h-24 mb-4 border-2 border-client">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="Profile" />
          ) : (
            <AvatarFallback className="bg-muted">
              <User className="h-12 w-12 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <label htmlFor="avatar-upload" className="cursor-pointer">
          <div className="flex items-center gap-2 text-sm font-medium text-client hover:underline">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload profile picture</span>
              </>
            )}
          </div>
          <input 
            id="avatar-upload" 
            type="file" 
            accept="image/*" 
            className="sr-only" 
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
            placeholder="Your first name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
            placeholder="Your last name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input 
            id="city" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            placeholder="Your city"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input 
            id="state" 
            value={state} 
            onChange={(e) => setState(e.target.value)} 
            placeholder="Your state"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthday">Birthday</Label>
        <Input 
          id="birthday" 
          type="date" 
          value={birthday} 
          onChange={(e) => setBirthday(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="height">Height</Label>
          <Input 
            id="height" 
            value={height} 
            onChange={(e) => setHeight(e.target.value)} 
            placeholder="e.g. 5'10\""
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <Input 
            id="weight" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
            placeholder="e.g. 170 lbs"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          onClick={handleNext} 
          disabled={!isFormValid}
          className="bg-client hover:bg-client/90"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
