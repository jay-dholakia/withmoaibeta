import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { trackWorkoutSet, fetchPersonalRecords } from '@/services/client-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, ChevronRight, ArrowLeft, AlertCircle, MapPin, Save, HelpCircle, Info, Youtube, Clock, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { saveWorkoutDraft, getWorkoutDraft, deleteWorkoutDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import { PersonalRecord } from '@/types/workout';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { VideoPlayer } from '@/components/client/VideoPlayer';
import Stopwatch from './Stopwatch';

const ActiveWorkout = () => {
  // ... (rest of the component remains the same)

  const handleSetChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseStates((prev) => {
      if (!prev[exerciseId]) {
        return prev;
      }

      const updatedSets = prev[exerciseId].sets.map((set, idx) => {
        if (idx === setIndex) {
          const updatedSet = { ...set, [field]: value };
          if (field === 'weight' && value.trim() !== '') {
            updatedSet.completed = true;
          }
          return updatedSet;
        }
        return set;
      });

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          sets: updatedSets,
        },
      };
    });

    if (field === 'weight' && value.trim() !== '') {
      const setNumber = setIndex + 1;
      setPendingSets(prev => {
        const currentSet = exerciseStates[exerciseId].sets[setIndex];
        const filtered = prev.filter(s => !(s.exerciseId === exerciseId && s.setNumber === setNumber));
        return [...filtered, {
          exerciseId,
          setNumber,
          weight: value,
          reps: currentSet.reps
        }];
      });
    }
  };

  // ... (rest of the component remains the same)
};
