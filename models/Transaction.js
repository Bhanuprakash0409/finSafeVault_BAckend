const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String, // Main category remains
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  note: {
    type: String,
    maxlength: 100,
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);