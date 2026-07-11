const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const net = require('net');
const { connectDB } = require('./src/config/db');
const scraperRoutes = require('./src/routes/scraperRoutes');

dotenv.config();

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '::';

const isPortFree = (port) => new Promise((resolve) => {
  const tester = net.createServer();
  tester.once('error', () => resolve(false));
  tester.once('listening', () => {
    tester.close(() => resolve(true));
  });
  tester.listen(port, HOST);
});

const findFreePort = async (startPort = DEFAULT_PORT) => {
  let port = startPort;
  while (port < startPort + 100) {
    if (await isPortFree(port)) return port;
    port += 1;
  }
  throw new Error('No free port found in range');
};

const startServer = async () => {
  try {
    const port = await findFreePort(DEFAULT_PORT);
    const server = app.listen(port, HOST, async () => {
      await connectDB();
      console.log(`Server running on port ${port}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', scraperRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start server
startServer();