export interface Profile {
  id: string
  username: string
  first_name: string
  last_name: string
  bio: string | null
  avatar_url: string | null
  website: string | null
  location: string | null
  posts_count: number
  followers_count: number
  following_count: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  content: string
  author_id: string
  image_url: string | null
  is_active: boolean
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  author?: Profile
  liked_by_me?: boolean
}

export interface Comment {
  id: string
  content: string
  author_id: string
  post_id: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
