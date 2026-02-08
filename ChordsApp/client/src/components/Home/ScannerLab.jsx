import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeChart } from '../../services/api';
import SongEditor from '../SongEditor';
import chordsAppParser from '../../utils/chordProParser';

const DEFAULT_PROMPT = `You are an expert OCR assistant specialized in transcribing Hebrew worship/music chord sheets. Your task is to accurately read chord charts and output them in a standardized inline format.

## OUTPUT FORMAT (MANDATORY - FOLLOW EXACTLY)

Your response MUST begin with EXACTLY these 2 lines (no extra lines between them):
Title: [Song title in original language]
Key: [Key like "C Major" or "Am"] | BPM: [number or "Not specified"] | Time: [like "4/4"]

IMPORTANT: The second line MUST combine Key, BPM, and Time on ONE line separated by " | " (pipe with spaces).

Then provide sections with inline chords. End with:
---
Analysis: [Your key detection reasoning]

## HEBREW TEXT HANDLING (CRITICAL)

1. **Reading Direction**: Hebrew lyrics are written RIGHT-TO-LEFT.
2. **Scanning Logic (CRITICAL)**: You must scan the line from **RIGHT TO LEFT**.
   - The "First Chord" of the line is the **RIGHTMOST** chord visually.
   - The "Last Chord" of the line is the **LEFTMOST** chord visually.
   - **DO NOT** scan chords Left-to-Right. This will reverse the logical order.
3. **Inline Conversion**: Place [chord] bracket IMMEDIATELY BEFORE (to the right of) the Hebrew word/syllable it applies to.
4. **Transliteration**: Do NOT transliterate Hebrew - keep original Hebrew characters.

## INLINE CHORD FORMAT RULES

1. Chords go in square brackets: [C] [Am] [F] [G] [Dm] etc.
2. Place chord bracket at the START (Right side) of the word/syllable.
3. **RTL SCANNING EXAMPLE (CRITICAL)**:
   
   **Visual Image (Right to Left):**
   (Left)    [C]       [F]    (Right)
         עולם      שלום

   **WRONG (Left-to-Right Scan):** 
   [C]שלום [F]עולם  (This places the Left chord C on the Right word Shalom) -> ERROR!

   **CORRECT (Right-to-Left Scan):**
   [F]שלום [C]עולם  (Rightmost chord F is first, Leftmost chord C is second) -> CORRECT!

## ERROR HANDLING

If image is unclear or partially visible:
1. Transcribe what you CAN read accurately
2. Mark unclear sections with [unclear]
3. Note in Analysis what was difficult to read

NEVER say "I cannot read this" - always attempt transcription.`;

const ScannerLab = () => {
    const { t } = useTranslation();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
    const [rawOutput, setRawOutput] = useState('');
    const [parsedSong, setParsedSong] = useState(null);
    const [activeTab, setActiveTab] = useState('raw'); // 'raw' | 'preview'
    const [error, setError] = useState(null);
    const [showEditor, setShowEditor] = useState(false);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);
        setRawOutput('');
        setParsedSong(null);
        setActiveTab('raw');

        try {
            const result = await analyzeChart(file, prompt);
            if (result.success && result.transcription) {
                setRawOutput(result.transcription);

                // Parse for preview
                const songData = {
                    title: 'Scanned Chart',
                    content: result.transcription,
                    ...chordsAppParser.extractMetadata(result.transcription)
                };
                setParsedSong(songData);
            } else {
                setError(t('scanner.error_analyze'));
            }
        } catch (err) {
            setError(err.message || t('scanner.error_connect'));
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <section className="scanner-lab" style={{
            marginTop: '40px',
            marginBottom: '40px',
            borderTop: '4px solid var(--border-main)',
            paddingTop: '40px'
        }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>{t('scanner.title')} 🔬</h2>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                {/* Left Column: Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ border: '2px dashed var(--border-main)', padding: '20px', textAlign: 'center' }}>
                        {isAnalyzing ? (
                            <div style={{ fontSize: '1.2rem', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
                                {t('scanner.analyzing')}
                            </div>
                        ) : (
                            <div style={{ position: 'relative', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileUpload}
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0,
                                        width: '100%', height: '100%',
                                        opacity: 0,
                                        cursor: 'pointer'
                                    }}
                                />
                                <button style={{ pointerEvents: 'none' }}>{t('scanner.upload')}</button>
                            </div>
                        )}
                        {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t('scanner.prompt_label')}</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            style={{
                                width: '100%',
                                height: '400px',
                                fontFamily: 'monospace',
                                padding: '10px',
                                border: '2px solid var(--border-main)',
                                resize: 'vertical'
                            }}
                        />
                    </div>
                </div>

                {/* Right Column: Output */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button
                            className={activeTab === 'raw' ? '' : 'ghost-button'}
                            onClick={() => setActiveTab('raw')}
                        >
                            {t('scanner.raw_output')}
                        </button>
                        <button
                            className={activeTab === 'preview' ? '' : 'ghost-button'}
                            onClick={() => setActiveTab('preview')}
                            disabled={!parsedSong}
                        >
                            {t('scanner.preview')}
                        </button>
                    </div>

                    <div style={{
                        flexGrow: 1,
                        border: '2px solid var(--border-main)',
                        minHeight: '500px',
                        background: 'var(--bg-secondary)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {activeTab === 'raw' ? (
                            <pre style={{
                                padding: '20px',
                                whiteSpace: 'pre-wrap',
                                overflowY: 'auto',
                                height: '100%',
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)'
                            }}>
                                {rawOutput || t('scanner.waiting')}
                            </pre>
                        ) : (
                            parsedSong ? (
                                <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
                                    <h3 style={{ marginTop: 0 }}>{parsedSong.title}</h3>
                                    <pre style={{
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'var(--font-mono)',
                                        columnCount: 1
                                    }}>
                                        {parsedSong.content}
                                    </pre>
                                </div>
                            ) : (
                                <div style={{ padding: '20px' }}>{t('scanner.no_preview')}</div>
                            )
                        )}
                    </div>

                    {/* Open Editor Button */}
                    {parsedSong && (
                        <button
                            onClick={() => setShowEditor(true)}
                            style={{
                                marginTop: '20px',
                                width: '100%',
                                padding: '16px',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                background: '#000',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {t('scanner.open_editor')}
                        </button>
                    )}
                </div>
            </div>

            {/* Song Editor Modal */}
            {showEditor && parsedSong && (
                <SongEditor
                    song={parsedSong}
                    onClose={() => setShowEditor(false)}
                    onSave={(updatedSong) => {
                        setParsedSong(updatedSong);
                        setRawOutput(updatedSong.content);
                        setShowEditor(false);
                    }}
                />
            )}
        </section>
    );
};

export default ScannerLab;
