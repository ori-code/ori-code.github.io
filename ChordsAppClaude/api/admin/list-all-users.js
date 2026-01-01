// Vercel Serverless Function: List All Users (Admin Only)
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
        const { adminKey } = req.query;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Forbidden - Invalid admin key' });
        }

        // Get all users from Firebase
        const usersSnapshot = await db.ref('users').once('value');
        const usersData = usersSnapshot.val();

        if (!usersData) {
            return res.json({ users: [] });
        }

        // Transform data into array and fetch user details from Firebase Auth
        const users = await Promise.all(Object.keys(usersData).map(async (userId) => {
            const userData = usersData[userId];

            // Get user email and displayName from Firebase Auth
            let email = 'N/A';
            let displayName = 'N/A';
            try {
                const userRecord = await admin.auth().getUser(userId);
                email = userRecord.email || 'N/A';
                displayName = userRecord.displayName || email.split('@')[0] || 'N/A';
            } catch (error) {
                console.error(`Error fetching auth data for user ${userId}:`, error.message);
            }

            return {
                userId,
                email,
                displayName,
                subscription: userData.subscription || { tier: 'FREE', status: 'active' },
                usage: userData.usage || { analysesThisMonth: 0, monthStartDate: new Date().toISOString() },
                bonusAnalyses: userData.bonusAnalyses || 0,
                songCount: userData.songs ? Object.keys(userData.songs).length : 0,
                maxSessions: userData.maxSessions || 1
            };
        }));

        return res.status(200).json({ users });

    } catch (error) {
        console.error('Error fetching all users:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
