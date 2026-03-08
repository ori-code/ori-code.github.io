// Vercel Serverless Function - Check if user can perform analysis
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: "https://chordsapp-e10e7-default-rtdb.firebaseio.com"
            });
        } else {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                databaseURL: "https://chordsapp-e10e7-default-rtdb.firebaseio.com"
            });
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

const db = admin.database();

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify Firebase ID token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized - No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let uid;
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            uid = decodedToken.uid;
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ error: 'Unauthorized - Invalid token' });
        }

        // Get user subscription and usage
        const subscriptionRef = db.ref(`users/${uid}/subscription`);
        const usageRef = db.ref(`users/${uid}/usage`);
        const bonusRef = db.ref(`users/${uid}/bonusAnalyses`);

        const [subscriptionSnap, usageSnap, bonusSnap] = await Promise.all([
            subscriptionRef.once('value'),
            usageRef.once('value'),
            bonusRef.once('value')
        ]);

        const subscription = subscriptionSnap.val() || { tier: 'FREE' };
        const usage = usageSnap.val() || { analysesThisMonth: 0, monthStartDate: new Date().toISOString() };
        const bonusAnalyses = bonusSnap.val() || 0;

        // Check if month has changed (reset usage)
        const monthStart = new Date(usage.monthStartDate);
        const now = new Date();
        if (monthStart.getMonth() !== now.getMonth() || monthStart.getFullYear() !== now.getFullYear()) {
            usage.analysesThisMonth = 0;
            usage.monthStartDate = now.toISOString();
            await usageRef.set(usage);
        }

        // Define tier limits
        const tierLimits = {
            FREE: 3,
            BASIC: 20,
            PRO: -1 // unlimited
        };

        const limit = tierLimits[subscription.tier] || 3;
        const used = usage.analysesThisMonth || 0;

        // Check if can analyze (unlimited OR under limit OR has bonus)
        const canAnalyze = limit === -1 || used < limit || bonusAnalyses > 0;

        return res.status(200).json({
            canAnalyze,
            tier: subscription.tier,
            limit: limit === -1 ? 'unlimited' : limit,
            used,
            remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - used),
            bonusAnalyses
        });

    } catch (error) {
        console.error('Error checking analysis permission:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
