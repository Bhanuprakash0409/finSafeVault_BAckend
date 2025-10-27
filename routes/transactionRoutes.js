const express = require('express');
const router = express.Router();
const { 
    getTransactions, 
    addTransaction, 
    getAnalytics,
    exportTransactionsCSV, // ⬅️ IMPORTED
    getMonthlyReport // ⬅️ Import the new controller
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/transactions/analytics
router.route('/analytics')
  .get(protect, getAnalytics);

// ⬅️ NEW: ROUTE for CSV export
router.route('/export') 
  .get(protect, exportTransactionsCSV);

router.route('/')
  .get(protect, getTransactions) 
  .post(protect, addTransaction); 

router.route('/monthly-report').get(protect, getMonthlyReport); // ⬅️ Add the new route

module.exports = router;