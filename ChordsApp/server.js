const express = require('express');
const multer = require('multer');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'ChordsApp API is running' });
});

// Main OCR endpoint
app.post('/api/analyze-chart', upload.single('chart'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Processing file:', req.file.originalname);

        // Convert image to base64
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        // Call OpenAI Vision API
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are an OCR assistant helping a musician transcribe their personal handwritten chord chart for practice purposes.

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
- Detect the lyric language direction. If the song text reads left-to-right (English, Spanish, etc.), analyze chord order and key left-to-right. If it reads right-to-left (Hebrew, Arabic, etc.), interpret chord placement, lyric alignment, and harmonic analysis right-to-left so chords remain over the correct syllables.
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

Simply read the text and format with inline [chord] brackets. Preserve the exact language of the lyrics. This is OCR of the user's personal handwritten practice notes.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 2000
        });

        const extractedText = response.choices[0].message.content;

        console.log('Transcription successful');

        res.json({
            success: true,
            transcription: extractedText,
            metadata: {
                filename: req.file.originalname,
                size: req.file.size,
                model: 'gpt-4o'
            }
        });

    } catch (error) {
        console.error('Error analyzing chart:', error);
        res.status(500).json({
            error: 'Failed to analyze chart',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`ChordsApp API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
