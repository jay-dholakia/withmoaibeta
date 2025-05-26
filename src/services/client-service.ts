
// This file is now just re-exporting from the refactored modules
// to maintain backward compatibility while we transition to the new structure.

export * from "./clients";

// Provide a deprecation notice in the console when importing from this file
console.warn(
  "Deprecation Notice: Importing from src/services/client-service.ts is deprecated. " +
  "Please import from the appropriate module in src/services/clients/ instead."
);
