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
    let currentTransposeSteps = 0;
    let lastUploadPayload = null;
    let lastRawTranscription = '';

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
            keyDetectionDiv.style.display = 'block';
        } else {
            // Show "not detected" message if no key found
            console.log('❌ No key found in transcription');
            detectedKeySpan.textContent = 'Key is not detected successfully';
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
            livePreview.textContent = '';
        }
        if (reanalyzeButton) {
            reanalyzeButton.disabled = true;
        }

        setStatus('processing', 'Analyzing chart with AI…');
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
                setStatus('success', 'Transcription ready! Edit visually on the left.');

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
        if (!source) {
            return source;
        }

        if (semitoneShift === 0) {
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
        console.log('applyTranspose called with steps:', steps);
        console.log('baselineChart:', baselineChart ? 'exists' : 'empty');
        console.log('songbookOutput.value:', songbookOutput.value ? 'exists' : 'empty');

        if (!baselineChart && !songbookOutput.value.trim()) {
            console.log('No content to transpose');
            setStatus('error', 'Nothing to transpose yet. Run the AI analysis first.');
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

        // Always transpose from the original baseline to avoid accumulating spacing errors
        const sourceChart = baselineChart || songbookOutput.value;
        console.log('Source chart length:', sourceChart.length);

        // Transpose the SongBook format (with brackets) using cumulative steps
        const transposedSongbook = transposeChart(sourceChart, currentTransposeSteps);
        console.log('Transposed songbook length:', transposedSongbook.length);
        songbookOutput.value = transposedSongbook;

        // Convert transposed version to visual format
        const transposedVisual = convertToAboveLineFormat(transposedSongbook, true);
        console.log('Visual format length:', transposedVisual.length);
        visualEditor.value = transposedVisual;

        setStatus('success', `Transposed ${currentTransposeSteps > 0 ? '+' : ''}${currentTransposeSteps} semitone${Math.abs(currentTransposeSteps) === 1 ? '' : 's'}.`);

        // Update the live preview
        updateLivePreview();
        console.log('Transpose complete');
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

            transposeStepInput.value = 0;
            setStatus('idle', 'Chart reset to AI transcription.');

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
        const bpmPlaceholder = 'BPM: [Enter the BPM]';
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

        const visualContent = visualEditor.value;
        console.log('Updating live preview with content length:', visualContent.length);

        // Use visual editor content for preview
        livePreview.textContent = visualContent;

        // Apply direction to all editing surfaces based on content
        setDirectionalLayout(livePreview, visualContent);
        setDirectionalLayout(visualEditor, visualContent);
        setDirectionalLayout(songbookOutput, songbookOutput.value);

        console.log('Live preview updated successfully');
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
