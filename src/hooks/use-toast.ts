
// This file now re-exports the sonner toast functionality
import { toast as sonnerToast } from "sonner";

// Re-export the functions from sonner
export const toast = sonnerToast;

// Provide a compatibility layer for any code still using the old useToast hook
export function useToast() {
  return {
    toast: sonnerToast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
      } else {
        sonnerToast.dismiss();
      }
    }
  };
}
