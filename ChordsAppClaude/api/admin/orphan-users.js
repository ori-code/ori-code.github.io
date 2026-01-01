// Vercel Serverless Function: Find Orphan Users (Admin Only)
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
            return res.status(403).json({ error: 'Invalid admin key' });
        }

        // Get all users from Firebase Auth
        const listUsersResult = await admin.auth().listUsers(1000);
        const authUsers = listUsersResult.users;

        // Get all users from database
        const dbSnapshot = await db.ref('users').once('value');
        const dbUsers = dbSnapshot.val() || {};
        const dbUserIds = new Set(Object.keys(dbUsers));

        // Find orphan users (in Auth but not in DB)
        const orphanUsers = authUsers
            .filter(user => !dbUserIds.has(user.uid))
            .map(user => ({
                uid: user.uid,
                email: user.email || 'No email',
                displayName: user.displayName || 'No name',
                createdAt: user.metadata.creationTime,
                lastSignIn: user.metadata.lastSignInTime
            }));

        console.log(`Found ${orphanUsers.length} orphan users out of ${authUsers.length} total auth users`);

        return res.status(200).json({
            success: true,
            totalAuthUsers: authUsers.length,
            totalDbUsers: dbUserIds.size,
            orphanCount: orphanUsers.length,
            orphanUsers
        });

    } catch (error) {
        console.error('Error finding orphan users:', error);
        return res.status(500).json({ error: 'Failed to find orphan users: ' + error.message });
    }
};
