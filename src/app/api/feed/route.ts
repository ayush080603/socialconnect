// GET /api/feed
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get followed user IDs if logged in
    let followedIds: string[] = []
    if (user) {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
      followedIds = follows?.map(f => f.following_id) || []
    }

    let query = supabase
      .from('posts')
      .select(`*, author:profiles(id, username, first_name, last_name, avatar_url)`, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // If user has follows, show followed posts; else show all public posts
    if (followedIds.length > 0) {
      query = query.in('author_id', followedIds)
    }

    const { data: posts, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    let likedPostIds: string[] = []
    if (user && posts && posts.length > 0) {
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', posts.map(p => p.id))
      likedPostIds = likes?.map(l => l.post_id) || []
    }

    const postsWithLikes = posts?.map(post => ({
      ...post,
      liked_by_me: likedPostIds.includes(post.id),
    }))

    return NextResponse.json({
      data: postsWithLikes,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
