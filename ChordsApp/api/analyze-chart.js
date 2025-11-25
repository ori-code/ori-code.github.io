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
        const { imageData, mimeType, intenseMode } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        // Set max tokens based on mode: regular (2000) or intense (5000)
        const maxTokens = intenseMode ? 5000 : 2000;

        // Call OpenAI Vision API with low temperature for precise output
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
                role: "user",
                content: [{
                    type: "text",
                    text: `You are an expert music OCR assistant specialized in extracting chord charts from images. Your task is to transcribe chord charts with MAXIMUM PRECISION in ChordPro format.

OUTPUT FORMAT - ChordPro Standard:
Return the transcription in ChordPro format with metadata tags and section blocks:

{title: [Extract song title from image]}
{author: [Extract artist/composer if visible, or leave blank if not shown]}
{key: [Extract key signature - e.g., "G Major", "Am", "F"]}
{tempo: [Extract BPM if shown, or estimate based on genre - optional]}
{time: [Extract time signature if shown, e.g., "4/4", "3/4" - optional]}

{comment: Verse 1}
O [G]come all ye [D]faithful, [G]joyful and tri[C]umphant
O [Em]come ye, O [Am]come ye to [D]Bethle[G]hem

{comment: Chorus}
O [G]come let us a[D]dore [Em]Him
O [C]come let us a[G]dore Him

CRITICAL: CHORD PLACEMENT ACCURACY (MOST IMPORTANT)
- Each chord must be placed EXACTLY at the syllable/character it appears above in the image
- Count character positions VERY carefully - chords align with specific syllables, not word starts
- If a chord is above "ha" in "hazeh", place it as "ha[C]zeh", NOT "[C]hazeh" or "hazeh[C]"
- Look at the VERTICAL ALIGNMENT in the image - the chord is directly above specific letters
- For transliterated Hebrew: "la'" counts as 3 characters, "sha" as 3, etc.

METADATA EXTRACTION:
1. {title: } - Extract song title from top of chart (required)
2. {author: } - Extract artist/composer name if visible (optional)
3. {key: } - Look for key signature in title (e.g., [F], [G], [Am]) or marked as "Key: X" (required)
4. {tempo: } - Extract BPM if shown, or estimate: slow hymns ~70, worship ~80-100, upbeat ~120+ (optional)
5. {time: } - Extract time signature if shown, default to 4/4 for most songs (optional)

SECTION BLOCKS:
- Wrap each section with {comment: Section Name}
- Common sections: Verse 1, Verse 2, Chorus, Bridge, Pre-Chorus, Intro, Outro, Tag
- Detect section headers like "Verse 1:", "Chorus:", "V1:", "C:", etc.
- Each section should be separated by blank lines

CHORD PLACEMENT EXAMPLES:
- Image shows "F" above "o" in "la'olam": Output "la'[F]olam"
- Image shows "Gm" above "ze" in "hazeh": Output "ha[Gm]zeh"
- Image shows "C" above "vat" in "ahavat": Output "aha[C]vat"
- Chords are NOT always at word beginnings - check vertical alignment carefully!

FORMATTING RULES:
1. Use INLINE BRACKET FORMAT: Insert [chord] directly BEFORE the syllable/character it's above
2. Preserve exact text, spelling, and language (Hebrew, Arabic, English, etc.)
3. For chord-only sections: {comment: Intro}\n[Em] [D] [C] [G]
4. Maintain proper spacing and line breaks between sections

VERIFICATION STEP:
Before finalizing, double-check each chord placement by verifying the character directly below the chord in the image matches where you placed [chord] in the text.

Return ONLY the ChordPro formatted chord chart with metadata and section blocks. No explanations.

This is the user's own chord sheet for personal practice.`
                }, {
                    type: "image_url",
                    image_url: {
                        url: `data:${mimeType};base64,${imageData}`
                    }
                }]
            }],
            max_tokens: maxTokens,
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
