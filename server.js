const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const transactionRoutes = require('./routes/transactions');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const connectDB = require('./db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json()); // Add this line to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Add this line to parse URL-encoded bodies

app.use(express.json());

// Routes
app.use('/api/transactions', require('./routes/transactionRoutes.js'));
app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/notes', require('./routes/noteRoutes.js'));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});