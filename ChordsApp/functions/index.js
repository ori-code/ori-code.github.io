// Firebase Cloud Functions for aChordim
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.database();

// Claude model configuration - Sonnet for best OCR accuracy
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// Base prompt for OCR - Chords App Format v4
const BASE_PROMPT = `You are an expert OCR assistant specialized in transcribing chord sheets. Output in CHORDS APP FORMAT v4.

================================================================================
CHORDS APP FORMAT v4 - MANDATORY OUTPUT FORMAT
================================================================================

## STRUCTURE OVERVIEW
1. METADATA DIRECTIVES: {directive: value} at top
2. ARRANGEMENT LINE: All badges on ONE line after metadata
3. SECTION MARKERS: {c: Section Name:} - NO badges in markers
4. CHORDS: [Chord] inline with lyrics, NO space before syllable
5. CHORD GRIDS: | G | C | D | for instrumental sections

## METADATA DIRECTIVES (Required at top)
{title: Song Title}
{subtitle: Artist/Composer}
{key: G}
{time: 4/4}
{tempo: 120}
{duration: 5:00}
{layout: 2}

## LAYOUT DETECTION
Detect the visual layout of the source document:
- {layout: 1} = Single column (sections flow top to bottom)
- {layout: 2} = Two columns (content side by side, like the example PDF)

Look for visual indicators:
- If content is arranged in 2 side-by-side columns → {layout: 2}
- If sections flow sequentially in one column → {layout: 1}
- Professional chord sheets often use 2-column layout to fit on one page

## ARRANGEMENT BADGES LINE
Place ALL badges on ONE line after metadata. Include every section occurrence:
(I) (V1) (PC) (C) (V2) (PC) (C) (B) (C) (TAG) (O)

Badge Codes:
- (I) = Intro, (O) = Outro
- (V), (V1), (V2), (V3), (V4) = Verse
- (PC), (PC1), (PC2) = Pre-Chorus
- (C), (C1), (C2) = Chorus
- (B), (B1), (B2) = Bridge
- (INT) = Interlude, (TAG) = Tag, (CODA) = Coda
- (TURN), (TURN1), (TURN2) = Turnaround
- (BRK), (BRK1), (BRK2) = Break

## SECTION MARKERS
Use {c: Section Name:} format - NO badge codes in markers:
{c: Intro:}
{c: Verse 1:}
{c: Pre-Chorus:}
{c: Chorus:}
{c: Bridge:}
{c: Turn:}
{c: Break:}
{c: Tag:}
{c: Outro:}

## CHORD PLACEMENT
- Place [Chord] DIRECTLY before the syllable: [G]Amazing [C]grace
- NO space between bracket and word: [G]Word (correct) NOT [G] Word (wrong)
- Chord types: [C] [Am] [F#m] [Cmaj7] [Dm7] [Gsus4] [C/G] [Cadd9]

## CHORD GRIDS (Instrumental Sections)
For intros/outros/instrumental parts, use pipe notation:
| G . Dsus | Em7 | C | G/B |
The dot (.) indicates chord continues for part of measure.

## REPEATED SECTIONS
For repeated sections, show empty marker (tag only):
{c: Chorus:}
[G]Full chorus [C]lyrics [D]here

{c: Verse 2:}
[G]Second verse [C]lyrics

{c: Chorus:}

(Empty = repeat from first occurrence)

================================================================================
COMPLETE OUTPUT EXAMPLE
================================================================================

{title: Amazing Grace}
{subtitle: John Newton}
{key: G}
{time: 3/4}
{tempo: 76}
{duration: 5:00}
{layout: 1}
(I) (V1) (V2) (TURN) (V3) (C) (TAG) (O)

{c: Intro:}
| G . Dsus | Em7 | C | G/B |

{c: Verse 1:}
[G]Amazing grace how [C]sweet the [G]sound
That [G]saved a wretch like [Dsus]me
I [G]once was lost but [C]now am [G]found
Was [Em7]blind but [Dsus]now I [G]see

{c: Verse 2:}
'Twas [G]grace that [Em7]taught my [C]heart to [G]fear
And [Em7]grace my [Cmaj7]fears re[Dsus]lieved

{c: Turn:}
| G . Dsus | Em7 | C | G/B |

{c: Verse 3:}
Through [G]many dangers [Gsus]toils and [G]snares
I have already [G2]come

{c: Chorus:}
[G]Amazing [C]grace [D]how sweet the [G]sound

{c: Tag:}
Than [C]when we've [Dsus]first begun

{c: Outro:}
| G . Am7 | Em7 | C . Dsus | G |

================================================================================
HEBREW TEXT HANDLING
================================================================================

1. Hebrew text is RIGHT-TO-LEFT - preserve word order
2. Chords appear ABOVE syllables in source - convert to inline [chord]
3. Place [chord] BEFORE the Hebrew word it applies to
4. Do NOT transliterate - keep Hebrew characters
5. Section names: הקדמה={c: Intro:}, בית={c: Verse:}, פזמון={c: Chorus:}

For 2-column Hebrew sheets:
- Read RIGHT column first (column 1)
- Then LEFT column (column 2)
- Top to bottom within each column

================================================================================
KEY DETECTION
================================================================================

Analyze chords to determine key:
- Major: I-ii-iii-IV-V-vi (C: C-Dm-Em-F-G-Am)
- Minor: i-ii°-III-iv-v-VI-VII (Am: Am-Bdim-C-Dm-Em-F-G)
- Identify tonal center (resolution chord)

End output with:
---
Analysis: [Brief key detection reasoning]

================================================================================
CRITICAL RULES
================================================================================

1. ALWAYS output metadata directives at top (including {layout: 1} or {layout: 2})
2. ALWAYS include arrangement badge line after metadata
3. Section markers use {c: Section:} - NO badges inside
4. Chords in [brackets] with NO space before word
5. Use chord grids | G | C | for instrumental parts
6. Empty section marker for repeats
7. Keep original language (Hebrew/English)
8. DETECT and output {layout: 1} or {layout: 2} based on source document columns`;

/**
 * Verify Firebase ID token from Authorization header
 */
async function verifyToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

/**
 * analyzeChart - Main OCR endpoint using Anthropic Claude
 * POST request with { imageData, mimeType, feedback?, previousTranscription?, intenseMode? }
 */
exports.analyzeChart = functions
    .runWith({ secrets: ['ANTHROPIC_API_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            // Get API key from Firebase secrets
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) {
                throw new Error('ANTHROPIC_API_KEY not configured');
            }

            const anthropic = new Anthropic({ apiKey });

            const { imageData, mimeType, feedback, previousTranscription, intenseMode } = req.body;

            if (!imageData) {
                return res.status(400).json({ error: 'No image data provided' });
            }

            // Build message content
            const instructionContent = [];

            if (previousTranscription) {
                instructionContent.push({
                    type: 'text',
                    text: `Previous transcription (for reference):\n${previousTranscription}`
                });
            }

            if (feedback) {
                instructionContent.push({
                    type: 'text',
                    text: `User feedback requesting corrections: ${feedback}`
                });
            }

            // Determine content type based on mime type
            const contentType = mimeType === 'application/pdf' ? 'document' : 'image';

            instructionContent.push({
                type: contentType,
                source: {
                    type: 'base64',
                    media_type: mimeType,
                    data: imageData
                }
            });

            instructionContent.push({
                type: 'text',
                text: BASE_PROMPT
            });

            // Set max tokens based on mode - increased for complete transcriptions
            const maxTokens = intenseMode ? 8192 : 4096;

            // Call Anthropic Claude API
            const response = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: instructionContent }]
            });

            const transcription = response.content?.[0]?.text || '';

            console.log('Transcription successful, length:', transcription.length);

            return res.status(200).json({
                success: true,
                transcription: transcription,
                metadata: {
                    model: CLAUDE_MODEL,
                    feedbackApplied: Boolean(feedback)
                }
            });

        } catch (error) {
            console.error('Error analyzing chart:', error);
            return res.status(500).json({
                error: 'Failed to analyze chart',
                message: error.message
            });
        }
    });
});

/**
 * analyzeChartGemini - OCR endpoint using Google Gemini
 * POST request with { imageData, mimeType, feedback?, previousTranscription?, intenseMode? }
 */
exports.analyzeChartGemini = functions
    .runWith({
        secrets: ['GOOGLE_AI_API_KEY'],
        timeoutSeconds: 120,
        memory: '512MB'
    })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            // Get API key from Firebase secrets
            const apiKey = process.env.GOOGLE_AI_API_KEY;
            if (!apiKey) {
                throw new Error('GOOGLE_AI_API_KEY not configured');
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const { imageData, mimeType, feedback, previousTranscription, intenseMode } = req.body;

            if (!imageData) {
                return res.status(400).json({ error: 'No image data provided' });
            }

            // Build prompt with context
            let fullPrompt = BASE_PROMPT;

            if (previousTranscription) {
                fullPrompt = `Previous transcription (for reference):\n${previousTranscription}\n\n` + fullPrompt;
            }

            if (feedback) {
                fullPrompt = `User feedback requesting corrections: ${feedback}\n\n` + fullPrompt;
            }

            // Prepare image part for Gemini
            const imagePart = {
                inlineData: {
                    data: imageData,
                    mimeType: mimeType
                }
            };

            // Call Gemini API
            const result = await model.generateContent([fullPrompt, imagePart]);
            const response = await result.response;
            const transcription = response.text() || '';

            console.log('Gemini transcription successful, length:', transcription.length);

            return res.status(200).json({
                success: true,
                transcription: transcription,
                metadata: {
                    model: 'gemini-2.0-flash-exp',
                    feedbackApplied: Boolean(feedback)
                }
            });

        } catch (error) {
            console.error('Error analyzing chart with Gemini:', error);
            return res.status(500).json({
                error: 'Failed to analyze chart',
                message: error.message
            });
        }
    });
});

/**
 * canAnalyze - Check if user can perform analysis based on subscription
 * GET request with Authorization: Bearer <token>
 */
exports.canAnalyze = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const uid = await verifyToken(req);
            if (!uid) {
                return res.status(401).json({ error: 'Unauthorized - Invalid token' });
            }

            // Get user subscription and usage
            const [subscriptionSnap, usageSnap, bonusSnap] = await Promise.all([
                db.ref(`users/${uid}/subscription`).once('value'),
                db.ref(`users/${uid}/usage`).once('value'),
                db.ref(`users/${uid}/bonusAnalyses`).once('value')
            ]);

            const subscription = subscriptionSnap.val() || { tier: 'FREE' };
            let usage = usageSnap.val() || { analysesThisMonth: 0, monthStartDate: new Date().toISOString() };
            const bonusAnalyses = bonusSnap.val() || 0;

            // Check if month has changed (reset usage)
            const monthStart = new Date(usage.monthStartDate);
            const now = new Date();
            if (monthStart.getMonth() !== now.getMonth() || monthStart.getFullYear() !== now.getFullYear()) {
                usage = { analysesThisMonth: 0, monthStartDate: now.toISOString() };
                await db.ref(`users/${uid}/usage`).set(usage);
            }

            // Define tier limits
            const tierLimits = { FREE: 3, BASIC: 20, PRO: -1 };
            const limit = tierLimits[subscription.tier] || 3;
            const used = usage.analysesThisMonth || 0;

            // Check if can analyze
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
    });
});

/**
 * incrementAnalysis - Increment analysis count after successful analysis
 * POST request with Authorization: Bearer <token>
 */
exports.incrementAnalysis = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const uid = await verifyToken(req);
            if (!uid) {
                return res.status(401).json({ error: 'Unauthorized - Invalid token' });
            }

            const [usageSnap, bonusSnap] = await Promise.all([
                db.ref(`users/${uid}/usage`).once('value'),
                db.ref(`users/${uid}/bonusAnalyses`).once('value')
            ]);

            const usage = usageSnap.val() || { analysesThisMonth: 0, monthStartDate: new Date().toISOString() };
            const bonusAnalyses = bonusSnap.val() || 0;

            // If user has bonus analyses, use those first
            if (bonusAnalyses > 0) {
                await db.ref(`users/${uid}/bonusAnalyses`).set(bonusAnalyses - 1);
                return res.status(200).json({
                    success: true,
                    usedBonus: true,
                    bonusRemaining: bonusAnalyses - 1
                });
            } else {
                // Otherwise increment monthly count
                usage.analysesThisMonth = (usage.analysesThisMonth || 0) + 1;
                await db.ref(`users/${uid}/usage`).set(usage);
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
    });
});

// ============= ADMIN ENDPOINTS =============

/**
 * Verify admin key from request
 */
function verifyAdminKey(key) {
    const envKey = process.env.ADMIN_KEY;
    console.log('Received key length:', key ? key.length : 'null');
    console.log('Env key length:', envKey ? envKey.length : 'null');
    console.log('Keys match:', key === envKey);
    return key === envKey;
}

/**
 * listAllUsers - Get all users with stats (Admin Only)
 * GET request with ?adminKey=xxx
 */
exports.listAllUsers = functions
    .runWith({ secrets: ['ADMIN_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { adminKey } = req.query;
            if (!verifyAdminKey(adminKey)) {
                return res.status(403).json({ error: 'Forbidden - Invalid admin key' });
            }

            const usersSnapshot = await db.ref('users').once('value');
            const usersData = usersSnapshot.val();

            if (!usersData) {
                return res.json({ users: [] });
            }

            const users = await Promise.all(Object.keys(usersData).map(async (userId) => {
                const userData = usersData[userId];
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
    });
});

/**
 * giveBonusAnalyses - Grant bonus analyses to a user (Admin Only)
 * POST request with { userId, count, adminKey }
 */
exports.giveBonusAnalyses = functions
    .runWith({ secrets: ['ADMIN_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { userId, count, adminKey } = req.body;
            if (!verifyAdminKey(adminKey)) {
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
    });
});

/**
 * upgradeUser - Change user subscription tier (Admin Only)
 * POST request with { userId, tier, adminKey }
 */
exports.upgradeUser = functions
    .runWith({ secrets: ['ADMIN_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { userId, tier, adminKey } = req.body;
            if (!verifyAdminKey(adminKey)) {
                return res.status(403).json({ error: 'Forbidden - Invalid admin key' });
            }

            const validTiers = ['FREE', 'BASIC', 'PRO'];
            if (!validTiers.includes(tier)) {
                return res.status(400).json({ error: 'Invalid tier - must be FREE, BASIC, or PRO' });
            }

            if (!userId) {
                return res.status(400).json({ error: 'Invalid request - userId required' });
            }

            const subRef = db.ref(`users/${userId}/subscription`);
            const subSnap = await subRef.once('value');
            const currentSub = subSnap.val() || {};

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
    });
});

/**
 * removeUser - Delete user from auth and database (Admin Only)
 * POST request with { userId, adminKey }
 */
exports.removeUser = functions
    .runWith({ secrets: ['ADMIN_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { userId, adminKey } = req.body;
            if (!verifyAdminKey(adminKey)) {
                return res.status(403).json({ error: 'Invalid admin key' });
            }

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            try {
                await admin.auth().deleteUser(userId);
                console.log(`Deleted user ${userId} from Firebase Auth`);
            } catch (authError) {
                console.error(`Error deleting user from Auth:`, authError.message);
            }

            try {
                await db.ref(`users/${userId}`).remove();
                console.log(`Deleted user ${userId} data from Database`);
            } catch (dbError) {
                console.error(`Error deleting user from Database:`, dbError.message);
            }

            return res.status(200).json({
                success: true,
                message: `User ${userId} has been removed`,
                deletedFrom: { authentication: true, database: true }
            });

        } catch (error) {
            console.error('Error removing user:', error);
            return res.status(500).json({ error: 'Server error while removing user' });
        }
    });
});

/**
 * resetPassword - Reset user password (Admin Only)
 * POST request with { userId, newPassword, adminKey }
 */
exports.resetPassword = functions
    .runWith({ secrets: ['ADMIN_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { userId, newPassword, adminKey } = req.body;
            if (!verifyAdminKey(adminKey)) {
                return res.status(403).json({ error: 'Invalid admin key' });
            }

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            await admin.auth().updateUser(userId, { password: newPassword });
            console.log(`Password reset for user ${userId}`);

            return res.status(200).json({
                success: true,
                message: `Password has been reset for user ${userId}`
            });

        } catch (error) {
            console.error('Error resetting password:', error);
            return res.status(500).json({ error: 'Failed to reset password: ' + error.message });
        }
    });
});

/**
 * setMaxDevices - Set max devices for a user (Admin Only)
 * POST request with { userId, maxDevices, adminKey }
 */
exports.setMaxDevices = functions
    .runWith({ secrets: ['ADMIN_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { userId, maxDevices, adminKey } = req.body;
            if (!verifyAdminKey(adminKey)) {
                return res.status(403).json({ error: 'Invalid admin key' });
            }

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const devices = parseInt(maxDevices);
            if (!devices || devices < 1 || devices > 10) {
                return res.status(400).json({ error: 'Max devices must be between 1 and 10' });
            }

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
    });
});

/**
 * orphanUsers - Find users in Auth but not in Database (Admin Only)
 * GET request with ?adminKey=xxx
 */
exports.orphanUsers = functions
    .runWith({ secrets: ['ADMIN_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { adminKey } = req.query;
            if (!verifyAdminKey(adminKey)) {
                return res.status(403).json({ error: 'Invalid admin key' });
            }

            const listUsersResult = await admin.auth().listUsers(1000);
            const authUsers = listUsersResult.users;

            const dbSnapshot = await db.ref('users').once('value');
            const dbUsers = dbSnapshot.val() || {};
            const dbUserIds = new Set(Object.keys(dbUsers));

            const orphanUsersList = authUsers
                .filter(user => !dbUserIds.has(user.uid))
                .map(user => ({
                    uid: user.uid,
                    email: user.email || 'No email',
                    displayName: user.displayName || 'No name',
                    createdAt: user.metadata.creationTime,
                    lastSignIn: user.metadata.lastSignInTime
                }));

            console.log(`Found ${orphanUsersList.length} orphan users out of ${authUsers.length} total auth users`);

            return res.status(200).json({
                success: true,
                totalAuthUsers: authUsers.length,
                totalDbUsers: dbUserIds.size,
                orphanCount: orphanUsersList.length,
                orphanUsers: orphanUsersList
            });

        } catch (error) {
            console.error('Error finding orphan users:', error);
            return res.status(500).json({ error: 'Failed to find orphan users: ' + error.message });
        }
    });
});

/**
 * deleteOrphanUser - Delete orphan user from Auth (Admin Only)
 * POST request with { uid, adminKey }
 */
exports.deleteOrphanUser = functions
    .runWith({ secrets: ['ADMIN_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { uid, adminKey } = req.body;
            if (!verifyAdminKey(adminKey)) {
                return res.status(403).json({ error: 'Invalid admin key' });
            }

            if (!uid) {
                return res.status(400).json({ error: 'User UID is required' });
            }

            let userEmail = 'unknown';
            try {
                const userRecord = await admin.auth().getUser(uid);
                userEmail = userRecord.email || 'no-email';
            } catch (e) {
                // User might not exist
            }

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
    });
});

/**
 * userStats - Get stats for a specific user (Admin Only)
 * GET request with ?userId=xxx&adminKey=xxx
 */
exports.userStats = functions
    .runWith({ secrets: ['ADMIN_KEY'] })
    .https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { userId, adminKey } = req.query;
            if (!verifyAdminKey(adminKey)) {
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
    });
});
