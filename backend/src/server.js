import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import connectionsRoutes from './routes/connections.js';
import notificationsRoutes from './routes/notifications.js';
import postsRoutes from './routes/posts.js';
// import postsRoutes from './routes/posts_simple.js';
import conversationsRoutes from './routes/conversations.js';
import questionsRoutes from './routes/questions.js';
import usersRoutes from './routes/users.js';
import roomsRoutes from './routes/rooms.js';
import studyTypesRoutes from './routes/studyTypes.js';
import subjectsRoutes from './routes/subjects.js';
import lessonsRoutes from './routes/lessons.js';
import notesRoutes from './routes/notes.js';
import flashcardsRoutes from './routes/flashcards.js';
import exercisesRoutes from './routes/exercises.js';
import filesRoutes from './routes/files.js';
import activityRoutes from './routes/activity.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3002;

// Initialize Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'http://localhost:8080'
      : '*',
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:8080'
    : '*', // Allow all origins in development
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Set charset to UTF-8 for all responses
app.use((req, res, next) => {
  res.set('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/study-types', studyTypesRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/activity', activityRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use(errorHandler);

// Socket.io authentication middleware
import jwt from 'jsonwebtoken';

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('WebSocket auth error: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    console.log('WebSocket auth: Attempting to verify token:', token.substring(0, 50) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.user = decoded;
    
    console.log(`User ${decoded.userId} (${decoded.email}) connected to WebSocket`);
    next();
  } catch (error) {
    console.log('WebSocket auth error:', error.message);
    console.log('Token that failed:', token ? token.substring(0, 50) + '...' : 'undefined');
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handling
const connectedUsers = new Map(); // userId -> socketId mapping

io.on('connection', (socket) => {
  const userId = socket.userId;
  connectedUsers.set(userId, socket.id);
  
  // Join user to their personal room
  socket.join(`user:${userId}`);
  
  // Send list of currently online users to the newly connected user
  const onlineUserIds = Array.from(connectedUsers.keys());
  socket.emit('users:online_list', { userIds: onlineUserIds });
  
  // Broadcast user online status
  socket.broadcast.emit('user:online', { userId });
  
  // Handle joining conversation rooms
  socket.on('join:conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    const roomSize = io.sockets.adapter.rooms.get(`conversation:${conversationId}`)?.size || 0;
    console.log(`[DEBUG] User ${userId} joined conversation ${conversationId} (room size: ${roomSize})`);
  });
  
  // Handle leaving conversation rooms
  socket.on('leave:conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    const roomSize = io.sockets.adapter.rooms.get(`conversation:${conversationId}`)?.size || 0;
    console.log(`[DEBUG] User ${userId} left conversation ${conversationId} (room size: ${roomSize})`);
  });
  
  // Handle typing indicators
  socket.on('typing:start', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:start', { userId });
  });
  
  socket.on('typing:stop', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId });
  });
  
  // Handle private chat messages
  socket.on('message:send', (data) => {
    const { conversationId, message } = data;
    
    console.log(`[DEBUG] Received message:send from user ${userId}:`);
    console.log(`[DEBUG] - Conversation ID: ${conversationId}`);
    console.log(`[DEBUG] - Message content: ${message.content}`);
    console.log(`[DEBUG] - Sender ID: ${message.senderId}`);
    console.log(`[DEBUG] - Receiver ID: ${message.receiverId}`);
    
    // Check who is in the conversation room
    const roomInfo = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
    console.log(`[DEBUG] - Users in conversation room: ${roomInfo ? Array.from(roomInfo).length : 0}`);
    if (roomInfo) {
      console.log(`[DEBUG] - Socket IDs in room:`, Array.from(roomInfo));
    }
    
    // Broadcast message to all users in the conversation except the sender
    socket.to(`conversation:${conversationId}`).emit('message:receive', {
      conversationId,
      message: {
        ...message,
        timestamp: new Date()
      }
    });
    
    console.log(`[DEBUG] Message broadcasted to conversation ${conversationId}`);
  });
  
  // Handle friend request events
  socket.on('friend:request', (data) => {
    socket.to(`user:${data.receiverId}`).emit('notification:friend_request', {
      type: 'friend_request',
      from: data.from,
      requestId: data.requestId,
      timestamp: Date.now()
    });
  });
  
  socket.on('friend:accept', (data) => {
    // Notify the original requester
    socket.to(`user:${data.requesterId}`).emit('notification:friend_accepted', {
      type: 'friend_accepted',
      from: data.from,
      timestamp: Date.now()
    });
  });
  
  socket.on('friend:reject', (data) => {
    // Notify the original requester
    socket.to(`user:${data.requesterId}`).emit('notification:friend_rejected', {
      type: 'friend_rejected',
      from: data.from,
      timestamp: Date.now()
    });
  });
  
  // Handle room chat events
  socket.on('room:join', (roomId) => {
    socket.join(`room:${roomId}`);
    console.log(`User ${userId} joined room ${roomId} chat`);
  });
  
  socket.on('room:leave', (roomId) => {
    socket.leave(`room:${roomId}`);
    console.log(`User ${userId} left room ${roomId} chat`);
  });
  
  socket.on('room:message', (data) => {
    // Emit to all users in the room except the sender
    socket.to(`room:${data.roomId}`).emit('room:new_message', {
      ...data.message,
      timestamp: Date.now()
    });
  });
  
  socket.on('room:typing_start', (data) => {
    socket.to(`room:${data.roomId}`).emit('room:typing_start', { 
      userId, 
      userName: socket.user.name || socket.user.email 
    });
  });
  
  socket.on('room:typing_stop', (data) => {
    socket.to(`room:${data.roomId}`).emit('room:typing_stop', { userId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    connectedUsers.delete(userId);
    socket.broadcast.emit('user:offline', { userId });
    console.log(`User ${userId} disconnected from WebSocket`);
  });
});

// Make io available to routes
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Study Space Backend API`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
