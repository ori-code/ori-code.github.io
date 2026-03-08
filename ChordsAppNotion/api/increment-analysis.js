// Vercel Serverless Function - Increment analysis count after successful analysis
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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
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

        const usageRef = db.ref(`users/${uid}/usage`);
        const bonusRef = db.ref(`users/${uid}/bonusAnalyses`);

        const [usageSnap, bonusSnap] = await Promise.all([
            usageRef.once('value'),
            bonusRef.once('value')
        ]);

        const usage = usageSnap.val() || { analysesThisMonth: 0, monthStartDate: new Date().toISOString() };
        const bonusAnalyses = bonusSnap.val() || 0;

        // If user has bonus analyses, use those first
        if (bonusAnalyses > 0) {
            await bonusRef.set(bonusAnalyses - 1);
            return res.status(200).json({
                success: true,
                usedBonus: true,
                bonusRemaining: bonusAnalyses - 1
            });
        } else {
            // Otherwise increment monthly count
            usage.analysesThisMonth = (usage.analysesThisMonth || 0) + 1;
            await usageRef.set(usage);
            return res.status(200).json({
                success: true,
                usedBonus: false,
                analysesThisMonth: usage.analysesThisMonth
            });
        }

    } catch (error) {
        console.error('Error incrementing analysis count:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
