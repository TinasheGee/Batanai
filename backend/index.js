console.log('>>> RUNNING INDEX FROM:', __filename);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // Import http
const { Server } = require('socket.io'); // Import Socket.io

const pool = require('./db');
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/business.routes');
const adminRoutes = require('./routes/admin.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const mallsRoutes = require('./routes/malls.routes');
const networkRoutes = require('./routes/network.routes');
const messageRoutes = require('./routes/messages.routes');
const notificationsRoutes = require('./routes/notifications.routes');

console.log('✅ reviewsRoutes imported');
console.log('✅ adminRoutes loaded:', adminRoutes);

const app = express();
const server = http.createServer(app); // Create HTTP server

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Configure CORS for Express
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://batanai.precknash.co.zw',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // include PATCH for admin verify and other patch endpoints
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Store io instance in app so routes can access it
app.set('io', io);

// Socket.io Connection Handler
const onlineUsers = new Map(); // Map userId -> socketId

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins their own room based on ID
  socket.on('join_room', (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    // Remove user from online map
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

console.log('➡️ Mounting business.routes.js');
app.use('/api/business', businessRoutes);
app.use('/api/products', productRoutes);
app.use('/api/malls', mallsRoutes);

app.get('/', (req, res) => {
  res.send('Batanai API running');
});

// Auto-test DB connection on startup
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ DATABASE CONNECTED SUCCESSFULLY! Time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ DATABASE CONNECTION FAILED:', err.message);
  }
})();

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
