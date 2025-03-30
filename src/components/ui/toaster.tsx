
// This is now just a wrapper around the sonner Toaster
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        className: "border border-border",
      }}
    />
  );
}
