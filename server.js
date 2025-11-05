const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
{
  "name": "finsafevault-backend",
  "version": "1.0.0",
  "description": "Backend for FinSafeVault application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "server": "nodemon server.js"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.2",
    "cloudinary": "^1.41.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
{
  "name": "finsafevault-backend",
  "version": "1.0.0",
  "description": "Backend for FinSafeVault application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "server": "nodemon server.js"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.2",
    "cloudinary": "^1.41.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
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