# Kiwi Learn - Backend Setup Guide

This guide will help you set up the custom Node.js backend for Kiwi Learn.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

## Step 1: Database Setup

1. **Create PostgreSQL database:**
```sql
CREATE DATABASE kiwi_learn;
```

2. **Note your database connection details:**
   - Host: `localhost` (or your PostgreSQL host)
   - Port: `5432` (default)
   - Database: `kiwi_learn`
   - Username: Your PostgreSQL username
   - Password: Your PostgreSQL password

## Step 2: Backend Configuration

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
   - Copy `env.example.txt` to `.env`:
   ```bash
   cp env.example.txt .env
   ```
   
   - Edit `.env` and fill in your values:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Update with your PostgreSQL credentials
   DATABASE_URL=postgresql://username:password@localhost:5432/kiwi_learn
   
   # Generate a strong secret key (use: openssl rand -base64 32)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown
   
   FRONTEND_URL=http://localhost:3000
   ```

## Step 3: Run Database Migrations

```bash
npm run db:migrate
```

This will create all necessary tables in your database.

## Step 4: Start the Backend Server

```bash
npm run dev
```

The server should start on `http://localhost:5000`. You should see:
```
🚀 Server running on port 5000
📡 Environment: development
🌐 Frontend URL: http://localhost:3000
✅ Database connected successfully
```

## Step 5: Frontend Configuration

1. **Navigate back to project root:**
```bash
cd ..
```

2. **Create/update `.env` file in project root:**
```env
VITE_API_URL=http://localhost:5000/api
```

3. **Start the frontend:**
```bash
npm run dev
```

## Step 6: Test the Setup

1. **Backend Health Check:**
   - Open `http://localhost:5000/health` in your browser
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Registration:**
   - Go to `http://localhost:3000/auth`
   - Register a new account
   - Check backend logs for successful registration

3. **Test File Upload:**
   - Login and go to Upload page
   - Upload a PDF or DOCX file
   - Check that file appears in `backend/uploads/` directory

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - Get all user documents
- `POST /api/documents` - Upload document (multipart/form-data)
- `GET /api/documents/:id` - Get single document
- `DELETE /api/documents/:id` - Delete document

### Lessons
- `GET /api/lessons` - Get all user lessons
- `POST /api/lessons` - Create lessons (bulk)
- `GET /api/lessons/:id` - Get single lesson
- `POST /api/lessons/:id/progress` - Update lesson progress

### User Profile
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `POST /api/users/xp` - Add XP
- `GET /api/users/achievements` - Get achievements
- `POST /api/users/achievements` - Add achievement

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Ensure database exists: `psql -l | grep kiwi_learn`

### Port Already in Use
- Change PORT in `.env` file
- Or kill process using port 5000: `lsof -ti:5000 | xargs kill`

### CORS Errors
- Ensure FRONTEND_URL in backend `.env` matches your frontend URL
- Check browser console for specific CORS error details

### File Upload Issues
- Ensure `uploads/` directory exists in backend folder
- Check file size limits (default: 10MB)
- Verify file type is in ALLOWED_FILE_TYPES

## Production Deployment

For production:

1. **Set NODE_ENV to production:**
```env
NODE_ENV=production
```

2. **Use strong JWT_SECRET:**
```bash
openssl rand -base64 32
```

3. **Configure proper CORS:**
```env
FRONTEND_URL=https://yourdomain.com
```

4. **Set up SSL/HTTPS** for database connection if needed

5. **Use environment-specific database** (not localhost)

6. **Set up file storage** (consider S3 or similar for production)

## Next Steps

- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up logging (Winston/Pino)
- [ ] Add monitoring (PM2, New Relic, etc.)
- [ ] Configure CI/CD pipeline
