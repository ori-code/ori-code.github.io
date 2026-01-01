// Vercel Serverless Function: Delete Orphan User (Admin Only)
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
        const { uid, adminKey } = req.body;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Invalid admin key' });
        }

        if (!uid) {
            return res.status(400).json({ error: 'User UID is required' });
        }

        // Get user info before deleting
        let userEmail = 'unknown';
        try {
            const userRecord = await admin.auth().getUser(uid);
            userEmail = userRecord.email || 'no-email';
        } catch (e) {
            // User might not exist
        }

        // Delete user from Firebase Auth
        await admin.auth().deleteUser(uid);
        console.log(`Deleted orphan user ${uid} (${userEmail}) from Firebase Auth`);

        return res.status(200).json({
            success: true,
            message: `Orphan user ${userEmail} has been deleted from Firebase Auth`,
            uid
        });

    } catch (error) {
        console.error('Error deleting orphan user:', error);
        return res.status(500).json({ error: 'Failed to delete orphan user: ' + error.message });
    }
};
