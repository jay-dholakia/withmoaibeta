
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'autoSave'> {
  autoSave?: boolean;
  storageKey?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoSave, storageKey, onChange, defaultValue, value, ...props }, ref) => {
    const [savedValue, setSavedValue] = React.useState<string | undefined>(
      typeof defaultValue === 'string' ? defaultValue : 
      typeof value === 'string' ? value : 
      ''
    );
    
    // Load saved value from localStorage on mount if storageKey is provided
    React.useEffect(() => {
      if (autoSave && storageKey) {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          setSavedValue(savedData);
        }
      }
    }, [autoSave, storageKey]);
    
    // Handle changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      }
      
      if (autoSave && storageKey) {
        setSavedValue(e.target.value);
        
        // Debounced save to localStorage
        const timeoutId = setTimeout(() => {
          localStorage.setItem(storageKey, e.target.value);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    };
    
    // If using autoSave, we need to control the component
    const textareaValue = autoSave ? savedValue : value;
    
    return (
      <textarea
        className={cn(
          "flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={textareaValue}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
