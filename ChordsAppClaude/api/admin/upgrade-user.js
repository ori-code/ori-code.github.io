// Vercel Serverless Function: Upgrade User Tier (Admin Only)
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
        const { userId, tier, adminKey } = req.body;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Forbidden - Invalid admin key' });
        }

        // Validate tier
        const validTiers = ['FREE', 'BASIC', 'PRO'];
        if (!validTiers.includes(tier)) {
            return res.status(400).json({ error: 'Invalid tier - must be FREE, BASIC, or PRO' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'Invalid request - userId required' });
        }

        // Get current subscription
        const subRef = db.ref(`users/${userId}/subscription`);
        const subSnap = await subRef.once('value');
        const currentSub = subSnap.val() || {};

        // Update tier
        const updatedSub = {
            ...currentSub,
            tier: tier,
            status: 'active',
            startDate: currentSub.startDate || new Date().toISOString(),
            paypalSubscriptionId: tier === 'FREE' ? null : (currentSub.paypalSubscriptionId || null),
            endDate: null
        };

        await subRef.set(updatedSub);

        return res.status(200).json({
            success: true,
            userId,
            previousTier: currentSub.tier || 'FREE',
            newTier: tier,
            subscription: updatedSub
        });

    } catch (error) {
        console.error('Error upgrading user:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
