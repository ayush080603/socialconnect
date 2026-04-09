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

    // If username provided, look up the email from profiles table
    if (!email && username) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // Get email from auth.users using the user id
      const { data: adminData, error: adminError } = await supabase
        .auth.admin.getUserById(profile.id)

      if (adminError || !adminData?.user?.email) {
        // Fallback: ask user to use email instead
        return NextResponse.json(
          { error: 'Please use your email address to log in' },
          { status: 401 }
        )
      }

      loginEmail = adminData.user.email
    }

    return NextResponse.json({ email: loginEmail })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}