// Vercel Serverless Function: Reset Password (Admin Only)
const admin = require('firebase-admin');

// Initialize Firebase Admin (singleton pattern for Vercel)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://chordsapp-e10e7-default-rtdb.firebaseio.com"
        });
    } catch (error) {
        console.error('Firebase Admin init error:', error.message);
    }
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, newPassword, adminKey } = req.body;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Invalid admin key' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Update user password using Firebase Admin SDK
        await admin.auth().updateUser(userId, {
            password: newPassword
        });

        console.log(`Password reset for user ${userId}`);

        return res.status(200).json({
            success: true,
            message: `Password has been reset for user ${userId}`
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ error: 'Failed to reset password: ' + error.message });
    }
};
