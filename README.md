# SocialConnect

A social media web application built with Next.js, Supabase, TypeScript, and Tailwind CSS.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (JWT-based)
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## Features
- JWT-based Authentication (register, login, logout)
- User Profiles with bio, avatar, location, website
- Create/Delete Posts with image upload (JPEG/PNG, max 2MB)
- Like / Unlike posts
- Comment on posts, delete own comments
- Public feed (chronological)
- Follow / Unfollow users
- Discover / search users
- Fully responsive UI

## Setup Instructions

### 1. Clone and install
```bash
git clone <your-repo-url>
cd socialconnect
npm install
npx shadcn@latest init
npx shadcn@latest add button input label textarea card avatar badge separator dropdown-menu toast dialog
```

### 2. Create Supabase project
- Go to https://supabase.com and create a new project
- Go to SQL Editor and run the contents of `schema.sql`

### 3. Environment variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npx vercel
```
Add the same environment variables in Vercel dashboard.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login (email or username) |
| POST | /api/auth/logout | Logout |
| GET | /api/users | List/search users |
| GET | /api/users/me | Get own profile |
| PUT/PATCH | /api/users/me | Update own profile |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users/:id/follow | Follow user |
| DELETE | /api/users/:id/follow | Unfollow user |
| GET | /api/users/:id/followers | Get followers |
| GET | /api/users/:id/following | Get following |
| GET | /api/posts | List all posts (paginated) |
| POST | /api/posts | Create post (with image) |
| GET | /api/posts/:id | Get single post |
| PUT/PATCH | /api/posts/:id | Update own post |
| DELETE | /api/posts/:id | Delete own post |
| POST | /api/posts/:id/like | Like a post |
| DELETE | /api/posts/:id/like | Unlike a post |
| GET | /api/posts/:id/comments | List comments |
| POST | /api/posts/:id/comments | Add comment |
| DELETE | /api/posts/:id/comments/:cid | Delete own comment |
| GET | /api/feed | Personalised feed |
