
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchCoachClients as fetchClientsForCoach,
  ClientData 
} from './coach-clients-service';
import { syncCoachEmailWithGroups as syncEmailWithGroups } from './coach-group-assignment-service';

// Re-export client-related functionality
export const fetchCoachClients = fetchClientsForCoach;

// Re-export the ClientData type
export type { ClientData };

// Re-export group assignment functionality
export const syncCoachEmailWithGroups = syncEmailWithGroups;
