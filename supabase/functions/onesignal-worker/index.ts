import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/javascript',
  'Service-Worker-Allowed': '/'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Return the OneSignal service worker script
  return new Response(
    `importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');`,
    { headers: corsHeaders }
  )
})