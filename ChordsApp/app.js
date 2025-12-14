document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('chartFileInput');
    const previewPanel = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const previewPlaceholder = previewPanel ? previewPanel.querySelector('.preview-placeholder') : null;
    const miniPreview = document.getElementById('miniWorkspacePreview');
    const miniPreviewImage = document.getElementById('miniWorkspacePreviewImage');
    const miniPreviewPlaceholder = miniPreview ? miniPreview.querySelector('.mini-preview-placeholder') : null;
    const analyzeButton = document.getElementById('analyzeButton');
    const analysisStatus = document.getElementById('analysisStatus');
    const aiReferenceContent = document.getElementById('aiReferenceContent');
    const visualEditor = document.getElementById('visualEditor');
    const songbookOutput = document.getElementById('songbookOutput');
    const transposeStepInput = document.getElementById('transposeStepInput');
    const transposeButtons = document.querySelectorAll('[data-shift]');
    const applyTransposeButton = document.getElementById('applyTranspose');
    const resetTransposeButton = document.getElementById('resetTranspose');
    const copyButton = document.getElementById('copyToClipboard');
    const reanalyzeButton = document.getElementById('reanalyzeButton');
    const reanalyzeFeedback = document.getElementById('reanalyzeFeedback');
    const printButton = document.getElementById('printButton');
    const saveLayoutButton = document.getElementById('saveLayoutButton');
    const printPreview = document.getElementById('printPreview');
    const livePreview = document.getElementById('livePreview');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const lineHeightValue = document.getElementById('lineHeightValue');
    const charSpacingSlider = document.getElementById('charSpacingSlider');
    const charSpacingValue = document.getElementById('charSpacingValue');
    const yearSpan = document.getElementById('year');
    const keyDetectionDiv = document.getElementById('keyDetection');
    const detectedKeySpan = document.getElementById('detectedKey');
    const keySelector = document.getElementById('keySelector');
    const nashvilleMode = document.getElementById('nashvilleMode');
    const timeSignature = document.getElementById('timeSignature');
    const bpmInput = document.getElementById('bpmInput');
    const keyAnalysisDiv = document.getElementById('keyAnalysis');
    const keyAnalysisText = document.getElementById('keyAnalysisText');
    const proEditorToggle = document.getElementById('proEditorToggle');

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    if (!fileInput || !analysisStatus || !visualEditor || !songbookOutput) {
        return;
    }

    // Detect local development (localhost or local network IP)
    const isLocalDev = window.location.hostname === 'localhost' ||
                       window.location.hostname.startsWith('192.168.') ||
                       window.location.hostname.startsWith('10.') ||
                       window.location.hostname.startsWith('172.');

    const API_URL = isLocalDev
        ? `http://${window.location.hostname}:3002/api/analyze-chart`
        : 'https://ori-code-github-io.vercel.app/api/analyze-chart';

    // Nashville Number System state - default key is C Major
    let currentKey = 'C Major';

    // Nashville Number System mappings
    const NASHVILLE_MAJOR = {
        'C': { 'C': '1', 'Dm': '2', 'Em': '3', 'F': '4', 'G': '5', 'Am': '6', 'Bdim': '7°', 'D': '2', 'E': '3', 'A': '6', 'B': '7' },
        'C#': { 'C#': '1', 'D#m': '2', 'E#m': '3', 'F#': '4', 'G#': '5', 'A#m': '6', 'B#dim': '7°', 'D#': '2', 'Fm': '3', 'A#': '6', 'G#m': '5' },
        'Db': { 'Db': '1', 'Ebm': '2', 'Fm': '3', 'Gb': '4', 'Ab': '5', 'Bbm': '6', 'Cdim': '7°', 'Eb': '2', 'F': '3', 'Bb': '6', 'Abm': '5' },
        'D': { 'D': '1', 'Em': '2', 'F#m': '3', 'G': '4', 'A': '5', 'Bm': '6', 'C#dim': '7°', 'E': '2', 'F#': '3', 'B': '6', 'Am': '5' },
        'Eb': { 'Eb': '1', 'Fm': '2', 'Gm': '3', 'Ab': '4', 'Bb': '5', 'Cm': '6', 'Ddim': '7°', 'F': '2', 'G': '3', 'C': '6', 'Bbm': '5' },
        'E': { 'E': '1', 'F#m': '2', 'G#m': '3', 'A': '4', 'B': '5', 'C#m': '6', 'D#dim': '7°', 'F#': '2', 'G#': '3', 'C#': '6', 'Bm': '5' },
        'F': { 'F': '1', 'Gm': '2', 'Am': '3', 'Bb': '4', 'C': '5', 'Dm': '6', 'Edim': '7°', 'G': '2', 'A': '3', 'D': '6', 'Cm': '5' },
        'F#': { 'F#': '1', 'G#m': '2', 'A#m': '3', 'B': '4', 'C#': '5', 'D#m': '6', 'E#dim': '7°', 'G#': '2', 'A#': '3', 'D#': '6', 'C#m': '5' },
        'Gb': { 'Gb': '1', 'Abm': '2', 'Bbm': '3', 'Cb': '4', 'Db': '5', 'Ebm': '6', 'Fdim': '7°', 'Ab': '2', 'Bb': '3', 'Eb': '6', 'Dbm': '5' },
        'G': { 'G': '1', 'Am': '2', 'Bm': '3', 'C': '4', 'D': '5', 'Em': '6', 'F#dim': '7°', 'A': '2', 'B': '3', 'E': '6', 'Dm': '5' },
        'Ab': { 'Ab': '1', 'Bbm': '2', 'Cm': '3', 'Db': '4', 'Eb': '5', 'Fm': '6', 'Gdim': '7°', 'Bb': '2', 'C': '3', 'F': '6', 'Ebm': '5' },
        'A': { 'A': '1', 'Bm': '2', 'C#m': '3', 'D': '4', 'E': '5', 'F#m': '6', 'G#dim': '7°', 'B': '2', 'C#': '3', 'F#': '6', 'Em': '5' },
        'Bb': { 'Bb': '1', 'Cm': '2', 'Dm': '3', 'Eb': '4', 'F': '5', 'Gm': '6', 'Adim': '7°', 'C': '2', 'D': '3', 'G': '6', 'Fm': '5' },
        'B': { 'B': '1', 'C#m': '2', 'D#m': '3', 'E': '4', 'F#': '5', 'G#m': '6', 'A#dim': '7°', 'C#': '2', 'D#': '3', 'G#': '6', 'F#m': '5', 'A': 'b7' }
    };

    const NASHVILLE_MINOR = {
        'Am': { 'Am': '1', 'Bdim': '2°', 'C': 'b3', 'Dm': '4', 'Em': '5', 'F': 'b6', 'G': 'b7', 'A': '1', 'B': '2', 'D': '4', 'E': '5' },
        'A#m': { 'A#m': '1', 'B#dim': '2°', 'C#': 'b3', 'D#m': '4', 'E#m': '5', 'F#': 'b6', 'G#': 'b7', 'A#': '1', 'C#': 'b3', 'D#': '4' },
        'Bbm': { 'Bbm': '1', 'Cdim': '2°', 'Db': 'b3', 'Ebm': '4', 'Fm': '5', 'Gb': 'b6', 'Ab': 'b7', 'Bb': '1', 'Db': 'b3', 'Eb': '4' },
        'Bm': { 'Bm': '1', 'C#dim': '2°', 'D': 'b3', 'Em': '4', 'F#m': '5', 'G': 'b6', 'A': 'b7', 'B': '1', 'D': 'b3', 'E': '4', 'F#': '5' },
        'Cm': { 'Cm': '1', 'Ddim': '2°', 'Eb': 'b3', 'Fm': '4', 'Gm': '5', 'Ab': 'b6', 'Bb': 'b7', 'C': '1', 'Eb': 'b3', 'F': '4', 'G': '5' },
        'C#m': { 'C#m': '1', 'D#dim': '2°', 'E': 'b3', 'F#m': '4', 'G#m': '5', 'A': 'b6', 'B': 'b7', 'C#': '1', 'E': 'b3', 'F#': '4', 'G#': '5' },
        'Dm': { 'Dm': '1', 'Edim': '2°', 'F': 'b3', 'Gm': '4', 'Am': '5', 'Bb': 'b6', 'C': 'b7', 'D': '1', 'F': 'b3', 'G': '4', 'A': '5' },
        'D#m': { 'D#m': '1', 'E#dim': '2°', 'F#': 'b3', 'G#m': '4', 'A#m': '5', 'B': 'b6', 'C#': 'b7', 'D#': '1', 'F#': 'b3', 'G#': '4' },
        'Ebm': { 'Ebm': '1', 'Fdim': '2°', 'Gb': 'b3', 'Abm': '4', 'Bbm': '5', 'Cb': 'b6', 'Db': 'b7', 'Eb': '1', 'Gb': 'b3', 'Ab': '4' },
        'Em': { 'Em': '1', 'F#dim': '2°', 'G': 'b3', 'Am': '4', 'Bm': '5', 'C': 'b6', 'D': 'b7', 'E': '1', 'G': 'b3', 'A': '4', 'B': '5' },
        'Fm': { 'Fm': '1', 'Gdim': '2°', 'Ab': 'b3', 'Bbm': '4', 'Cm': '5', 'Db': 'b6', 'Eb': 'b7', 'F': '1', 'Ab': 'b3', 'Bb': '4', 'C': '5' },
        'F#m': { 'F#m': '1', 'G#dim': '2°', 'A': 'b3', 'Bm': '4', 'C#m': '5', 'D': 'b6', 'E': 'b7', 'F#': '1', 'A': 'b3', 'B': '4', 'C#': '5' },
        'Gm': { 'Gm': '1', 'Adim': '2°', 'Bb': 'b3', 'Cm': '4', 'Dm': '5', 'Eb': 'b6', 'F': 'b7', 'G': '1', 'Bb': 'b3', 'C': '4', 'D': '5' },
        'G#m': { 'G#m': '1', 'A#dim': '2°', 'B': 'b3', 'C#m': '4', 'D#m': '5', 'E': 'b6', 'F#': 'b7', 'G#': '1', 'B': 'b3', 'C#': '4', 'D#': '5' }
    };

    // Convert chord to Nashville number
    const chordToNashville = (chord, key) => {
        if (!chord || !key) return null;

        // Clean up the chord - remove extra spaces and get just the root
        chord = chord.trim();

        // Extract root note from chord (handle slash chords and extensions)
        // Match patterns like: C, Cm, C#, C#m, Db, Dbm, etc.
        const chordMatch = chord.match(/^([A-G][#b]?m?)/);
        if (!chordMatch) return null;

        const chordRoot = chordMatch[1];

        // Enharmonic equivalents for keys not in the table
        const keyEnharmonics = {
            'G#': 'Ab', 'A#': 'Bb', 'D#': 'Eb',
            'Cb': 'B', 'Fb': 'E'
        };

        // Check major key first
        let majorRoot = key.replace(' Major', '').trim();
        // Convert to enharmonic if needed
        if (keyEnharmonics[majorRoot]) {
            majorRoot = keyEnharmonics[majorRoot];
        }
        if (NASHVILLE_MAJOR[majorRoot]) {
            // Try the chord directly
            if (NASHVILLE_MAJOR[majorRoot][chordRoot]) {
                return NASHVILLE_MAJOR[majorRoot][chordRoot];
            }
            // Try enharmonic equivalent of the chord
            const chordEnharmonic = keyEnharmonics[chordRoot] || keyEnharmonics[chordRoot.replace('m', '')] + (chordRoot.includes('m') ? 'm' : '');
            if (chordEnharmonic && NASHVILLE_MAJOR[majorRoot][chordEnharmonic]) {
                return NASHVILLE_MAJOR[majorRoot][chordEnharmonic];
            }
        }

        // Check minor key
        let minorRoot = key.replace(' Minor', '').trim() + 'm';
        // Convert to enharmonic if needed
        const minorBase = minorRoot.replace('m', '');
        if (keyEnharmonics[minorBase]) {
            minorRoot = keyEnharmonics[minorBase] + 'm';
        }
        if (NASHVILLE_MINOR[minorRoot] && NASHVILLE_MINOR[minorRoot][chordRoot]) {
            return NASHVILLE_MINOR[minorRoot][chordRoot];
        }

        return null;
    };

    // Initialize directional layout defaults
    setDirectionalLayout(visualEditor, '');
    setDirectionalLayout(songbookOutput, '');
    setDirectionalLayout(livePreview, '');
    if (printPreview) {
        setDirectionalLayout(printPreview, '');
    }

    const SAMPLE_CHART = `Title: Great Are You Lord
Artist: All Sons & Daughters
Key: G Major

[Intro]
[G]    [D/F#]    [Em7]    [C2]

Verse 1:
You [G]give life, You are [D/F#]love
You [Em7]bring light to the [C2]darkness
You [G]give hope, You re[D/F#]store
Every [Em7]heart that is [C2]broken

Chorus:
[G]Great are You, [D/F#]Lord, [Em7]it's Your breath in our [C2]lungs
So we [G]pour out our [D/F#]praise, pour out our [Em7]praise [C2]

Bridge:
[C2]All the earth will shout Your [G/D]praise
Our [Em7]hearts will cry, these bones will [D]sing
[C2]Great are [D]You, [G]Lord`;

    const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const ENHARMONIC_EQUIV = {
        Db: 'C#',
        Eb: 'D#',
        Gb: 'F#',
        Ab: 'G#',
        Bb: 'A#',
        Cb: 'B',
        Fb: 'E',
        'E#': 'F',
        'B#': 'C'
    };
    // Match chords in brackets [C] [Em] [D/F#] [C2] [Gsus4] etc.
    // Comprehensive regex to match all chord patterns
    const CHORD_REGEX = /\[([A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G](?:#|b)?)?)\]/g;

    let uploadedFile = null;
    let previewObjectURL = null;
    let baselineChart = '';
    let baselineVisualContent = ''; // Store original visual content for transposition
    let currentTransposeSteps = 0;
    let originalDetectedKey = ''; // Store the original key before any transposition
    let lastUploadPayload = null;
    let lastRawTranscription = '';
    let currentSongName = ''; // Current song name - also exposed to window

    // Session live mode state
    let currentSessionSongId = null; // ID of the song currently being displayed
    let isFollowingLeader = true; // Whether user is following the leader's song

    // Expose currentSongName to window for session-ui.js
    Object.defineProperty(window, 'currentSongName', {
        get: () => currentSongName,
        set: (value) => { currentSongName = value; }
    });

    // Expose function to set original key from song library
    window.setOriginalKey = (key) => {
        originalDetectedKey = key;
        currentKey = key;
        currentTransposeSteps = 0; // Reset transpose steps when loading a new song
        console.log('Original key set to:', key);
    };

    // Expose function to set baseline chart from song library
    window.setBaselineChart = (chart) => {
        baselineChart = chart;
        console.log('Baseline chart set for transposition');
    };

    // Expose function to set baseline visual content from song library
    window.setBaselineVisualContent = (content) => {
        baselineVisualContent = content;
        console.log('Baseline visual content set for transposition');
    };

    // Expose function to convert visual format to inline songbook format
    window.convertToInlineFormat = (visualContent) => {
        // Convert above-line format back to inline [C] format
        const lines = visualContent.split('\n');
        const result = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Preserve metadata lines
            if (/^\w+:|.*\|.*Key:.*\|.*BPM:/.test(line)) {
                // Convert combined format back to separate lines
                if (/\|.*Key:.*\|.*BPM:/.test(line)) {
                    const parts = line.split('|').map(p => p.trim());
                    if (parts[0] && parts[0] !== '') result.push(`Title: ${parts[0]}`);
                    if (parts[1]) result.push(parts[1]);
                    if (parts[2]) result.push(parts[2]);
                } else {
                    result.push(line);
                }
                i++;
                continue;
            }

            // Check if next line might be lyrics
            if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
                const chordLine = line;
                const lyricLine = lines[i + 1];

                // If current line has chords and next line is text, combine them
                if (/[A-G][#b]?(maj|min|m|dim|aug|sus|add)?[0-9]*/.test(chordLine)) {
                    // Simple inline conversion: place chords in brackets before lyrics
                    const chords = chordLine.trim().split(/\s+/);
                    let combined = lyricLine;

                    // Try to insert chords at approximate positions
                    chords.forEach(chord => {
                        if (chord) {
                            combined = `[${chord}]` + combined;
                        }
                    });

                    result.push(combined);
                    i += 2;
                    continue;
                }
            }

            result.push(line);
            i++;
        }

        return result.join('\n');
    };

    const statusDot = analysisStatus.querySelector('.status-dot');
    const statusText = analysisStatus.querySelector('.status-text');
    const progressBarFill = analysisStatus.querySelector('.progress-bar-fill');

    const setStatus = (state, message, progress = null) => {
        if (!statusDot || !statusText) {
            return;
        }

        statusDot.className = `status-dot ${state}`;

        // Update status panel class for progress bar visibility
        if (state === 'processing' && progress !== null) {
            analysisStatus.classList.add('processing');
        } else {
            analysisStatus.classList.remove('processing');
        }

        // Add progress percentage if provided
        if (progress !== null && progress >= 0 && progress <= 100) {
            statusText.textContent = `${message} (${progress}%)`;

            // Update progress bar width
            if (progressBarFill) {
                progressBarFill.style.width = `${progress}%`;
            }
        } else {
            statusText.textContent = message;

            // Reset progress bar
            if (progressBarFill) {
                progressBarFill.style.width = '0%';
            }
        }
    };

    const resetPreview = (message = 'No file selected yet. Supported: JPG, PNG, HEIC, PDF.') => {
        if (previewObjectURL) {
            URL.revokeObjectURL(previewObjectURL);
            previewObjectURL = null;
        }

        if (previewImage) {
            previewImage.src = '';
            previewImage.style.display = 'none';
        }

        if (miniPreviewImage) {
            miniPreviewImage.src = '';
            miniPreviewImage.style.display = 'none';
        }

        if (previewPlaceholder) {
            previewPlaceholder.textContent = message;
            previewPlaceholder.style.display = 'block';
        }

        if (miniPreviewPlaceholder) {
            miniPreviewPlaceholder.textContent = message;
            miniPreviewPlaceholder.style.display = 'block';
        }

        if (reanalyzeButton) {
            reanalyzeButton.disabled = true;
        }

        if (reanalyzeFeedback) {
            reanalyzeFeedback.value = '';
        }

        lastUploadPayload = null;
        lastRawTranscription = '';
    };

    // Add {comment: } markers around section headers
    const addCommentMarkers = (text) => {
        if (!text) return '';

        const lines = text.split('\n');
        const result = [];

        const sectionPatterns = [
            /^(Verse|V|Strophe)\s*(\d+)?:?\s*$/i,
            /^(Chorus|Refrain|C|Hook):?\s*$/i,
            /^(Bridge|B):?\s*$/i,
            /^(Pre-Chorus|Pre):?\s*$/i,
            /^(Intro|Introduction):?\s*$/i,
            /^(Outro|Ending):?\s*$/i,
            /^(Tag|Coda):?\s*$/i
        ];

        for (const line of lines) {
            // Check if line matches any section pattern and doesn't already have {comment: }
            const isSectionHeader = sectionPatterns.some(pattern => pattern.test(line.trim()));
            const hasCommentMarker = line.trim().startsWith('{comment:');

            if (isSectionHeader && !hasCommentMarker) {
                result.push(`{comment: ${line.trim()}}`);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    };

    const removeAnalysisLines = (text) => {
        if (!text) {
            return '';
        }

        // Remove markdown code block markers (```chordpro, ```songbook, etc.)
        text = text.replace(/^```[a-z]*\n?/gm, '').replace(/```$/gm, '').trim();

        // Split into lines
        const lines = text.split('\n');
        const cleaned = [];
        let inAnalysisSection = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Detect start of analysis section
            if (line.match(/^Analysis:/i)) {
                inAnalysisSection = true;
                continue;
            }

            // Skip lines that look like analysis bullets
            // (lines starting with "-" or "•" that mention musical terms)
            if (line.match(/^[-–—•]\s*(Predominant|Strong|Most frequent|Typical|Song begins|Harmonic|Dsus4|Gsus4|chord|progression|resolution|movement|scale|tonal)/i)) {
                continue;
            }

            // Skip "Number:" lines
            if (line.match(/^Number:/i)) {
                continue;
            }

            // If we were in analysis section and hit an empty line followed by content, we're out
            if (inAnalysisSection && line === '') {
                inAnalysisSection = false;
            }

            // Skip lines while in analysis section
            if (inAnalysisSection) {
                continue;
            }

            cleaned.push(lines[i]); // Keep original line with spacing
        }

        return cleaned.join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trimEnd();
    };

    const extractAndDisplayKey = (transcription) => {
        if (!keyDetectionDiv || !detectedKeySpan) return;

        console.log('=== EXTRACTING KEY FROM TRANSCRIPTION 1===');
        console.log('Transcription:', transcription.substring(0, 500));

        // Remove markdown code blocks if present (Claude sometimes wraps in ```)
        let cleanedTranscription = transcription.replace(/```[a-z]*\n?/g, '').replace(/```$/g, '');

        // Look for "Key:" line in the transcription - more flexible regex
        const keyMatch = cleanedTranscription.match(/Key:\s*([^\n\r]+)/i);

        if (keyMatch && keyMatch[1]) {
            const detectedKey = keyMatch[1].trim();
            console.log('✅ Key detected:', detectedKey);
            detectedKeySpan.textContent = detectedKey;
            currentKey = detectedKey;
            originalDetectedKey = detectedKey; // Store original key for transposition
            if (keySelector) {
                keySelector.value = detectedKey;
            }
            keyDetectionDiv.style.display = 'block';

            // Set Nashville mode to "chords" only by default after analysis
            if (nashvilleMode) {
                nashvilleMode.value = 'chords';
            }

            // Set default BPM and Time Signature if not detected
            if (bpmInput && !bpmInput.value) {
                bpmInput.value = '120';
            }
            if (timeSignature && !timeSignature.value) {
                timeSignature.value = '4/4';
            }

            updateLivePreview();
        } else {
            // Show "not detected" message if no key found
            console.log('❌ No key found in transcription');
            detectedKeySpan.textContent = 'Key is not detected successfully';
            currentKey = '';
            originalDetectedKey = '';
            if (keySelector) {
                keySelector.value = '';
            }
            keyDetectionDiv.style.display = 'block';
        }

        // Look for "Analysis:" section in the transcription - grab everything after "Analysis:"
        if (keyAnalysisDiv && keyAnalysisText) {
            const analysisMatch = cleanedTranscription.match(/Analysis:\s*([^\n\r]+(?:\n[^\n\r]+)*)/i);

            if (analysisMatch && analysisMatch[1]) {
                const analysis = analysisMatch[1].trim();
                console.log('✅ Analysis found:', analysis.substring(0, 200));
                keyAnalysisText.textContent = analysis;
                keyAnalysisDiv.style.display = 'block';
            } else {
                // Hide analysis section if not found
                console.log('❌ No analysis found in transcription');
                keyAnalysisDiv.style.display = 'none';
            }
        }
    };

    const handleFileSelection = () => {
        uploadedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

        if (!uploadedFile) {
            analyzeButton.disabled = true;
            baselineChart = '';
            visualEditor.value = '';
            songbookOutput.value = '';
            setDirectionalLayout(visualEditor, '');
            setDirectionalLayout(songbookOutput, '');
            setDirectionalLayout(livePreview, '');
            if (aiReferenceContent) {
                aiReferenceContent.innerHTML = '<p class="preview-placeholder">AI transcription will appear here after analysis.</p>';
                aiReferenceContent.removeAttribute('dir');
                aiReferenceContent.style.direction = '';
                aiReferenceContent.style.textAlign = '';
                aiReferenceContent.style.unicodeBidi = '';
            }
            transposeStepInput.value = 0;
            setStatus('idle', 'Waiting for an upload…');
            resetPreview();
            if (reanalyzeButton) {
                reanalyzeButton.disabled = true;
            }
            return;
        }

        setStatus('idle', `Ready to analyze "${uploadedFile.name}".`);
        analyzeButton.disabled = false;
        if (reanalyzeButton) {
            const hasFeedback = reanalyzeFeedback && reanalyzeFeedback.value.trim();
            reanalyzeButton.disabled = !lastUploadPayload || !hasFeedback;
        }

        baselineChart = '';
        currentTransposeSteps = 0;
        visualEditor.value = '';
        songbookOutput.value = '';
        lastUploadPayload = null;
        lastRawTranscription = '';
        if (aiReferenceContent) {
            aiReferenceContent.innerHTML = '<p class="preview-placeholder">AI transcription will appear here after analysis.</p>';
        }
        transposeStepInput.value = 0;

        if (uploadedFile.type.startsWith('image/')) {
            if (previewObjectURL) {
                URL.revokeObjectURL(previewObjectURL);
            }
            previewObjectURL = URL.createObjectURL(uploadedFile);
            if (previewImage) {
                previewImage.src = previewObjectURL;
                previewImage.style.display = 'block';
            }
            if (previewPlaceholder) {
                previewPlaceholder.style.display = 'none'; // Hide the placeholder text when image is shown
            }
            if (miniPreviewImage) {
                miniPreviewImage.src = previewObjectURL;
                miniPreviewImage.style.display = 'block';
            }
            if (miniPreviewPlaceholder) {
                miniPreviewPlaceholder.style.display = 'none';
            }
            if (reanalyzeButton) {
                const hasFeedback = reanalyzeFeedback && reanalyzeFeedback.value.trim();
                reanalyzeButton.disabled = !lastUploadPayload || !hasFeedback;
            }
        } else if (uploadedFile.type === 'application/pdf') {
            // Handle PDF preview - render first page as image
            if (previewPlaceholder) {
                previewPlaceholder.style.display = 'none';
            }
            if (miniPreviewPlaceholder) {
                miniPreviewPlaceholder.style.display = 'none';
            }

            // Read PDF and render first page
            const fileReader = new FileReader();
            fileReader.onload = async function(e) {
                const typedarray = new Uint8Array(e.target.result);

                try {
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    const page = await pdf.getPage(1);

                    // Render to main preview
                    if (previewImage) {
                        const canvas = document.createElement('canvas');
                        const viewport = page.getViewport({ scale: 1.5 });
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;

                        await page.render({
                            canvasContext: canvas.getContext('2d'),
                            viewport: viewport
                        }).promise;

                        previewImage.src = canvas.toDataURL();
                        previewImage.style.display = 'block';
                    }

                    // Render to mini preview
                    if (miniPreviewImage) {
                        const miniCanvas = document.createElement('canvas');
                        const miniViewport = page.getViewport({ scale: 1.0 });
                        miniCanvas.width = miniViewport.width;
                        miniCanvas.height = miniViewport.height;

                        await page.render({
                            canvasContext: miniCanvas.getContext('2d'),
                            viewport: miniViewport
                        }).promise;

                        miniPreviewImage.src = miniCanvas.toDataURL();
                        miniPreviewImage.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Error rendering PDF:', error);
                    if (previewPlaceholder) {
                        previewPlaceholder.innerHTML = `📄 PDF uploaded: ${uploadedFile.name} (Preview failed)`;
                        previewPlaceholder.style.display = 'block';
                    }
                }
            };
            fileReader.readAsArrayBuffer(uploadedFile);

            if (reanalyzeButton) {
                const hasFeedback = reanalyzeFeedback && reanalyzeFeedback.value.trim();
                reanalyzeButton.disabled = !lastUploadPayload || !hasFeedback;
            }
        } else {
            resetPreview('Preview not available for this file type, but it is ready for analysis.');
        }

        // Auto-analyze if enabled
        const autoAnalyzeCheckbox = document.getElementById('autoAnalyzeCheckbox');
        if (autoAnalyzeCheckbox && autoAnalyzeCheckbox.checked && uploadedFile) {
            setTimeout(() => {
                if (analyzeButton && !analyzeButton.disabled) {
                    console.log('🚀 Auto-analyzing uploaded file...');
                    analyzeChart();
                }
            }, 500); // Small delay to ensure preview is ready
        }
    };

    const analyzeChart = async () => {
        if (!uploadedFile) {
            setStatus('error', 'Please upload a chord chart before analyzing.');
            return;
        }

        // Check subscription limits
        if (window.subscriptionManager) {
            if (!window.subscriptionManager.canAnalyze()) {
                const summary = window.subscriptionManager.getUsageSummary();
                setStatus('error', `You've used all ${summary.analysesLimit} analyses this month. Upgrade to continue!`);

                // Show subscription modal
                if (document.getElementById('subscriptionModal')) {
                    document.getElementById('subscriptionModal').style.display = 'flex';
                }
                return;
            }
        }

        // STRICT RESET: Clear everything before new analysis
        baselineChart = '';
        currentTransposeSteps = 0;
        visualEditor.value = '';
        songbookOutput.value = '';
        setDirectionalLayout(visualEditor, '');
        setDirectionalLayout(songbookOutput, '');
        setDirectionalLayout(livePreview, '');
        transposeStepInput.value = 0;
        if (livePreview) {
            livePreview.innerHTML = '';
        }
        if (reanalyzeButton) {
            reanalyzeButton.disabled = true;
        }

        setStatus('processing', 'Preparing image', 10);
        analyzeButton.disabled = true;

        try {
            // Convert file to base64
            const reader = new FileReader();
            const fileData = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(uploadedFile);
            });

            setStatus('processing', 'Encoding file', 20);

            // Extract base64 data and mime type
            const [metadata, base64Data] = fileData.split(',');
            const mimeType = metadata.match(/:(.*?);/)[1];

            lastUploadPayload = {
                base64Data,
                mimeType
            };

            // Check if intense mode is enabled (Pro users only)
            const intenseScanCheckbox = document.getElementById('intenseScanCheckbox');
            const intenseMode = intenseScanCheckbox ? intenseScanCheckbox.checked : false;

            setStatus('processing', 'Uploading to AI server', 30);

            // Call the Vercel serverless API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: base64Data,
                    mimeType: mimeType,
                    intenseMode: intenseMode
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            setStatus('processing', 'AI analyzing chords', 60);

            const result = await response.json();

            setStatus('processing', 'Processing results', 80);

            if (result.success && result.transcription) {
                baselineChart = removeAnalysisLines(result.transcription);
                currentTransposeSteps = 0;

                // AI now returns proper ChordPro format with metadata and {comment:} tags
                // Default: Show chords above lyrics (cleaner view)
                let visualFormat = convertToAboveLineFormat(baselineChart, true);

                // ✅ Auto-insert arrangement line (V1) (C) (V2) etc.
                visualFormat = autoInsertArrangementLine(visualFormat);

                // ✅ Ensure BPM and Time Signature metadata exist with defaults
                visualFormat = ensureMetadata(visualFormat);

                // ✅ Normalize spacing around pipes in metadata
                visualFormat = normalizeMetadataSpacing(visualFormat);

                visualEditor.value = visualFormat;

                // Keep ChordPro format as baseline
                songbookOutput.value = baselineChart;
                setDirectionalLayout(songbookOutput, baselineChart);

                // Update AI reference preview in Step 3
                if (aiReferenceContent) {
                    aiReferenceContent.textContent = baselineChart;
                    setDirectionalLayout(aiReferenceContent, baselineChart);
                }

                // Extract and display detected key
                extractAndDisplayKey(result.transcription);

                lastRawTranscription = result.transcription;

                transposeStepInput.value = 0;

                setStatus('processing', 'Finalizing', 95);
                // Small delay to show the final progress step
                await new Promise(resolve => setTimeout(resolve, 200));

                setStatus('success', 'AI transcription ready! Edit visually on the left.');

                // Increment analysis counter
                if (window.subscriptionManager) {
                    await window.subscriptionManager.incrementAnalysisCount();
                    updateUsageDisplay();
                }

                // Update the live preview
                updateLivePreview();

                // Broadcast to session if leader
                if (window.sessionManager && window.sessionManager.isLeader && window.sessionManager.activeSession) {
                    await broadcastCurrentSong();
                    await addCurrentSongToPlaylist();
                }
            } else {
                throw new Error('Invalid response from API');
            }

        } catch (error) {
            console.error('Analysis error:', error);
            setStatus('error', `Failed to analyze: ${error.message}. Make sure the backend server is running.`);

            // Fallback to demo mode if API fails
            console.log('Falling back to demo mode...');
            baselineChart = removeAnalysisLines(SAMPLE_CHART);
            currentTransposeSteps = 0;

            // Add {comment: } markers for section headers
            baselineChart = addCommentMarkers(baselineChart);

            // Default: Show chords above lyrics
            let visualFormat = convertToAboveLineFormat(baselineChart, true);

            // ✅ Auto-insert arrangement line (V1) (C) (V2) etc.
            visualFormat = autoInsertArrangementLine(visualFormat);

            // ✅ Ensure BPM and Time Signature metadata exist with defaults
            visualFormat = ensureMetadata(visualFormat);

            // ✅ Normalize spacing around pipes in metadata
            visualFormat = normalizeMetadataSpacing(visualFormat);

            visualEditor.value = visualFormat;

            // Keep SongBook format
            songbookOutput.value = baselineChart;
            setDirectionalLayout(songbookOutput, baselineChart);

            // Update AI reference preview in Step 3
            if (aiReferenceContent) {
                aiReferenceContent.textContent = baselineChart;
                setDirectionalLayout(aiReferenceContent, baselineChart);
            }

            // Extract and display detected key
            extractAndDisplayKey(SAMPLE_CHART);

            lastRawTranscription = SAMPLE_CHART;

            transposeStepInput.value = 0;
            updateLivePreview();
        } finally {
            analyzeButton.disabled = false;
        }
    };

    const transposeChart = (source, semitoneShift) => {
        console.log('🎵 transposeChart called - semitoneShift:', semitoneShift);
        if (!source) {
            console.log('❌ No source provided to transposeChart');
            return source;
        }

        if (semitoneShift === 0) {
            console.log('⏸️ Semitone shift is 0, returning source unchanged');
            return source;
        }

        console.log('📝 Source first 300 chars:', source.substring(0, 300));

        // Check if source has bracketed chords [C] [Em] or plain chords (B A C#m)
        const hasBrackets = source.includes('[') && CHORD_REGEX.test(source);
        console.log('Has brackets:', hasBrackets);

        if (hasBrackets) {
            // Transpose bracketed format [C] [Em] etc.
            const result = source.replace(CHORD_REGEX, (fullMatch, chord) => {
                const newChord = transposeChord(chord, semitoneShift);
                console.log(`  🎸 [${chord}] → [${newChord}]`);
                return '[' + newChord + ']';
            });
            console.log('✅ transposeChart complete - result first 300 chars:', result.substring(0, 300));
            return result;
        } else {
            // Transpose plain chord format (chord line above lyrics)
            console.log('🔄 Transposing plain chord format (line-by-line)');
            const lines = source.split('\n');
            const transposedLines = lines.map((line, index) => {
                // Skip metadata/title lines - they contain pipe-separated info or key/bpm labels
                const isMetadataLine = /\|\s*Key:\s*[^|]+\|\s*BPM:/i.test(line) ||
                                       /^(Key|Title|Artist|BPM|Tempo|Capo):/i.test(line) ||
                                       /\|\s*Key:/i.test(line);
                if (isMetadataLine) {
                    console.log(`  ⏭️ Line ${index} is metadata, skipping:`, line.substring(0, 60));
                    return line;
                }

                // Skip arrangement lines with notation like (I) (V1) (PC) (C) etc.
                const isArrangementLine = /\([VBICOTPC]+\d*\)/.test(line);
                if (isArrangementLine) {
                    console.log(`  ⏭️ Line ${index} is arrangement line, skipping:`, line.substring(0, 60));
                    return line;
                }

                // Check if this line looks like a chord line
                // More flexible detection: line with mostly chords and whitespace

                // Strict pattern for pure chord lines
                const hasOnlyChords = /^[\s]*([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?[\s()|\-\.]*)+[\s]*$/;

                // Also check: if line has multiple chord patterns and is mostly uppercase/symbols
                const chordPattern = /[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?/g;
                const chords = line.match(chordPattern) || [];
                const hasMultipleChords = chords.length >= 2;
                const isShortLine = line.trim().length < 50;
                const hasFewLowercase = (line.match(/[a-z]/g) || []).length < 5;
                const looksLikeChordLine = hasMultipleChords && isShortLine && hasFewLowercase;

                if (hasOnlyChords.test(line) || looksLikeChordLine) {
                    console.log(`  📝 Line ${index} is chord line:`, line.substring(0, 60));
                    // This is a chord line - transpose each chord
                    const transposed = line.replace(/([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g, (match, chord) => {
                        const newChord = transposeChord(chord, semitoneShift);
                        if (index < 5) {
                            console.log(`    🎸 ${chord} → ${newChord}`);
                        }
                        return newChord;
                    });
                    return transposed;
                }
                // Not a chord line, return as-is
                return line;
            });

            const result = transposedLines.join('\n');
            console.log('✅ transposeChart complete - result first 300 chars:', result.substring(0, 300));
            return result;
        }
    };

    // Expose transposeChart globally for live-mode.js
    window.transposeChart = transposeChart;

    const transposeChord = (symbol, semitoneShift) => {
        if (!symbol) {
            return symbol;
        }

        const [main, bass] = symbol.split('/');
        const transposedMain = transposeChordRoot(main, semitoneShift);
        if (!bass) {
            return transposedMain;
        }

        const transposedBass = transposeChordRoot(bass, semitoneShift, true);
        return `${transposedMain}/${transposedBass}`;
    };

    const transposeChordRoot = (token, semitoneShift, forceFlatPreference = false) => {
        if (!token) {
            return token;
        }

        const match = token.match(/^([A-G](?:#|b)?)(.*)$/);
        if (!match) {
            return token;
        }

        const [, root, suffix] = match;
        const normalizedRoot = ENHARMONIC_EQUIV[root] || root;
        const baseIndex = NOTES_SHARP.indexOf(normalizedRoot);
        if (baseIndex === -1) {
            return token;
        }

        const useFlats = forceFlatPreference || root.includes('b');
        const targetIndex = (baseIndex + semitoneShift + NOTES_SHARP.length) % NOTES_SHARP.length;
        const newRoot = useFlats ? NOTES_FLAT[targetIndex] : NOTES_SHARP[targetIndex];

        return `${newRoot}${suffix}`;
    };

    // Transpose key name (e.g., "C Major" + 2 steps = "D Major")
    const transposeKey = (keyName, steps) => {
        if (!keyName || steps === 0) return keyName;

        // Extract key root and type (Major/Minor)
        const keyMatch = keyName.match(/^([A-G][#b]?)\s*(Major|Minor)?$/i);
        if (!keyMatch) return keyName;

        const keyRoot = keyMatch[1];
        const keyType = keyMatch[2] || 'Major';

        // Transpose the root note
        const transposedRoot = transposeChordRoot(keyRoot, steps);

        return `${transposedRoot} ${keyType}`;
    };

    // Transpose visual (above-line) format directly while preserving spacing
    const transposeVisualFormat = (content, steps) => {
        const lines = content.split('\n');
        const result = [];

        for (let line of lines) {
            // Skip metadata lines
            if (/^(Key|Title|Artist|BPM|Tempo|Capo):/i.test(line) || /\|\s*Key:\s*[^|]+\|\s*BPM:/i.test(line)) {
                result.push(line);
                continue;
            }

            // Skip arrangement lines with notation like (I) (V1) (PC) (C) etc.
            if (/\([VBICOTPC]+\d*\)/.test(line)) {
                result.push(line);
                continue;
            }

            // Skip arrangement lines without parentheses like "I V1 PC C V2 PC C B C O"
            // Check if line contains only section notation (requires at least 3 sections to avoid catching lyrics)
            const cleanLine = line.replace(/<[^>]*>/g, '').trim(); // Remove HTML tags
            const sectionPattern = /^(?:[IVBCOTPC]+\d*\s*){3,}$/; // At least 3 section notations
            if (sectionPattern.test(cleanLine)) {
                result.push(line);
                continue;
            }

            // Check if this line contains chords (has multiple chord-like patterns)
            const hasChords = /\b[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\b/.test(line);

            if (hasChords) {
                // Find all chords with their positions
                const chordPattern = /\b([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
                const chords = [];
                let match;

                while ((match = chordPattern.exec(line)) !== null) {
                    chords.push({
                        original: match[0],
                        transposed: transposeChordRoot(match[0], steps),
                        start: match.index,
                        end: match.index + match[0].length
                    });
                }

                // Build new line by replacing chords while preserving spacing
                let newLine = '';
                let lastEnd = 0;

                for (const chord of chords) {
                    // Add the space before the chord
                    newLine += line.substring(lastEnd, chord.start);
                    // Add the transposed chord with padding to match original length
                    const paddingNeeded = chord.original.length - chord.transposed.length;
                    newLine += chord.transposed;
                    if (paddingNeeded > 0) {
                        newLine += ' '.repeat(paddingNeeded);
                    }
                    lastEnd = chord.end;
                }

                // Add remaining part of line
                newLine += line.substring(lastEnd);
                result.push(newLine);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    };

    const applyTranspose = (steps) => {
        console.log('\n\n═══════════════════════════════════════');
        console.log('🎼 APPLY TRANSPOSE CALLED');
        console.log('═══════════════════════════════════════');
        console.log('📊 Input steps:', steps);
        console.log('📊 Current transpose steps:', currentTransposeSteps);
        console.log('📊 baselineChart exists:', !!baselineChart);
        console.log('📊 baselineChart length:', baselineChart ? baselineChart.length : 0);
        console.log('📊 baselineChart first 200 chars:', baselineChart ? baselineChart.substring(0, 200) : 'N/A');
        console.log('📊 songbookOutput.value exists:', !!(songbookOutput && songbookOutput.value));
        console.log('📊 songbookOutput.value length:', songbookOutput ? songbookOutput.value.length : 0);

        // Check if we have content to transpose
        const hasVisualContent = visualEditor && visualEditor.value.trim();
        const hasSongbookContent = baselineChart || (songbookOutput && songbookOutput.value.trim());

        if (!hasVisualContent && !hasSongbookContent) {
            console.error('❌ No content to transpose!');
            setStatus('error', 'Nothing to transpose yet. Load a song or run AI analysis first.');
            return;
        }
        if (!Number.isInteger(steps) || steps === 0) {
            console.log('Invalid steps:', steps);
            return;
        }

        // Capture current page count BEFORE transposing (for auto-layout)
        const A4_HEIGHT_PX = 1123;
        const PADDING = 40;
        const AVAILABLE_HEIGHT = A4_HEIGHT_PX - PADDING;
        const pageCountBeforeTranspose = livePreview
            ? Math.ceil(livePreview.scrollHeight / AVAILABLE_HEIGHT)
            : 1;
        console.log('📄 Page count before transpose:', pageCountBeforeTranspose);

        console.log('Before transpose - currentTransposeSteps:', currentTransposeSteps);
        // Update cumulative transpose steps
        currentTransposeSteps += steps;
        console.log('After transpose - currentTransposeSteps:', currentTransposeSteps);

        // If we have songbook format, use the original method
        if (baselineChart || (songbookOutput && songbookOutput.value.trim())) {
            const sourceChart = baselineChart || songbookOutput.value;
            console.log('✅ Using songbook format');
            console.log('📊 Source chart length:', sourceChart.length);
            console.log('📊 Source chart first 200 chars:', sourceChart.substring(0, 200));

            // Transpose the SongBook format (with brackets) using cumulative steps
            const transposedSongbook = transposeChart(sourceChart, currentTransposeSteps);
            console.log('📊 Transposed songbook length:', transposedSongbook.length);
            console.log('📊 Transposed songbook first 200 chars:', transposedSongbook.substring(0, 200));
            songbookOutput.value = transposedSongbook;

            // Convert transposed version to visual format
            console.log('🔄 Converting to above-line format...');
            let transposedVisual = convertToAboveLineFormat(transposedSongbook, true);
            console.log('📊 Visual format length:', transposedVisual.length);
            console.log('📊 Visual format first 200 chars:', transposedVisual.substring(0, 200));

            // Add arrangement line
            transposedVisual = autoInsertArrangementLine(transposedVisual);

            visualEditor.value = transposedVisual;
        } else {
            // For loaded songs without songbook format, transpose visual format directly
            console.log('Transposing visual format directly');
            const sourceVisual = baselineVisualContent || visualEditor.value;
            let transposedVisual = transposeVisualFormat(sourceVisual, currentTransposeSteps);

            // Add arrangement line
            transposedVisual = autoInsertArrangementLine(transposedVisual);

            visualEditor.value = transposedVisual;
        }

        // Transpose the key and update it everywhere
        if (originalDetectedKey) {
            // Always transpose from the original detected key, not the current displayed key
            const newKey = transposeKey(originalDetectedKey, currentTransposeSteps);
            console.log('Transposing key from', originalDetectedKey, 'by', currentTransposeSteps, 'steps to', newKey);

            currentKey = newKey;
            detectedKeySpan.textContent = newKey;
            if (keySelector) {
                keySelector.value = newKey;
            }

            // Update the key in the visual editor content
            let content = visualEditor.value;
            // Match key value precisely without trailing spaces (handles "Key: D Major | BPM: 75" format)
            const keyLineRegex = /^(.*Key:\s*)([A-G][#b]?\s*(?:Major|Minor|major|minor)?)/m;
            if (keyLineRegex.test(content)) {
                content = content.replace(keyLineRegex, `$1${newKey}`);
                visualEditor.value = content;
            }
        }

        setStatus('success', `Transposed ${currentTransposeSteps > 0 ? '+' : ''}${currentTransposeSteps} semitone${Math.abs(currentTransposeSteps) === 1 ? '' : 's'}.`);

        // Update the live preview
        updateLivePreview();

        // Auto-adjust layout DISABLED - preserve user's layout settings
        // Wait 200ms for updateLivePreview's internal timeout (100ms) to complete
        // setTimeout(() => {
        //     autoAdjustLayoutAfterTranspose(pageCountBeforeTranspose);
        // }, 200);

        // Save local transpose preference if in a session
        if (window.sessionManager && window.sessionManager.activeSession && currentSessionSongId) {
            window.sessionManager.setLocalTranspose(currentSessionSongId, currentTransposeSteps);
            console.log(`🎵 Saved local transpose for session: ${currentTransposeSteps} steps`);
        }

        console.log('═══════════════════════════════════════');
        console.log('✅ TRANSPOSE COMPLETE');
        console.log('═══════════════════════════════════════\n');
    };

    const handleCopyToClipboard = async () => {
        // Copy SongBook format (with brackets) for use in other apps
        if (!songbookOutput.value.trim()) {
            return;
        }

        const originalLabel = copyButton.textContent;
        try {
            await navigator.clipboard.writeText(songbookOutput.value);
            copyButton.textContent = 'Copied SongBook format!';
            setTimeout(() => {
                copyButton.textContent = originalLabel;
            }, 1600);
        } catch (error) {
            copyButton.textContent = 'Press ⌘+C / Ctrl+C';
            setTimeout(() => {
                copyButton.textContent = originalLabel;
            }, 2000);
        }
    };

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }

    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeChart);
    }

    // Mode toggle between Quick Print and Custom
    const toggleLayoutMode = document.getElementById('toggleLayoutMode');
    const advancedControls = document.getElementById('advancedControls');
    if (toggleLayoutMode && advancedControls) {
        toggleLayoutMode.addEventListener('click', () => {
            const isHidden = advancedControls.style.display === 'none';
            advancedControls.style.display = isHidden ? 'flex' : 'none';
            toggleLayoutMode.textContent = isHidden ? '← Quick Print' : '⚙️ Customize';

            // Store preference
            localStorage.setItem('layoutMode', isHidden ? 'custom' : 'quick');
            console.log('🎨 Layout mode:', isHidden ? 'Custom' : 'Quick Print');
        });

        // Restore mode preference on load
        const savedMode = localStorage.getItem('layoutMode');
        if (savedMode === 'custom') {
            advancedControls.style.display = 'flex';
            toggleLayoutMode.textContent = '← Quick Print';
        }
    }

    // Chord workspace collapse toggle
    const toggleChordWorkspace = document.getElementById('toggleChordWorkspace');
    const chordWorkspaceContent = document.getElementById('chordWorkspaceContent');
    if (toggleChordWorkspace && chordWorkspaceContent) {
        toggleChordWorkspace.addEventListener('click', () => {
            const isHidden = chordWorkspaceContent.style.display === 'none';
            chordWorkspaceContent.style.display = isHidden ? 'block' : 'none';
            toggleChordWorkspace.textContent = isHidden ? '▲ Collapse' : '▼ Expand';

            // Store preference
            localStorage.setItem('chordWorkspaceState', isHidden ? 'expanded' : 'collapsed');
            console.log('📝 Edit workspace:', isHidden ? 'Expanded' : 'Collapsed');
        });

        // Restore state preference on load (default: collapsed)
        const savedState = localStorage.getItem('chordWorkspaceState');
        if (savedState === 'expanded') {
            chordWorkspaceContent.style.display = 'block';
            toggleChordWorkspace.textContent = '▲ Collapse';
        } else {
            // Default state: collapsed
            chordWorkspaceContent.style.display = 'none';
            toggleChordWorkspace.textContent = '▼ Expand';
        }
    }

    // SongBook format collapse toggle
    const toggleSongbookFormat = document.getElementById('toggleSongbookFormat');
    const songbookFormatContent = document.getElementById('songbookFormatContent');
    if (toggleSongbookFormat && songbookFormatContent) {
        toggleSongbookFormat.addEventListener('click', () => {
            const isHidden = songbookFormatContent.style.display === 'none';
            songbookFormatContent.style.display = isHidden ? 'block' : 'none';
            toggleSongbookFormat.textContent = isHidden ? '▲ Collapse' : '▼ Expand';

            // Store preference
            localStorage.setItem('songbookFormatState', isHidden ? 'expanded' : 'collapsed');
            console.log('📋 SongBook Format:', isHidden ? 'Expanded' : 'Collapsed');
        });

        // Restore state preference on load (default: collapsed)
        const savedState = localStorage.getItem('songbookFormatState');
        if (savedState === 'expanded') {
            songbookFormatContent.style.display = 'block';
            toggleSongbookFormat.textContent = '▲ Collapse';
        } else {
            // Default state: collapsed
            songbookFormatContent.style.display = 'none';
            toggleSongbookFormat.textContent = '▼ Expand';
        }
    }

    // Auto-optimize button
    const autoOptimizeButton = document.getElementById('autoOptimizeButton');
    if (autoOptimizeButton) {
        autoOptimizeButton.addEventListener('click', () => {
            console.log('✨ Auto-optimize clicked');
            autoOptimizeLayout();
        });
    }

    // Quick key transpose buttons
    const quickKeyTransposeButtons = document.querySelectorAll('.quick-key-transpose');
    quickKeyTransposeButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetKey = button.dataset.targetKey;

            // Calculate steps needed to transpose to target key
            const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

            // Extract root note from ORIGINAL key (before any transposition)
            let originalRoot = originalDetectedKey || currentKey;
            originalRoot = originalRoot.replace(/\s*(Major|Minor|m)\s*/gi, '').trim();
            // Handle flat notation
            originalRoot = originalRoot.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#')
                .replace('Ab', 'G#').replace('Bb', 'A#');

            const originalIndex = chromaticScale.indexOf(originalRoot);
            const targetIndex = chromaticScale.indexOf(targetKey);

            if (originalIndex === -1 || targetIndex === -1) {
                console.warn('⚠️ Cannot transpose: invalid key', originalRoot, '->', targetKey);
                return;
            }

            // Calculate absolute steps from original to target
            let targetSteps = targetIndex - originalIndex;
            // Normalize to range [-6, 6] for shortest path
            if (targetSteps > 6) targetSteps -= 12;
            if (targetSteps < -6) targetSteps += 12;

            // Calculate DELTA from current transposition to target
            const deltaSteps = targetSteps - currentTransposeSteps;

            console.log(`🎹 Quick transpose: ${originalRoot} (currently at ${currentTransposeSteps} steps) -> ${targetKey} (target: ${targetSteps} steps) = delta: ${deltaSteps} steps`);

            if (deltaSteps === 0) {
                console.log('✓ Already in target key');
                return;
            }

            applyTranspose(deltaSteps);
        });
    });

    transposeButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Transpose button clicked:', button.dataset.shift);
            const shift = Number.parseInt(button.dataset.shift, 10);
            applyTranspose(shift);
        }, { passive: false });
    });

    if (applyTransposeButton) {
        applyTransposeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Apply transpose clicked');
            const steps = Number.parseInt(transposeStepInput.value, 10);
            if (!Number.isNaN(steps)) {
                applyTranspose(steps);
                transposeStepInput.value = 0;
            }
        }, { passive: false });
    }

    if (resetTransposeButton) {
        resetTransposeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Reset transpose clicked');
            if (!baselineChart) {
                console.log('No baseline chart to reset');
                return;
            }

            // Reset cumulative transpose steps
            currentTransposeSteps = 0;

            // Reset SongBook format to original
            songbookOutput.value = baselineChart;

            // Convert to visual format
            const visualFormat = convertToAboveLineFormat(baselineChart, true);
            visualEditor.value = visualFormat;

            // Reset key to original
            if (originalDetectedKey) {
                currentKey = originalDetectedKey;
                detectedKeySpan.textContent = originalDetectedKey;
                if (keySelector) {
                    keySelector.value = originalDetectedKey;
                }
            }

            transposeStepInput.value = 0;
            setStatus('idle', 'Chart reset to original transcription.');

            // Update the live preview
            updateLivePreview();

            // Save reset to local transpose preference if in a session
            if (window.sessionManager && window.sessionManager.activeSession && currentSessionSongId) {
                window.sessionManager.setLocalTranspose(currentSessionSongId, 0);
                console.log('🎵 Reset local transpose for session');
            }
        });
    }

    if (copyButton) {
        copyButton.addEventListener('click', handleCopyToClipboard);
    }

    if (reanalyzeFeedback) {
        reanalyzeFeedback.addEventListener('input', () => {
            if (!reanalyzeButton) return;
            const hasFeedback = Boolean(reanalyzeFeedback.value.trim());
            reanalyzeButton.disabled = !lastUploadPayload || !hasFeedback;
        });
    }

    if (reanalyzeButton) {
        reanalyzeButton.addEventListener('click', () => {
            if (reanalyzeButton.disabled) {
                return;
            }

            if (!lastUploadPayload) {
                console.warn('Re-analysis requested without stored upload payload.');
                setStatus('error', 'Please upload and analyze a chart before sending feedback.');
                return;
            }

            const feedback = reanalyzeFeedback ? reanalyzeFeedback.value.trim() : '';
            if (!feedback) {
                setStatus('error', 'Enter feedback describing what to fix.');
                return;
            }

            setStatus('processing', 'Preparing re-analysis', 15);
            reanalyzeButton.disabled = true;

            // Check if intense mode is enabled
            const intenseScanCheckbox = document.getElementById('intenseScanCheckbox');
            const intenseMode = intenseScanCheckbox ? intenseScanCheckbox.checked : false;

            setStatus('processing', 'Sending to AI server', 30);

            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: lastUploadPayload.base64Data,
                    mimeType: lastUploadPayload.mimeType,
                    feedback,
                    previousTranscription: lastRawTranscription,
                    intenseMode: intenseMode
                })
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    setStatus('processing', 'AI re-analyzing', 65);
                    return response.json();
                })
                .then(async (result) => {
                    setStatus('processing', 'Processing updated chart', 85);

                    // Small delay to show progress
                    await new Promise(resolve => setTimeout(resolve, 150));

                    if (result.success && result.transcription) {
                        baselineChart = removeAnalysisLines(result.transcription);
                        currentTransposeSteps = 0;

                        // Add {comment: } markers for section headers
                        baselineChart = addCommentMarkers(baselineChart);

                        // Default: Show chords above lyrics
                        const visualFormat = convertToAboveLineFormat(baselineChart, true);
                        visualEditor.value = visualFormat;

                        songbookOutput.value = baselineChart;
                        setDirectionalLayout(songbookOutput, baselineChart);

                        if (aiReferenceContent) {
                            aiReferenceContent.textContent = baselineChart;
                            setDirectionalLayout(aiReferenceContent, baselineChart);
                        }

                        extractAndDisplayKey(result.transcription);

                        transposeStepInput.value = 0;
                        setStatus('success', 'Re-analysis applied! Review the updated chart.');

                        updateLivePreview();

                        lastRawTranscription = result.transcription;
                    } else {
                        throw new Error('Invalid response from API');
                    }
                })
                .catch((error) => {
                    console.error('Re-analysis error:', error);
                    setStatus('error', `Failed to re-analyze: ${error.message}`);
                })
                .finally(() => {
                    if (reanalyzeButton) {
                        const hasFeedback = Boolean(reanalyzeFeedback.value.trim());
                        reanalyzeButton.disabled = !lastUploadPayload || !hasFeedback;
                    }
                });
        });
    }

    const convertToAboveLineFormat = (text, compact = true) => {
        if (!text.trim()) {
            return '';
        }

        // Convert inline [C] format to above-line format
        const lines = text.split('\n');
        const formatted = [];
        let extractedTitle = null;
        let extractedKey = null;
        const bpmPlaceholder = 'BPM: 120';
        let combinedTitleInserted = false;

        // Pre-scan for title, author, key, tempo, and time values
        let extractedAuthor = null;
        let extractedTempo = null;
        let extractedTime = null;

        for (const rawLine of lines) {
            if (!extractedTitle && rawLine.match(/^\{title:/i)) {
                extractedTitle = rawLine.replace(/^\{title:\s*/i, '').replace(/\}$/, '').trim();
            }
            if (!extractedAuthor && rawLine.match(/^\{author:/i)) {
                extractedAuthor = rawLine.replace(/^\{author:\s*/i, '').replace(/\}$/, '').trim();
            }
            if (!extractedKey && rawLine.match(/^\{key:/i)) {
                extractedKey = rawLine.replace(/^\{key:\s*/i, '').replace(/\}$/, '').trim();
            }
            if (!extractedTempo && rawLine.match(/^\{tempo:/i)) {
                extractedTempo = rawLine.replace(/^\{tempo:\s*/i, '').replace(/\}$/, '').trim();
            }
            if (!extractedTime && rawLine.match(/^\{time:/i)) {
                extractedTime = rawLine.replace(/^\{time:\s*/i, '').replace(/\}$/, '').trim();
            }
        }

        for (let line of lines) {
            // Remove {soc} {eoc} markers
            if (line.match(/^\{(soc|eoc)\}$/)) {
                continue;
            }

            // Handle {comment: Section Name} - convert to "Section Name:"
            if (line.match(/^\{comment:/i)) {
                const sectionName = line.replace(/^\{comment:\s*/i, '').replace(/\}$/, '').trim();
                if (compact && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
                    formatted.push(''); // Add blank line before section
                }
                formatted.push(sectionName + (sectionName.endsWith(':') ? '' : ':'));
                continue;
            }

            // Format ChordPro metadata lines - {title:}, {author:}, {key:}, etc.
            if (line.match(/^\{title:/i)) {
                const title = line.replace(/^\{title:\s*/i, '').replace(/\}$/, '').trim();
                const keyDisplay = extractedKey ? extractedKey : 'Unknown';
                const tempoDisplay = extractedTempo ? `BPM: ${extractedTempo}` : bpmPlaceholder;
                const timeDisplay = extractedTime ? `Time: ${extractedTime}` : 'Time: 4/4';
                const combinedLine = `${title}${title ? ' | ' : ''}Key: ${keyDisplay} | ${tempoDisplay} | ${timeDisplay}`;
                formatted.push(combinedLine.trim());
                if (extractedAuthor) {
                    formatted.push(extractedAuthor);
                }
                formatted.push('');
                combinedTitleInserted = true;
                continue;
            }

            if (line.match(/^\{(author|key|tempo|time):/i)) {
                // These are already handled in the metadata block above
                continue;
            }

            // Legacy format support - old style metadata
            if (line.match(/^\{?Artist:/i)) {
                const artist = line.replace(/^\{?Artist:\s*/i, '').replace(/\}$/, '');
                if (compact) {
                    formatted.push(artist);
                } else {
                    formatted.push(artist);
                    formatted.push('');
                }
                continue;
            }

            if (line.match(/^Number:/i)) {
                // Drop number line from visual template
                continue;
            }

            if (line.match(/^\{?(Tempo|Time):/i)) {
                const meta = line.replace(/^\{?/, '').replace(/\}$/, '');
                formatted.push(meta);
                continue;
            }

            // Section markers - less spacing (legacy format without {comment:})
            if (line.match(/.*:$/) && !line.includes('[') && !line.includes(']')) {
                if (compact && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
                    formatted.push(''); // Only one blank line before sections
                }
                formatted.push(line);
                continue;
            }

            // Check if line has chords
            if (line.includes('[') && line.includes(']')) {
                // Build chord and lyric lines character by character for precise alignment
                let chordLine = '';
                let lyricLine = '';
                let i = 0;

                while (i < line.length) {
                    if (line[i] === '[') {
                        // Found a chord
                        const endBracket = line.indexOf(']', i);
                        if (endBracket !== -1) {
                            const chord = line.substring(i + 1, endBracket);

                            // Add the chord at current position
                            chordLine += chord;

                            // Move past the bracket
                            i = endBracket + 1;

                            // Don't add spaces to lyric line - chord takes no space in lyrics
                            continue;
                        }
                    }

                    // Regular character - add to lyric line
                    lyricLine += line[i];
                    // Add space to chord line to keep alignment
                    chordLine += ' ';
                    i++;
                }

                // Check if line has actual lyrics or just chords
                const hasLyrics = lyricLine.trim().length > 0;

                if (!hasLyrics) {
                    // Chord-only line - just show chords with spacing
                    formatted.push(chordLine.trimEnd());
                } else {
                    // Both chords and lyrics
                    const trimmedChords = chordLine.trimEnd();
                    const trimmedLyrics = lyricLine.trimEnd();

                    if (trimmedChords) {
                        formatted.push(trimmedChords);
                    }
                    if (trimmedLyrics) {
                        formatted.push(trimmedLyrics);
                    }
                }
            } else {
                // No chords, just add the line (but skip excessive blank lines in compact mode)
                if (line.match(/^Analysis:/i)) {
                    continue;
                }
                if (compact && line.trim() === '' && formatted.length > 0 && formatted[formatted.length - 1] === '') {
                    continue; // Skip double blank lines
                }
                formatted.push(line);
            }
        }

        // If there was a key but no title to attach it to, add it at the top with BPM placeholder
        if (!combinedTitleInserted && extractedKey) {
            formatted.unshift(`Key: ${extractedKey} | ${bpmPlaceholder}`);
        }

        return formatted.join('\n');
    };

    function detectRTL(text) {
        // Check if text contains Hebrew, Arabic, or other RTL characters
        const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return rtlChars.test(text);
    }

    function setDirectionalLayout(element, content) {
        if (!element) {
            return;
        }

        const isRTL = detectRTL(content || '');
        const direction = isRTL ? 'rtl' : 'ltr';

        element.setAttribute('dir', direction);
        element.style.direction = direction;
        element.style.textAlign = isRTL ? 'right' : 'left';

        // Ensure mixed-language content renders in natural order
        element.style.unicodeBidi = 'plaintext';
    }

    // Expose setDirectionalLayout globally for live-mode.js
    window.setDirectionalLayout = setDirectionalLayout;

    const convertVisualToSongBook = (visualText) => {
        // Convert above-line format back to inline [C] format
        if (!visualText.trim()) return '';

        const lines = visualText.split('\n');
        const result = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Skip metadata and section markers
            if (line.match(/^(Title:|Artist:|Key:|Tempo:|Time:|Number:|\{.*\}|.*:$|^\s*$)/)) {
                result.push(line);
                i++;
                continue;
            }

            // Check if next line exists (potential lyric line)
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];

                // Check if current line might be chords (contains chord-like patterns)
                const hasChordPattern = /[A-G](#|b)?(maj|min|m|dim|aug|sus|add)?[0-9]*(\/[A-G](#|b)?)?/.test(line);

                if (hasChordPattern && !nextLine.match(/^(Title:|Artist:|Key:|.*:$)/)) {
                    // This looks like a chord line followed by lyrics
                    const chordLine = line;
                    const lyricLine = nextLine;

                    // Merge them: place [chords] inline with lyrics
                    let mergedLine = '';
                    let chordPos = 0;
                    let lyricPos = 0;

                    // Extract chords from chord line
                    const chordMatches = [];
                    let match;
                    const chordRegex = /[A-G](#|b)?(maj|min|m|dim|aug|sus|add)?[0-9]*(\/[A-G](#|b)?)?/g;
                    while ((match = chordRegex.exec(chordLine)) !== null) {
                        chordMatches.push({
                            chord: match[0],
                            position: match.index
                        });
                    }

                    // Build merged line
                    for (const chordMatch of chordMatches) {
                        // Add lyrics up to chord position
                        while (lyricPos < chordMatch.position && lyricPos < lyricLine.length) {
                            mergedLine += lyricLine[lyricPos];
                            lyricPos++;
                        }
                        // Add chord in brackets
                        mergedLine += `[${chordMatch.chord}]`;
                    }

                    // Add remaining lyrics
                    mergedLine += lyricLine.substring(lyricPos);

                    result.push(mergedLine);
                    i += 2; // Skip both chord and lyric lines
                    continue;
                }
            }

            // Not a chord-lyric pair, just add the line
            result.push(line);
            i++;
        }

        return result.join('\n');
    };

    const updateSongBookFromVisual = () => {
        // Convert visual editor (above-line) to SongBook format (inline brackets)
        const songbookFormat = convertVisualToSongBook(visualEditor.value);
        songbookOutput.value = songbookFormat;
        setDirectionalLayout(songbookOutput, songbookOutput.value);
    };

    // Format content with structured HTML for professional display
    const formatForPreview = (content, options = {}) => {
        const { enableSectionBlocks = false } = options;
        const lines = content.split('\n');
        const formatted = [];
        let inMetadata = true;
        let metadataLines = [];
        let currentSection = null;
        let sectionContent = [];
        let sectionCounter = 0;

        // ✅ STRIP HTML TAGS from content before parsing (fixes <b>C</b> issue)
        const cleanContent = content.replace(/<[^>]*>/g, '');

        // ✅ PARSE SONG STRUCTURE FOR CIRCULAR BADGES - ONLY inline notation
        // Pattern for inline notation: (V1)2 or (C)3 or (PC)2 - number after parentheses = repeat count
        // Must try PC and CD first (two chars) before single letter
        const inlinePattern = /\((PC|CD|[VBICOT])(\d*)\)(\d+)?/gi;
        const songStructure = [];
        const inlineMatches = [...cleanContent.matchAll(inlinePattern)];

        console.log('🔍 DEBUG: Badge parsing');
        console.log('Original content:', content.substring(0, 200));
        console.log('Clean content:', cleanContent.substring(0, 200));
        console.log('Inline matches found:', inlineMatches.length);

        for (const inlineMatch of inlineMatches) {
            const sectionType = inlineMatch[1].toUpperCase();
            const sectionNum = inlineMatch[2] || '';
            const repeatCount = inlineMatch[3] ? parseInt(inlineMatch[3]) : 1;

            console.log(`  Match: "${inlineMatch[0]}" -> type: ${sectionType}, num: ${sectionNum}, count: ${repeatCount}`);
            songStructure.push({ type: sectionType, num: sectionNum, count: repeatCount });
        }

        console.log('Final songStructure:', songStructure);

        // ✅ Simple check for arrangement line - line contains inline notation and only that
        // Helper function to check if line is an arrangement line
        const isArrangementLine = (line) => {
            // Strip HTML tags from line first (e.g., (<b>C</b>) -> (C))
            const cleanLine = line.replace(/<[^>]*>/g, '');
            // Check if line contains at least one inline notation pattern
            const hasInlineNotation = /\((?:PC|CD|[VBICOT])\d*\)/.test(cleanLine);
            // Check if line contains ONLY inline notation patterns, digits, spaces, parentheses, and pipe
            const onlyInlineNotation = /^[\s\(VBICOTPCD\d\)|]+$/.test(cleanLine) && hasInlineNotation;
            return onlyInlineNotation;
        };

        const finishSection = () => {
            if (currentSection && sectionContent.length > 0) {
                const sectionId = `section-${sectionCounter++}`;
                const sectionClass = enableSectionBlocks ? 'song-section-block' : '';
                const blockStart = enableSectionBlocks ? `<div class="${sectionClass}" data-section-id="${sectionId}" data-section-name="${currentSection}">` : '';
                const blockEnd = enableSectionBlocks ? '</div>' : '';

                formatted.push(blockStart);
                formatted.push(`<div class="section-header">${currentSection}</div>`);
                formatted.push(...sectionContent);
                formatted.push(blockEnd);

                sectionContent = [];
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // First non-empty lines are metadata (title, author, key info)
            if (inMetadata && line) {
                // Check if line is a section header - if so, it's not metadata
                const isSectionHeader = /^(VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE-CHORUS|TAG|CODA)\s*\d*:?$/i.test(line) ||
                                       /^(V|C|B)\s*\d+:$/i.test(line);

                // Skip chord progression summary lines (e.g., "C | 1 | G | 5 D/F | 2# Em | 3")
                const isChordProgression = /^[A-G|#b/\d\s]+\|[A-G|#b/\d\s]+/.test(line);

                // ✅ Check if line is arrangement line - skip it entirely
                const lineIsArrangement = isArrangementLine(line);

                // Check if it's a metadata line (contains Key:, BPM:, Tempo:, etc.)
                if (!isSectionHeader && !isChordProgression && !lineIsArrangement && (i < 3 || /Key:|BPM:|Tempo:|Time:/.test(line) || /(Words|Music)\s+by/i.test(line))) {
                    metadataLines.push(line);
                    if (metadataLines.length >= 4 || (i > 0 && !line)) {
                        inMetadata = false;
                    }
                    continue;
                } else {
                    // First non-metadata line found
                    inMetadata = false;
                    // Output metadata
                    if (metadataLines.length > 0) {
                        // ✅ ALWAYS SHOW METADATA TEMPLATE
                        // Extract title
                        let titleText = metadataLines[0].replace(/^Title:\s*/i, '').trim();
                        formatted.push(`<div class="song-title">${titleText}</div>`);

                        // Parse metadata from lines
                        let author = '';
                        let keyInfo = '';
                        let bpmInfo = '';
                        let timeInfo = '';

                        for (let j = 1; j < metadataLines.length; j++) {
                            const line = metadataLines[j];
                            if (/Key:/i.test(line)) {
                                keyInfo = line;
                            } else if (/BPM:/i.test(line) || /Tempo:/i.test(line)) {
                                bpmInfo = line;
                            } else if (/Time:/i.test(line)) {
                                timeInfo = line;
                            } else if (!/(Words|Music)\s+by/i.test(line) && !/^[A-G|#b/\d\s]+\|/.test(line)) {
                                // Assume it's author if not a special line
                                if (!author) author = line;
                            }
                        }

                        // Extract just the Key value if keyInfo contains combined metadata
                        let displayKey = keyInfo || 'Key: —';
                        if (keyInfo && keyInfo.includes('|')) {
                            // Extract just the "Key: X" part before the first pipe
                            const keyMatch = keyInfo.match(/Key:\s*([^|]+)/i);
                            if (keyMatch) {
                                displayKey = `Key: ${keyMatch[1].trim()}`;
                            }
                        }

                        // Display in order: Author, Key, BPM, Time (always show template)
                        // Use values from inputs/dropdowns if available
                        const displayBPM = bpmInput && bpmInput.value ? `BPM: ${bpmInput.value}` : (bpmInfo || 'BPM: 120');
                        const displayTime = timeSignature && timeSignature.value ? `Time: ${timeSignature.value}` : (timeInfo || 'Time: 4/4');

                        if (author) {
                            formatted.push(`<div class="song-meta">${author}</div>`);
                        }
                        // Combine Key, BPM, and Time on one line separated by spaces
                        const metaLine = `${displayKey}  •  ${displayBPM}  •  ${displayTime}`;
                        formatted.push(`<div class="song-meta">${metaLine}</div>`);

                        // ✅ ADD CIRCULAR SECTION BADGES WITH REPEAT COUNT
                        if (songStructure.length > 0) {
                            const badges = songStructure.map(section => {
                                const label = section.num ? `${section.type}${section.num}` : section.type;
                                // Add repeat count as superscript if > 1
                                const repeatCount = section.count > 1 ? `<sup class="repeat-count">${section.count}</sup>` : '';
                                const colorClass =
                                    section.type === 'I' ? 'badge-intro' :
                                    section.type === 'V' ? 'badge-verse' :
                                    section.type === 'C' ? 'badge-chorus' :
                                    section.type === 'B' ? 'badge-bridge' :
                                    section.type === 'PC' ? 'badge-prechorus' :
                                    'badge-other';
                                return `<span class="section-badge ${colorClass}">${label}${repeatCount}</span>`;
                            }).join('');
                            formatted.push(`<div class="section-badges-row">${badges}</div>`);
                        }

                        formatted.push('<br>');
                        metadataLines = [];
                    }
                }
            }

            // Empty line
            if (!line) {
                if (currentSection) {
                    sectionContent.push('<br>');
                } else {
                    formatted.push('<br>');
                }
                continue;
            }

            // ✅ Skip arrangement line (line with only inline notation)
            if (isArrangementLine(line)) {
                continue;
            }

            // Section headers (VERSE 1:, CHORUS:, etc.)
            if (/^(VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE-CHORUS|TAG|CODA)\s*\d*:?$/i.test(line) ||
                /^(V|C|B)\s*\d+:$/i.test(line)) {
                // Finish previous section if exists
                finishSection();
                // Start new section
                currentSection = line;
                continue;
            }

            // Regular line
            if (currentSection) {
                sectionContent.push(line + '<br>');
            } else {
                formatted.push(line + '<br>');
            }
        }

        // Finish last section
        finishSection();

        // If we haven't output metadata yet (all lines were metadata), output them now
        if (metadataLines.length > 0) {
            const result = [];
            // Strip "Title:" prefix from first line
            let titleText = metadataLines[0].replace(/^Title:\s*/i, '').trim();
            result.push(`<div class="song-title">${titleText}</div>`);
            for (let j = 1; j < metadataLines.length; j++) {
                // Skip chord progression lines in metadata
                if (!/^[A-G|#b/\d\s]+\|[A-G|#b/\d\s]+/.test(metadataLines[j])) {
                    result.push(`<div class="song-meta">${metadataLines[j]}</div>`);
                }
            }
            result.push('<br>');
            result.push(...formatted);
            return result.join('');
        }

        return formatted.join('');
    };

    // Make formatForPreview globally accessible for Live Mode
    window.formatForPreview = formatForPreview;

    // Auto-optimize font size based on content length
    const optimizeFontSize = (content) => {
        if (!livePreview || !content) return;

        const lineCount = content.split('\n').length;
        const charCount = content.length;

        // Calculate optimal font size based on content (improved thresholds for readability)
        let fontSize = 11; // Default 11pt for short content

        if (lineCount > 100 || charCount > 3200) {
            fontSize = 9.5; // Very long content - minimum readable size
        } else if (lineCount > 80 || charCount > 2600) {
            fontSize = 9.5; // Long content
        } else if (lineCount > 60 || charCount > 2000) {
            fontSize = 10; // Medium-long content
        } else if (lineCount > 40 || charCount > 1400) {
            fontSize = 10.5; // Medium content
        }

        livePreview.style.fontSize = fontSize + 'pt';
        console.log(`Auto-optimized font size to ${fontSize}pt (${lineCount} lines, ${charCount} chars)`);
    };

    const updateLivePreview = () => {
        if (!livePreview) {
            console.error('livePreview element not found!');
            return;
        }

        let visualContent = visualEditor.value;
        console.log('Updating live preview with content length:', visualContent.length);

        // Always make chords bold (skip Nashville numbers for clean print preview)
        visualContent = makeChordsBold(visualContent);

        // Auto-optimize font size DISABLED - preserve user's settings
        // optimizeFontSize(visualContent);

        // Format with structured HTML for professional display
        const formattedHTML = formatForPreview(visualContent);
        livePreview.innerHTML = formattedHTML;

        // Apply direction to all editing surfaces based on content
        setDirectionalLayout(livePreview, visualContent);
        setDirectionalLayout(visualEditor, visualEditor.value);
        setDirectionalLayout(songbookOutput, songbookOutput.value);

        // Update pagination after content is loaded
        setTimeout(() => {
            if (typeof updatePagination === 'function') {
                updatePagination();
            }
        }, 100);

        console.log('Live preview updated successfully');
    };

    // Make all chords bold with optional Nashville numbers
    const makeChordsBold = (content) => {
        const lines = content.split('\n');
        const result = [];

        // Get Nashville mode from dropdown
        const mode = nashvilleMode ? nashvilleMode.value : 'both';
        const key = currentKey || 'C Major';

        // Detect if content is RTL (Hebrew, Arabic, etc.)
        const isRTL = /[\u0590-\u05FF\u0600-\u06FF]/.test(content);

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Skip metadata lines (combined format like "Title | Key: X | BPM: Y" or standalone)
            if (/^(Key|Title|Artist|BPM|Tempo|Capo):/i.test(line) || /\|\s*Key:\s*[^|]+\|\s*BPM:/i.test(line)) {
                result.push(line);
                continue;
            }

            // Skip arrangement lines (e.g., "(I) (V1) (PC) (C) (V2) (PC) (C) (B) (C) (O)")
            const hasInlineNotation = /\((?:PC|CD|[VBICOT])\d*\)/.test(line);
            const onlyInlineNotation = /^[\s\(VBICOTPCD\d\)|]+$/.test(line) && hasInlineNotation;
            if (onlyInlineNotation) {
                result.push(line);
                continue;
            }

            // For RTL content, be more careful about what is a chord vs lyrics
            if (isRTL) {
                // Check if this line is a chord line or a lyrics line
                // Chord lines: contain multiple chords (2+) OR only chords with spaces
                // Lyrics lines: contain Hebrew characters + text
                const hasHebrewChars = /[\u0590-\u05FF]/.test(line);
                const chordMatches = line.match(/\b[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\b/g);
                const chordCount = chordMatches ? chordMatches.length : 0;

                // Only process chords if:
                // 1. Line has no Hebrew characters (English chord line), OR
                // 2. Line has multiple chords (2+), indicating it's a chord line not lyrics
                const shouldProcessChords = !hasHebrewChars || chordCount >= 2;

                if (shouldProcessChords) {
                    // Only match chords that are surrounded by spaces or at start/end of line
                    const chordPattern = /(^|\s)([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)(\s|$)/g;
                    line = line.replace(chordPattern, (match, before, chord, after) => {
                        const number = chordToNashville(chord, key);
                        if (mode === 'both' && number) {
                            return `${before}<b>${number} | ${chord}</b>${after}`;
                        } else if (mode === 'numbers' && number) {
                            return `${before}<b>${number}</b>${after}`;
                        } else {
                            return `${before}<b>${chord}</b>${after}`;
                        }
                    });
                }
                // If it's a lyrics line with Hebrew and isolated letters, leave it as-is
            } else {
                // For English text, use normal pattern
                const chordPattern = /\b([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
                line = line.replace(chordPattern, (chord) => {
                    const number = chordToNashville(chord, key);
                    if (mode === 'both' && number) {
                        return `<b>${chord} | ${number}</b>`;
                    } else if (mode === 'numbers' && number) {
                        return `<b>${number}</b>`;
                    } else {
                        return `<b>${chord}</b>`;
                    }
                });
            }

            result.push(line);
        }

        return result.join('\n');
    };

    // Add Nashville numbers after bold chords (e.g., <b>C | 1</b> for LTR, <b>1 | C</b> for RTL)
    const addNashvilleNumbers = (content, key) => {
        console.log('addNashvilleNumbers called with key:', key);
        const lines = content.split('\n');
        const result = [];

        // Detect if content is RTL (Hebrew, Arabic, etc.)
        const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\uFB50-\uFDFF\uFE70-\uFEFF]/;
        const isRTL = rtlChars.test(content);

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Skip metadata lines (combined format like "Title | Key: X | BPM: Y" or standalone)
            if (/^(Key|Title|Artist|BPM|Tempo|Capo):/i.test(line) || /\|\s*Key:\s*[^|]+\|\s*BPM:/i.test(line)) {
                result.push(line);
                continue;
            }

            // Pattern to find bold chords: <b>ChordName</b>
            const boldChordPattern = /<b>([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)<\/b>/g;

            // Add Nashville numbers inside the bold tags with pipe separator
            line = line.replace(boldChordPattern, (match, chord) => {
                const number = chordToNashville(chord, key);
                if (number) {
                    console.log(`Chord: ${chord} -> Number: ${number}`);
                    // Format based on text direction: LTR = "C | 1", RTL = "1 | C"
                    if (isRTL) {
                        return `<b>${number} | ${chord}</b>`;
                    } else {
                        return `<b>${chord} | ${number}</b>`;
                    }
                }
                return match;
            });

            result.push(line);
        }

        return result.join('\n');
    };

    // A4 page height calculation
    // A4 = 297mm, with ~10mm margins = 277mm printable
    // At 72 DPI (print): 277mm = 785 points
    // At 96 DPI (screen): multiply by 96/72 = 1.333
    const A4_PRINTABLE_HEIGHT_PX = 785 * (96 / 72); // ~1047px at screen resolution

    function updateA4Indicator() {
        const a4Indicator = document.getElementById('a4PageIndicator');
        if (!a4Indicator || !livePreview) return;

        const fontSize = parseFloat(fontSizeSlider ? fontSizeSlider.value : 10);
        const lineHeight = parseFloat(lineHeightSlider ? lineHeightSlider.value : 1.2);

        // Calculate line height in pixels (pt to px conversion: 1pt = 1.333px at 96 DPI)
        const lineHeightPx = fontSize * 1.333 * lineHeight;

        // Calculate how many lines fit on A4
        const linesPerPage = Math.floor(A4_PRINTABLE_HEIGHT_PX / lineHeightPx);

        // Position indicator at the end of the first page
        const indicatorPosition = linesPerPage * lineHeightPx;

        // Add padding offset (the preview container has padding)
        const containerPadding = 30; // matches .live-preview padding
        a4Indicator.style.top = (indicatorPosition + containerPadding) + 'px';
    }

    // Pagination function - creates multiple pages when content overflows
    function updatePagination() {
        if (!livePreview) return;

        const pagesWrapper = document.getElementById('pagesWrapper');
        const pageCounter = document.getElementById('pageCounter');
        if (!pagesWrapper || !pageCounter) return;

        // A4 dimensions at 96 DPI (screen resolution)
        const A4_HEIGHT_PX = 1123; // 297mm
        const PADDING = 40; // 20px top + 20px bottom
        const AVAILABLE_HEIGHT = A4_HEIGHT_PX - PADDING;

        // Get content height
        const contentHeight = livePreview.scrollHeight;

        // Calculate number of pages needed
        const pagesNeeded = Math.ceil(contentHeight / AVAILABLE_HEIGHT);

        // Update page counter
        pageCounter.textContent = `Page 1 of ${pagesNeeded} (A4)`;

        // If multiple pages needed, adjust layout
        if (pagesNeeded > 1) {
            // Calculate height per page to distribute content evenly
            const heightPerPage = Math.ceil(contentHeight / pagesNeeded);
            livePreview.style.minHeight = `${contentHeight}px`;

            // Show visual page breaks
            const existingBreaks = livePreview.querySelectorAll('.page-break-indicator');
            existingBreaks.forEach(br => br.remove());

            for (let i = 1; i < pagesNeeded; i++) {
                const breakPosition = AVAILABLE_HEIGHT * i;
                const breakDiv = document.createElement('div');
                breakDiv.className = 'page-break-indicator';
                breakDiv.style.cssText = `
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: ${breakPosition}px;
                    height: 2px;
                    background: repeating-linear-gradient(
                        90deg,
                        rgba(239, 68, 68, 0.5) 0,
                        rgba(239, 68, 68, 0.5) 10px,
                        transparent 10px,
                        transparent 20px
                    );
                    pointer-events: none;
                    z-index: 10;
                `;
                livePreview.style.position = 'relative';
                livePreview.appendChild(breakDiv);
            }
        } else {
            // Single page - remove indicators
            const existingBreaks = livePreview.querySelectorAll('.page-break-indicator');
            existingBreaks.forEach(br => br.remove());
            livePreview.style.minHeight = '1123px';
        }
    }

    // Overflow notification system
    let overflowNotificationTimeout = null;

    function showOverflowNotification(currentPages, expectedPages, overflowPages) {
        const notification = document.getElementById('overflowNotification');
        const message = document.getElementById('overflowMessage');

        if (!notification || !message) return;

        message.textContent = `Content is ${overflowPages} page${overflowPages > 1 ? 's' : ''} over the limit! (${currentPages} pages instead of ${expectedPages})`;

        // Show notification
        notification.classList.add('show');

        // Clear any existing timeout
        if (overflowNotificationTimeout) {
            clearTimeout(overflowNotificationTimeout);
        }

        // Auto-hide after 5 seconds
        overflowNotificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    function hideOverflowNotification() {
        const notification = document.getElementById('overflowNotification');
        if (notification) {
            notification.classList.remove('show');
        }
        if (overflowNotificationTimeout) {
            clearTimeout(overflowNotificationTimeout);
        }
    }

    function checkContentOverflow() {
        if (!livePreview || !pageCountSelect) return;

        const A4_HEIGHT_PX = 1123;
        const PADDING = 40;
        const AVAILABLE_HEIGHT = A4_HEIGHT_PX - PADDING;

        // Get expected page count from dropdown
        const expectedPages = parseInt(pageCountSelect.value);

        // Calculate actual page count based on content height
        const contentHeight = livePreview.scrollHeight;
        const currentPages = Math.ceil(contentHeight / AVAILABLE_HEIGHT);

        // Check if content exceeds expected pages
        if (currentPages > expectedPages) {
            const overflowPages = currentPages - expectedPages;
            showOverflowNotification(currentPages, expectedPages, overflowPages);
        } else {
            hideOverflowNotification();
        }
    }

    // Font size control
    if (fontSizeSlider && fontSizeValue && livePreview) {
        fontSizeSlider.addEventListener('input', () => {
            const size = fontSizeSlider.value;
            fontSizeValue.textContent = size;
            livePreview.style.fontSize = size + 'pt';
            updateA4Indicator();
            setTimeout(() => {
                updatePagination();
                checkContentOverflow();
            }, 100);
        });
    }

    // Line height control
    if (lineHeightSlider && lineHeightValue && livePreview) {
        lineHeightSlider.addEventListener('input', () => {
            const height = lineHeightSlider.value;
            lineHeightValue.textContent = height;
            livePreview.style.lineHeight = height;
            updateA4Indicator();
            setTimeout(() => {
                updatePagination();
                checkContentOverflow();
            }, 100);
        });
    }

    // Character spacing control
    if (charSpacingSlider && charSpacingValue && livePreview) {
        charSpacingSlider.addEventListener('input', () => {
            const spacing = charSpacingSlider.value;
            charSpacingValue.textContent = spacing;
            livePreview.style.letterSpacing = spacing + 'px';
            updateA4Indicator();
            setTimeout(() => {
                updatePagination();
                checkContentOverflow();
            }, 100);
        });
    }

    // Editor font size control (for the edit window textarea)
    const editorFontSizeSlider = document.getElementById('editorFontSizeSlider');
    const editorFontSizeValue = document.getElementById('editorFontSizeValue');

    if (editorFontSizeSlider && editorFontSizeValue && visualEditor) {
        editorFontSizeSlider.addEventListener('input', () => {
            const size = editorFontSizeSlider.value;
            editorFontSizeValue.textContent = size + 'px';
            visualEditor.style.fontSize = size + 'px';
        });
    }

    // SongBook font size control
    const songbookFontSizeSlider = document.getElementById('songbookFontSizeSlider');
    const songbookFontSizeValue = document.getElementById('songbookFontSizeValue');

    if (songbookFontSizeSlider && songbookFontSizeValue && songbookOutput) {
        songbookFontSizeSlider.addEventListener('input', () => {
            const size = songbookFontSizeSlider.value;
            songbookFontSizeValue.textContent = size + 'px';
            songbookOutput.style.fontSize = size + 'px';
        });
    }

    // Column and Page layout control with dropdowns
    const columnCountSelect = document.getElementById('columnCount');
    const pageCountSelect = document.getElementById('pageCount');

    // Auto-fit content to selected layout
    function autoFitContent(pages) {
        if (!livePreview || !fontSizeSlider) return;

        const A4_HEIGHT_PX = 1123;
        const totalAvailableHeight = A4_HEIGHT_PX * pages;
        const contentHeight = livePreview.scrollHeight;

        // Calculate if content fits
        if (contentHeight > totalAvailableHeight) {
            // Content too large - reduce font size
            let currentSize = parseFloat(fontSizeSlider.value);
            const minSize = parseFloat(fontSizeSlider.min);

            // Reduce by 0.5pt increments until it fits or reaches minimum
            while (currentSize > minSize && livePreview.scrollHeight > totalAvailableHeight) {
                currentSize -= 0.5;
                fontSizeSlider.value = currentSize;
                fontSizeValue.textContent = currentSize;
                livePreview.style.fontSize = currentSize + 'pt';

                // Force reflow
                livePreview.offsetHeight;
            }
            console.log('📐 Auto-fit: Reduced font to', currentSize, 'pt to fit content');
        } else if (contentHeight < totalAvailableHeight * 0.6) {
            // Content too small - increase font size
            let currentSize = parseFloat(fontSizeSlider.value);
            const maxSize = parseFloat(fontSizeSlider.max);

            // Increase by 0.5pt increments while it still fits
            while (currentSize < maxSize && livePreview.scrollHeight < totalAvailableHeight * 0.8) {
                currentSize += 0.5;
                fontSizeSlider.value = currentSize;
                fontSizeValue.textContent = currentSize;
                livePreview.style.fontSize = currentSize + 'pt';

                // Force reflow
                livePreview.offsetHeight;

                // Check if it still fits
                if (livePreview.scrollHeight > totalAvailableHeight) {
                    // Went too far, revert
                    currentSize -= 0.5;
                    fontSizeSlider.value = currentSize;
                    fontSizeValue.textContent = currentSize;
                    livePreview.style.fontSize = currentSize + 'pt';
                    break;
                }
            }
            console.log('📐 Auto-fit: Increased font to', currentSize, 'pt to better fill space');
        }
    }

    // Auto-adjust layout to maintain target page count (used after transpose)
    function autoAdjustLayoutAfterTranspose(targetPages) {
        if (!livePreview || !fontSizeSlider) return;

        console.log('🎯 Auto-layout: Target pages =', targetPages);

        // Wait for layout to stabilize using double RAF
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const A4_HEIGHT_PX = 1123;
                const PADDING = 40;
                const AVAILABLE_HEIGHT = A4_HEIGHT_PX - PADDING;

                // Calculate current page count
                const contentHeight = livePreview.scrollHeight;
                const currentPages = Math.ceil(contentHeight / AVAILABLE_HEIGHT);

                console.log('🎯 Auto-layout: Current pages =', currentPages, '| Content height =', contentHeight);

                if (currentPages === targetPages) {
                    console.log('✅ Auto-layout: Already at target page count');
                    return;
                }

                let currentSize = parseFloat(fontSizeSlider.value);
                const minSize = parseFloat(fontSizeSlider.min);
                const maxSize = parseFloat(fontSizeSlider.max);
                const maxIterations = 100; // Safety limit
                let iterations = 0;

                if (currentPages > targetPages) {
                    // Content overflowed - reduce font size
                    console.log('📉 Auto-layout: Reducing font to fit', targetPages, 'pages');

                    while (iterations < maxIterations && currentSize > minSize) {
                        const newContentHeight = livePreview.scrollHeight;
                        const newPages = Math.ceil(newContentHeight / AVAILABLE_HEIGHT);

                        if (newPages <= targetPages) {
                            console.log('✅ Auto-layout: Font reduced to', currentSize, 'pt (', newPages, 'pages)');
                            updateA4Indicator();
                            updatePagination();
                            return;
                        }

                        currentSize -= 0.5;
                        fontSizeSlider.value = currentSize;
                        fontSizeValue.textContent = currentSize;
                        livePreview.style.fontSize = currentSize + 'pt';

                        // Force reflow
                        livePreview.offsetHeight;
                        iterations++;
                    }

                    if (iterations >= maxIterations) {
                        console.log('⚠️ Auto-layout: Reached iteration limit');
                    } else {
                        console.log('⚠️ Auto-layout: Reached minimum font size');
                    }
                } else {
                    // Content fits in fewer pages - try to increase font size
                    console.log('📈 Auto-layout: Increasing font to fill', targetPages, 'pages');

                    while (iterations < maxIterations && currentSize < maxSize) {
                        // Try incrementing
                        const testSize = currentSize + 0.5;
                        fontSizeSlider.value = testSize;
                        fontSizeValue.textContent = testSize;
                        livePreview.style.fontSize = testSize + 'pt';

                        // Force reflow
                        livePreview.offsetHeight;

                        const newContentHeight = livePreview.scrollHeight;
                        const newPages = Math.ceil(newContentHeight / AVAILABLE_HEIGHT);

                        if (newPages > targetPages) {
                            // Went too far, revert to previous size
                            fontSizeSlider.value = currentSize;
                            fontSizeValue.textContent = currentSize;
                            livePreview.style.fontSize = currentSize + 'pt';
                            console.log('✅ Auto-layout: Font increased to', currentSize, 'pt (', targetPages, 'pages)');
                            updateA4Indicator();
                            updatePagination();
                            return;
                        }

                        currentSize = testSize;
                        iterations++;
                    }

                    if (iterations >= maxIterations) {
                        console.log('⚠️ Auto-layout: Reached iteration limit');
                    } else {
                        console.log('✅ Auto-layout: Reached maximum font size at', currentSize, 'pt');
                    }
                }

                updateA4Indicator();
                updatePagination();
            });
        });
    }

    // Auto-optimize layout to fit content on 1 page
    function autoOptimizeLayout() {
        if (!livePreview || !columnCountSelect || !pageCountSelect) {
            console.warn('⚠️ Cannot auto-optimize: missing required elements');
            return;
        }

        console.log('✨ Auto-optimizing layout for 1 page...');

        // Get content length to determine optimal columns
        const content = livePreview.textContent || '';
        const contentLength = content.length;

        // Smart defaults based on content length
        let optimalColumns = 2; // Default to 2 columns
        if (contentLength < 500) {
            optimalColumns = 1; // Short content - single column
        } else if (contentLength > 2000) {
            optimalColumns = 3; // Long content - 3 columns
        }

        // Set optimal layout
        columnCountSelect.value = optimalColumns;
        pageCountSelect.value = 1;

        // Apply layout settings (this will trigger autoFitContent)
        applyLayoutSettings();

        console.log(`✅ Auto-optimized: ${optimalColumns} columns, 1 page`);
    }

    // Apply layout settings based on column and page count
    function applyLayoutSettings() {
        if (!livePreview || !columnCountSelect || !pageCountSelect) return;

        const columns = parseInt(columnCountSelect.value);
        const pages = parseInt(pageCountSelect.value);
        const A4_HEIGHT_PX = 1123;

        console.log(`📊 Layout: ${columns} columns × ${pages} pages`);

        // Calculate height based on pages
        const height = A4_HEIGHT_PX * pages;

        // Apply column settings
        livePreview.style.columns = columns.toString();
        livePreview.style.columnFill = 'auto';
        livePreview.style.height = height + 'px';

        if (columns > 1) {
            livePreview.style.columnGap = '40px';
            livePreview.style.columnRule = '1px solid rgba(0, 0, 0, 0.2)';
        } else {
            livePreview.style.columnGap = '0px';
            livePreview.style.columnRule = 'none';
        }

        // Auto-fit content to layout
        setTimeout(() => {
            autoFitContent(pages);
            updatePagination();
        }, 100);
    }

    // Initialize with default values (2 columns, 1 page)
    if (livePreview && columnCountSelect && pageCountSelect) {
        console.log('📋 Initializing layout dropdowns...');
        applyLayoutSettings();

        // Event listeners for dropdowns
        columnCountSelect.addEventListener('change', applyLayoutSettings);
        pageCountSelect.addEventListener('change', applyLayoutSettings);

        console.log('✅ Layout dropdowns initialized');
    } else {
        console.log('⚠️ Layout dropdowns or livePreview not found!');
    }

    // Initialize A4 indicator position and pagination
    setTimeout(updateA4Indicator, 100);
    setTimeout(updatePagination, 200);

    // ✅ AUTO-INSERT ARRANGEMENT LINE - Extract sections and add (V1) (C) notation
    function autoInsertArrangementLine(content) {
        // ALWAYS use default arrangement structure - don't scan for sections
        // Intro → Verse → Pre-Chorus → Chorus → Verse → Pre-Chorus → Chorus → Bridge → Chorus → Outro
        const arrangementLine = '(I) (V1) (PC) (C) (V2) (PC) (C) (B) (C) (O)';

        // Check if arrangement line already exists - don't duplicate
        if (/\([VBICOTPC]+\d*\)\s*\([VBICOTPC]+\d*\)/.test(content)) {
            console.log('Arrangement line already exists, skipping insertion');
            return content;
        }

        const lines = content.split('\n');
        const sectionPattern = /^(VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE-CHORUS|TAG|CODA|Intro|Verse|Chorus|Bridge|Outro|Pre-Chorus)/i;

        // Find where to insert the arrangement line (after metadata, before first section or content)
        let insertIndex = -1;
        let lastMetadataIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check if this is a metadata line (Title, Key, BPM, etc.)
            const isMetadata = /^(Title|Key|BPM|Tempo|Time|Author):/i.test(line) ||
                              line.includes('Key:') || line.includes('BPM:') || line.includes('Time:') ||
                              line.startsWith('{');

            if (isMetadata) {
                lastMetadataIndex = i;
            }

            // Check if this is the first section header or content
            const isSection = sectionPattern.test(line);
            const isContent = line !== '' && !isMetadata && !/^\s*$/.test(line);

            if (isSection || (isContent && lastMetadataIndex >= 0)) {
                insertIndex = i;
                break;
            }
        }

        // If no section found, insert after last metadata line
        if (insertIndex === -1) {
            insertIndex = lastMetadataIndex + 1;
        }

        // Insert the arrangement line before the first section/content
        lines.splice(insertIndex, 0, '', arrangementLine, '');
        return lines.join('\n');
    }

    /**
     * Normalize spacing around pipe characters in metadata lines
     * Ensures consistent format: "Key: A Major | BPM: 125 | Time: 4/4"
     */
    function normalizeMetadataSpacing(content) {
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check if this is a metadata line containing pipes
            if (/Key:|BPM:|Time:|Tempo:/i.test(line) && line.includes('|')) {
                // Normalize spacing: remove spaces around pipes, then add consistent spacing
                lines[i] = line.replace(/\s*\|\s*/g, ' | ');
            }
        }

        return lines.join('\n');
    }

    /**
     * Ensures BPM and Time Signature metadata exist in content with default values
     * Adds "BPM: 120" and "Time: 4/4" if not present
     */
    function ensureMetadata(content) {
        const lines = content.split('\n');

        // Check if BPM exists
        const hasBPM = /BPM:\s*\d+/i.test(content);
        // Check if Time Signature exists
        const hasTime = /Time:\s*[^\n\r|]+/i.test(content);

        // If both exist, return content unchanged
        if (hasBPM && hasTime) {
            return content;
        }

        // Find the Key line to add BPM and Time to it
        let keyLineIndex = lines.findIndex(line => /Key:/i.test(line));

        if (keyLineIndex >= 0) {
            // Add missing metadata to the Key line
            let keyLine = lines[keyLineIndex];

            if (!hasBPM) {
                keyLine += ' | BPM: 120';
            }
            if (!hasTime) {
                keyLine += ' | Time: 4/4';
            }

            lines[keyLineIndex] = keyLine;
        } else {
            // No Key line found - add a new metadata line at the start
            let metadataLine = '';
            if (!hasBPM) {
                metadataLine = 'BPM: 120';
            }
            if (!hasTime) {
                metadataLine += (metadataLine ? ' | ' : '') + 'Time: 4/4';
            }
            if (metadataLine) {
                lines.unshift(metadataLine);
            }
        }

        return lines.join('\n');
    }

    // ✅ UPDATE EDITOR BADGES - Show song structure in edit mode
    function updateEditorBadges() {
        const visualEditor = document.getElementById('visualEditor');
        const editorStructure = document.getElementById('editorSongStructure');
        const badgesRow = document.getElementById('editorBadgesRow');

        if (!visualEditor || !editorStructure || !badgesRow) return;

        const content = visualEditor.value;
        if (!content || !content.trim()) {
            editorStructure.style.display = 'none';
            return;
        }

        // ✅ ONLY parse inline notation: (V1) (C) (V2) etc. - NOT section headers
        // Pattern for inline notation: (V1)2 or (C)3 or (PC)2 - number after parentheses = repeat count
        // Must try PC and CD first (two chars) before single letter
        const inlinePattern = /\((PC|CD|[VBICOT])(\d*)\)(\d+)?/gi;

        const songStructure = [];
        const inlineMatches = [...content.matchAll(inlinePattern)];

        for (const inlineMatch of inlineMatches) {
            const sectionType = inlineMatch[1].toUpperCase();
            const sectionNum = inlineMatch[2] || '';
            const repeatCount = inlineMatch[3] ? parseInt(inlineMatch[3]) : 1;

            songStructure.push({ type: sectionType, num: sectionNum, count: repeatCount });
        }

        // Show/hide structure based on whether sections exist
        if (songStructure.length === 0) {
            editorStructure.style.display = 'none';
            return;
        }

        editorStructure.style.display = 'block';

        // Generate badges HTML with repeat count
        const badges = songStructure.map(section => {
            const label = section.num ? `${section.type}${section.num}` : section.type;
            // ✅ Add repeat count as superscript if > 1
            const repeatCount = section.count && section.count > 1 ? `<sup class="repeat-count">${section.count}</sup>` : '';
            const colorClass =
                section.type === 'I' ? 'badge-intro' :
                section.type === 'V' ? 'badge-verse' :
                section.type === 'C' ? 'badge-chorus' :
                section.type === 'B' ? 'badge-bridge' :
                section.type === 'PC' ? 'badge-prechorus' :
                section.type === 'O' ? 'badge-outro' :
                'badge-other';
            return `<span class="section-badge ${colorClass}">${label}${repeatCount}</span>`;
        }).join('');

        badgesRow.innerHTML = badges;
    }

    // ✅ Call once on page load if there's content
    updateEditorBadges();

    // Pro Editor Mode Toggle
    if (proEditorToggle && visualEditor && songbookOutput) {
        proEditorToggle.addEventListener('change', () => {
            const chordProFormat = songbookOutput.value;

            if (!chordProFormat || !chordProFormat.trim()) {
                return; // No content to toggle
            }

            if (proEditorToggle.checked) {
                // Switch to Pro Mode: Show raw ChordPro format with {title:}, {comment:}, etc.
                visualEditor.value = chordProFormat;
            } else {
                // Switch to Regular Mode: Show chords above lyrics (clean display)
                const visualFormat = convertToAboveLineFormat(chordProFormat, true);
                visualEditor.value = visualFormat;
            }

            // Update preview after toggle
            updateLivePreview();
            updateEditorBadges(); // ✅ Update badges after mode toggle
        });
    }

    // Update SongBook and preview when visual editor changes
    if (visualEditor) {
        visualEditor.addEventListener('input', () => {
            updateSongBookFromVisual();
            updateLivePreview();
            updateEditorBadges(); // ✅ Update section badges in edit mode
        });
    }

    // Handle manual key change
    if (keySelector) {
        keySelector.addEventListener('change', (e) => {
            const newKey = e.target.value;
            if (!newKey || !visualEditor) return;

            // Update the key in the visual editor content
            let content = visualEditor.value;

            // Replace existing "Key: ..." line with new key
            const keyLineRegex = /^(.*Key:\s*)([^\n\r|]+)/m;
            if (keyLineRegex.test(content)) {
                content = content.replace(keyLineRegex, `$1${newKey}`);
            } else {
                // If no key line exists, add it at the top
                const lines = content.split('\n');
                // Find if there's a title line
                const titleIndex = lines.findIndex(line => line.match(/^.*\|/));
                if (titleIndex >= 0) {
                    // Insert key into the title line
                    lines[titleIndex] = lines[titleIndex].replace(/\|.*$/, `| Key: ${newKey}`);
                } else {
                    // Add key as first line
                    lines.unshift(`Key: ${newKey}`);
                }
                content = lines.join('\n');
            }

            visualEditor.value = content;
            detectedKeySpan.textContent = newKey;
            currentKey = newKey;
            updateSongBookFromVisual();
            updateLivePreview();
        });
    }

    // Handle Nashville mode dropdown (with subscription check)
    if (nashvilleMode) {
        nashvilleMode.addEventListener('change', () => {
            // Check if user has Pro subscription for Nashville Numbers
            if (window.subscriptionManager && !window.subscriptionManager.canUseNashvilleNumbers()) {
                alert('🔢 Nashville Numbers is a Pro feature!\n\nUpgrade to Pro for $1.99/month to unlock Nashville Number System and unlimited AI analyses.');

                // Reset to "chords only" mode
                nashvilleMode.value = 'chords';

                // Show subscription modal
                if (document.getElementById('subscriptionModal')) {
                    document.getElementById('subscriptionModal').style.display = 'flex';
                }
                return;
            }

            // Update the preview with the selected mode
            updateLivePreview();
        });
    }

    // Handle time signature dropdown
    if (timeSignature) {
        timeSignature.addEventListener('change', () => {
            const newTimeSig = timeSignature.value;
            if (!newTimeSig || !visualEditor) return;

            // Update the time signature in the visual editor content
            let content = visualEditor.value;

            // Replace existing "Time: ..." pattern
            const timeSigRegex = /^(.*Time:\s*)([^\n\r|]+)/m;
            if (timeSigRegex.test(content)) {
                content = content.replace(timeSigRegex, `$1${newTimeSig}`);
            } else {
                // If no time signature line exists, add it after BPM or Key
                const lines = content.split('\n');
                const bpmIndex = lines.findIndex(line => line.match(/BPM:/i));
                const keyIndex = lines.findIndex(line => line.match(/Key:/i));

                if (bpmIndex >= 0) {
                    // Insert after BPM line
                    lines[bpmIndex] = lines[bpmIndex] + ` | Time: ${newTimeSig}`;
                } else if (keyIndex >= 0) {
                    // Insert into key line
                    lines[keyIndex] = lines[keyIndex] + ` | Time: ${newTimeSig}`;
                } else {
                    // Add as first line
                    lines.unshift(`Time: ${newTimeSig}`);
                }
                content = lines.join('\n');
            }

            visualEditor.value = content;
            updateSongBookFromVisual();
            updateLivePreview();
        });
    }

    // Handle BPM input change
    if (bpmInput) {
        bpmInput.addEventListener('input', () => {
            const newBPM = bpmInput.value;
            if (!newBPM || !visualEditor) return;

            // Update the BPM in the visual editor content
            let content = visualEditor.value;

            // Replace existing "BPM: ..." pattern
            const bpmRegex = /^(.*BPM:\s*)(\d+)/mi;
            if (bpmRegex.test(content)) {
                content = content.replace(bpmRegex, `$1${newBPM}`);
            } else {
                // If no BPM line exists, add it after Key
                const lines = content.split('\n');
                const keyIndex = lines.findIndex(line => line.match(/Key:/i));

                if (keyIndex >= 0) {
                    // Insert into key line
                    lines[keyIndex] = lines[keyIndex] + ` | BPM: ${newBPM}`;
                } else {
                    // Add as first line
                    lines.unshift(`BPM: ${newBPM}`);
                }
                content = lines.join('\n');
            }

            visualEditor.value = content;
            updateSongBookFromVisual();
            updateLivePreview();
        });
    }

    // Reverse sync: When editor content changes, update controllers
    if (visualEditor) {
        let syncTimeout;
        visualEditor.addEventListener('input', () => {
            // Debounce to avoid too many updates while typing
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => {
                const content = visualEditor.value;

                // Extract Key
                const keyMatch = content.match(/Key:\s*([^\n\r|]+)/i);
                if (keyMatch && keySelector) {
                    const extractedKey = keyMatch[1].trim();
                    // Only update if different to avoid circular updates
                    if (keySelector.value !== extractedKey) {
                        keySelector.value = extractedKey;
                        if (detectedKeySpan) {
                            detectedKeySpan.textContent = extractedKey;
                        }
                        currentKey = extractedKey;
                    }
                }

                // Extract BPM
                const bpmMatch = content.match(/BPM:\s*(\d+)/i);
                if (bpmMatch && bpmInput) {
                    const extractedBPM = bpmMatch[1];
                    // Only update if different to avoid circular updates
                    if (bpmInput.value !== extractedBPM) {
                        bpmInput.value = extractedBPM;
                    }
                }

                // Extract Time Signature
                const timeMatch = content.match(/Time:\s*([^\n\r|]+)/i);
                if (timeMatch && timeSignature) {
                    const extractedTime = timeMatch[1].trim();
                    // Only update if different to avoid circular updates
                    if (timeSignature.value !== extractedTime) {
                        timeSignature.value = extractedTime;
                    }
                }
            }, 500); // 500ms debounce delay
        });
    }

    if (printButton) {
        printButton.addEventListener('click', () => {
            // Use visual editor content for printing (already in above-line format)
            if (printPreview) {
                const visualContent = visualEditor.value;
                printPreview.textContent = visualContent;
                // Apply the same font size and line height as live preview
                printPreview.style.fontSize = livePreview.style.fontSize || '10pt';
                printPreview.style.lineHeight = livePreview.style.lineHeight || '1.3';

                // Auto-detect and apply direction
                setDirectionalLayout(printPreview, visualContent);
            }

            // Trigger print
            window.print();
        });
    }

    // ============= PRINT PREVIEW PREFERENCES =============

    /**
     * Save print preview layout preferences to Firebase
     */
    async function savePrintPreviewPreferences() {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to save layout preferences');
            return;
        }

        try {
            // Get current layout settings from dropdowns
            const columnCountSelect = document.getElementById('columnCount');
            const pageCountSelect = document.getElementById('pageCount');
            const columnCount = columnCountSelect ? parseInt(columnCountSelect.value) : 2;
            const pageCount = pageCountSelect ? parseInt(pageCountSelect.value) : 1;

            const preferences = {
                fontSize: parseFloat(fontSizeSlider.value),
                lineHeight: parseFloat(lineHeightSlider.value),
                charSpacing: parseFloat(charSpacingSlider.value),
                columnCount: columnCount,
                pageCount: pageCount,
                savedAt: Date.now()
            };

            await firebase.database().ref(`users/${user.uid}/printPreviewPreferences`).set(preferences);
            console.log('✅ Layout preferences saved:', preferences);

            // Show success feedback
            const originalText = saveLayoutButton.textContent;
            saveLayoutButton.textContent = '✓ Saved!';
            saveLayoutButton.style.background = '#10b981';
            setTimeout(() => {
                saveLayoutButton.textContent = originalText;
                saveLayoutButton.style.background = 'var(--primary)';
            }, 2000);
        } catch (error) {
            console.error('❌ Error saving layout preferences:', error);
            alert('Failed to save layout preferences. Please try again.');
        }
    }

    /**
     * Load print preview layout preferences from Firebase
     */
    async function loadPrintPreviewPreferences() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const snapshot = await firebase.database().ref(`users/${user.uid}/printPreviewPreferences`).once('value');
            const preferences = snapshot.val();

            if (preferences) {
                console.log('📥 Loading saved layout preferences:', preferences);

                // Apply font size
                if (preferences.fontSize && fontSizeSlider && fontSizeValue) {
                    fontSizeSlider.value = preferences.fontSize;
                    fontSizeValue.textContent = preferences.fontSize;
                    if (livePreview) {
                        livePreview.style.fontSize = `${preferences.fontSize}pt`;
                    }
                }

                // Apply line height
                if (preferences.lineHeight && lineHeightSlider && lineHeightValue) {
                    lineHeightSlider.value = preferences.lineHeight;
                    lineHeightValue.textContent = preferences.lineHeight;
                    if (livePreview) {
                        livePreview.style.lineHeight = preferences.lineHeight;
                    }
                }

                // Apply character spacing
                if (preferences.charSpacing !== undefined && charSpacingSlider && charSpacingValue) {
                    charSpacingSlider.value = preferences.charSpacing;
                    charSpacingValue.textContent = preferences.charSpacing;
                    if (livePreview) {
                        livePreview.style.letterSpacing = `${preferences.charSpacing}px`;
                    }
                }

                // Apply column count
                if (preferences.columnCount) {
                    const columnCountSelect = document.getElementById('columnCount');
                    if (columnCountSelect) {
                        columnCountSelect.value = preferences.columnCount;
                    }
                }

                // Apply page count
                if (preferences.pageCount) {
                    const pageCountSelect = document.getElementById('pageCount');
                    if (pageCountSelect) {
                        pageCountSelect.value = preferences.pageCount;
                    }
                }

                // Apply the layout settings (this will trigger auto-fit)
                const columnCountSelect = document.getElementById('columnCount');
                const pageCountSelect = document.getElementById('pageCount');
                if (columnCountSelect && pageCountSelect && livePreview) {
                    const columns = parseInt(columnCountSelect.value);
                    const pages = parseInt(pageCountSelect.value);
                    const A4_HEIGHT_PX = 1123;
                    const height = A4_HEIGHT_PX * pages;

                    livePreview.style.columns = columns.toString();
                    livePreview.style.columnFill = 'auto';
                    livePreview.style.height = height + 'px';

                    if (columns > 1) {
                        livePreview.style.columnGap = '40px';
                        livePreview.style.columnRule = '1px solid rgba(0, 0, 0, 0.2)';
                    } else {
                        livePreview.style.columnGap = '0px';
                        livePreview.style.columnRule = 'none';
                    }
                }

                console.log('✅ Layout preferences applied successfully');
            }
        } catch (error) {
            console.error('❌ Error loading layout preferences:', error);
        }
    }

    // Save Layout button handler
    if (saveLayoutButton) {
        saveLayoutButton.addEventListener('click', savePrintPreviewPreferences);
    }

    // Make loadPrintPreviewPreferences globally accessible for auth state changes
    window.loadPrintPreviewPreferences = loadPrintPreviewPreferences;

    // ============= LIVE PREVIEW TOGGLE =============
    const livePreviewToggle = document.getElementById('livePreviewToggle');
    let isLivePreviewMode = false;

    if (livePreviewToggle) {
        livePreviewToggle.addEventListener('click', () => {
            isLivePreviewMode = !isLivePreviewMode;

            const previewControlsRow = document.querySelector('.preview-controls-row');
            const editorWorkspace = document.querySelector('.editor-workspace');
            const uploadSection = document.querySelector('.upload-section');
            const songInfoSection = document.querySelector('.song-info-section');
            const sessionControls = document.querySelector('.session-controls');
            const previewHeaderTitle = document.getElementById('previewHeaderTitle');
            const pageCounter = document.getElementById('pageCounter');

            if (isLivePreviewMode) {
                // Enter Live Preview Mode
                livePreviewToggle.innerHTML = '✏️ Back to Editor';
                livePreviewToggle.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';

                // Hide editing controls
                if (previewControlsRow) previewControlsRow.style.display = 'none';
                if (editorWorkspace) editorWorkspace.style.display = 'none';
                if (uploadSection) uploadSection.style.display = 'none';
                if (songInfoSection) songInfoSection.style.display = 'none';
                if (sessionControls) sessionControls.style.display = 'none';
                if (printButton) printButton.style.display = 'none';
                if (saveLayoutButton) saveLayoutButton.style.display = 'none';
                if (pageCounter) pageCounter.style.display = 'none';

                // Update header
                if (previewHeaderTitle) previewHeaderTitle.textContent = 'Live Session Preview';

                // Make preview full width and centered
                if (livePreview) {
                    livePreview.style.maxWidth = '100%';
                    livePreview.style.margin = '0 auto';
                }
            } else {
                // Exit Live Preview Mode - Back to Editor
                livePreviewToggle.innerHTML = '📺 Live Preview';
                livePreviewToggle.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)';

                // Show editing controls
                if (previewControlsRow) previewControlsRow.style.display = 'flex';
                if (editorWorkspace) editorWorkspace.style.display = 'block';
                if (uploadSection) uploadSection.style.display = 'block';
                if (songInfoSection) songInfoSection.style.display = 'block';
                if (sessionControls) sessionControls.style.display = 'block';
                if (printButton) printButton.style.display = 'block';
                if (saveLayoutButton) saveLayoutButton.style.display = 'block';
                if (pageCounter) pageCounter.style.display = 'block';

                // Restore header
                if (previewHeaderTitle) previewHeaderTitle.textContent = 'Print Preview & Transpose';

                // Restore preview layout
                if (livePreview) {
                    livePreview.style.maxWidth = '210mm';
                    livePreview.style.margin = '';
                }
            }
        });
    }

    // ============= SUBSCRIPTION SYSTEM INTEGRATION =============

    /**
     * Update usage display in header and subscription modal
     */
    function updateUsageDisplay() {
        if (!window.subscriptionManager) return;

        const summary = window.subscriptionManager.getUsageSummary();

        // Update header usage indicator
        const headerIndicator = document.getElementById('headerUsageIndicator');
        const headerText = document.getElementById('headerUsageText');

        if (headerIndicator && headerText) {
            if (summary.tier === 'FREE' || summary.tier === 'BASIC') {
                headerIndicator.style.display = 'block';
                const remaining = summary.analysesRemaining;
                if (remaining === 'Unlimited') {
                    headerText.textContent = '∞ Analyses';
                } else {
                    headerText.textContent = `${remaining}/${summary.analysesLimit} analyses left`;

                    // Change color if running low
                    if (remaining <= 1) {
                        headerIndicator.style.background = 'rgba(255, 59, 92, 0.15)';
                        headerText.style.color = 'var(--primary)';
                    } else {
                        headerIndicator.style.background = 'rgba(59, 130, 246, 0.15)';
                        headerText.style.color = '#3b82f6';
                    }
                }
            } else {
                headerIndicator.style.display = 'block';
                headerText.textContent = '✨ Pro';
                headerIndicator.style.background = 'linear-gradient(135deg, var(--primary) 0%, #ff8fab 100%)';
                headerText.style.color = 'white';
            }
        }

        // Update usage text in subscription modal
        const usageIndicator = document.getElementById('usageIndicator');
        const usageText = document.getElementById('usageText');

        if (usageIndicator && usageText) {
            usageIndicator.style.display = 'block';
            usageText.textContent = `Current: ${summary.tierName} Plan | Analyses used this month: ${summary.analysesUsed}/${summary.analysesLimit === -1 ? '∞' : summary.analysesLimit}`;
        }

        // Show/hide upgrade button
        const upgradeButton = document.getElementById('upgradeButton');
        if (upgradeButton) {
            if (summary.tier === 'FREE' || summary.tier === 'BASIC') {
                upgradeButton.style.display = 'block';
            } else {
                upgradeButton.style.display = 'none';
            }
        }

        // Update Nashville Numbers mode UI
        if (nashvilleMode && !summary.canUseNashville) {
            nashvilleMode.style.opacity = '0.5';
            nashvilleMode.disabled = true;
            nashvilleMode.title = 'Pro feature - Upgrade to unlock';
        } else if (nashvilleMode) {
            nashvilleMode.style.opacity = '1';
            nashvilleMode.disabled = false;
            nashvilleMode.title = 'Select Nashville Number System display mode';
        }
    }

    /**
     * Initialize subscription buttons and modals
     */
    function initSubscriptionUI() {
        // Upgrade button click
        const upgradeButton = document.getElementById('upgradeButton');
        if (upgradeButton) {
            upgradeButton.addEventListener('click', () => {
                const modal = document.getElementById('subscriptionModal');
                if (modal) {
                    modal.style.display = 'flex';
                }
            });
        }

        // My Subscription button click
        const mySubscriptionBtn = document.getElementById('mySubscriptionBtn');
        if (mySubscriptionBtn) {
            mySubscriptionBtn.addEventListener('click', () => {
                const modal = document.getElementById('subscriptionModal');
                if (modal) {
                    modal.style.display = 'flex';
                }
            });
        }

        // Close subscription modal
        const subscriptionModalClose = document.getElementById('subscriptionModalClose');
        if (subscriptionModalClose) {
            subscriptionModalClose.addEventListener('click', () => {
                const modal = document.getElementById('subscriptionModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Close modal on background click
        const subscriptionModal = document.getElementById('subscriptionModal');
        if (subscriptionModal) {
            subscriptionModal.addEventListener('click', (e) => {
                if (e.target === subscriptionModal) {
                    subscriptionModal.style.display = 'none';
                }
            });
        }
    }

    /**
     * Initialize PayPal subscription buttons
     */
    async function initPayPalButtons() {
        if (!window.paypalSubscriptionManager) {
            console.error('PayPal subscription manager not loaded');
            return;
        }

        try {
            await window.paypalSubscriptionManager.init();

            // Create Basic subscription button
            window.paypalSubscriptionManager.createSubscriptionButton('BASIC', 'paypal-basic-button');

            // Create Pro subscription button
            window.paypalSubscriptionManager.createSubscriptionButton('PRO', 'paypal-pro-button');

        } catch (error) {
            console.error('Failed to initialize PayPal buttons:', error);
        }
    }

    /**
     * Handle subscription changes
     */
    function handleSubscriptionChange(data) {
        console.log('Subscription changed:', data);
        updateUsageDisplay();

        // Update save button state based on new subscription
        if (window.updateSaveButtonState) {
            window.updateSaveButtonState();
        }

        // Update intense scan option visibility
        const intenseScanOption = document.getElementById('intenseScanOption');
        if (intenseScanOption && window.subscriptionManager) {
            const isPro = window.subscriptionManager.getCurrentTier() === 'PRO';
            intenseScanOption.style.display = isPro ? 'block' : 'none';
        }
    }

    // Initialize subscription system
    if (window.subscriptionManager) {
        // Listen for auth state changes from auth.js
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in, initialize subscription
                await window.subscriptionManager.init(user);
                updateUsageDisplay();

                // Initialize session manager
                await window.sessionManager.init(user);
                updateSessionButtonsVisibility();

                // Load saved print preview preferences
                await loadPrintPreviewPreferences();

                // Show intense scan option for Pro users
                const intenseScanOption = document.getElementById('intenseScanOption');
                if (intenseScanOption) {
                    const isPro = window.subscriptionManager.getCurrentTier() === 'PRO';
                    intenseScanOption.style.display = isPro ? 'block' : 'none';
                }

                // Initialize PayPal buttons
                await initPayPalButtons();
            } else {
                // User is signed out
                await window.subscriptionManager.init(null);
                await window.sessionManager.init(null);

                const headerIndicator = document.getElementById('headerUsageIndicator');
                if (headerIndicator) {
                    headerIndicator.style.display = 'none';
                }
                const upgradeButton = document.getElementById('upgradeButton');
                if (upgradeButton) {
                    upgradeButton.style.display = 'none';
                }

                // Hide intense scan option
                const intenseScanOption = document.getElementById('intenseScanOption');
                if (intenseScanOption) {
                    intenseScanOption.style.display = 'none';
                }

                // Hide session buttons
                hideAllSessionButtons();
            }
        });

        // Register subscription change callback
        window.subscriptionManager.onSubscriptionChange(handleSubscriptionChange);
    }

    // ============= LIVE SESSION INTEGRATION =============

    /**
     * Update session buttons visibility based on user tier
     */
    function updateSessionButtonsVisibility() {
        const createBtn = document.getElementById('createSessionBtn');
        const joinBtn = document.getElementById('joinSessionBtn');
        const mySessionsBtn = document.getElementById('mySessionsBtn');
        const goLiveBtn = document.getElementById('goLiveButton');

        if (!window.subscriptionManager || !window.subscriptionManager.currentUser) {
            hideAllSessionButtons();
            return;
        }

        // Show/hide based on tier
        const canCreate = window.subscriptionManager.canCreateSession();
        const canJoin = window.subscriptionManager.canJoinSession();

        if (createBtn) createBtn.style.display = canCreate ? 'block' : 'none';
        if (joinBtn) joinBtn.style.display = canJoin ? 'block' : 'none';
        if (mySessionsBtn) mySessionsBtn.style.display = (canCreate || canJoin) ? 'block' : 'none';
        if (goLiveBtn) goLiveBtn.style.display = (canCreate || canJoin) ? 'block' : 'none';
    }

    /**
     * Hide all session buttons
     */
    function hideAllSessionButtons() {
        const buttons = ['createSessionBtn', 'joinSessionBtn', 'mySessionsBtn', 'goLiveButton'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
    }

    /**
     * Broadcast current song to session (LEADER only)
     */
    async function broadcastCurrentSong() {
        if (!window.sessionManager || !window.sessionManager.isLeader || !window.sessionManager.activeSession) {
            return; // Not in a session or not a leader
        }

        const visualEditor = document.getElementById('visualEditor');
        const keySelector = document.getElementById('keySelector');
        const bpmInput = document.getElementById('bpmInput');

        if (!visualEditor || !keySelector) return;

        const songData = {
            id: `song_${Date.now()}`,
            name: currentSongName || 'Untitled',
            content: visualEditor.value,
            originalKey: keySelector.value,
            transposeSteps: globalTransposeSteps || 0,
            bpm: bpmInput ? parseInt(bpmInput.value) || null : null
        };

        try {
            await window.sessionManager.updateCurrentSong(songData);
            console.log('📡 Broadcasted song to session');
        } catch (error) {
            console.error('Error broadcasting song:', error);
        }
    }

    /**
     * Handle incoming song updates from leader (PLAYER only)
     * @param {object} songData - Song data from leader
     * @param {boolean} shouldDisplay - Whether to display the song (based on inLiveMode)
     */
    function handleSongUpdateFromLeader(songData, shouldDisplay) {
        if (window.sessionManager.isLeader) return; // Leaders don't receive updates

        console.log('📻 Received song from leader:', songData.name, 'shouldDisplay:', shouldDisplay);

        // Always update the "Now Playing" banner
        updateNowPlayingBanner(songData.name, !shouldDisplay);

        // If not in live mode, just update the banner but don't change the content
        if (!shouldDisplay) {
            console.log('📴 Not following leader - content unchanged');
            return;
        }

        // We're in live mode - display the leader's song
        isFollowingLeader = true;
        currentSessionSongId = songData.songId;

        // Update visual editor with original content (before any transpose)
        const visualEditor = document.getElementById('visualEditor');
        const songbookOutput = document.getElementById('songbookOutput');
        const livePreview = document.getElementById('livePreview');

        if (visualEditor) {
            visualEditor.value = songData.content;
            // Apply RTL/LTR direction based on new song content
            setDirectionalLayout(visualEditor, songData.content);
        }

        // Also reset direction for songbook output and live preview
        if (songbookOutput) {
            setDirectionalLayout(songbookOutput, songData.content);
        }
        if (livePreview) {
            setDirectionalLayout(livePreview, songData.content);
        }

        // Update key selector with original key
        const keySelector = document.getElementById('keySelector');
        if (keySelector) {
            keySelector.value = songData.originalKey;
        }

        // Update BPM
        const bpmInput = document.getElementById('bpmInput');
        if (bpmInput && songData.bpm) {
            bpmInput.value = songData.bpm;
        }

        // Update Time signature
        const timeSignature = document.getElementById('timeSignature');
        if (timeSignature && songData.timeSignature) {
            timeSignature.value = songData.timeSignature;
        }

        // Update song name
        currentSongName = songData.name;

        // Set baseline for transposition (always use original content)
        baselineChart = songData.content;
        baselineVisualContent = songData.content;
        originalDetectedKey = songData.originalKey;
        currentTransposeSteps = 0;

        // Regenerate preview first
        updateSongBookFromVisual();

        // Apply user's local transpose preference for this song (if any)
        const localTranspose = window.sessionManager.getLocalTranspose(songData.songId);
        if (localTranspose !== 0) {
            console.log(`🎵 Applying user's local transpose: ${localTranspose} steps`);
            applyTranspose(localTranspose);
        }

        // If Live Mode is active, also update it
        console.log('📺 Checking Live Mode - exists:', !!window.liveMode, 'isActive:', window.liveMode?.isActive);
        if (window.liveMode && window.liveMode.isActive) {
            console.log('📺 Updating Live Mode display with:', songData.name);
            window.liveMode.updateFromBroadcast(songData);
        }
    }

    /**
     * Update the "Now Playing" banner
     * @param {string} songName - Name of the current song
     * @param {boolean} showReturnButton - Whether to show the "Return to Live" button
     */
    function updateNowPlayingBanner(songName, showReturnButton) {
        const nowPlayingBanner = document.getElementById('liveSessionBanner');
        const nowPlayingSong = document.getElementById('nowPlayingSong');
        const returnToLiveBtn = document.getElementById('returnToLiveBtn');

        if (!nowPlayingBanner) return;

        if (songName) {
            nowPlayingBanner.style.display = 'flex';
            if (nowPlayingSong) nowPlayingSong.textContent = songName;
            if (returnToLiveBtn) returnToLiveBtn.style.display = showReturnButton ? 'inline-block' : 'none';
        } else {
            nowPlayingBanner.style.display = 'none';
        }
    }

    /**
     * Return to leader's current song (for "Return to Live" feature)
     */
    function returnToLeaderSong() {
        const leaderSong = window.sessionManager.getLeaderCurrentSong();
        if (!leaderSong) {
            console.log('⚠️ No leader song available');
            return;
        }

        // Enable live mode
        window.sessionManager.setLiveMode(true);
        isFollowingLeader = true;

        // Load the leader's song
        handleSongUpdateFromLeader(leaderSong, true);

        console.log('↩️ Returned to leader song:', leaderSong.name);
    }

    // Expose returnToLeaderSong globally for UI access
    window.returnToLeaderSong = returnToLeaderSong;

    /**
     * Add current song to session playlist (LEADER only)
     */
    async function addCurrentSongToPlaylist() {
        if (!window.sessionManager || !window.sessionManager.isLeader || !window.sessionManager.activeSession) {
            return;
        }

        const visualEditor = document.getElementById('visualEditor');
        const keySelector = document.getElementById('keySelector');
        const bpmInput = document.getElementById('bpmInput');

        if (!visualEditor || !keySelector) return;

        const songData = {
            id: `song_${Date.now()}`,
            name: currentSongName || 'Untitled',
            content: visualEditor.value,
            originalKey: keySelector.value,
            bpm: bpmInput ? parseInt(bpmInput.value) || null : null
        };

        try {
            await window.sessionManager.addSongToPlaylist(songData);
            console.log('➕ Added current song to session playlist');
        } catch (error) {
            console.error('Error adding song to playlist:', error);
        }
    }

    // Set up session manager callbacks
    if (window.sessionManager) {
        // Override the onSongUpdate callback to handle received songs
        window.sessionManager.onSongUpdate = handleSongUpdateFromLeader;

        // Override onPlaylistUpdate to refresh UI
        window.sessionManager.onPlaylistUpdate = (playlist) => {
            if (window.sessionUI) {
                window.sessionUI.loadPlaylist();
            }
        };

        // Override onParticipantsUpdate to refresh UI
        window.sessionManager.onParticipantsUpdate = (participants) => {
            if (window.sessionUI) {
                window.sessionUI.loadParticipants();
            }
        };
    }

    // Add event listeners for session buttons
    const createSessionBtn = document.getElementById('createSessionBtn');
    if (createSessionBtn) {
        createSessionBtn.addEventListener('click', () => {
            if (!window.subscriptionManager || !window.subscriptionManager.canCreateSession()) {
                alert('Creating sessions requires a PRO subscription ($1.99/mo)');
                document.getElementById('subscriptionModal').style.display = 'flex';
                return;
            }
            window.sessionUI.showCreateSessionModal();
        });
    }

    const joinSessionBtn = document.getElementById('joinSessionBtn');
    if (joinSessionBtn) {
        joinSessionBtn.addEventListener('click', () => {
            if (!window.subscriptionManager || !window.subscriptionManager.canJoinSession()) {
                alert('Joining sessions requires at least a BASIC subscription ($0.99/mo)');
                document.getElementById('subscriptionModal').style.display = 'flex';
                return;
            }
            window.sessionUI.showJoinSessionModal();
        });
    }

    const mySessionsBtn = document.getElementById('mySessionsBtn');
    if (mySessionsBtn) {
        mySessionsBtn.addEventListener('click', () => {
            window.sessionUI.showMySessionsModal();
        });
    }

    // Callback for loading song from playlist (called from session-ui.js)
    window.onLoadSongFromPlaylist = async (songId) => {
        // Get song from playlist
        const playlist = await window.sessionManager.getPlaylist();
        const song = playlist.find(s => s.id === songId);

        if (!song || !song.content) {
            alert('Song content not available');
            return;
        }

        // Load the song into the editor
        const visualEditor = document.getElementById('visualEditor');
        const keySelector = document.getElementById('keySelector');
        const bpmInput = document.getElementById('bpmInput');

        if (visualEditor) {
            visualEditor.value = song.content;
        }

        if (keySelector && song.originalKey) {
            keySelector.value = song.originalKey;
        }

        if (bpmInput && song.bpm) {
            bpmInput.value = song.bpm;
        }

        const timeSignature = document.getElementById('timeSignature');
        if (timeSignature && song.timeSignature) {
            timeSignature.value = song.timeSignature;
        }

        // Update state
        currentSongName = song.name;
        baselineChart = song.content;
        baselineVisualContent = song.content;
        originalDetectedKey = song.originalKey || '';
        currentTransposeSteps = 0;

        // Regenerate preview
        updateSongBookFromVisual();
        updateEditorBadges(); // ✅ Update badges in edit mode

        // If leader, broadcast this song
        if (window.sessionManager && window.sessionManager.isLeader) {
            await broadcastCurrentSong();
            console.log(`📡 Loaded and broadcast: ${song.name}`);
        }

        // Close the session controls modal
        window.sessionUI.hideSessionControls();
    };

    // Listen for song loaded from library and broadcast if leader
    window.addEventListener('songLoaded', async (event) => {
        // Wait a bit for the song to fully load into the editor
        setTimeout(async () => {
            if (window.sessionManager && window.sessionManager.isLeader && window.sessionManager.activeSession) {
                await broadcastCurrentSong();
            }
        }, 500);
    });

    // ============= END LIVE SESSION INTEGRATION =============

    // Initialize subscription UI
    initSubscriptionUI();
});
