'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export default function CreatePostPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ title: 'Only JPEG and PNG allowed', variant: 'destructive' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image must be under 2MB', variant: 'destructive' })
      return
    }
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImage(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      toast({ title: 'Post content is required', variant: 'destructive' })
      return
    }
    setSubmitting(true)

    const formData = new FormData()
    formData.append('content', content.trim())
    if (image) formData.append('image', image)

    const res = await fetch('/api/posts', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      toast({ title: data.error || 'Failed to create post', variant: 'destructive' })
      setSubmitting(false)
      return
    }

    toast({ title: 'Post created!' })
    router.push('/feed')
  }

  const remaining = 280 - content.length

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={280}
                rows={5}
                className="resize-none"
              />
              <p className={`text-xs text-right ${remaining < 20 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {remaining} characters remaining
              </p>
            </div>

            <div className="space-y-2">
              <Label>Image (optional)</Label>
              {preview ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                  <p className="text-xs text-muted-foreground mt-1">JPEG or PNG, max 2MB</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImage}
                className="hidden"
              />
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !content.trim()} className="flex-1">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Post
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
