// Vercel Serverless Function for ChordsApp - Using Anthropic Claude
const Anthropic = require('@anthropic-ai/sdk');

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

Simply read the text and format with inline [chord] brackets. Preserve the exact language of the lyrics. This is OCR of the user's personal handwritten practice notes.`;

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
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        // Get data from request
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
            messages: [
                {
                    role: 'user',
                    content: instructionContent
                }
            ]
        });

        const transcription = response.content?.[0]?.text || '';

        console.log('=== CLAUDE RESPONSE ===');
        console.log('First 500 chars:', transcription.substring(0, 500));
        console.log('Has Key line?:', transcription.includes('Key:'));
        console.log('Transcription successful');

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

        const status = error.status || 500;
        let message = error.message || 'Failed to analyze chart';

        if (error.error?.type === 'not_found_error') {
            message = `Anthropic model "${CLAUDE_MODEL}" is unavailable. Check ANTHROPIC_MODEL/.env configuration or account access.`;
        }

        return res.status(status).json({
            error: 'Failed to analyze chart',
            message
        });
    }
};
