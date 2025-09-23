import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  try {
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET')
    }

    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('No signature found in request')
    }

    // Get the raw body
    const body = await req.text()

    // Verify the event
    let event: Stripe.Event
    try {
      // Using the async version for proper event verification
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400 }
      )
    }

    // Initialize Supabase client with service role key for auth access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Processing webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        console.log('Processing customer.created:', { 
          customerId: customer.id,
          email: customer.email
        })

        if (customer.email) {
          // First find user ID from auth.users by email
          const { data: users, error: authError } = await supabase.auth.admin.listUsers()
          if (authError) {
            throw authError
          }

          const authUser = users.users.find(u => u.email === customer.email)
          if (!authUser) {
            console.error('No user found with email:', customer.email)
            break
          }

          // Update user with Stripe customer ID
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: customer.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', authUser.id)

          if (updateError) {
            console.error('Error updating user with customer ID:', updateError)
            throw updateError
          }

          console.log('Successfully updated user with customer ID:', {
            userId: authUser.id,
            customerId: customer.id
          })
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Processing checkout.session.completed:', {
          sessionId: session.id,
          customerId: session.customer,
          email: session.customer_email
        })
        
        if (session.customer_email) {
          // First find user ID from auth.users by email
          const { data: users, error: authError } = await supabase.auth.admin.listUsers()
          if (authError) {
            throw authError
          }

          const authUser = users.users.find(u => u.email === session.customer_email)
          if (!authUser) {
            console.error('No user found with email:', session.customer_email)
            break
          }

          // Update user with Stripe customer ID
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString()
            })
            .eq('id', authUser.id)

          if (updateError) {
            console.error('Error updating user with customer ID:', updateError)
            throw updateError
          }

          console.log('Successfully updated user from session:', {
            userId: authUser.id,
            customerId: session.customer
          })

          if (session.mode === 'subscription') {
            // Handle subscription payment
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
            
            // Determine subscription type from price interval
            const subscriptionType = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

            // Update user subscription status
            const { error: statusError } = await supabase
              .from('users')
              .update({
                subscription_status: 'active',
                user_type: 'professional',
                updated_at: new Date().toISOString()
              })
              .eq('id', authUser.id)

            if (statusError) {
              console.error('Error updating user subscription status:', statusError)
              throw statusError
            }

            // Create subscription record
            const { error: subscriptionError } = await supabase
              .from('user_subscriptions')
              .insert([{
                user_id: authUser.id,
                plan_id: session.metadata?.plan_id,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: session.customer as string,
                status: subscription.status,
                subscription_type: subscriptionType,
                current_period_start: new Date(subscription.current_period_start * 1000),
                current_period_end: new Date(subscription.current_period_end * 1000),
                cancel_at_period_end: subscription.cancel_at_period_end
              }])

            if (subscriptionError) {
              console.error('Error creating subscription record:', subscriptionError)
              throw subscriptionError
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Processing subscription update:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        })

        // Get user from subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id) 
          .single()

        if (subscriptionError) {
          console.error('Error finding subscription:', subscriptionError)
          break
        }

        // Determine subscription type from price interval
        const subscriptionType = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

        // Update subscription record
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            subscription_type: subscriptionType,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
          throw updateError
        }

        // If subscription is cancelled at period end, we'll keep the user's access until then
        // The customer.subscription.deleted event will handle the actual cancellation
        if (subscription.cancel_at_period_end) {
          console.log('Subscription will be cancelled at period end:', {
            subscriptionId: subscription.id,
            endDate: new Date(subscription.current_period_end * 1000)
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Processing subscription deletion:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer
        })

        // Get user from subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (subscriptionError) {
          console.error('Error finding subscription:', subscriptionError)
          break
        }

        // Update user's subscription status
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'inactive',
            user_type: 'member', // Downgrade to regular member
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionData.user_id)

        if (userUpdateError) {
          console.error('Error updating user status:', userUpdateError)
          throw userUpdateError
        }

        // Update subscription record
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            subscription_type: null,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error updating subscription record:', updateError)
          throw updateError
        }

        console.log('Successfully processed subscription cancellation:', {
          subscriptionId: subscription.id,
          userId: subscriptionData.user_id
        })
        break
      }

      default: {
        console.log('Unhandled event type:', event.type)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400 }
    )
  }
})