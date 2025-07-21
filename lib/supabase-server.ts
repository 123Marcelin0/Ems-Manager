import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client for use in API routes (server-side)
export async function createServerSupabaseClient(request: NextRequest) {
  // Create base client
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  let accessToken: string | null = null
  let refreshToken: string | null = null
  
  // First, try to get token from Authorization header (preferred for API calls)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.slice(7)
    console.log('✅ Server Auth: Found token in Authorization header')
  }
  
  // Fallback: Try to get the session token from request cookies
  if (!accessToken) {
    const sessionCookies = [
      `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`,
      'sb-access-token',
      'supabase-auth-token'
    ]
    
    for (const cookieName of sessionCookies) {
      const cookie = request.cookies.get(cookieName)
      if (cookie?.value) {
        try {
          const sessionData = JSON.parse(cookie.value)
          if (sessionData.access_token) {
            accessToken = sessionData.access_token
            refreshToken = sessionData.refresh_token || ''
            console.log('✅ Server Auth: Found token in cookies')
            break
          }
        } catch (error) {
          // Try the cookie value directly as access token
          accessToken = cookie.value
          console.log('✅ Server Auth: Found direct token in cookies')
          break
        }
      }
    }
  }
  
  // Set the session if we found tokens
  if (accessToken) {
    try {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      })
      console.log('✅ Server Auth: Session set successfully')
    } catch (error) {
      console.warn('⚠️ Server Auth: Could not set session in API route:', error)
    }
  } else {
    console.warn('⚠️ Server Auth: No authentication token found in request')
  }
  
  return supabase
} 