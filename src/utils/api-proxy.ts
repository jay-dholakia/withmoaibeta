
import { supabase } from '@/integrations/supabase/client';

/**
 * Makes a request through the Supabase API proxy to avoid CORS issues
 * @param url The target URL to request
 * @param options Fetch options for the request
 * @returns The response from the proxied request
 */
export async function proxyFetch(url: string, options: RequestInit = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('api-proxy', {
      body: {
        ...options.body ? { body: options.body } : {},
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      query: { url },
    });

    if (error) {
      console.error('Error using API proxy:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Failed to proxy request:', error);
    throw error;
  }
}
