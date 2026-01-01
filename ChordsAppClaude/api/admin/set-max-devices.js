// Vercel Serverless Function: Set Max Devices (Admin Only)
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
        const { userId, maxDevices, adminKey } = req.body;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Invalid admin key' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const devices = parseInt(maxDevices);
        if (!devices || devices < 1 || devices > 10) {
            return res.status(400).json({ error: 'Max devices must be between 1 and 10' });
        }

        // Update maxSessions in Firebase Realtime Database
        await db.ref(`users/${userId}/maxSessions`).set(devices);

        console.log(`Max devices set to ${devices} for user ${userId}`);

        return res.status(200).json({
            success: true,
            message: `Max devices set to ${devices}`,
            maxDevices: devices
        });

    } catch (error) {
        console.error('Error setting max devices:', error);
        return res.status(500).json({ error: 'Failed to set max devices: ' + error.message });
    }
};
