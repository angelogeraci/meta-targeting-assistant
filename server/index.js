const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const socketService = require('./services/socket');

// Environment variables configuration
dotenv.config();

// Import routes
const criteriaRoutes = require('./routes/criteria');
const metaRoutes = require('./routes/meta');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const auth = require('./middleware/auth');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Express app initialization
const app = express();
const server = http.createServer(app);

// Socket.io initialization
socketService.init(server);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/criteria', auth, criteriaRoutes);
app.use('/api/meta', auth, metaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', auth, projectRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Meta Targeting Assistant API');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server error');
});

// Server port
const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Socket.IO is active for real-time updates`);
  });
};

startServer();

module.exports = { app, server };
