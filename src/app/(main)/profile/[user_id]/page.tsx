'use client'

import { Profile, Post } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PostCard from '@/components/PostCard'
import { Loader2, MapPin, Globe, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { use } from 'react'

export default function ProfilePage({ params }: { params: Promise<{ user_id: string }> }) {
  const { user_id } = use(params)
  const { user, profile: myProfile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const isMe = user?.id === user_id

  useEffect(() => {
    fetchProfile()
    fetchUserPosts()
    if (user && !isMe) checkFollowing()
  }, [user_id, user])

  const fetchProfile = async () => {
    const res = await fetch(`/api/users/${user_id}`)
    if (res.ok) {
      const json = await res.json()
      setProfile(json.data)
    }
    setLoading(false)
  }

  const fetchUserPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`*, author:profiles(id, username, first_name, last_name, avatar_url)`)
      .eq('author_id', user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (data) {
      const postIds = data.map(p => p.id)
      let likedIds: string[] = []
      if (user && postIds.length > 0) {
        const { data: likes } = await supabase
          .from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
        likedIds = likes?.map(l => l.post_id) || []
      }
      setPosts(data.map(p => ({ ...p, liked_by_me: likedIds.includes(p.id) })))
    }
  }

  const checkFollowing = async () => {
    if (!user) return
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', user_id)
      .single()
    setIsFollowing(!!data)
  }

  const handleFollow = async () => {
    if (!user) return
    setFollowLoading(true)
    const method = isFollowing ? 'DELETE' : 'POST'
    const res = await fetch(`/api/users/${user_id}/follow`, { method })
    if (res.ok) {
      setIsFollowing(!isFollowing)
      setProfile(prev => prev ? {
        ...prev,
        followers_count: prev.followers_count + (isFollowing ? -1 : 1)
      } : prev)
    } else {
      toast({ title: 'Action failed', variant: 'destructive' })
    }
    setFollowLoading(false)
  }

  const handleDeletePost = (id: string) => setPosts(prev => prev.filter(p => p.id !== id))

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!profile) {
    return <div className="text-center py-20"><p className="text-muted-foreground">User not found</p></div>
  }

  const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex gap-2 mt-2">
            {isMe ? (
              <Button variant="outline" asChild size="sm">
                <Link href="/profile/edit">Edit Profile</Link>
              </Button>
            ) : user ? (
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                size="sm"
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            ) : null}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>

        {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {profile.location && (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
              <Globe className="h-3.5 w-3.5" />{profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />Joined {format(new Date(profile.created_at), 'MMM yyyy')}
          </span>
        </div>

        <div className="flex gap-4 text-sm">
          <span><strong>{profile.posts_count}</strong> <span className="text-muted-foreground">posts</span></span>
          <span><strong>{profile.followers_count}</strong> <span className="text-muted-foreground">followers</span></span>
          <span><strong>{profile.following_count}</strong> <span className="text-muted-foreground">following</span></span>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No posts yet</p>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} onDelete={handleDeletePost} />)
        )}
      </div>
    </div>
  )
}
