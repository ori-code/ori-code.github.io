const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Firebase Admin SDK
// For local development, use service account key
// For production, use environment variables or default credentials
const fs = require('fs');
const path = require('path');

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Production: Load from environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://chordsapp-e10e7-default-rtdb.firebaseio.com"
        });
        console.log('Firebase Admin initialized successfully (from env)');
    } else if (fs.existsSync(path.join(__dirname, 'firebase-admin-key.json'))) {
        // Development: Load from local file
        const serviceAccount = require('./firebase-admin-key.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://chordsapp-e10e7-default-rtdb.firebaseio.com"
        });
        console.log('Firebase Admin initialized successfully (from file)');
    } else {
        // Fallback: Try default credentials
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            databaseURL: "https://chordsapp-e10e7-default-rtdb.firebaseio.com"
        });
        console.log('Firebase Admin initialized successfully (default credentials)');
    }
} catch (error) {
    console.warn('Firebase Admin not initialized:', error.message);
    console.warn('Usage tracking will not work without Firebase Admin SDK');
    console.warn('Please download firebase-admin-key.json from Firebase Console');
}

const db = admin.database();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 image data
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const GEMINI_MODEL = 'gemini-2.0-flash-exp';

// Hebrew Chord Sheet OCR Prompt v2.0
const BASE_PROMPT = `You are an expert OCR assistant specialized in transcribing Hebrew worship/music chord sheets. Your task is to accurately read chord charts and output them in a standardized inline format.

## OUTPUT FORMAT (MANDATORY - FOLLOW EXACTLY)

Your response MUST begin with EXACTLY these 2 lines (no extra lines between them):
Title: [Song title in original language]
Key: [Key like "C Major" or "Am"] | BPM: [number or "Not specified"] | Time: [like "4/4"]

IMPORTANT: The second line MUST combine Key, BPM, and Time on ONE line separated by " | " (pipe with spaces).

Example correct format:
Title: שיר הללויה
Key: G Major | BPM: 120 | Time: 4/4

Then provide sections with inline chords. End with:
---
Analysis: [Your key detection reasoning]

## HEBREW TEXT HANDLING (CRITICAL)

1. **Reading Direction**: Hebrew lyrics are written RIGHT-TO-LEFT
2. **Chord Positioning**: In the source image, chords appear ABOVE the syllable where the chord changes
3. **Inline Conversion**: Place [chord] bracket IMMEDIATELY BEFORE the Hebrew word/syllable it applies to
4. **Word Order**: Preserve Hebrew word order exactly as written (RTL reading)
5. **Transliteration**: Do NOT transliterate Hebrew - keep original Hebrew characters

## SECTION MARKERS - HEBREW TO ENGLISH MAPPING

Recognize these Hebrew section names and output with English equivalent:
| Hebrew | Output As |
|--------|-----------|
| הקדמה | INTRO: |
| בית / בית א' / בית ב' | VERSE 1: / VERSE 2: |
| פזמון / פזמון א' | CHORUS: |
| פריקורס | PRE-CHORUS: |
| גשר / ברידג' | BRIDGE: |
| אאוטרו / סיום | OUTRO: |
| x2 / פעמיים | (x2) |

## INLINE CHORD FORMAT RULES

1. Chords go in square brackets: [C] [Am] [F] [G] [Dm] etc.
2. Place chord bracket at the START of the word/syllable where chord changes
3. If multiple chords on one line, space them according to lyric timing
4. For chord-only lines (like intros), write: [F] | [C] | [G] | [Am]

### Example Conversion:

**Source (chords above lyrics):**
    F              C
אני חוזר אליך, ומחליף עולי בשלך

**Output (inline format, RTL preserved):**
[F]אני חוזר אליך, ומ[C]חליף עולי בשלך

## KEY DETECTION ALGORITHM

### Step 1: Extract all unique chords from the sheet
List every chord you see (C, Am, F, G, Dm, Em, etc.)

### Step 2: Match against key signatures

**MAJOR KEYS** (I-ii-iii-IV-V-vi-vii°):
- C Major: C, Dm, Em, F, G, Am, Bdim
- G Major: G, Am, Bm, C, D, Em, F#dim
- D Major: D, Em, F#m, G, A, Bm, C#dim
- F Major: F, Gm, Am, Bb, C, Dm, Edim

**MINOR KEYS** (i-ii°-III-iv-v-VI-VII):
- A Minor: Am, Bdim, C, Dm, Em, F, G
- E Minor: Em, F#dim, G, Am, Bm, C, D
- D Minor: Dm, Edim, F, Gm, Am, Bb, C

### Step 3: Determine tonal center
- Which chord does the song resolve to?
- Which chord starts/ends sections?
- What's the "home" feeling chord?

### Step 4: Report with confidence
Always provide a key - use "likely" if uncertain.

## MULTI-COLUMN LAYOUT HANDLING (CRITICAL FOR HEBREW SHEETS)

Hebrew chord sheets are OFTEN printed in 2-COLUMN LAYOUT. This is very common!

### How to detect 2-column layout:
- Page is divided vertically into two halves
- Each column has its own section headers (בית א', פזמון, etc.)
- Sections in left column are typically continuations (בית ב', פזמון ב')

### Reading order for 2-column Hebrew sheets:
1. **RIGHT COLUMN FIRST** - This is column 1 (Hebrew reads right-to-left)
2. **LEFT COLUMN SECOND** - This is column 2
3. Within each column: read TOP to BOTTOM
4. Output ALL sections from right column, THEN all sections from left column

### Visual example of 2-column layout:
Page layout (what you see):
|  LEFT COLUMN (read 2nd)  |  RIGHT COLUMN (read 1st)  |
|  בית ב'                   |  הקדמה                    |
|  פזמון ב'                 |  בית א'                   |
|  פריקורס ב'               |  פריקורס א'               |
|                          |  פזמון א'                 |

Correct output order:
1. INTRO (הקדמה) - from right column
2. VERSE 1 (בית א') - from right column
3. PRE-CHORUS (פריקורס א') - from right column
4. CHORUS (פזמון א') - from right column
5. VERSE 2 (בית ב') - from left column
6. CHORUS 2 (פזמון ב') - from left column
7. PRE-CHORUS 2 (פריקורס ב') - from left column

### Text alignment within columns:
- Hebrew text is RIGHT-ALIGNED within each column
- Chords appear ABOVE the lyrics they belong to
- The rightmost chord in a line applies to the rightmost word

## COMMON OCR CHALLENGES - HEBREW SPECIFIC

| Issue | Solution |
|-------|----------|
| ו vs י | Context: ו often connects words, י often at word end |
| ה vs ח | Check word meaning context |
| כ vs ב | Look at stroke details |
| ם vs מ | ם is always word-final |
| ן vs נ | ן is always word-final |
| Missing niqqud | Hebrew chord sheets rarely have vowel marks - this is normal |

## QUALITY CHECKLIST (Verify before outputting)

- Title extracted correctly in Hebrew
- Key: line is present and populated
- All sections labeled (VERSE, CHORUS, etc.)
- Chords are in [brackets]
- Hebrew text preserved exactly (not transliterated)
- Multi-column layout read in correct order (right-to-left columns)
- Analysis section explains key choice

## ERROR HANDLING

If image is unclear or partially visible:
1. Transcribe what you CAN read accurately
2. Mark unclear sections with [unclear]
3. Note in Analysis what was difficult to read
4. Still provide your best key estimate

NEVER say "I cannot read this" - always attempt transcription with confidence markers.`;

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'ChordsAppClaude API is running' });
});

// Main OCR endpoint - Using Google Gemini
app.post('/api/analyze-chart', async (req, res) => {
    try {
        let base64Image, mimeType;
        const feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() : '';
        const previousTranscription = typeof req.body.previousTranscription === 'string' ? req.body.previousTranscription.trim() : '';

        if (req.body.imageData && req.body.mimeType) {
            base64Image = req.body.imageData;
            mimeType = req.body.mimeType;
            console.log('Processing JSON request with base64 image');
        } else {
            return res.status(400).json({ error: 'No image data provided. Expected imageData and mimeType in JSON body.' });
        }

        // Build prompt with context
        let fullPrompt = BASE_PROMPT;

        if (previousTranscription) {
            fullPrompt = `Previous transcription (for reference):\n${previousTranscription}\n\n` + fullPrompt;
        }

        if (feedback) {
            fullPrompt = `User feedback requesting corrections: ${feedback}\n\n` + fullPrompt;
        }

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        // Prepare image part for Gemini
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType
            }
        };

        // Call Gemini API
        const result = await model.generateContent([fullPrompt, imagePart]);
        const response = await result.response;
        const extractedText = response.text() || '';

        console.log('=== GEMINI RESPONSE ===');
        console.log('First 500 chars:', extractedText.substring(0, 500));
        console.log('Has Key line?:', extractedText.includes('Key:'));
        console.log('Has Analysis line?:', extractedText.includes('Analysis:'));
        console.log('Transcription successful');

        res.json({
            success: true,
            transcription: extractedText,
            metadata: {
                model: GEMINI_MODEL,
                feedbackApplied: Boolean(feedback)
            }
        });

    } catch (error) {
        console.error('Error analyzing chart:', error);

        const status = error.response?.status || 500;
        let message = error.message || 'Failed to analyze chart';

        res.status(status).json({
            error: 'Failed to analyze chart',
            message
        });
    }
});
// ============= USAGE TRACKING ENDPOINTS =============

/**
 * Verify Firebase ID token from client
 */
async function verifyUser(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized - No token provided' });
        return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
        return null;
    }
}

/**
 * Check if user can perform analysis
 * GET /api/can-analyze
 */
app.get('/api/can-analyze', async (req, res) => {
    try {
        const uid = await verifyUser(req, res);
        if (!uid) return;

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

        res.json({
            canAnalyze,
            tier: subscription.tier,
            limit: limit === -1 ? 'unlimited' : limit,
            used,
            remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - used),
            bonusAnalyses
        });

    } catch (error) {
        console.error('Error checking analysis permission:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Increment analysis count after successful analysis
 * POST /api/increment-analysis
 */
app.post('/api/increment-analysis', async (req, res) => {
    try {
        const uid = await verifyUser(req, res);
        if (!uid) return;

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
            res.json({
                success: true,
                usedBonus: true,
                bonusRemaining: bonusAnalyses - 1
            });
        } else {
            // Otherwise increment monthly count
            usage.analysesThisMonth += 1;
            await usageRef.set(usage);
            res.json({
                success: true,
                usedBonus: false,
                analysesThisMonth: usage.analysesThisMonth
            });
        }

    } catch (error) {
        console.error('Error incrementing analysis count:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Give bonus analyses to a user (ADMIN ONLY)
 * POST /api/admin/give-bonus-analyses
 * Body: { userId: string, count: number, adminKey: string }
 */
app.post('/api/admin/give-bonus-analyses', async (req, res) => {
    try {
        const { userId, count, adminKey } = req.body;

        // Verify admin key (set in .env)
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

        res.json({
            success: true,
            userId,
            bonusAdded: count,
            totalBonus: currentBonus + count
        });

    } catch (error) {
        console.error('Error giving bonus analyses:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Upgrade user tier (ADMIN ONLY)
 * POST /api/admin/upgrade-user
 * Body: { userId: string, tier: 'FREE'|'BASIC'|'PRO', adminKey: string }
 */
app.post('/api/admin/upgrade-user', async (req, res) => {
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

        res.json({
            success: true,
            userId,
            previousTier: currentSub.tier || 'FREE',
            newTier: tier,
            subscription: updatedSub
        });

    } catch (error) {
        console.error('Error upgrading user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Get user usage stats (ADMIN ONLY)
 * GET /api/admin/user-stats/:userId?adminKey=xxx
 */
app.get('/api/admin/user-stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { adminKey } = req.query;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Forbidden - Invalid admin key' });
        }

        const [subscriptionSnap, usageSnap, bonusSnap] = await Promise.all([
            db.ref(`users/${userId}/subscription`).once('value'),
            db.ref(`users/${userId}/usage`).once('value'),
            db.ref(`users/${userId}/bonusAnalyses`).once('value')
        ]);

        res.json({
            userId,
            subscription: subscriptionSnap.val() || { tier: 'FREE' },
            usage: usageSnap.val() || { analysesThisMonth: 0 },
            bonusAnalyses: bonusSnap.val() || 0
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Get all users' usage stats (ADMIN ONLY)
 * GET /api/admin/list-all-users?adminKey=xxx
 */
app.get('/api/admin/list-all-users', async (req, res) => {
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

        res.json({ users });

    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/admin/remove-user
 * Remove a user completely (auth + database)
 */
app.post('/api/admin/remove-user', async (req, res) => {
    const { userId, adminKey } = req.body;

    // Verify admin key
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Invalid admin key' });
    }

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Delete user from Firebase Authentication
        try {
            await admin.auth().deleteUser(userId);
            console.log(`✅ Deleted user ${userId} from Firebase Auth`);
        } catch (authError) {
            console.error(`Error deleting user from Auth:`, authError.message);
            // Continue even if auth deletion fails - user might not exist in auth
        }

        // Delete user data from Realtime Database
        try {
            await db.ref(`users/${userId}`).remove();
            console.log(`✅ Deleted user ${userId} data from Database`);
        } catch (dbError) {
            console.error(`Error deleting user from Database:`, dbError.message);
        }

        res.json({
            success: true,
            message: `User ${userId} has been removed`,
            deletedFrom: {
                authentication: true,
                database: true
            }
        });

    } catch (error) {
        console.error('Error removing user:', error);
        res.status(500).json({ error: 'Server error while removing user' });
    }
});

/**
 * POST /api/admin/reset-password
 * Reset a user's password (ADMIN ONLY)
 * Body: { userId: string, newPassword: string, adminKey: string }
 */
app.post('/api/admin/reset-password', async (req, res) => {
    const { userId, newPassword, adminKey } = req.body;

    // Verify admin key
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Invalid admin key' });
    }

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Update user password using Firebase Admin SDK
        await admin.auth().updateUser(userId, {
            password: newPassword
        });

        console.log(`✅ Password reset for user ${userId}`);

        res.json({
            success: true,
            message: `Password has been reset for user ${userId}`
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password: ' + error.message });
    }
});

/**
 * POST /api/admin/set-max-devices
 * Set maximum allowed devices for a user (ADMIN ONLY)
 * Body: { userId: string, maxDevices: number, adminKey: string }
 */
app.post('/api/admin/set-max-devices', async (req, res) => {
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

    try {
        // Update maxSessions in Firebase Realtime Database
        await db.ref(`users/${userId}/maxSessions`).set(devices);

        console.log(`✅ Max devices set to ${devices} for user ${userId}`);

        res.json({
            success: true,
            message: `Max devices set to ${devices}`,
            maxDevices: devices
        });

    } catch (error) {
        console.error('Error setting max devices:', error);
        res.status(500).json({ error: 'Failed to set max devices: ' + error.message });
    }
});

/**
 * GET /api/admin/orphan-users
 * Find users that exist in Firebase Auth but not in the database (ADMIN ONLY)
 * These are "orphan" users that can't be managed through the normal admin panel
 */
app.get('/api/admin/orphan-users', async (req, res) => {
    const { adminKey } = req.query;

    // Verify admin key
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Invalid admin key' });
    }

    try {
        // Get all users from Firebase Auth
        const listUsersResult = await admin.auth().listUsers(1000); // Max 1000 users
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

        res.json({
            success: true,
            totalAuthUsers: authUsers.length,
            totalDbUsers: dbUserIds.size,
            orphanCount: orphanUsers.length,
            orphanUsers
        });

    } catch (error) {
        console.error('Error finding orphan users:', error);
        res.status(500).json({ error: 'Failed to find orphan users: ' + error.message });
    }
});

/**
 * POST /api/admin/delete-orphan-user
 * Delete an orphan user from Firebase Auth only (ADMIN ONLY)
 * Body: { uid: string, adminKey: string }
 */
app.post('/api/admin/delete-orphan-user', async (req, res) => {
    const { uid, adminKey } = req.body;

    // Verify admin key
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Invalid admin key' });
    }

    if (!uid) {
        return res.status(400).json({ error: 'User UID is required' });
    }

    try {
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
        console.log(`✅ Deleted orphan user ${uid} (${userEmail}) from Firebase Auth`);

        res.json({
            success: true,
            message: `Orphan user ${userEmail} has been deleted from Firebase Auth`,
            uid
        });

    } catch (error) {
        console.error('Error deleting orphan user:', error);
        res.status(500).json({ error: 'Failed to delete orphan user: ' + error.message });
    }
});

// Start server - bind to 0.0.0.0 to accept connections from any network interface
app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChordsAppClaude API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Usage tracking: http://localhost:${PORT}/api/can-analyze`);
});
