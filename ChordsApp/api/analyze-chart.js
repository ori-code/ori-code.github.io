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
                    text: `You are an OCR assistant specialized in extracting chord charts from images. Transcribe this chord chart image exactly as it appears.

IMPORTANT FORMATTING RULES:
1. Use INLINE BRACKET FORMAT for chords: [C] [G] [Em] [D]
2. Place chord brackets directly where they appear in the lyrics
3. Example: "Amazing[C] grace how [G]sweet the[Em] sound[D]"
4. For intro sections with only chords, list them with brackets and spaces: [Intro] [Em] [D] [C] [G] [A] [G]
5. Preserve all text exactly as written (even if handwritten)
6. Keep original language (Hebrew, English, etc.)
7. Maintain song structure (Verse, Chorus, Bridge, etc.)
8. If you see metadata like Title or Artist, include it

Return ONLY the transcribed chord chart text. Do not add explanations or comments.

This is the user's own handwritten chord sheet for personal practice and study purposes.`
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
