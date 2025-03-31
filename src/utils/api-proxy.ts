
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
        url,  // Include the URL in the body instead of query
        ...options.body ? { body: options.body } : {},
        method: options.method || 'GET',
        headers: options.headers || {},
      },
    });

    if (error) {
      console.error('Error using Supabase API proxy:', error);
      throw new Error(`Supabase proxy error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to proxy request through Supabase:', error);
    throw error;
  }
}
