const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
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

// Initialize Anthropic Claude
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';

const BASE_PROMPT = `You are an OCR assistant helping a musician transcribe their personal handwritten chord chart for practice purposes.

CRITICAL REQUIREMENT - YOUR RESPONSE MUST START WITH:
Number: [song number if visible]
Title: [song name if visible]
Key: [THE DETECTED KEY - REQUIRED - NEVER SKIP THIS LINE]

Then provide the lyrics with inline chord brackets, then end with:
Analysis: [Detailed explanation of the key detection]

TASK: Read ALL visible text from this image and format as an inline chord chart.

FORMATTING RULES:
- Place chords in square brackets [C] [G] [Em] etc. directly within the lyric lines
- Insert the chord bracket right before the syllable where the chord changes
- Preserve all words/lyrics from the image EXACTLY as written (Hebrew, English, or any language)
- Include section markers if visible (Verse 1:, Chorus:, Bridge:, etc.)
- Identify song number and title if present
- The "Key:" line is MANDATORY - analyze the chords and provide the most likely key
- Detect the overall lyric language direction. If the text is left-to-right (English, Spanish, etc.), interpret chord placement and key detection left-to-right. If the text is right-to-left (Hebrew, Arabic, etc.), interpret chord placement, lyric alignment, and harmonic analysis right-to-left so chords stay over their intended syllables.
- End with an "Analysis:" section explaining your key choice

KEY DETECTION REFERENCE (Music Theory):
MAJOR KEYS - Pattern: I (major), ii (minor), iii (minor), IV (major), V (major), vi (minor), vii° (diminished)
• C Major: C, Dm, Em, F, G, Am, Bdim
• D Major: D, Em, F#m, G, A, Bm, C#dim
• E Major: E, F#m, G#m, A, B, C#m, D#dim
• F Major: F, Gm, Am, Bb, C, Dm, Edim
• G Major: G, Am, Bm, C, D, Em, F#dim
• A Major: A, Bm, C#m, D, E, F#m, G#dim
• B Major: B, C#m, D#m, E, F#, G#m, A#dim
• Db Major: Db, Ebm, Fm, Gb, Ab, Bbm, Cdim
• Eb Major: Eb, Fm, Gm, Ab, Bb, Cm, Ddim
• Ab Major: Ab, Bbm, Cm, Db, Eb, Fm, Gdim
• Bb Major: Bb, Cm, Dm, Eb, F, Gm, Adim

MINOR KEYS - Pattern: i (minor), ii° (diminished), bIII (major), iv (minor), v (minor), bVI (major), bVII (major)
• A Minor: Am, Bdim, C, Dm, Em, F, G
• E Minor: Em, F#dim, G, Am, Bm, C, D
• B Minor: Bm, C#dim, D, Em, F#m, G, A
• D Minor: Dm, Edim, F, Gm, Am, Bb, C
• G Minor: Gm, Adim, Bb, Cm, Dm, Eb, F
• C Minor: Cm, Ddim, Eb, Fm, Gm, Ab, Bb
• F Minor: Fm, Gdim, Ab, Bbm, Cm, Db, Eb
• F# Minor: F#m, G#dim, A, Bm, C#m, D, E
• C# Minor: C#m, D#dim, E, F#m, G#m, A, B
• G# Minor: G#m, A#dim, B, C#m, D#m, E, F#
• Eb Minor: Ebm, Fdim, Gb, Abm, Bbm, Cb, Db
• Bb Minor: Bbm, Cdim, Db, Ebm, Fm, Gb, Ab

KEY DETECTION STRATEGY:
1. List all unique chords from the chart
2. Match them against the key patterns above
3. The key with the most matching chords is likely the correct key
4. Common progressions: I-IV-V, I-V-vi-IV, ii-V-I (jazz), i-VI-III-VII (minor)
5. If uncertain between major and relative minor (e.g., C Major vs A Minor), choose based on:
   - Which chord appears most frequently or starts/ends the song
   - Starting and ending chords (these often indicate tonal center)
   - Chord progression patterns and resolution points
   - Where the harmony feels most "at rest"
6. Note any modal characteristics or borrowed chords if present
7. If there are multiple key possibilities, choose the most likely one based on harmonic analysis
8. ALWAYS provide a key - make your best educated guess based on the chord patterns

NASHVILLE NUMBER SYSTEM REFERENCE:
The Nashville Number System uses scale degrees (numbers) to represent chords, making transposition easy.
• Major key: 1=I (major), 2=ii (minor), 3=iii (minor), 4=IV (major), 5=V (major), 6=vi (minor), 7=vii° (dim)
• Minor key: 1=i (minor), 2=ii° (dim), b3=bIII (major), 4=iv (minor), 5=v (minor), b6=bVI (major), b7=bVII (major)
• Notation: Plain number = major (1, 4, 5), Number with dash = minor (2-, 3-, 6-), Number with ° = diminished (7°)
• Example in C Major: 1=C, 2-=Dm, 3-=Em, 4=F, 5=G, 6-=Am, 7°=Bdim
• Example in A Minor: 1-=Am, 2°=Bdim, b3=C, 4-=Dm, 5-=Em, b6=F, b7=G
• Common progressions in numbers: 1-4-5, 1-5-6-4, 1-6-4-5, 2-5-1 (jazz)
• Use Nashville numbers to help identify the key - if you see a pattern like "1-4-5-1" or "1-5-6-4", match it to the chord names

EXAMPLE FORMAT (English):
Title: Song Name
Artist: Artist Name
Key: C Major (determined by C-G-Am-F progression - I-V-vi-IV in C Major)

[Intro]
[C]    [G]    [Am]    [F]

Verse 1:
Come [C]over here and [G]tell me everything I [Am]wanna [F]hear
I'll pre[C]tend that I don't [G]see the reason you're [Am]back over [F]here

Chorus:
So [C]kiss me one more [G]time, cross every [Am]T and dot every [F]I
Of that [C]pretty little [G]lie

EXAMPLE FORMAT (Hebrew/Other Languages):
Number: 171
Title: Hineni (Here I Am)
Key: B Major

[Verse]
[B]הנני [A]כאן ל[B]פני[C#m]ך
[B]כל [F#m]עולמי [B]בידך[A]ותיך, [B]כולי [E]שלך [A]לנצח

Analysis: B Major determined by B-A-B-C#m-B-E progression. Song starts and ends on B (tonic). The A natural (instead of A#) gives mixolydian flavor common in Hebrew worship. Progression is I-VII-I-ii-I-IV in B Major.

CRITICAL FORMATTING RULES:
1. The "Key:" line MUST appear near the top, after Number/Title
2. Put ONLY the key name on the "Key:" line (e.g., "Key: B Major" or "Key: E Minor")
3. Add detailed analysis AFTER the lyrics as a separate "Analysis:" section
4. Format:
   Number: [if visible]
   Title: [song name]
   Key: [KEY NAME ONLY - NO EXPLANATION HERE]

   [lyrics with chords]

   Analysis: [Detailed explanation of why this key, chord progressions, modal characteristics, etc.]

IMPORTANT KEY DETECTION REQUIREMENTS:
- You MUST always provide a key on the "Key:" line
- Keep "Key:" line SHORT - just the key name (e.g., "B Major", "E Minor", "G Major")
- Put detailed reasoning in the Analysis section at the END
- Analysis should explain:
  * Starting chord and ending chord
  * Most frequent chord and tonal center
  * Chord progression patterns (I-IV-V, I-V-vi-IV, etc.)
  * Resolution points where harmony feels "at rest"
  * Any borrowed chords or modal characteristics (e.g., mixolydian, dorian)
  * If you initially considered another key, explain why you chose this one instead

Simply read the text and format with inline [chord] brackets. Preserve the exact language of the lyrics. This is OCR of the user's personal handwritten practice notes.`;

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'ChordsAppClaude API is running' });
});

// Main OCR endpoint
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
                data: base64Image
            }
        });

        instructionContent.push({
            type: 'text',
            text: BASE_PROMPT
        });

        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: instructionContent
                }
            ]
        });

        const extractedText = response.content?.[0]?.text || '';

        console.log('=== CLAUDE RESPONSE ===');
        console.log('First 500 chars:', extractedText.substring(0, 500));
        console.log('Has Key line?:', extractedText.includes('Key:'));
        console.log('Has Analysis line?:', extractedText.includes('Analysis:'));
        console.log('Transcription successful');

        res.json({
            success: true,
            transcription: extractedText,
            metadata: {
                model: CLAUDE_MODEL,
                feedbackApplied: Boolean(feedback)
            }
        });

    } catch (error) {
        console.error('Error analyzing chart:', error);

        const status = error.response?.status || 500;
        let message = error.message || 'Failed to analyze chart';

        if (error.response?.data?.error?.type === 'not_found_error') {
            message = `Anthropic model "${CLAUDE_MODEL}" is unavailable. Check ANTHROPIC_MODEL/.env configuration or account access.`;
        }

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

        // Transform data into array
        const users = Object.keys(usersData).map(userId => {
            const userData = usersData[userId];
            return {
                userId,
                subscription: userData.subscription || { tier: 'FREE', status: 'active' },
                usage: userData.usage || { analysesThisMonth: 0, monthStartDate: new Date().toISOString() },
                bonusAnalyses: userData.bonusAnalyses || 0,
                songCount: userData.songs ? Object.keys(userData.songs).length : 0
            };
        });

        res.json({ users });

    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`ChordsAppClaude API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Usage tracking: http://localhost:${PORT}/api/can-analyze`);
});
