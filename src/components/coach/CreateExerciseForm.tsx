import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { createExercise } from '@/services/workout-service';
import { supabase } from '@/integrations/supabase/client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Exercise name must be at least 2 characters.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  description: z.string().optional(),
  exercise_type: z.string().default('strength'),
  log_type: z.string().default('weight_reps'),
});

type FormValues = z.infer<typeof formSchema>;

type CreateExerciseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExerciseCreated?: (exercise: any) => void;
};

const EXERCISE_CATEGORIES = [
  'Abs',
  'Back',
  'Biceps',
  'Cardio',
  'Chest',
  'Core',
  'Full Body',
  'Legs',
  'Shoulders',
  'Triceps',
  'Upper Body',
  'Lower Body',
  'Olympic',
  'Plyometrics',
  'Other'
];

const EXERCISE_TYPES = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'sport', label: 'Sport-Specific' }
];

const LOG_TYPES = [
  { value: 'weight_reps', label: 'Weight & Reps' },
  { value: 'time', label: 'Time' },
  { value: 'distance', label: 'Distance' },
  { value: 'bodyweight', label: 'Bodyweight Only' }
];

export const CreateExerciseForm = ({ 
  open, 
  onOpenChange, 
  onExerciseCreated 
}: CreateExerciseFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [uploadingGif, setUploadingGif] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      exercise_type: 'strength',
      log_type: 'weight_reps'
    },
  });

  const handleGifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Only accept gif files
    if (!file.type.includes('gif')) {
      toast.error('Please upload a GIF file');
      return;
    }
    
    setGifFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadGif = async (exerciseId: string): Promise<string | null> => {
    if (!gifFile) return null;
    
    try {
      setUploadingGif(true);
      const filename = `${exerciseId}_${Date.now()}.gif`;
      
      const { data, error } = await supabase.storage
        .from('exercise-gifs')
        .upload(filename, gifFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading GIF:', error);
        toast.error('Failed to upload exercise demonstration GIF');
        return null;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('exercise-gifs')
        .getPublicUrl(filename);
      
      return publicUrl;
    } catch (error) {
      console.error('Unexpected error uploading GIF:', error);
      toast.error('An error occurred while uploading the GIF');
      return null;
    } finally {
      setUploadingGif(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Create the exercise without the gif_url first
      const result = await createExercise({
        name: data.name,
        category: data.category,
        description: data.description || null,
        exercise_type: data.exercise_type,
        log_type: data.log_type
      });
      
      if (result.error) {
        toast.error('Failed to create exercise');
        console.error('Error creating exercise:', result.error);
        return;
      }
      
      if (result.isDuplicate) {
        toast.warning(`Exercise "${data.name}" already exists!`);
        if (onExerciseCreated && result.exercise) {
          onExerciseCreated(result.exercise);
        }
      } else if (result.exercise) {
        // If we have a GIF, upload it and update the exercise
        if (gifFile && result.exercise.id) {
          const gifUrl = await uploadGif(result.exercise.id);
          
          if (gifUrl) {
            // Update the exercise with the GIF URL using Supabase directly
            const { error: updateError } = await supabase
              .from('exercises')
              .update({ gif_url: gifUrl })
              .eq('id', result.exercise.id);
            
            if (updateError) {
              console.error('Error updating exercise with GIF URL:', updateError);
            } else {
              // Update the local exercise object with the gif_url
              result.exercise.gif_url = gifUrl;
            }
          }
        }
        
        toast.success(`Exercise "${data.name}" created successfully!`);
        if (onExerciseCreated) {
          onExerciseCreated(result.exercise);
        }
        form.reset();
        setGifFile(null);
        setPreviewUrl(null);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error submitting exercise:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise to the database. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Bench Press" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXERCISE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Exercise description" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="exercise_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXERCISE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="log_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logging Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How to log it" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOG_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* GIF Upload Section */}
            <div className="space-y-2">
              <FormLabel>Exercise Demonstration GIF</FormLabel>
              <div className="flex items-center gap-2">
                <Input 
                  type="file" 
                  accept=".gif" 
                  id="gif-upload"
                  className="hidden"
                  onChange={handleGifChange}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  asChild
                  className="w-full"
                >
                  <label htmlFor="gif-upload" className="flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>{gifFile ? 'Change GIF' : 'Upload GIF'}</span>
                  </label>
                </Button>
              </div>
              
              {/* Preview the GIF if selected */}
              {previewUrl && (
                <div className="mt-2 border rounded-md p-2 relative">
                  <div className="aspect-video flex items-center justify-center bg-muted/30 rounded">
                    <img 
                      src={previewUrl} 
                      alt="Exercise preview" 
                      className="max-h-[200px] object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full bg-background/80"
                    onClick={() => {
                      setGifFile(null); 
                      setPreviewUrl(null);
                    }}
                  >
                    ×
                  </Button>
                </div>
              )}
              
              {!previewUrl && (
                <div className="border border-dashed rounded-md p-8 flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <p className="text-sm text-center">
                    Upload a GIF that demonstrates proper exercise form
                  </p>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                The GIF will be shown to clients to help them understand proper form
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || uploadingGif}>
                {(isSubmitting || uploadingGif) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadingGif ? 'Uploading GIF...' : 'Creating...'}
                  </>
                ) : (
                  'Create Exercise'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
