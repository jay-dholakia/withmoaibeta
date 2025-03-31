
import { supabase } from '@/integrations/supabase/client';

/**
 * Makes a request through the Supabase API proxy to avoid CORS issues
 * @param url The target URL to request
 * @param options Fetch options for the request
 * @returns The response from the proxied request
 */
export async function proxyFetch(url: string, options: RequestInit = {}) {
  try {
    console.log(`Sending proxy request to: ${url}`);
    
    // Ensure we're using Supabase's functions.invoke() method correctly
    const { data, error } = await supabase.functions.invoke('api-proxy', {
      body: {
        url,  // Include the URL in the body instead of query
        ...options.body ? { body: options.body } : {},
        method: options.method || 'GET',
        headers: options.headers || {},
      },
    });

    if (error) {
      console.error('Supabase API proxy error:', error);
      // Ensure error handling is Supabase-specific
      throw new Error(`Supabase proxy error: ${error.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    // Make sure error handling doesn't reference Firebase
    console.error('Failed to proxy request through Supabase:', error);
    
    // Check if the error is related to Firebase somehow
    if (error instanceof Error && error.name === 'FirebaseError') {
      console.error('Detected Firebase-related error in Supabase code!', error);
      throw new Error('This application uses Supabase, not Firebase. Please check your configuration.');
    }
    
    throw error;
  }
}
