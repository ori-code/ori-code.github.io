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

        // Call OpenAI Vision API
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
                role: "user",
                content: [{
                    type: "text",
                    text: `You are an expert music OCR assistant specialized in extracting chord charts from images. Your task is to transcribe chord charts with PRECISE chord placement.

CRITICAL: CHORD PLACEMENT ACCURACY
- Each chord must be placed EXACTLY at the syllable/word it appears above in the image
- Count character positions carefully - chords align with specific syllables
- If a chord is above "ha" in "hazeh", place it as "ha[C]zeh", not at the start of the line

KEY DETECTION:
- Look for key signature in title (e.g., [F], [G], [Am]) or marked as "Key: X"
- Include "Key: [detected key]" at the start of output

FORMATTING RULES:
1. Use INLINE BRACKET FORMAT: Insert [chord] directly BEFORE the syllable it's above
2. WRONG: "[F] [Gm] [Dm] en la'olam hazeh davar echad lehatsia"
3. CORRECT: "en la'[F]olam ha[Gm]zeh davar e[Dm]chad lehatsia"
4. For chord-only sections (Intro/Outro): [Intro] [Em] [D] [C] [G]
5. Preserve exact text, spelling, and language (Hebrew, Arabic, English, etc.)
6. Maintain structure labels (Verse 1, Chorus, Bridge, etc.)
7. If title contains key like "[F]", extract it: "Key: F Major"

EXAMPLES:
- Image shows "F" above "en": Output "[F]en la'olam..."
- Image shows "Gm" above "zeh": Output "...ha[Gm]zeh..."
- Image shows chords above specific words, NOT at line start

Return ONLY the transcribed chord chart with accurate inline chord placement. No explanations.

This is the user's own chord sheet for personal practice.`
                }, {
                    type: "image_url",
                    image_url: {
                        url: `data:${mimeType};base64,${imageData}`
                    }
                }]
            }],
            max_tokens: 2000
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
