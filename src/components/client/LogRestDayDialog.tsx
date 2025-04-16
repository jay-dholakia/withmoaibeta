import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Armchair } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RestLog, logRestDay } from "@/services/activity-logging-service";

interface LogRestDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const LogRestDayDialog: React.FC<LogRestDayDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    const restData: RestLog = {
      log_date: date,
      notes
    };

    try {
      const result = await logRestDay(restData);

      if (result) {
        resetForm();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDate(new Date());
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <Armchair className="h-5 w-5" />
            <span>Log Rest Day</span>
          </DialogTitle>
          <DialogDescription>
            Record your rest day and any notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap

