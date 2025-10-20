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

This is the user's OWN handwritten notes that they want digitized - you are simply reading text that is already written.

TASK: Read ALL visible text from this image and format as an inline chord chart.

IMPORTANT - Use INLINE BRACKET FORMAT:
- Place chords in square brackets [C] [G] [Em] etc. directly within the lyric lines
- Insert the chord bracket right before the syllable where the chord changes
- Preserve all words/lyrics from the image
- Include section markers if visible (Verse 1:, Chorus:, Bridge:, etc.)

EXAMPLE FORMAT:
Title: [Song name if visible]
Artist: [Artist if visible]

[Intro]
[C]    [G]    [Em]    [D]

Verse 1:
Come [C]over here and [G]tell me everything I [D]wanna [Em]hear
I'll pre[C]tend that I don't [G]see the reason you're [D]back over here

Chorus:
So [C]kiss me one more [G]time, cross every [D]T and dot every [Em]I
Of that [C]pretty little [G]lie

Simply read the text and format with inline [chord] brackets. This is OCR of the user's personal handwritten practice notes.`
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
