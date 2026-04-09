'use client'

import { Post } from '@/lib/types'
import { useEffect, useState, useCallback } from 'react'
import PostCard from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const fetchPosts = useCallback(async (pageNum: number, replace = false) => {
    setLoading(true)
    const res = await fetch(`/api/posts?page=${pageNum}&limit=10`)
    if (res.ok) {
      const json = await res.json()
      setPosts(prev => replace ? json.data : [...prev, ...json.data])
      setHasMore(json.hasMore)
    }
    setLoading(false)
    setInitialLoad(false)
  }, [])

  useEffect(() => {
    fetchPosts(1, true)
  }, [fetchPosts])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPosts(next)
  }

  const handleDelete = (id: string) => setPosts(prev => prev.filter(p => p.id !== id))

  if (initialLoad) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        {/* Only show when confirmed logged in */}
        {!authLoading && user && (
          <Button asChild size="sm">
            <Link href="/posts/create">New Post</Link>
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-muted-foreground text-lg">No posts yet</p>
          {!authLoading && (
            user
              ? <Button asChild><Link href="/posts/create">Create the first post</Link></Button>
              : <Button asChild><Link href="/auth/register">Join to post</Link></Button>
          )}
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} />
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}