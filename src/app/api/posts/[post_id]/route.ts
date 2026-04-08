// GET PUT PATCH DELETE /api/posts/[post_id]
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: post, error } = await supabase
      .from('posts')
      .select(`*, author:profiles(id, username, first_name, last_name, avatar_url)`)
      .eq('id', post_id)
      .eq('is_active', true)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    let liked_by_me = false
    if (user) {
      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post_id)
        .single()
      liked_by_me = !!like
    }

    return NextResponse.json({ data: { ...post, liked_by_me } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ post_id: string }> }) {
  return updatePost(request, params)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ post_id: string }> }) {
  return updatePost(request, params)
}

async function updatePost(request: NextRequest, params: Promise<{ post_id: string }>) {
  try {
    const { post_id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (content && content.length > 280) {
      return NextResponse.json({ error: 'Content must be 280 characters or less' }, { status: 400 })
    }

    const { data: post, error } = await supabase
      .from('posts')
      .update({ content })
      .eq('id', post_id)
      .eq('author_id', user.id)
      .select(`*, author:profiles(id, username, first_name, last_name, avatar_url)`)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ data: post, message: 'Post updated' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post_id)
      .eq('author_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Post deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
