// DELETE /api/posts/[post_id]/comments/[comment_id]
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ post_id: string; comment_id: string }> }
) {
  try {
    const { comment_id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment_id)
      .eq('author_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Comment deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
