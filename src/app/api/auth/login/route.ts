import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    if ((!email && !username) || !password) {
      return NextResponse.json({ error: 'Email or username and password are required' }, { status: 400 })
    }

    const supabase = await createClient()

    let loginEmail = email

    // If username provided, look up email
    if (!email && username) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single()

      if (!profile) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // Get email from auth.users via admin (we use service role for this)
      const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
      if (!userData?.user?.email) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
      loginEmail = userData.user.email
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    })

    if (error) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({
      message: 'Login successful',
      access_token: data.session?.access_token,
      user: { ...data.user, profile },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
