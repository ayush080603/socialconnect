// GET /api/posts  POST /api/posts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const { data: { user } } = await supabase.auth.getUser()

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, username, first_name, last_name, avatar_url)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Check which posts user has liked
    let likedPostIds: string[] = []
    if (user) {
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', posts?.map(p => p.id) || [])

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const content = formData.get('content') as string
    const imageFile = formData.get('image') as File | null

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (content.length > 280) {
      return NextResponse.json({ error: 'Content must be 280 characters or less' }, { status: 400 })
    }

    let image_url: string | null = null

    // Upload image if provided
    if (imageFile && imageFile.size > 0) {
      if (!['image/jpeg', 'image/png'].includes(imageFile.type)) {
        return NextResponse.json({ error: 'Only JPEG and PNG images are allowed' }, { status: 400 })
      }
      if (imageFile.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image must be less than 2MB' }, { status: 400 })
      }

      const fileExt = imageFile.type === 'image/jpeg' ? 'jpg' : 'png'
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, buffer, { contentType: imageFile.type })

      if (uploadError) {
        return NextResponse.json({ error: 'Image upload failed' }, { status: 400 })
      }

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName)
      image_url = urlData.publicUrl
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ content: content.trim(), author_id: user.id, image_url })
      .select(`*, author:profiles(id, username, first_name, last_name, avatar_url)`)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: { ...post, liked_by_me: false }, message: 'Post created' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
