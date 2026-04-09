'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Home, Search, User, LogOut, PlusSquare } from 'lucide-react'

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
    : 'U'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-primary">
          SocialConnect
        </Link>

        {/* Render nothing while auth state is loading — prevents icon flash */}
        {!loading && (
          <>
            {user ? (
              <nav className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/feed"><Home className="h-5 w-5" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/discover"><Search className="h-5 w-5" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/posts/create"><PlusSquare className="h-5 w-5" /></Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${profile?.id}`}>
                        <User className="mr-2 h-4 w-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/edit">Edit Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" asChild><Link href="/auth/login">Login</Link></Button>
                <Button asChild><Link href="/auth/register">Sign Up</Link></Button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  )
}