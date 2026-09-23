const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const messagingRoutes = require('./routes/messagingRoutes');
const faceAuthRoutes = require('./routes/faceAuthRoutes');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
if (process.env.BASE44_PUBLIC_HOST_SUFFIX) {
  allowedOrigins.push('https://3000-' + process.env.BASE44_PUBLIC_HOST_SUFFIX);
}

const corsOptions = {
  origin: (origin, callback) => {
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
app.use('/api/face-auth', faceAuthRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

