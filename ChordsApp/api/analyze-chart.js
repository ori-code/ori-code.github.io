// Vercel Serverless Function for ChordsApp
const OpenAI = require('openai');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // Get file from request
        const { imageData, mimeType } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        // Call OpenAI Vision API with low temperature for precise output
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
                role: "user",
                content: [{
                    type: "text",
                    text: `You are an expert music OCR assistant specialized in extracting chord charts from images. Your task is to transcribe chord charts with MAXIMUM PRECISION in chord placement.

CRITICAL: CHORD PLACEMENT ACCURACY (MOST IMPORTANT)
- Each chord must be placed EXACTLY at the syllable/character it appears above in the image
- Count character positions VERY carefully - chords align with specific syllables, not word starts
- If a chord is above "ha" in "hazeh", place it as "ha[C]zeh", NOT "[C]hazeh" or "hazeh[C]"
- Look at the VERTICAL ALIGNMENT in the image - the chord is directly above specific letters
- For transliterated Hebrew: "la'" counts as 3 characters, "sha" as 3, etc.

KEY DETECTION:
- Look for key signature in title (e.g., [F], [G], [Am]) or marked as "Key: X"
- Include "Key: [detected key]" at the start of output

FORMATTING RULES:
1. Use INLINE BRACKET FORMAT: Insert [chord] directly BEFORE the syllable/character it's above
2. WRONG: "[F] [Gm] [Dm] en la'olam hazeh davar echad lehatsia"
3. WRONG: "[F]en [Gm]la'olam [Dm]hazeh" (chords at word start when they should be mid-word)
4. CORRECT: "en la'[F]olam ha[Gm]zeh davar e[Dm]chad lehatsia"
5. For chord-only sections (Intro/Outro): [Intro] [Em] [D] [C] [G]
6. Preserve exact text, spelling, and language (Hebrew, Arabic, English, etc.)
7. Maintain structure labels (Verse 1, Chorus, Bridge, etc.)
8. If title contains key like "[F]", extract it: "Key: F Major"

DETAILED EXAMPLES:
- Image shows "F" above "o" in "la'olam": Output "la'[F]olam"
- Image shows "Gm" above "ze" in "hazeh": Output "ha[Gm]zeh"
- Image shows "C" above "vat" in "ahavat": Output "aha[C]vat"
- Image shows "Am" above "lech" in "halleluyah": Output "halle[Am]luyah"
- Chords are NOT always at word beginnings - check vertical alignment carefully!

VERIFICATION STEP:
Before finalizing, double-check each chord placement by verifying the character directly below the chord in the image matches where you placed [chord] in the text.

Return ONLY the transcribed chord chart with accurate inline chord placement. No explanations.

This is the user's own chord sheet for personal practice.`
                }, {
                    type: "image_url",
                    image_url: {
                        url: `data:${mimeType};base64,${imageData}`
                    }
                }]
            }],
            max_tokens: 3000,
            temperature: 0.2
        });

        const transcription = response.choices[0].message.content.trim();

        return res.status(200).json({
            success: true,
            transcription: transcription
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to process image'
        });
    }
};
