import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const geminiApiKey = Deno.env.get('GEMINI_API_KEY')?.trim() 
const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Security Verification
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Invalid auth token.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Parse the request
    const { message, context } = await req.json()

    // 2. Call the LLM (Gemini 1.5 Flash - Standard and Fast)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { 
            role: 'user', 
            parts: [{ 
              text: `System Directive: You are Smart Advisor, a strict, data-driven financial coach for college students. Provide actionable, constraint-based advice. \n\nContext: ${JSON.stringify(context)}\n\nUser Query: ${message}` 
            }] 
          }
        ],
        generationConfig: {
          maxOutputTokens: 4000,
        }
      }),
    })

    const llmData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      throw new Error(llmData.error?.message || 'Failed to fetch from Gemini API')
    }

    // Parse the response
    const advisorText = llmData.candidates[0].content.parts[0].text;

    // Return the response to React
    return new Response(
      JSON.stringify({ reply: advisorText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})