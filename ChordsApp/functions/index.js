// Firebase Cloud Functions for ChordsApp
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.database();

// Claude model configuration
const CLAUDE_MODEL = 'claude-3-5-haiku-20241022';

// Base prompt for OCR
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

MINOR KEYS - Pattern: i (minor), ii° (diminished), bIII (major), iv (minor), v (minor), bVI (major), bVII (major)
• A Minor: Am, Bdim, C, Dm, Em, F, G
• E Minor: Em, F#dim, G, Am, Bm, C, D
• B Minor: Bm, C#dim, D, Em, F#m, G, A
• D Minor: Dm, Edim, F, Gm, Am, Bb, C
• G Minor: Gm, Adim, Bb, Cm, Dm, Eb, F

KEY DETECTION STRATEGY:
1. List all unique chords from the chart
2. Match them against the key patterns above
3. The key with the most matching chords is likely the correct key
4. Common progressions: I-IV-V, I-V-vi-IV, ii-V-I (jazz), i-VI-III-VII (minor)
5. ALWAYS provide a key - make your best educated guess based on the chord patterns

Simply read the text and format with inline [chord] brackets. Preserve the exact language of the lyrics. This is OCR of the user's personal handwritten practice notes.`;

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
exports.analyzeChart = functions.https.onRequest((req, res) => {
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

            // Set max tokens based on mode
            const maxTokens = intenseMode ? 5000 : 2000;

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
