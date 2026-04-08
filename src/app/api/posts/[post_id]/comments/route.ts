// GET POST /api/posts/[post_id]/comments
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params
    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`*, author:profiles(id, username, first_name, last_name, avatar_url)`)
      .eq('post_id', post_id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: comments })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }
    if (content.length > 280) {
      return NextResponse.json({ error: 'Comment must be 280 characters or less' }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({ content: content.trim(), author_id: user.id, post_id })
      .select(`*, author:profiles(id, username, first_name, last_name, avatar_url)`)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: comment, message: 'Comment added' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
