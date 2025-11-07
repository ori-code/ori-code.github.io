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
    const printPreview = document.getElementById('printPreview');
    const livePreview = document.getElementById('livePreview');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const lineHeightValue = document.getElementById('lineHeightValue');
    const yearSpan = document.getElementById('year');
    const keyDetectionDiv = document.getElementById('keyDetection');
    const detectedKeySpan = document.getElementById('detectedKey');
    const keySelector = document.getElementById('keySelector');
    const nashvilleToggle = document.getElementById('nashvilleToggle');
    const bpmInput = document.getElementById('bpmInput');
    const keyAnalysisDiv = document.getElementById('keyAnalysis');
    const keyAnalysisText = document.getElementById('keyAnalysisText');

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    if (!fileInput || !analysisStatus || !visualEditor || !songbookOutput) {
        return;
    }

    const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3002/api/analyze-chart'
        : 'https://ori-code-github-io.vercel.app/api/analyze-chart';

    // Nashville Number System state - ON by default with C Major
    let showNashvilleNumbers = true;
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

        // Check major key first
        const majorRoot = key.replace(' Major', '').trim();
        if (NASHVILLE_MAJOR[majorRoot] && NASHVILLE_MAJOR[majorRoot][chordRoot]) {
            return NASHVILLE_MAJOR[majorRoot][chordRoot];
        }

        // Check minor key
        const minorRoot = key.replace(' Minor', '').trim() + 'm';
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

    const setStatus = (state, message) => {
        if (!statusDot || !statusText) {
            return;
        }

        statusDot.className = `status-dot ${state}`;
        statusText.textContent = message;
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

    const removeAnalysisLines = (text) => {
        if (!text) {
            return '';
        }
        return text
            .replace(/^Analysis:.*$/gim, '')
            .replace(/^Number:.*$/gim, '')
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

            // Enable Nashville numbers by default after analysis
            showNashvilleNumbers = true;
            if (nashvilleToggle) {
                nashvilleToggle.style.display = 'inline-block';
                nashvilleToggle.textContent = '🔢 Nashville Numbers: ON';
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
            if (nashvilleToggle) {
                nashvilleToggle.style.display = 'none';
            }
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
    };

    const analyzeChart = async () => {
        if (!uploadedFile) {
            setStatus('error', 'Please upload a chord chart before analyzing.');
            return;
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

        setStatus('processing', 'Analyzing chart…');
        analyzeButton.disabled = true;

        try {
            // Convert file to base64
            const reader = new FileReader();
            const fileData = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(uploadedFile);
            });

            // Extract base64 data and mime type
            const [metadata, base64Data] = fileData.split(',');
            const mimeType = metadata.match(/:(.*?);/)[1];

            lastUploadPayload = {
                base64Data,
                mimeType
            };

            // Call the Vercel serverless API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: base64Data,
                    mimeType: mimeType
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.transcription) {
                baselineChart = removeAnalysisLines(result.transcription);
                currentTransposeSteps = 0;

                // Convert to visual format (above-line) for editing
                const visualFormat = convertToAboveLineFormat(baselineChart, true);
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
                extractAndDisplayKey(result.transcription);

                lastRawTranscription = result.transcription;

                transposeStepInput.value = 0;
                setStatus('success', 'AI transcription ready! Edit visually on the left.');

                // Update the live preview
                updateLivePreview();
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

            // Convert to visual format for editing
            const visualFormat = convertToAboveLineFormat(baselineChart, true);
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
                // Check if this line looks like a chord line (contains chord patterns)
                // Chord pattern: starts with chords like B, C#m, Dm, F#, etc.
                const hasOnlyChords = /^[\s]*([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?[\s()]*)+[\s]*$/;

                if (hasOnlyChords.test(line)) {
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
            const transposedVisual = convertToAboveLineFormat(transposedSongbook, true);
            console.log('📊 Visual format length:', transposedVisual.length);
            console.log('📊 Visual format first 200 chars:', transposedVisual.substring(0, 200));
            visualEditor.value = transposedVisual;
        } else {
            // For loaded songs without songbook format, transpose visual format directly
            console.log('Transposing visual format directly');
            const sourceVisual = baselineVisualContent || visualEditor.value;
            const transposedVisual = transposeVisualFormat(sourceVisual, currentTransposeSteps);
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
            const keyLineRegex = /^(.*Key:\s*)([^\n\r|]+)/m;
            if (keyLineRegex.test(content)) {
                content = content.replace(keyLineRegex, `$1${newKey}`);
                visualEditor.value = content;
            }
        }

        setStatus('success', `Transposed ${currentTransposeSteps > 0 ? '+' : ''}${currentTransposeSteps} semitone${Math.abs(currentTransposeSteps) === 1 ? '' : 's'}.`);

        // Update the live preview
        updateLivePreview();

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

            setStatus('processing', 'Re-analyzing with your feedback…');
            reanalyzeButton.disabled = true;

            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: lastUploadPayload.base64Data,
                    mimeType: lastUploadPayload.mimeType,
                    feedback,
                    previousTranscription: lastRawTranscription
                })
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then((result) => {
                    if (result.success && result.transcription) {
                        baselineChart = removeAnalysisLines(result.transcription);
                        currentTransposeSteps = 0;

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
        const bpmPlaceholder = 'BPM: ___';
        let combinedTitleInserted = false;

        // Pre-scan for title and key values
        for (const rawLine of lines) {
            if (!extractedTitle && rawLine.match(/^\{?Title:/i)) {
                extractedTitle = rawLine.replace(/^\{?Title:\s*/i, '').replace(/\}$/, '').trim();
            }
            if (!extractedKey && rawLine.match(/^\{?Key:/i)) {
                extractedKey = rawLine.replace(/^\{?Key:\s*/i, '').replace(/\}$/, '').trim();
            }
        }

        for (let line of lines) {
            // Remove {soc} {eoc} markers
            if (line.match(/^\{(soc|eoc)\}$/)) {
                continue;
            }

            // Format metadata lines
            if (line.match(/^\{?Title:/i)) {
                const title = line.replace(/^\{?Title:\s*/i, '').replace(/\}$/, '').trim();
                const keyDisplay = extractedKey ? extractedKey : 'Unknown';
                const combinedLine = `${title}${title ? ' | ' : ''}Key: ${keyDisplay} | ${bpmPlaceholder}`;
                formatted.push(combinedLine.trim());
                formatted.push('');
                combinedTitleInserted = true;
                continue;
            }

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

            if (line.match(/^\{?Key:/i)) {
                // Key already merged with title line above
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

            // Section markers - less spacing
            if (line.match(/.*:$/)) {
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

    const updateLivePreview = () => {
        if (!livePreview) {
            console.error('livePreview element not found!');
            return;
        }

        let visualContent = visualEditor.value;
        console.log('Updating live preview with content length:', visualContent.length);

        // Always make chords bold, then add Nashville numbers if enabled
        visualContent = makeChordsBold(visualContent);
        if (showNashvilleNumbers && currentKey) {
            visualContent = addNashvilleNumbers(visualContent, currentKey);
        }

        // Use visual editor content for preview (innerHTML to support bold tags)
        livePreview.innerHTML = visualContent.replace(/\n/g, '<br>');

        // Apply direction to all editing surfaces based on content
        setDirectionalLayout(livePreview, visualContent);
        setDirectionalLayout(visualEditor, visualEditor.value);
        setDirectionalLayout(songbookOutput, songbookOutput.value);

        console.log('Live preview updated successfully');
    };

    // Make all chords bold
    const makeChordsBold = (content) => {
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Skip metadata lines (combined format like "Title | Key: X | BPM: Y" or standalone)
            if (/^(Key|Title|Artist|BPM|Tempo|Capo):/i.test(line) || /\|\s*Key:\s*[^|]+\|\s*BPM:/i.test(line)) {
                result.push(line);
                continue;
            }

            // Skip lines with Hebrew/RTL characters to avoid messing up text
            if (/[\u0590-\u05FF\u0600-\u06FF]/.test(line)) {
                // Still process chords but be more careful
                // Only match chords that are surrounded by spaces or at start/end of line
                const chordPattern = /(^|\s)([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)(\s|$)/g;
                line = line.replace(chordPattern, (match, before, chord, after) => {
                    return `${before}<b>${chord}</b>${after}`;
                });
            } else {
                // For English text, use normal pattern
                const chordPattern = /\b([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
                line = line.replace(chordPattern, (match) => {
                    return `<b>${match}</b>`;
                });
            }

            result.push(line);
        }

        return result.join('\n');
    };

    // Add Nashville numbers after bold chords (e.g., <b>E1</b>)
    const addNashvilleNumbers = (content, key) => {
        console.log('addNashvilleNumbers called with key:', key);
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Skip metadata lines (combined format like "Title | Key: X | BPM: Y" or standalone)
            if (/^(Key|Title|Artist|BPM|Tempo|Capo):/i.test(line) || /\|\s*Key:\s*[^|]+\|\s*BPM:/i.test(line)) {
                result.push(line);
                continue;
            }

            // Pattern to find bold chords: <b>ChordName</b>
            const boldChordPattern = /<b>([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)<\/b>/g;

            // Add Nashville numbers inside the bold tags
            line = line.replace(boldChordPattern, (match, chord) => {
                const number = chordToNashville(chord, key);
                if (number) {
                    console.log(`Chord: ${chord} -> Number: ${number}`);
                    return `<b>${chord}${number}</b>`;
                }
                return match;
            });

            result.push(line);
        }

        return result.join('\n');
    };

    // Font size control
    if (fontSizeSlider && fontSizeValue && livePreview) {
        fontSizeSlider.addEventListener('input', () => {
            const size = fontSizeSlider.value;
            fontSizeValue.textContent = size;
            livePreview.style.fontSize = size + 'pt';
        });
    }

    // Line height control
    if (lineHeightSlider && lineHeightValue && livePreview) {
        lineHeightSlider.addEventListener('input', () => {
            const height = lineHeightSlider.value;
            lineHeightValue.textContent = height;
            livePreview.style.lineHeight = height;
        });
    }

    // Update SongBook and preview when visual editor changes
    if (visualEditor) {
        visualEditor.addEventListener('input', () => {
            updateSongBookFromVisual();
            updateLivePreview();
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
                    lines[titleIndex] = lines[titleIndex].replace(/\|.*$/, `| Key: ${newKey} | BPM: ___ | Capo: ___`);
                } else {
                    // Add key as first line
                    lines.unshift(`Key: ${newKey} | BPM: ___ | Capo: ___`);
                    lines.unshift('');
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

    // Handle Nashville numbers toggle
    if (nashvilleToggle) {
        nashvilleToggle.addEventListener('click', () => {
            showNashvilleNumbers = !showNashvilleNumbers;
            nashvilleToggle.textContent = showNashvilleNumbers
                ? '🔢 Nashville Numbers: ON'
                : '🔢 Nashville Numbers: OFF';
            updateLivePreview();
        });
    }

    // Handle BPM input change
    if (bpmInput) {
        bpmInput.addEventListener('input', () => {
            const bpm = bpmInput.value;
            if (visualEditor && bpm) {
                // Update BPM in the visual editor content
                let content = visualEditor.value;
                const bpmRegex = /BPM:\s*(\d+|___)/i;

                if (bpmRegex.test(content)) {
                    // Replace existing BPM value
                    content = content.replace(bpmRegex, `BPM: ${bpm}`);
                } else {
                    // If no BPM line exists, try to add it to the first line with Key
                    const keyLineRegex = /^(.*Key:[^|\n]*)\|?\s*(.*)$/m;
                    if (keyLineRegex.test(content)) {
                        content = content.replace(keyLineRegex, `$1| BPM: ${bpm} | Capo: ___ $2`);
                    }
                }

                visualEditor.value = content;
                updateSongBookFromVisual();
                updateLivePreview();
            }
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
});
