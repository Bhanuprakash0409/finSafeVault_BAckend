const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const connectDB = require('./db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add multer middleware to handle multipart/form-data
const upload = multer();
app.use(upload.any());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes')); // ⬅️ ADD THIS
app.use('/api/notes', require('./routes/noteRoutes'));

// Simple check API for testing
app.get('/', (req, res) => {
  res.send('FinSafe Vault API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));