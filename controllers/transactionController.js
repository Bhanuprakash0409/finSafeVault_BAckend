const Transaction = require('../models/Transaction');
const User = require('../models/User'); // ⬅️ NEW: Need to import User model
const { sendMinBalanceAlert } = require('../services/emailService'); // ⬅️ NEW: Import email service

// Helper function to calculate current balance (needed for email check)
const calculateNetBalance = async (userId) => {
    const allTransactions = await Transaction.find({ userId });

    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    
    return totalIncome - totalExpense;
};


// @desc    Get all transactions for the logged-in user (LIMITED TO 10)
// @route   GET /api/transactions
// @access  Private 
exports.getTransactions = async (req, res) => {
    // ⬅️ NEW: Get all parameters including month/year
    const { page, date, year, month, all } = req.query; 
    
    const limit = 10;
    const skip = ((parseInt(page) || 1) - 1) * limit;
    
    // ⬅️ Build the MongoDB query object
    let query = { userId: req.user._id };

    // --- Date Filtering Logic ---
    if (date) {
        // If date is provided, filter transactions for that entire day (start to end)
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(targetDate.getDate() + 1);

        query.date = { 
            $gte: targetDate, // Greater than or equal to the start of the day
            $lt: nextDay      // Less than the start of the next day
        };
    } else if (all && year && month) { 
        // ⬅️ CRITICAL FIX: Filter by the full month/year when requested for the PDF report
        const targetYear = parseInt(year);
        const targetMonth = parseInt(month) - 1; // JS month is 0-indexed

        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

        query.date = { 
            $gte: startOfMonth, 
            $lte: endOfMonth      
        };
    }

    try {
        // We'll run multiple queries in parallel for efficiency
        const [totalCount, transactions, balanceData] = await Promise.all([
            // 1. Get the total count of documents matching the query
            Transaction.countDocuments(query),

            (() => {
                let transactionsQuery = Transaction.find(query).sort({ createdAt: -1 });
                if (!all) { // Apply pagination only if 'all' is NOT set
                    transactionsQuery = transactionsQuery.limit(limit).skip(skip);
                }
                return transactionsQuery.exec();
            })(),

            // 3. Get overall balance totals using an aggregation pipeline
            Transaction.aggregate([
                { $match: { userId: req.user._id } }, // Match all transactions for the user
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
                        totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
                    }
                }
            ])
        ]);

        const totals = balanceData[0] || { totalIncome: 0, totalExpense: 0 };

        res.json({
            transactions,
            totalCount,
            pages: Math.ceil(totalCount / limit),
            // Add the balance figures to the response
            balance: {
                totalIncome: totals.totalIncome,
                totalExpense: totals.totalExpense,
                netBalance: totals.totalIncome - totals.totalExpense
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error fetching transactions' });
    }
};

// @desc    Add a new transaction (income or expense)
// @route   POST /api/transactions
// @access  Private
exports.addTransaction = async (req, res) => {
  // ⬅️ MODIFIED: Only destructure core fields  
  const { type, amount, category, date, note } = req.body; 

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ message: 'Please include all required fields: type, amount, category, date' });
  }
  
  try {
    const newTransaction = new Transaction({
      userId: req.user._id, 
      type,
      amount: Number(amount),
      category,
      // REMOVED: subCategory: subCategory || undefined,
      // REMOVED: tags: tags || [],
      date: new Date(date),
      note,
    });

    const savedTransaction = await newTransaction.save();

    // ----------------------------------------------------
    // ➡️ MINIMUM BALANCE CHECK LOGIC
    // ----------------------------------------------------
    // Get user details directly from the request object (attached by 'protect' middleware)
    const { minBalance: minBalanceLimit, email, name } = req.user;
    const minBalanceValue = minBalanceLimit !== undefined 
      ? minBalanceLimit 
      : 0;
    
    const currentBalance = await calculateNetBalance(req.user._id);

    // Send Alert if balance is below the defined limit AND the user has set an email
    if (currentBalance < minBalanceValue && email) {
        await sendMinBalanceAlert(email, name, currentBalance, minBalanceValue);
    }

    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error('Error adding transaction or checking balance:', error); 
    res.status(500).json({ message: 'Server error adding transaction' });
  }
};

// @desc    Get aggregated financial data for charts
// @route   GET /api/transactions/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;    
    
    // ⬅️ CRITICAL: Get year from query, default to current year
    const { year, month } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : null; // JS month is 0-indexed

    let dateFilter;
    if (targetMonth !== null) {
      // Filter by specific month if provided
      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
      dateFilter = { $gte: startOfMonth, $lte: endOfMonth };
    } else {
      // Default to filtering by the entire year
      const startOfYear = new Date(targetYear, 0, 1);
      const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);
      dateFilter = { $gte: startOfYear, $lte: endOfYear };
    }
    
    // 1. Aggregate Expenses by Category (for Pie Chart)
    const categoryData = await Transaction.aggregate([
      { $match: { 
          userId, 
          type: 'expense',
          date: dateFilter, // ⬅️ Apply the year filter
      }},
      { $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }},
      { $sort: { total: -1 } } 
    ]);

    // 2. Aggregate Monthly Income AND Expense (for combined Bar Chart)
    const monthlyDataCombined = await Transaction.aggregate([
      { $match: { 
          userId, 
          date: dateFilter, // ⬅️ Apply the year filter
      }},
      { $group: {
        _id: { month: { $month: '$date' }, year: { $year: '$date' } },
        income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format combined monthly data for easy charting
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedMonthlyData = monthlyDataCombined.map(item => ({
        name: monthNames[item._id.month - 1],
        income: item.income,
        expense: item.expense
    }));

    res.json({
      categoryData,
      monthlyData: formattedMonthlyData, // ⬅️ NOW CONTAINS BOTH INCOME & EXPENSE
      currentYear: targetYear // Send back the year used for context
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error fetching analytics data' });
  }
};


// ----------------------------------------------------
// ➡️ CSV EXPORT LOGIC
// ----------------------------------------------------

// @desc    Export transactions as CSV for the selected month/year
// @route   GET /api/transactions/export
// @access  Private
exports.exportTransactionsCSV = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // ⬅️ UPDATED: Get month and year from query parameters
        const { year, month } = req.query; 

        // Use current date as default if no parameters are provided
        const now = new Date();
        const targetYear = year ? parseInt(year) : now.getFullYear();
        const targetMonth = month ? parseInt(month) - 1 : now.getMonth(); // Month is 0-indexed in JS Date

        // Calculate Start and End Dates for the target month
        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0); // Day 0 of the next month is the last day of the current month

        const transactions = await Transaction.find({
            userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ date: 1 });

        if (transactions.length === 0) {
            return res.status(404).json({ message: `No transactions found for ${targetYear}/${targetMonth + 1}.` });
        }

        // CSV Header (Updated)
        const header = "Date,Type,Category,Amount,Note\n"; // ⬅️ REMOVED Subcategory, Tags

        // CSV Body generation
        const csv = transactions.map(t => 
            [
                t.date.toLocaleDateString('en-US'),
                t.type,
                t.category,
                t.type === 'expense' ? `-${t.amount.toFixed(2)}` : t.amount.toFixed(2),
                `"${t.note ? t.note.replace(/"/g, '""') : ''}"`
            ].join(',')
        ).join('\n');

        const csvContent = header + csv;
        const monthName = new Date(targetYear, targetMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' }); // Get full month/year name
        
        // Set headers for download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="FinSafe_Monthly_Receipt_${monthName}.csv"`);
        
        res.send(csvContent);

    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).json({ message: 'Server error during CSV export.' });
    }
};

// @desc    Get all transactions for a specific month for PDF reporting
// @route   GET /api/transactions/monthly-report
// @access  Private
exports.getMonthlyReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ message: 'Year and month are required.' });
        }

        const targetYear = parseInt(year);
        const targetMonth = parseInt(month) - 1; // JS month is 0-indexed

        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

        const transactions = await Transaction.find({
            userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ date: 1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching monthly report data.' });
    }
};