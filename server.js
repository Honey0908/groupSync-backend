const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const errorHandler = require('./utils/errorHandler'); // Add error handler
const authenticate = require('./middleware/authMiddleware');

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Web Push Configuration
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;
webPush.setVapidDetails(
  `mailto: ${process.env.EMAIL}`,
  publicVapidKey,
  privateVapidKey
);

// Import Routes
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', authenticate, roomRoutes); // Authenticate protected routes
app.use('/api/notifications', authenticate, notificationRoutes);

// Global error handler middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
