import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Image, Loader2, Upload, User } from 'lucide-react';
import { ClientProfile, uploadClientAvatar } from '@/services/client-service';
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  
  // Parse and set birthday from profile data
  useEffect(() => {
    if (profile.birthday) {
      const date = new Date(profile.birthday);
      setBirthMonth((date.getMonth() + 1).toString());
      setBirthDay(date.getDate().toString());
      setBirthYear(date.getFullYear().toString());
    }
  }, [profile.birthday]);
  
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [weight, setWeight] = useState(profile.weight?.replace(/[^0-9.]/g, '') || '');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>(
    profile.weight?.toLowerCase().includes('kg') ? 'kg' : 'lbs'
  );
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  
  const [focusStates, setFocusStates] = useState({
    firstName: !!firstName,
    lastName: !!lastName,
    city: !!city,
    state: !!state
  });

  // Parse and set height from profile data
  useEffect(() => {
    if (profile.height) {
      const heightMatch = profile.height.match(/(\d+)'(\d+)"/);
      if (heightMatch) {
        setFeet(heightMatch[1]);
        setInches(heightMatch[2]);
      }
    }
  }, [profile.height]);

  // Update focus states when profile data changes
  useEffect(() => {
    setFirstName(profile.first_name || '');
    setLastName(profile.last_name || '');
    setCity(profile.city || '');
    setState(profile.state || '');
    setAvatarUrl(profile.avatar_url || '');
    
    if (profile.weight) {
      setWeight(profile.weight.replace(/[^0-9.]/g, '') || '');
      setWeightUnit(profile.weight.toLowerCase().includes('kg') ? 'kg' : 'lbs');
    }
    
    setFocusStates({
      firstName: !!profile.first_name,
      lastName: !!profile.last_name,
      city: !!profile.city,
      state: !!profile.state
    });
  }, [profile]);

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

  // Generate arrays for the dropdown options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
  }));
  
  const days = Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }));
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => ({
    value: (currentYear - 99 + i).toString(),
    label: (currentYear - 99 + i).toString()
  }));

  const isValidBirthday = (): boolean => {
    if (!birthMonth || !birthDay || !birthYear) return false;
    
    const month = parseInt(birthMonth, 10);
    const day = parseInt(birthDay, 10);
    const year = parseInt(birthYear, 10);
    
    if (isNaN(month) || isNaN(day) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) return false;
    if (month === 2) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      if (day > (isLeapYear ? 29 : 28)) return false;
    }
    
    const birthDate = new Date(year, month - 1, day);
    return birthDate <= new Date();
  };

  const handleNext = () => {
    let birthdayString: string | null = null;
    if (isValidBirthday()) {
      const birthDate = new Date(
        parseInt(birthYear),
        parseInt(birthMonth) - 1,
        parseInt(birthDay)
      );
      birthdayString = birthDate.toISOString();
    }
    
    const formattedHeight = feet && inches ? `${feet}'${inches}"` : '';
    const formattedWeight = weight ? `${weight} ${weightUnit}` : '';

    onUpdate({
      first_name: firstName,
      last_name: lastName,
      city,
      state,
      birthday: birthdayString,
      height: formattedHeight,
      weight: formattedWeight,
      favorite_movements: profile.favorite_movements || []
    });
    onNext();
  };

  const handleFocus = (field: keyof typeof focusStates) => {
    setFocusStates(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof typeof focusStates, value: string) => {
    setFocusStates(prev => ({ ...prev, [field]: value.length > 0 }));
  };

  const isFormValid = firstName && lastName && city && state && 
                      isValidBirthday() && feet && inches && weight;

  return (
    <div className="space-y-6 text-left">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-black mb-2">Let's Get to Know You</h1>
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
            onFocus={() => handleFocus('firstName')}
            onBlur={() => handleBlur('firstName', firstName)}
            className={`h-14 ${focusStates.firstName ? 'pt-7 pb-2' : 'py-4'}`}
          />
          <span 
            className={`absolute left-3 pointer-events-none transition-all duration-200 ${
              focusStates.firstName 
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
            onFocus={() => handleFocus('lastName')}
            onBlur={() => handleBlur('lastName', lastName)}
            className={`h-14 ${focusStates.lastName ? 'pt-7 pb-2' : 'py-4'}`}
          />
          <span 
            className={`absolute left-3 pointer-events-none transition-all duration-200 ${
              focusStates.lastName 
                ? 'top-2 text-xs text-muted-foreground' 
                : 'top-1/2 -translate-y-1/2 text-muted-foreground'
            }`}
          >
            Last Name
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Input 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={() => handleFocus('city')}
            onBlur={() => handleBlur('city', city)}
            className={`h-14 ${focusStates.city ? 'pt-7 pb-2' : 'py-4'}`}
          />
          <span 
            className={`absolute left-3 pointer-events-none transition-all duration-200 ${
              focusStates.city 
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
            onFocus={() => handleFocus('state')}
            onBlur={() => handleBlur('state', state)}
            className={`h-14 ${focusStates.state ? 'pt-7 pb-2' : 'py-4'}`}
          />
          <span 
            className={`absolute left-3 pointer-events-none transition-all duration-200 ${
              focusStates.state 
                ? 'top-2 text-xs text-muted-foreground' 
                : 'top-1/2 -translate-y-1/2 text-muted-foreground'
            }`}
          >
            State
          </span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Birthdate</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Select
              value={birthMonth}
              onValueChange={setBirthMonth}
            >
              <SelectTrigger className="h-14">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={birthDay}
              onValueChange={setBirthDay}
            >
              <SelectTrigger className="h-14">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {days.map(day => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={birthYear}
              onValueChange={setBirthYear}
            >
              <SelectTrigger className="h-14">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Height</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Input 
              type="number" 
              value={feet}
              onChange={e => setFeet(e.target.value)}
              min="1"
              max="8"
              className="h-14 pr-8 text-right"
              placeholder="ft"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">ft</span>
          </div>
          <div className="relative">
            <Input 
              type="number" 
              value={inches}
              onChange={e => setInches(e.target.value)}
              min="0"
              max="11"
              className="h-14 pr-8 text-right"
              placeholder="in"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">in</span>
          </div>
        </div>
      </div>
        
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Weight</h3>
        <div className="flex gap-2">
          <Input 
            type="number" 
            placeholder="Weight"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="flex-1 h-14"
          />
          <Select 
            value={weightUnit} 
            onValueChange={(value: 'lbs' | 'kg') => setWeightUnit(value)}
          >
            <SelectTrigger className="w-24 h-14">
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
