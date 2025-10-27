const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db');

// Connect to database
dotenv.config();
connectDB();

const app = express();

// ----------------------------------------------------
// ➡️ CRITICAL FIX: ENSURE THESE ARE HERE AND ORDERED CORRECTLY
// ----------------------------------------------------
app.use(cors()); 
app.use(express.json()); // <--- THIS LINE PARSES THE JSON BODY!!!

// ----------------------------------------------------
// ➡️ Routes (MUST come after the middleware)
// ----------------------------------------------------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));

// Simple check API for testing
app.get('/', (req, res) => {
  res.send('FinSafe Vault API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));