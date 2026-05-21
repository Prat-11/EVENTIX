# Eventix

A concurrency-first event booking platform with real-time seat reservation.

**Live:** https://eventix-a27u.onrender.com

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL via Supabase |
| Real-time | Socket.IO |
| Auth | JWT + bcryptjs |
| Storage | Cloudinary |
| Uploads | Multer + multer-storage-cloudinary |
| Deployment | Render |

## Architecture

```
server/
├── app.js                  Entry point
├── config/
│   ├── database.js         PostgreSQL pool (pg)
│   └── cloudinary.js       Cloudinary + multer setup
├── controllers/            HTTP request handlers
├── services/               Business logic + DB queries
├── routes/                 URL mappings
├── middlewares/            Auth, rate limiting, error handling
├── models/                 SQL schema reference
├── views/                  HTML pages
└── public/                 CSS, JS, images
```

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/events
POST   /api/events
DELETE /api/events/:id

POST   /api/events/:id/reserve
DELETE /api/events/:id/reserve
GET    /api/events/:id/reservations
POST   /api/events/:id/enroll

GET    /api/users/:id
PUT    /api/users/:id
POST   /api/users/:id/avatar
GET    /api/users/:id/bookings
```

## Database Schema

```sql
users        — id, name, email, password, avatar, is_admin
events       — id, organizer_id, event_name, date, category, image, members_required
enrollments  — id, event_id, user_id, seats, seat_count  (permanent bookings)
reservations — id, event_id, user_id, seats, expires_at  (5-min temporary holds)
```

## Concurrency Model

1. User selects seats → `POST /api/events/:id/reserve` creates a 5-minute hold
2. Other users see those seats as reserved in real-time via Socket.IO
3. User confirms → `POST /api/events/:id/enroll` runs a PostgreSQL transaction with `SELECT FOR UPDATE` to lock the row
4. If two users try to book the same seat simultaneously, the transaction ensures only one succeeds
5. Background job runs every 60 seconds to delete expired reservations and broadcast freed seats

## Environment Variables

```
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
JWT_SECRET
SESSION_SECRET
PORT
NODE_ENV
```

## Local Setup

```bash
git clone https://github.com/Prat-11/EVENTIX
cd EVENTIX/server
npm install
# fill in .env
npm start
```

Open http://localhost:3000
