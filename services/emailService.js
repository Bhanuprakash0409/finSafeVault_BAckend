const nodemailer = require('nodemailer');

const FRONTEND_URL = 'https://fin-safe-vault-frontend.vercel.app'; 

const transporter = nodemailer.createTransport({
    // CRITICAL FIX: Use the 'service: SendGrid' for API connection
    service: 'SendGrid', 
    auth: {
        user: 'apikey', 
        pass: process.env.SENDGRID_API_KEY, 
    },
});

// Utility function to get the verified sender email from environment
const getSenderEmail = () => {
    // We assume EMAIL_SERVICE_USER holds the verified sender email address.
    // Use a generic email if the environment variable is missing for safety.
    return process.env.EMAIL_SERVICE_USER || 'noreply@finsafevault.com';
};


const sendMinBalanceAlert = async (userEmail, userName, currentBalance, minBalanceLimit) => {
    const mailOptions = {
        // ✅ FIX 1: Use the utility function for the FROM address
        from: `FinSafe Vault <${getSenderEmail()}>`, 
        to: userEmail,
        subject: `🚨 FinSafe Vault Alert: Low Account Balance!`,
        html: `
            <p>Dear ${userName},</p>
            <p>Your current net balance is <strong>₹${currentBalance.toFixed(2)}</strong>, which is below your minimum limit of ₹${minBalanceLimit.toFixed(2)}.</p>
        `,
    };
    // ... (delivery logic) ...
};

const sendWelcomeEmail = async (userEmail, userName) => {
    const mailOptions = {
        // ✅ FIX 2: Use the utility function for the FROM address
        from: `FinSafe Vault <${getSenderEmail()}>`, 
        to: userEmail,
        subject: `🎉 Welcome to FinSafe Vault, ${userName}!`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <p>Thank you for creating an account with FinSafe Vault.</p>
                <a href="${FRONTEND_URL}/login">Go to Dashboard</a>
            </div>
        `,
    };
    // ... (delivery logic) ...
};

const sendNameChangeConfirmation = async (userEmail, newName, token) => {
    const confirmationLink = `${FRONTEND_URL}/confirm-name-change?token=${token}`;
    
    const mailOptions = {
        // ✅ FIX 3: Use the utility function for the FROM address
        from: `FinSafe Vault <${getSenderEmail()}>`, 
        to: userEmail,
        subject: `🔒 FinSafe Vault: Confirm New Username`,
        html: `<p>Click the link to confirm: <a href="${confirmationLink}">Confirm Username Change</a></p>`,
    };
    // ... (delivery logic) ...
};


module.exports = { sendMinBalanceAlert, sendWelcomeEmail, sendNameChangeConfirmation };