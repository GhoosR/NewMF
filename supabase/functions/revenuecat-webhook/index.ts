import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-revenuecat-secret',
}

interface RevenueCatWebhookEvent {
  api_version: string
  event: {
    type: string
    app_user_id: string
    product_id?: string
    purchased_at_ms?: number
    expiration_at_ms?: number
    period_type?: string
    store?: string
    environment?: string
    subscriber_attributes?: Record<string, any>
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('RevenueCat webhook function started')
    
    // Initialize Supabase client with service role key for webhook operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://afvltpqnhmaxanirwnqz.supabase.co'
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service role key available:', serviceRoleKey ? 'Yes' : 'No')
    
    if (!serviceRoleKey) {
      console.error('Missing Supabase service role key')
      return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
    }
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    // Verify RevenueCat webhook secret (optional for testing)
    const webhookSecret = req.headers.get('x-revenuecat-secret')
    const expectedSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
    
    console.log('Webhook secret received:', webhookSecret ? 'Yes' : 'No')
    console.log('Expected secret set:', expectedSecret ? 'Yes' : 'No')
    
    // Skip authentication for testing if no secret is set
    if (expectedSecret && webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret. Provided:', webhookSecret, 'Expected:', expectedSecret)
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
    
    // If no secret is expected, skip validation
    if (!expectedSecret) {
      console.log('No webhook secret configured - skipping validation')
    }
    
    console.log('Webhook authentication successful')

    // Parse the webhook payload
    const webhookEvent: RevenueCatWebhookEvent = await req.json()
    console.log('RevenueCat webhook received:', webhookEvent.event.type)

    const { event } = webhookEvent
    const { app_user_id, product_id, purchased_at_ms, expiration_at_ms, period_type, store, environment, subscriber_attributes } = event

    // Handle different event types
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE':
      case 'RENEWAL':
        console.log('Processing subscription event:', event.type)
        
        // Update user subscription status
        const { error: subscriptionError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: app_user_id,
            product_id: product_id,
            status: 'active',
            current_period_start: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : null,
            current_period_end: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
            revenuecat_user_id: app_user_id,
            revenuecat_product_id: product_id,
            revenuecat_store: store,
            revenuecat_environment: environment,
            revenuecat_attributes: subscriber_attributes,
            updated_at: new Date().toISOString()
          })

        if (subscriptionError) {
          console.error('Error updating subscription:', subscriptionError)
          return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
        }

        // Update user premium status
        const { error: userError } = await supabaseClient
          .from('users')
          .update({
            is_premium: true,
            premium_updated_at: new Date().toISOString()
          })
          .eq('id', app_user_id)

        if (userError) {
          console.error('Error updating user premium status:', userError)
        }

        console.log('Successfully processed subscription event')
        break

      case 'CANCELLATION':
      case 'EXPIRATION':
        console.log('Processing cancellation/expiration event:', event.type)
        
        // Update subscription status to cancelled/expired
        const { error: cancelError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', app_user_id)

        if (cancelError) {
          console.error('Error cancelling subscription:', cancelError)
        }

        // Update user premium status
        const { error: userCancelError } = await supabaseClient
          .from('users')
          .update({
            is_premium: false,
            premium_updated_at: new Date().toISOString()
          })
          .eq('id', app_user_id)

        if (userCancelError) {
          console.error('Error updating user premium status:', userCancelError)
        }

        console.log('Successfully processed cancellation/expiration event')
        break

      case 'TEST':
        console.log('Test webhook received - no action needed')
        break

      default:
        console.log('Unknown event type:', event.type)
    }

    return new Response('OK', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})