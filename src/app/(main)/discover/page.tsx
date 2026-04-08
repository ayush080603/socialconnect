'use client'

import { Profile } from '@/lib/types'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'

export default function DiscoverPage() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    fetchUsers(debouncedSearch)
  }, [debouncedSearch])

  const fetchUsers = async (q: string) => {
    setLoading(true)
    const res = await fetch(`/api/users?search=${encodeURIComponent(q)}&limit=20`)
    if (res.ok) {
      const json = await res.json()
      setUsers(json.data || [])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Discover People</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {search ? 'No users found' : 'Start typing to search for people'}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => {
            const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
            return (
              <Link key={user.id} href={`/profile/${user.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                      {user.bio && <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.bio}</p>}
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <p><strong>{user.posts_count}</strong> posts</p>
                      <p><strong>{user.followers_count}</strong> followers</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
