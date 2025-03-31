
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers to allow requests from any origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request URL and body
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");
    
    // Ensure a target URL is provided
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: "Missing target URL parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get request method, headers, and body
    const method = req.method;
    const headers = new Headers(req.headers);
    
    // Remove host header as it will be set by fetch
    headers.delete("host");
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    // Add body for non-GET requests
    if (method !== "GET" && method !== "HEAD") {
      const contentType = req.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const json = await req.json();
        fetchOptions.body = JSON.stringify(json);
      } else {
        fetchOptions.body = await req.text();
      }
    }
    
    console.log(`Proxying ${method} request to: ${targetUrl}`);

    // Forward the request to the target URL
    const response = await fetch(targetUrl, fetchOptions);
    
    // Get response data
    const responseData = await response.text();
    const responseHeaders = new Headers(response.headers);
    
    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
    
    // Return the response with CORS headers
    return new Response(responseData, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error in API proxy:", error);
    
    // Return error response with CORS headers
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred during the request" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
