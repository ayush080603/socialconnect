'use client'

import { Comment } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function CommentSection({ postId }: { postId: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    setLoading(true)
    const res = await fetch(`/api/posts/${postId}/comments`)
    if (res.ok) {
      const json = await res.json()
      setComments(json.data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return
    setSubmitting(true)
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment.trim() }),
    })
    if (res.ok) {
      const json = await res.json()
      setComments(prev => [...prev, json.data])
      setNewComment('')
    } else {
      toast({ title: 'Failed to add comment', variant: 'destructive' })
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId))
    } else {
      toast({ title: 'Failed to delete comment', variant: 'destructive' })
    }
  }

  return (
    <div className="w-full space-y-3 border-t pt-3">
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-2">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map(comment => {
            const author = comment.author
            const initials = author ? `${author.first_name[0]}${author.last_name[0]}`.toUpperCase() : 'U'
            return (
              <div key={comment.id} className="flex gap-2">
                <Link href={`/profile/${author?.id}`}>
                  <Avatar className="h-7 w-7 mt-0.5">
                    <AvatarImage src={author?.avatar_url || ''} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/profile/${author?.id}`} className="font-medium text-xs hover:underline">
                      @{author?.username}
                    </Link>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {user?.id === comment.author_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm mt-0.5">{comment.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {user && (
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="resize-none min-h-[60px] text-sm"
            maxLength={280}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
