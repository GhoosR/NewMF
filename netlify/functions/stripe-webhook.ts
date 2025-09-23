import { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  const SUPABASE_FUNCTION_URL = 'https://afvltpqnhmaxanirwnqz.supabase.co/functions/v1/stripe-webhook'
  
  try {
    // Forward the request to Supabase
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': event.headers['stripe-signature'] || '',
      },
      body: event.body
    })

    const data = await response.json()

    return {
      statusCode: response.status,
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Error forwarding webhook:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process webhook' })
    }
  }
}