const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
// Only require necessary components/files once
const connectDB = require('./db'); 

// Load environment variables
dotenv.config();

const app = express();

// ----------------------------------------------------
// ✅ Clean Middleware Setup
// ----------------------------------------------------
app.use(cors());
app.use(express.json()); // Parses application/json bodies
app.use(express.urlencoded({ extended: true })); // Parses application/x-www-form-urlencoded bodies

// ----------------------------------------------------
// ✅ Routes Registration (Using correct file names)
// ----------------------------------------------------
// Note: We are using the correct file names (e.g., transactionRoutes.js)
app.use('/api/transactions', require('./routes/transactionRoutes.js'));
app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/notes', require('./routes/noteRoutes.js'));


const PORT = process.env.PORT || 5000;

// Connect to DB and then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});