'use client'

import { Post } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Heart, MessageCircle, Trash2, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import CommentSection from './CommentSection'

interface PostCardProps {
  post: Post
  onDelete?: (id: string) => void
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  const [liked, setLiked] = useState(post.liked_by_me || false)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [showComments, setShowComments] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  const author = post.author
  const initials = author ? `${author.first_name[0]}${author.last_name[0]}`.toUpperCase() : 'U'
  const isOwner = user?.id === post.author_id

  const handleLike = async () => {
    if (!user) return
    setLikeLoading(true)
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', post.id)
      setLiked(false)
      setLikeCount(c => c - 1)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: post.id })
      setLiked(true)
      setLikeCount(c => c + 1)
    }
    setLikeLoading(false)
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Post deleted' })
      onDelete?.(post.id)
    } else {
      toast({ title: 'Failed to delete post', variant: 'destructive' })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/profile/${author?.id}`} className="flex items-center gap-3 hover:opacity-80">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author?.avatar_url || ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">
                {author?.first_name} {author?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">@{author?.username}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-0">
        <div className="flex items-center gap-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!user || likeLoading}
            className={`gap-1.5 ${liked ? 'text-red-500 hover:text-red-600' : ''}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(v => !v)}
            className="gap-1.5"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{post.comment_count}</span>
          </Button>
        </div>

        {showComments && <CommentSection postId={post.id} />}
      </CardFooter>
    </Card>
  )
}
