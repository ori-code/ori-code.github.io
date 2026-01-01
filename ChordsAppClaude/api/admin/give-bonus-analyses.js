// Vercel Serverless Function: Give Bonus Analyses (Admin Only)
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
        const { userId, count, adminKey } = req.body;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Forbidden - Invalid admin key' });
        }

        if (!userId || !count || count <= 0) {
            return res.status(400).json({ error: 'Invalid request - userId and positive count required' });
        }

        const bonusRef = db.ref(`users/${userId}/bonusAnalyses`);
        const bonusSnap = await bonusRef.once('value');
        const currentBonus = bonusSnap.val() || 0;

        await bonusRef.set(currentBonus + count);

        return res.status(200).json({
            success: true,
            userId,
            bonusAdded: count,
            totalBonus: currentBonus + count
        });

    } catch (error) {
        console.error('Error giving bonus analyses:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
