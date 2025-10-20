document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('chartFileInput');
    const previewPanel = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const previewPlaceholder = previewPanel ? previewPanel.querySelector('.preview-placeholder') : null;
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
    const printButton = document.getElementById('printButton');
    const printPreview = document.getElementById('printPreview');
    const livePreview = document.getElementById('livePreview');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const lineHeightValue = document.getElementById('lineHeightValue');
    const yearSpan = document.getElementById('year');

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    if (!fileInput || !analysisStatus || !visualEditor || !songbookOutput) {
        return;
    }

    const SAMPLE_CHART = `[Intro]
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
    // Match chords in brackets [C] [Em] [D/F#] etc.
    const CHORD_REGEX = /\[([A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G](?:#|b)?)?)\]/g;

    let uploadedFile = null;
    let previewObjectURL = null;
    let baselineChart = '';

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

        if (previewPlaceholder) {
            previewPlaceholder.textContent = message;
        }
    };

    const handleFileSelection = () => {
        uploadedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

        if (!uploadedFile) {
            analyzeButton.disabled = true;
            baselineChart = '';
            visualEditor.value = '';
            songbookOutput.value = '';
            if (aiReferenceContent) {
                aiReferenceContent.innerHTML = '<p class="preview-placeholder">AI transcription will appear here after analysis.</p>';
            }
            transposeStepInput.value = 0;
            setStatus('idle', 'Waiting for an upload…');
            resetPreview();
            return;
        }

        setStatus('idle', `Ready to analyze "${uploadedFile.name}".`);
        analyzeButton.disabled = false;

        baselineChart = '';
        visualEditor.value = '';
        songbookOutput.value = '';
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
        } else {
            resetPreview('Preview not available for this file type, but it is ready for analysis.');
        }
    };

    const analyzeChart = async () => {
        if (!uploadedFile) {
            setStatus('error', 'Please upload a chord chart before analyzing.');
            return;
        }

        setStatus('processing', 'Analyzing chart with AI…');
        analyzeButton.disabled = true;

        try {
            // Create FormData to send the file
            const formData = new FormData();
            formData.append('chart', uploadedFile);

            // Call the backend API
            const response = await fetch('http://localhost:3001/api/analyze-chart', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.transcription) {
                baselineChart = result.transcription;

                // Convert to visual format (above-line) for editing
                const visualFormat = convertToAboveLineFormat(result.transcription, true);
                visualEditor.value = visualFormat;

                // Keep SongBook format
                songbookOutput.value = result.transcription;

                // Update AI reference preview in Step 3
                if (aiReferenceContent) {
                    aiReferenceContent.textContent = result.transcription;
                }

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
            baselineChart = SAMPLE_CHART;

            // Convert to visual format for editing
            const visualFormat = convertToAboveLineFormat(SAMPLE_CHART, true);
            visualEditor.value = visualFormat;

            // Keep SongBook format
            songbookOutput.value = SAMPLE_CHART;

            // Update AI reference preview in Step 3
            if (aiReferenceContent) {
                aiReferenceContent.textContent = SAMPLE_CHART;
            }

            transposeStepInput.value = 0;
            updateLivePreview();
        } finally {
            analyzeButton.disabled = false;
        }
    };

    const transposeChart = (source, semitoneShift) => {
        if (!source || !semitoneShift) {
            return source;
        }

        // Match [Chord] format and transpose the chord inside brackets
        return source.replace(CHORD_REGEX, (fullMatch, chord) => {
            return '[' + transposeChord(chord, semitoneShift) + ']';
        });
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

    const applyTranspose = (steps) => {
        if (!songbookOutput.value.trim()) {
            setStatus('error', 'Nothing to transpose yet. Run the AI analysis first.');
            return;
        }
        if (!Number.isInteger(steps) || steps === 0) {
            return;
        }

        // Transpose the SongBook format (with brackets)
        const transposedSongbook = transposeChart(songbookOutput.value, steps);
        songbookOutput.value = transposedSongbook;

        // Convert transposed version to visual format
        const transposedVisual = convertToAboveLineFormat(transposedSongbook, true);
        visualEditor.value = transposedVisual;

        setStatus('success', `Transposed ${steps > 0 ? '+' : ''}${steps} semitone${Math.abs(steps) === 1 ? '' : 's'}.`);

        // Update the live preview
        updateLivePreview();
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
        button.addEventListener('click', () => {
            const shift = Number.parseInt(button.dataset.shift, 10);
            applyTranspose(shift);
        });
    });

    if (applyTransposeButton) {
        applyTransposeButton.addEventListener('click', () => {
            const steps = Number.parseInt(transposeStepInput.value, 10);
            if (!Number.isNaN(steps)) {
                applyTranspose(steps);
                transposeStepInput.value = 0;
            }
        });
    }

    if (resetTransposeButton) {
        resetTransposeButton.addEventListener('click', () => {
            if (!baselineChart) {
                return;
            }

            // Reset SongBook format to original
            songbookOutput.value = baselineChart;

            // Convert to visual format
            const visualFormat = convertToAboveLineFormat(baselineChart, true);
            visualEditor.value = visualFormat;

            transposeStepInput.value = 0;
            setStatus('idle', 'Chart reset to AI transcription.');

            // Update the live preview
            updateLivePreview();
        });
    }

    if (copyButton) {
        copyButton.addEventListener('click', handleCopyToClipboard);
    }

    const convertToAboveLineFormat = (text, compact = true) => {
        if (!text.trim()) {
            return '';
        }

        // Convert inline [C] format to above-line format
        const lines = text.split('\n');
        const formatted = [];

        for (let line of lines) {
            // Remove {soc} {eoc} markers
            if (line.match(/^\{(soc|eoc)\}$/)) {
                continue;
            }

            // Format metadata lines
            if (line.match(/^\{?Title:/i)) {
                const title = line.replace(/^\{?Title:\s*/i, '').replace(/\}$/, '');
                if (compact) {
                    formatted.push(title);
                    formatted.push('');
                } else {
                    formatted.push(title);
                    formatted.push('');
                }
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

            if (line.match(/^\{?(Key|Tempo|Time):/i)) {
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

                            // Add spaces to lyric line to match chord length
                            lyricLine += ' '.repeat(chord.length);
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
                    formatted.push(chordLine.trim());
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
                if (compact && line.trim() === '' && formatted.length > 0 && formatted[formatted.length - 1] === '') {
                    continue; // Skip double blank lines
                }
                formatted.push(line);
            }
        }

        return formatted.join('\n');
    };

    const detectRTL = (text) => {
        // Check if text contains Hebrew, Arabic, or other RTL characters
        const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return rtlChars.test(text);
    };

    const convertVisualToSongBook = (visualText) => {
        // Convert above-line format back to inline [C] format
        if (!visualText.trim()) return '';

        const lines = visualText.split('\n');
        const result = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Skip metadata and section markers
            if (line.match(/^(Title:|Artist:|Key:|Tempo:|Time:|\{.*\}|.*:$|^\s*$)/)) {
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
    };

    const updateLivePreview = () => {
        if (!livePreview) return;

        // Use visual editor content for preview
        livePreview.textContent = visualEditor.value;

        // Auto-detect and set direction
        const isRTL = detectRTL(visualEditor.value);
        livePreview.style.direction = isRTL ? 'rtl' : 'ltr';
        livePreview.style.textAlign = isRTL ? 'right' : 'left';
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

    if (printButton) {
        printButton.addEventListener('click', () => {
            // Use visual editor content for printing (already in above-line format)
            if (printPreview) {
                printPreview.textContent = visualEditor.value;
                // Apply the same font size and line height as live preview
                printPreview.style.fontSize = livePreview.style.fontSize || '10pt';
                printPreview.style.lineHeight = livePreview.style.lineHeight || '1.3';

                // Auto-detect and apply direction
                const isRTL = detectRTL(visualEditor.value);
                printPreview.style.direction = isRTL ? 'rtl' : 'ltr';
                printPreview.style.textAlign = isRTL ? 'right' : 'left';
            }

            // Trigger print
            window.print();
        });
    }
});
