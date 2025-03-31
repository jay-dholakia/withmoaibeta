
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
    // Parse request body to get parameters
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const targetUrl = requestData.url;
    
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

    // Get request method, headers, and body from the request data
    const method = requestData.method || "GET";
    const requestHeaders = requestData.headers || {};
    const bodyData = requestData.body;
    
    // Prepare headers for the outgoing request
    const headers = new Headers(requestHeaders);
    
    // Remove host header as it will be set by fetch
    headers.delete("host");
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    // Add body for non-GET requests if provided
    if (method !== "GET" && method !== "HEAD" && bodyData) {
      if (typeof bodyData === 'object') {
        fetchOptions.body = JSON.stringify(bodyData);
      } else {
        fetchOptions.body = bodyData;
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
    console.error("Error in Supabase API proxy:", error);
    
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
