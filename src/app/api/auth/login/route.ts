import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    if ((!email && !username) || !password) {
      return NextResponse.json(
        { error: 'Email or username and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let loginEmail = email

    // Username login — get email directly from profiles table, no admin API needed
    if (!email && username) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .single()

      if (error || !profile?.email) {
        return NextResponse.json(
          { error: 'No account found with that username' },
          { status: 401 }
        )
      }

      loginEmail = profile.email
    }

    return NextResponse.json({ email: loginEmail })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}