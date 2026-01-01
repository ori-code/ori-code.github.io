// Vercel Serverless Function: Get User Stats (Admin Only)
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, adminKey } = req.query;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Forbidden - Invalid admin key' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const [subscriptionSnap, usageSnap, bonusSnap] = await Promise.all([
            db.ref(`users/${userId}/subscription`).once('value'),
            db.ref(`users/${userId}/usage`).once('value'),
            db.ref(`users/${userId}/bonusAnalyses`).once('value')
        ]);

        return res.status(200).json({
            userId,
            subscription: subscriptionSnap.val() || { tier: 'FREE' },
            usage: usageSnap.val() || { analysesThisMonth: 0 },
            bonusAnalyses: bonusSnap.val() || 0
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
