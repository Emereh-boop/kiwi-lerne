# Kiwi Learn Backend API

Node.js + Express + PostgreSQL backend for the Kiwi Learn platform.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS

### 3. Set Up Database

1. Create a PostgreSQL database:
```sql
CREATE DATABASE kiwi_learn;
```

2. Run migrations:
```bash
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Users & Profiles

- `GET /api/users/profile` - Get user profile with gamification data
- `PATCH /api/users/profile` - Update user profile
- `GET /api/users/achievements` - Get user achievements
- `POST /api/users/achievements` - Add achievement
- `POST /api/users/xp` - Add XP (with auto level calculation)

### Documents

- `GET /api/documents` - Get all user documents
- `GET /api/documents/:id` - Get single document
- `POST /api/documents` - Upload document (multipart/form-data)
- `DELETE /api/documents/:id` - Delete document
- `PATCH /api/documents/:id` - Update document

### Lessons

- `GET /api/lessons` - Get all user lessons
- `GET /api/lessons/document/:documentId` - Get lessons for document
- `GET /api/lessons/:id` - Get single lesson
- `POST /api/lessons` - Create lessons (bulk)
- `GET /api/lessons/:id/progress` - Get lesson progress
- `POST /api/lessons/:id/progress` - Update lesson progress

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained from `/api/auth/login` or `/api/auth/register`.

## File Uploads

Documents are uploaded via multipart/form-data with field name `file`. Files are stored in the `uploads/` directory (configurable via `UPLOAD_DIR`).

Supported file types:
- PDF (`application/pdf`)
- DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- TXT (`text/plain`)
- Markdown (`text/markdown`)

## Database Schema

See `database/schema.sql` for the complete database schema.

Key tables:
- `users` - User accounts
- `profiles` - User gamification data
- `documents` - Uploaded documents
- `lessons` - Generated lessons
- `lesson_progress` - User lesson progress
- `achievements` - User achievements

## Development

- Use `npm run dev` for development with auto-reload
- Use `npm start` for production
- Use `npm run db:migrate` to run database migrations
