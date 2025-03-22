
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Image, Loader2, Upload, User, CalendarIcon } from 'lucide-react';
import { ClientProfile, uploadClientAvatar } from '@/services/client-service';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [birthdayDate, setBirthdayDate] = useState<Date | undefined>(
    profile.birthday ? new Date(profile.birthday) : undefined
  );
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [weight, setWeight] = useState(profile.weight?.replace(/[^0-9.]/g, '') || '');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>(
    profile.weight?.toLowerCase().includes('kg') ? 'kg' : 'lbs'
  );
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(!!firstName);
  const [lastNameFocused, setLastNameFocused] = useState(!!lastName);
  const [cityFocused, setCityFocused] = useState(!!city);
  const [stateFocused, setStateFocused] = useState(!!state);

  // Parse existing height on component mount
  React.useEffect(() => {
    if (profile.height) {
      const heightMatch = profile.height.match(/(\d+)'(\d+)"/);
      if (heightMatch) {
        setFeet(heightMatch[1]);
        setInches(heightMatch[2]);
      }
    }
  }, [profile.height]);

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
    // Format height and weight with units
    const formattedHeight = feet && inches ? `${feet}'${inches}"` : '';
    const formattedWeight = weight ? `${weight} ${weightUnit}` : '';

    // Save current data
    onUpdate({
      first_name: firstName,
      last_name: lastName,
      city,
      state,
      birthday: birthdayDate ? birthdayDate.toISOString() : null,
      height: formattedHeight,
      weight: formattedWeight
    });
    onNext();
  };

  const isFormValid = firstName && lastName && city && state && birthdayDate && feet && inches && weight;

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
        <div className="relative">
          <Input 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onFocus={() => setFirstNameFocused(true)}
            onBlur={() => setFirstNameFocused(firstName.length > 0)}
            placeholder="First Name"
            className="h-12 pl-3 pt-6"
          />
          <span 
            className={`absolute left-3 transition-all duration-200 pointer-events-none ${
              firstNameFocused 
                ? 'top-2 text-xs text-muted-foreground' 
                : 'top-1/2 -translate-y-1/2 text-muted-foreground'
            }`}
          >
            First Name
          </span>
        </div>
        
        <div className="relative">
          <Input 
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onFocus={() => setLastNameFocused(true)}
            onBlur={() => setLastNameFocused(lastName.length > 0)}
            placeholder="Last Name"
            className="h-12 pl-3 pt-6"
          />
          <span 
            className={`absolute left-3 transition-all duration-200 pointer-events-none ${
              lastNameFocused 
                ? 'top-2 text-xs text-muted-foreground' 
                : 'top-1/2 -translate-y-1/2 text-muted-foreground'
            }`}
          >
            Last Name
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="relative">
          <Input 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={() => setCityFocused(true)}
            onBlur={() => setCityFocused(city.length > 0)}
            placeholder="City"
            className="h-12 pl-3 pt-6"
          />
          <span 
            className={`absolute left-3 transition-all duration-200 pointer-events-none ${
              cityFocused 
                ? 'top-2 text-xs text-muted-foreground' 
                : 'top-1/2 -translate-y-1/2 text-muted-foreground'
            }`}
          >
            City
          </span>
        </div>
        
        <div className="relative">
          <Input 
            value={state}
            onChange={(e) => setState(e.target.value)}
            onFocus={() => setStateFocused(true)}
            onBlur={() => setStateFocused(state.length > 0)}
            placeholder="State"
            className="h-12 pl-3 pt-6"
          />
          <span 
            className={`absolute left-3 transition-all duration-200 pointer-events-none ${
              stateFocused 
                ? 'top-2 text-xs text-muted-foreground' 
                : 'top-1/2 -translate-y-1/2 text-muted-foreground'
            }`}
          >
            State
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground mb-1">Birthday</div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !birthdayDate && "text-muted-foreground"
              )}
            >
              {birthdayDate ? (
                format(birthdayDate, "MMMM d, yyyy")
              ) : (
                <span>Select your birthday</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={birthdayDate}
              onSelect={setBirthdayDate}
              disabled={(date) => date > new Date()}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-1">Height</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Input 
              type="number" 
              placeholder="Feet"
              value={feet}
              onChange={e => setFeet(e.target.value)}
              min="1"
              max="8"
              className="text-center"
            />
            <span className="ml-2 text-sm">ft</span>
          </div>
          
          <div className="flex items-center">
            <Input 
              type="number" 
              placeholder="Inches"
              value={inches}
              onChange={e => setInches(e.target.value)}
              min="0"
              max="11"
              className="text-center"
            />
            <span className="ml-2 text-sm">in</span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-1">Weight</div>
        <div className="flex gap-2">
          <Input 
            type="number" 
            placeholder="Weight"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="flex-1"
          />
          <Select 
            value={weightUnit} 
            onValueChange={(value: 'lbs' | 'kg') => setWeightUnit(value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lbs">lbs</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
            </SelectContent>
          </Select>
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
