// Firebase Cloud Functions for ChordsApp
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

// Base prompt for OCR - Hebrew Chord Sheet OCR Prompt v2.0
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
