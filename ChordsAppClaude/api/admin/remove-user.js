// Vercel Serverless Function: Remove User (Admin Only)
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

const db = admin.database();

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
        const { userId, adminKey } = req.body;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Invalid admin key' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Delete user from Firebase Authentication
        try {
            await admin.auth().deleteUser(userId);
            console.log(`Deleted user ${userId} from Firebase Auth`);
        } catch (authError) {
            console.error(`Error deleting user from Auth:`, authError.message);
        }

        // Delete user data from Realtime Database
        try {
            await db.ref(`users/${userId}`).remove();
            console.log(`Deleted user ${userId} data from Database`);
        } catch (dbError) {
            console.error(`Error deleting user from Database:`, dbError.message);
        }

        return res.status(200).json({
            success: true,
            message: `User ${userId} has been removed`,
            deletedFrom: {
                authentication: true,
                database: true
            }
        });

    } catch (error) {
        console.error('Error removing user:', error);
        return res.status(500).json({ error: 'Server error while removing user' });
    }
};
