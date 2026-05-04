import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables configured in Supabase
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

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
    // 1. Security Verification: Initialize Supabase client with the user's Auth Header
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user token is valid
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Invalid auth token.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Parse the request payload
    const { userPrompt, financialContext } = await req.json()

    // 2. Edge Function Dev: Call the LLM (Gemini) securely
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`
    
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
              text: `System Directive: You are Smart Advisor, a strict, data-driven financial coach for college students. Provide actionable, constraint-based advice. \n\nContext: ${JSON.stringify(financialContext)}\n\nUser Query: ${userPrompt}` 
            }] 
          }
        ],
        generationConfig: {
          maxOutputTokens: 250,
        }
      }),
    })

    const llmData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      throw new Error(llmData.error?.message || 'Failed to fetch from Gemini API')
    }

    // Parse Gemini's specific response structure
    const advisorText = llmData.candidates[0].content.parts[0].text;

    // Return the LLM response to the client
    return new Response(
      JSON.stringify({ advisorResponse: advisorText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})