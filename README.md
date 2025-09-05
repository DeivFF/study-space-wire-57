# Study Space Application

## Overview

Study Space is an educational platform that allows students to share knowledge, ask questions, solve exercises, participate in challenges, and engage in polls.

## Prerequisites

- Node.js (version 16 or higher)
- PostgreSQL (version 13 or higher)
- npm or yarn package manager

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/study-space.git
cd study-space
```

### 2. Setup Backend

```bash
cd backend
npm install
```

#### Configure Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials and other configurations:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# Server Configuration
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-long-and-random
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
```

#### Run Database Migrations

```bash
npm run migrate
```

#### Start Backend Server

```bash
# Development mode with auto-restart on file changes
npm run dev

# Or production mode
npm start
```

### 3. Setup Frontend

In a new terminal, from the root directory:

```bash
npm install
```

#### Configure Environment Variables

Create environment files:

```bash
# Development environment
echo "VITE_API_URL=http://localhost:3002" > .env.development

# Production environment
echo "VITE_API_URL=https://your-production-api.com" > .env.production
```

#### Start Frontend Development Server

```bash
npm run dev
```

## Running Both Services Together

### Option 1: Using Separate Terminals

1. Terminal 1: Start backend

   ```bash
   cd backend
   npm run dev
   ```

2. Terminal 2: Start frontend
   ```bash
   npm run dev
   ```

### Option 2: Using Concurrently (Recommended)

Install concurrently in the root directory:

```bash
npm install --save-dev concurrently
```

Add these scripts to the root `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "vite",
    "dev:backend": "cd backend && npm run dev"
  }
}
```

Then run both services:

```bash
npm run dev
```

## Accessing the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3002
- Backend Health Check: http://localhost:3002/health

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
npm test
```

### End-to-End Tests

```bash
npx playwright test
```

## Features Implemented

### Poll Voting System

- Users can vote in polls with multiple options
- Visual display of results with progress bars
- Real-time percentage calculation
- Prevention of multiple votes per user
- Responsive design for all devices

### Exercise Validation System

- Immediate feedback on answer correctness
- Visual indication of correct answers when user is wrong
- Support for both multiple choice and descriptive exercises
- Prevention of multiple responses per user
- Difficulty level and subject tagging

## Troubleshooting

### Common Issues

#### 1. Connection Refused Errors

If you see errors like:

```
WebSocket connection to 'ws://localhost:3002/socket.io/' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED
```

**Solution:**

1. Make sure the backend server is running:

   ```bash
   cd backend
   npm run dev
   ```

2. Check that the backend is listening on the correct port:
   ```bash
   # Check if port 3002 is in use
   netstat -an | grep 3002
   ```

#### 2. Database Connection Errors

If you see database connection errors:

```
ConnectionError: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

1. Make sure PostgreSQL is running:

   ```bash
   # On macOS with Homebrew
   brew services start postgresql

   # On Ubuntu/Debian
   sudo systemctl start postgresql

   # On Windows
   net start postgresql-x64-13
   ```

2. Verify your database credentials in the `.env` file

#### 3. Environment Variables Not Loading

If the application seems to ignore your environment variables:

**Solution:**

1. Make sure environment files are in the correct directories:

   - Backend: `backend/.env`
   - Frontend: `.env`, `.env.development`, `.env.production`

2. Restart both servers after making changes to environment files

## API Documentation

### Poll Voting Endpoints

- `POST /api/posts/:id/vote` - Vote on a poll
- `GET /api/posts/:id/results` - Get poll results

### Exercise Response Endpoints

- `POST /api/posts/:id/respond` - Submit exercise response
- `GET /api/posts/:id/response` - Get user's previous response

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
