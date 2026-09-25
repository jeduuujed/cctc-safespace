const dotenv = require('dotenv');

dotenv.config();

const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const messagingRoutes = require('./routes/messagingRoutes');
const emailAuthRoutes = require('./routes/emailAuthRoutes');

const app = express();
app.set('trust proxy', 1);

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...(process.env.FRONTEND_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean)
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '4mb' }));

app.use('/api', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/auth', emailAuthRoutes);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`Server running on ${HOST}:${PORT}`));

