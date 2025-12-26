# ChordsApp

AI-powered chord chart transcription tool for worship leaders and musicians.

## Features

- Upload handwritten or printed chord charts (JPG, PNG, HEIC, PDF)
- AI-powered OCR using OpenAI GPT-4 Vision
- Automatic chord and lyric extraction
- Transpose to any key with one click
- Edit and refine the transcription
- Print or copy clean, professional chord charts

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Navigate to the ChordsApp directory:**
   ```bash
   cd ChordsApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your API key:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   PORT=3001
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open the app:**
   - Open `index.html` in your browser
   - Or use a local server: `python3 -m http.server 8000`
   - Visit: `http://localhost:8000`

## How to Use

1. **Upload a chord chart** - Click "Choose a file" or use the upload button
2. **Analyze** - Click "Analyze with AI" to extract chords positioned above lyrics
3. **Edit** - Manually adjust chord alignment in the editor using spaces - what you see is what you get!
4. **Transpose** - Use the +1/-1 buttons or enter custom semitone shifts (works on chord symbols)
5. **Live Preview** - See the exact formatted version in real-time below the editor
6. **Adjust Formatting** - Use the Font Size and Line Spacing sliders to optimize for one-page printing
7. **Copy** - Use "Copy text" to paste into other applications
8. **Print** - Click "Print chart" to print exactly what you see in the editor

## API Endpoints

### POST `/api/analyze-chart`
- **Description:** Analyzes a chord chart image and extracts structured text
- **Input:** `multipart/form-data` with `chart` file
- **Output:** JSON with transcription

Example response:
```json
{
  "success": true,
  "transcription": "[Verse]\nG                 D/F#\nYou give life...",
  "metadata": {
    "filename": "chart.jpg",
    "size": 123456,
    "model": "gpt-4o"
  }
}
```

### GET `/health`
- **Description:** Health check endpoint
- **Output:** `{ "status": "ok" }`

## Project Structure

```
ChordsApp/
├── index.html          # Main frontend
├── styles.css          # Styling
├── app.js             # Frontend logic
├── server.js          # Backend API (OpenAI integration)
├── package.json       # Dependencies
├── .env.example       # Environment template
├── .env               # Your secrets (DO NOT COMMIT)
└── README.md          # This file
```

## Troubleshooting

### "Failed to analyze" error
- Make sure the backend server is running (`npm start`)
- Check that your OpenAI API key is valid in `.env`
- Verify the server is on port 3001: `http://localhost:3001/health`

### CORS errors
- The server has CORS enabled by default
- If issues persist, check your browser console

### Poor OCR results
- Use high-contrast images (black text on white background works best)
- Ensure the chord chart is clearly visible and not blurry
- Try cropping the image to just the chart area

## Cost Considerations

OpenAI GPT-4 Vision API pricing (as of January 2025):
- ~$0.01 per image analysis
- Most chord charts use 500-1500 tokens

## Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Node.js, Express
- **AI:** OpenAI GPT-4 Vision (gpt-4o)
- **Image Processing:** Base64 encoding

## Next Steps

- Add batch processing for multiple charts
- Support for exporting to PDF
- Cloud deployment (Vercel, Railway, etc.)
- User authentication and saved charts
- Alternative AI providers (Azure, Google Vision)

## Support

Questions or issues? Contact: support@thefaithsound.com

---

Built with love for worship leaders and musicians by The Faith Sound.
