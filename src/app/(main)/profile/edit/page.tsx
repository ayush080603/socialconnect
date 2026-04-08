'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Camera } from 'lucide-react'

export default function EditProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', bio: '', website: '', location: '', avatar_url: '',
  })

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
    if (profile) {
      setForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
        location: profile.location || '',
        avatar_url: profile.avatar_url || '',
      })
    }
  }, [user, profile, loading])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ title: 'Only JPEG and PNG allowed', variant: 'destructive' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image must be under 2MB', variant: 'destructive' })
      return
    }

    setUploadingAvatar(true)
    const fileExt = file.type === 'image/jpeg' ? 'jpg' : 'png'
    const fileName = `${user.id}/avatar.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, new Uint8Array(arrayBuffer), { contentType: file.type, upsert: true })

    if (error) {
      toast({ title: 'Avatar upload failed', variant: 'destructive' })
      setUploadingAvatar(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    setForm(f => ({ ...f, avatar_url: data.publicUrl + `?t=${Date.now()}` }))
    setUploadingAvatar(false)
    toast({ title: 'Avatar updated!' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      toast({ title: data.error || 'Failed to update profile', variant: 'destructive' })
      setSaving(false)
      return
    }

    await refreshProfile()
    toast({ title: 'Profile updated!' })
    router.push(`/profile/${user?.id}`)
    setSaving(false)
  }

  const initials = profile ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase() : 'U'

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={form.avatar_url} />
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                </Button>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={handleAvatarUpload} className="hidden" />
              <p className="text-xs text-muted-foreground">Click camera to change avatar</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={set('first_name')} required />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={set('last_name')} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bio <span className="text-muted-foreground text-xs">({form.bio.length}/160)</span></Label>
              <Textarea
                value={form.bio}
                onChange={set('bio')}
                maxLength={160}
                rows={3}
                placeholder="Tell people about yourself..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={set('website')} placeholder="https://yoursite.com" type="url" />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={set('location')} placeholder="City, Country" />
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
