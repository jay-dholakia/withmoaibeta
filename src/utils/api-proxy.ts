
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
    
    const { data, error } = await supabase.functions.invoke('api-proxy', {
      body: {
        url,
        ...options.body ? { body: options.body } : {},
        method: options.method || 'GET',
        headers: options.headers || {},
      },
    });

    if (error) {
      console.error('Supabase API proxy error:', error);
      throw new Error(`Supabase proxy error: ${error.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to proxy request through Supabase:', error);
    
    // More generic error handling without specific Firebase checks
    throw new Error(`API proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
