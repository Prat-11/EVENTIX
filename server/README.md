# Eventix - Event Management Platform

A real-time event booking platform with seat reservation, built with proper MVC architecture and MongoDB.

## 🏗️ Project Structure

```
server/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   └── firebase.js      # Firebase Admin SDK (optional)
├── controllers/         # Request handlers
│   ├── authController.js
│   ├── userController.js
│   └── eventController.js
├── models/              # MongoDB schemas
│   ├── User.js
│   ├── Event.js
│   └── Reservation.js
├── routes/              # URL mappings
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── eventRoutes.js
├── middlewares/         # Custom middleware
│   ├── auth.js          # JWT authentication
│   ├── errorHandler.js  # Error handling
│   └── rateLimiter.js   # Rate limiting
├── views/               # HTML templates
├── public/              # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── .env                 # Environment variables
├── app.js               # Application entry point
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up MongoDB:**
   - Install MongoDB locally, or
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

3. **Configure environment variables:**
   Edit `.env` file:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/eventix
   JWT_SECRET=your_jwt_secret_here
   SESSION_SECRET=your_session_secret_here
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open your browser and go to: `http://localhost:3000/home.html`

## 📚 MVC Architecture Explained

### Models (`/models`)
- **Purpose:** Define data structure and schema
- **Contains:** Mongoose schemas only
- **Example:** User schema, Event schema, Reservation schema
- **Does NOT contain:** Database queries or business logic

### Views (`/views` + `/public`)
- **Purpose:** User interface and presentation
- **Contains:** HTML files, CSS, client-side JavaScript
- **Example:** home.html, login.html, event pages
- **Does NOT contain:** Server-side logic

### Controllers (`/controllers`)
- **Purpose:** Handle requests from client and interact with database
- **Contains:** Request processing, validation, database operations
- **Example:** authController handles login/register
- **Does NOT contain:** Routes or schemas

### Routes (`/routes`)
- **Purpose:** Map URLs to controller functions
- **Contains:** Express router definitions
- **Example:** `/api/auth/login` → `authController.login`
- **Does NOT contain:** Business logic

### Middlewares (`/middlewares`)
- **Purpose:** Process requests before reaching controllers
- **Contains:** Authentication, validation, error handling
- **Example:** JWT verification, rate limiting

### Config (`/config`)
- **Purpose:** Application configuration
- **Contains:** Database connections, external service setup
- **Example:** MongoDB connection, Firebase initialization

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/firebase-login` - Login with Firebase
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout (protected)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile (protected)
- `GET /api/users/:id/bookings` - Get user bookings (protected)

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (protected)
- `GET /api/events/:id/reservations` - Get reservations
- `POST /api/events/:id/reserve` - Reserve seats (protected)
- `DELETE /api/events/:id/reserve` - Clear reservation (protected)
- `POST /api/events/:id/enroll` - Enroll in event (protected)
- `DELETE /api/events/:id` - Delete event (protected)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

**To access protected routes:**
1. Login or register to get a token
2. Include token in Authorization header:
   ```
   Authorization: Bearer <your_token_here>
   ```

## 🎯 Features

- ✅ User authentication (email/password + Firebase)
- ✅ Real-time seat reservation (5-minute hold)
- ✅ Atomic booking with MongoDB transactions
- ✅ Socket.IO for real-time updates
- ✅ Concurrency control (no overbooking)
- ✅ Rate limiting and security
- ✅ Proper MVC architecture
- ✅ RESTful API design

## 🛠️ Technologies

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.IO
- **Authentication:** JWT, bcrypt, Firebase Admin SDK
- **Security:** Helmet, CORS, Rate Limiting

## 📝 Development Notes

### MongoDB vs Firebase
This version uses **MongoDB** instead of Firestore:
- Better transaction support
- More flexible queries
- Easier local development
- Standard SQL-like operations

### Proper MVC Structure
- **Models** = Schema only (no queries)
- **Controllers** = Handle requests + database operations
- **Views** = Client-side UI
- **Routes** = URL mapping

This is different from the previous structure where models contained database queries.

## 🐛 Troubleshooting

**MongoDB connection error:**
- Make sure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`

**Port already in use:**
- Change PORT in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill`

**JWT errors:**
- Make sure JWT_SECRET is set in `.env`
- Check token format in Authorization header

## 📄 License

MIT License - feel free to use for learning and projects!
