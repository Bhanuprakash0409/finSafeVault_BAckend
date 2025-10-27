const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    // Use host and port instead of 'service: gmail' for better reliability
    host: 'smtp.gmail.com', 
    port: 465, // Standard secure port
    secure: true, // Use SSL/TLS
    auth: {
        user: process.env.EMAIL_SERVICE_USER,
        pass: process.env.EMAIL_SERVICE_PASS,
    },
});

const sendMinBalanceAlert = async (userEmail, userName, currentBalance, minBalanceLimit) => {
    const mailOptions = {
        from: process.env.EMAIL_SERVICE_USER,
        to: userEmail,
        subject: `🚨 FinSafe Vault Alert: Low Account Balance!`,
        html: `
            <p>Dear ${userName},</p>
            <p>This is an automated alert from your FinSafe Vault.</p>
            <p style="color: red; font-size: 16px; font-weight: bold;">
                ⚠️ Your current account balance is low.
            </p>
            <ul>
                <li>Current Net Balance: <strong>₹${currentBalance.toFixed(2)}</strong></li>
                <li>Your Minimum Limit: <strong>₹${minBalanceLimit.toFixed(2)}</strong></li>
            </ul>
            <p>Please add funds to your account to maintain a healthy financial standing.</p>
            <br>
            <p>Thank you for using FinSafe Vault for secure financial clarity.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Minimum balance alert sent successfully to ${userEmail}`);
    } catch (error) {
        console.error(`[Email Error] Failed to send email to ${userEmail}:`, error);
    }
};

const sendWelcomeEmail = async (userEmail, userName) => {
    const mailOptions = {
        from: process.env.EMAIL_SERVICE_USER,
        to: userEmail,
        subject: `🎉 Welcome to FinSafe Vault, ${userName}!`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Welcome Aboard!</h2>
                <p>Hi ${userName},</p>
                <p>Thank you for creating an account with <strong>FinSafe Vault</strong>. We're excited to help you achieve financial clarity and security.</p>
                <p>You can now log in to your dashboard to start tracking your income and expenses.</p>
                <a href="http://localhost:3000/login" style="display: inline-block; padding: 10px 20px; margin: 10px 0; font-size: 16px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
                <br>
                <p>Best regards,<br>The FinSafe Vault Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Welcome email sent successfully to ${userEmail}`);
    } catch (error) {
        console.error(`[Email Error] Failed to send welcome email to ${userEmail}:`, error);
    }
};

const sendNameChangeConfirmation = async (userEmail, newName, token) => {
    // NOTE: Replace 'http://localhost:3000' with your actual frontend URL after deployment
    const confirmationLink = `http://localhost:3000/confirm-name-change?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_SERVICE_USER,
        to: userEmail,
        subject: `🔒 FinSafe Vault: Confirm New Username`,
        html: `
            <p>You requested to change your username to: <strong>${newName}</strong>.</p>
            <p>Please click the link below to confirm this change:</p>
            <p><a href="${confirmationLink}">Confirm Username Change</a></p>
            <p>If you did not request this change, please ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Name change confirmation sent to ${userEmail}`);
    } catch (error) {
        console.error(`[Email Error] Failed to send name change email to ${userEmail}:`, error);
    }
};


module.exports = { sendMinBalanceAlert, sendWelcomeEmail, sendNameChangeConfirmation };