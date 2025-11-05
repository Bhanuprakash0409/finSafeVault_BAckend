const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser'); // Import body-parser
const connectDB = require('./db');

// Load environment variables
dotenv.config(); 

const app = express();

// ----------------------------------------------------
// ➡️ CRITICAL FIX: ENSURE THESE ARE HERE AND ORDERED CORRECTLY
// ----------------------------------------------------
app.use(cors()); 
app.use(bodyParser.json()); // Use body-parser to parse JSON
app.use(express.json()); 

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

app.listen(PORT, () => {
  // Connect to database once the server is ready to listen
  connectDB();
  console.log(`Server running on port ${PORT}`);
});