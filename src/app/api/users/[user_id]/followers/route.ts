// GET /api/users/[user_id]/followers
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('follows')
      .select(`follower:profiles!follower_id(id, username, first_name, last_name, avatar_url)`)
      .eq('following_id', user_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: data?.map(d => d.follower) || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
