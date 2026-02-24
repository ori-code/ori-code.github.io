// ============= DISABLE PINCH-TO-ZOOM ON MOBILE =============
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gestureend', function(e) {
    e.preventDefault();
}, { passive: false });

// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// ============= GLOBAL STYLED PROMPT FUNCTION =============
// Replaces native browser prompt() with a styled modal
window.styledPrompt = (message, defaultValue = '', title = 'Enter value') => {
    return new Promise((resolve) => {
        const modal = document.getElementById('styledPromptModal');
        const input = document.getElementById('styledPromptInput');
        const titleEl = document.getElementById('styledPromptTitle');
        const messageEl = document.getElementById('styledPromptMessage');
        const confirmBtn = document.getElementById('styledPromptConfirm');
        const cancelBtn = document.getElementById('styledPromptCancel');
        const closeBtn = document.getElementById('styledPromptClose');

        if (!modal || !input) {
            // Fallback to native prompt if modal not found
            resolve(prompt(message, defaultValue));
            return;
        }

        // Set content
        titleEl.textContent = title;
        messageEl.textContent = message;
        input.value = defaultValue;
        input.placeholder = '';

        // Show modal
        modal.style.display = 'flex';

        // Focus and select input
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);

        // Cleanup function
        const cleanup = () => {
            modal.style.display = 'none';
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            closeBtn.removeEventListener('click', onCancel);
            input.removeEventListener('keydown', onKeydown);
        };

        // Event handlers
        const onConfirm = () => {
            cleanup();
            resolve(input.value);
        };

        const onCancel = () => {
            cleanup();
            resolve(null);
        };

        const onKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };

        // Attach event listeners
        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        closeBtn.addEventListener('click', onCancel);
        input.addEventListener('keydown', onKeydown);
    });
};

// ============= SUCCESS TOAST NOTIFICATION =============
window.showSuccessToast = (message = 'Analysis complete!') => {
    // Remove existing toast if any
    const existingToast = document.querySelector('.success-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <div class="success-toast-content">
            <span class="success-toast-icon">✓</span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Show toast with animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

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
    const songDuration = document.getElementById('songDuration');
    const keyAnalysisDiv = document.getElementById('keyAnalysis');
    const keyAnalysisText = document.getElementById('keyAnalysisText');
    const proEditorToggle = document.getElementById('proEditorToggle');

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Pad sounds load on demand when user clicks a key (no bulk preload)

    // ============= A4 PREVIEW SCALING =============
    // Scales the A4 preview to fit available space (mobile or side-by-side layout)
    (function initPreviewScaling() {
        const A4_WIDTH_PX = 793; // 210mm in pixels at 96dpi

        let previewContainer = null;
        let scaleWrapper = null;

        function setupScaling() {
            previewContainer = document.querySelector('.preview-container');
            if (!previewContainer) return;

            // Check if wrapper already exists (added in HTML)
            if (previewContainer.parentElement?.classList.contains('preview-scale-wrapper')) {
                scaleWrapper = previewContainer.parentElement;
            } else {
                // Fallback: create wrapper dynamically
                scaleWrapper = document.createElement('div');
                scaleWrapper.className = 'preview-scale-wrapper';
                previewContainer.parentNode.insertBefore(scaleWrapper, previewContainer);
                scaleWrapper.appendChild(previewContainer);
            }
        }

        function applyScaling() {
            if (!previewContainer || !scaleWrapper) setupScaling();
            if (!previewContainer || !scaleWrapper) return;

            // Clear any previously set inline dimensions so CSS layout can compute naturally
            scaleWrapper.style.width = '';
            scaleWrapper.style.height = '';
            previewContainer.style.transform = '';
            previewContainer.style.width = '';

            // Force layout recalc
            const availableWidth = scaleWrapper.clientWidth;
            if (!availableWidth || availableWidth <= 0) return;

            const scale = Math.min(1, availableWidth / A4_WIDTH_PX);

            if (scale < 0.99) {
                // Need to scale down — preview is wider than available space
                previewContainer.classList.add('mobile-scaled');
                previewContainer.style.width = A4_WIDTH_PX + 'px';
                previewContainer.style.transform = `scale(${scale})`;

                // Set wrapper height to match scaled content
                const contentHeight = previewContainer.offsetHeight;
                scaleWrapper.style.height = (contentHeight * scale) + 'px';
            } else {
                // No scaling needed — enough room for full A4
                previewContainer.classList.remove('mobile-scaled');
            }
        }

        // Initial application (multiple attempts for robustness)
        setTimeout(applyScaling, 100);
        setTimeout(applyScaling, 500);

        // Reapply on resize (debounced)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(applyScaling, 150);
        });

        // Reapply when content changes (e.g., after analysis)
        const observer = new MutationObserver(() => {
            setTimeout(applyScaling, 50);
        });

        // Observe the live preview for content changes
        setTimeout(() => {
            const livePreview = document.getElementById('livePreview');
            if (livePreview) {
                observer.observe(livePreview, { childList: true, subtree: true, characterData: true });
            }
        }, 500);

        // Expose for manual refresh if needed
        window.refreshPreviewScaling = applyScaling;
    })();

    if (!fileInput || !analysisStatus || !visualEditor || !songbookOutput) {
        return;
    }

    // ============= KEY NORMALIZATION HELPER =============
    // Converts various key formats to match dropdown options (e.g., "G" → "G Major", "Gm" → "G Minor")
    function normalizeKey(key) {
        if (!key || typeof key !== 'string') return 'C Major';

        key = key.trim();

        // If already in correct format, return as-is
        if (key.match(/^[A-G][#b]?\s+(Major|Minor)$/i)) {
            // Capitalize properly
            const parts = key.split(/\s+/);
            const note = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).replace('b', 'b').replace('#', '#');
            const quality = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
            return `${note} ${quality}`;
        }

        // Handle shorthand formats
        const match = key.match(/^([A-G][#b]?)(m|min|minor)?$/i);
        if (match) {
            const note = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            const isMinor = match[2] && match[2].toLowerCase().startsWith('m');
            return `${note} ${isMinor ? 'Minor' : 'Major'}`;
        }

        // Handle formats like "G Major", "g major", etc.
        const fullMatch = key.match(/^([A-G][#b]?)\s*(major|minor|maj|min)?$/i);
        if (fullMatch) {
            const note = fullMatch[1].charAt(0).toUpperCase() + fullMatch[1].slice(1);
            const quality = fullMatch[2];
            const isMinor = quality && (quality.toLowerCase() === 'minor' || quality.toLowerCase() === 'min');
            return `${note} ${isMinor ? 'Minor' : 'Major'}`;
        }

        // Default fallback
        return 'C Major';
    }

    // Make it globally available for other modules
    window.normalizeKey = normalizeKey;

    // ============= CHECK FOR SHARED SONG URL =============
    const urlParams = new URLSearchParams(window.location.search);
    const sharedSongSlug = urlParams.get('song');

    if (sharedSongSlug) {
        loadSharedSong(sharedSongSlug);
    }

    // ============= CHECK FOR SESSION JOIN URL =============
    const joinSessionCode = urlParams.get('join');
    if (joinSessionCode) {
        // Wait for sessionUI to be ready, then open join modal with pre-filled code
        setTimeout(() => {
            const sessionCodeInput = document.getElementById('sessionCodeInput');
            if (sessionCodeInput && window.sessionUI) {
                sessionCodeInput.value = joinSessionCode.toUpperCase();
                window.sessionUI.showJoinSessionModal();
                // Clean URL to remove the join parameter
                window.history.replaceState({}, '', window.location.pathname);
            }
        }, 500);
    }

    // ============= CHECK FOR SINGER JOIN URL =============
    const singerSessionCode = urlParams.get('singer');
    if (singerSessionCode) {
        // Join as singer (anonymous, lyrics only)
        joinAsSinger(singerSessionCode.toUpperCase());
    }

    // ============= CHECK FOR PUBLIC SONG URL =============
    const publicSongId = urlParams.get('public');
    if (publicSongId) {
        // Load public song in Live Mode view
        loadPublicSongFromUrl(publicSongId);
    }

    /**
     * Load a public song from URL parameter
     */
    async function loadPublicSongFromUrl(songId) {
        try {
            console.log('🌐 Loading public song:', songId);

            // Wait for Firebase to be ready
            await new Promise(resolve => {
                if (typeof firebase !== 'undefined' && firebase.database) {
                    resolve();
                } else {
                    const checkFirebase = setInterval(() => {
                        if (typeof firebase !== 'undefined' && firebase.database) {
                            clearInterval(checkFirebase);
                            resolve();
                        }
                    }, 100);
                }
            });

            // Load song from public-songs
            const snapshot = await firebase.database().ref(`public-songs/${songId}`).once('value');
            const song = snapshot.val();

            if (!song) {
                showAlert('Song not found or has been unpublished.');
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
                return;
            }

            // Wait for live mode to be ready
            await new Promise(resolve => {
                if (window.liveMode) {
                    resolve();
                } else {
                    const checkLiveMode = setInterval(() => {
                        if (window.liveMode) {
                            clearInterval(checkLiveMode);
                            resolve();
                        }
                    }, 100);
                }
            });

            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);

            // Enter public view mode
            await window.liveMode.enterPublicViewMode(song, songId);

            console.log('🌐 Loaded public song:', song.title);

        } catch (error) {
            console.error('Error loading public song:', error);
            showAlert('Failed to load song: ' + error.message);
        }
    }

    /**
     * Join session as singer (anonymous auth, lyrics only)
     */
    async function joinAsSinger(sessionCode) {
        try {
            console.log('🎤 Attempting to join as singer with code:', sessionCode);

            // Wait for Firebase to be ready
            await new Promise(resolve => {
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    resolve();
                } else {
                    const checkFirebase = setInterval(() => {
                        if (typeof firebase !== 'undefined' && firebase.auth) {
                            clearInterval(checkFirebase);
                            resolve();
                        }
                    }, 100);
                }
            });

            // Sign in anonymously
            console.log('🎤 Signing in anonymously...');
            await firebase.auth().signInAnonymously();
            console.log('🎤 Anonymous sign-in successful');

            // Wait for session manager to be ready
            await new Promise(resolve => {
                if (window.sessionManager) {
                    resolve();
                } else {
                    const checkManager = setInterval(() => {
                        if (window.sessionManager) {
                            clearInterval(checkManager);
                            resolve();
                        }
                    }, 100);
                }
            });

            // Join the session as singer
            const result = await window.sessionManager.joinAsSinger(sessionCode);
            console.log('🎤 Joined as singer:', result.singerName);

            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);

            // Wait for live mode to be ready, then enter singer mode
            await new Promise(resolve => {
                if (window.liveMode) {
                    resolve();
                } else {
                    const checkLiveMode = setInterval(() => {
                        if (window.liveMode) {
                            clearInterval(checkLiveMode);
                            resolve();
                        }
                    }, 100);
                }
            });

            // Enter singer mode (lyrics only, limited controls)
            await window.liveMode.enterSingerMode();

            // Show welcome toast
            if (window.sessionUI) {
                window.sessionUI.showToast(`🎤 Joined as ${result.singerName}`);
            }

        } catch (error) {
            console.error('🎤 Error joining as singer:', error);
            showAlert('Could not join session: ' + error.message);
        }
    }

    async function loadSharedSong(slug) {
        try {
            // Wait for Firebase to be ready
            await new Promise(resolve => {
                if (typeof firebase !== 'undefined' && firebase.database) {
                    resolve();
                } else {
                    const checkFirebase = setInterval(() => {
                        if (typeof firebase !== 'undefined' && firebase.database) {
                            clearInterval(checkFirebase);
                            resolve();
                        }
                    }, 100);
                }
            });

            const database = firebase.database();
            const snapshot = await database.ref(`public-songs/${slug}`).once('value');
            const song = snapshot.val();

            if (!song) {
                showMessage('Error', 'Shared song not found', 'error');
                return;
            }

            console.log('Loading shared song:', song.name);

            // Enter view-only mode
            enterViewOnlyMode();

            // Load song content into preview
            const content = song.baselineChart || song.content || '';
            const visualFormat = convertToAboveLineFormat(content);

            // Display in preview
            if (livePreview) {
                livePreview.innerHTML = formatForPreview(visualFormat);
            }

            // Update metadata displays
            if (keySelector) keySelector.value = normalizeKey(song.key);
            if (bpmInput) bpmInput.value = song.bpm || '120';
            if (timeSignature) timeSignature.value = song.time || '4/4';

            // Set the visualEditor (for transpose to work)
            visualEditor.value = reverseArrangementLineForRTL(visualFormat);

            // Apply saved layout settings if available
            if (livePreview) {
                // Font Size
                if (song.fontSize && fontSizeSlider && fontSizeValue) {
                    fontSizeSlider.value = song.fontSize;
                    fontSizeValue.textContent = song.fontSize;
                    livePreview.style.fontSize = song.fontSize + 'pt';
                    const sideMenuFontSize = document.getElementById('sideMenuFontSize');
                    const sideMenuFontSizeVal = document.getElementById('sideMenuFontSizeVal');
                    if (sideMenuFontSize) sideMenuFontSize.value = song.fontSize;
                    if (sideMenuFontSizeVal) sideMenuFontSizeVal.textContent = song.fontSize + 'pt';
                }

                // Line Height
                if (song.lineHeight) {
                    const lineHeightSlider = document.getElementById('lineHeightSlider');
                    const lineHeightValue = document.getElementById('lineHeightValue');
                    if (lineHeightSlider) lineHeightSlider.value = song.lineHeight;
                    if (lineHeightValue) lineHeightValue.textContent = song.lineHeight;
                    livePreview.style.lineHeight = song.lineHeight;
                }

                // Char Spacing
                if (song.charSpacing !== null && song.charSpacing !== undefined) {
                    const charSpacingSlider = document.getElementById('charSpacingSlider');
                    const charSpacingValue = document.getElementById('charSpacingValue');
                    if (charSpacingSlider) charSpacingSlider.value = song.charSpacing;
                    if (charSpacingValue) charSpacingValue.textContent = song.charSpacing;
                    livePreview.style.letterSpacing = song.charSpacing + 'px';
                }

                // Column Count
                if (song.columnCount) {
                    const columnCountSelect = document.getElementById('columnCount');
                    if (columnCountSelect) {
                        columnCountSelect.value = song.columnCount;
                        livePreview.style.columns = song.columnCount;
                    }
                }

                // Page Count
                if (song.pageCount) {
                    const pageCountSelect = document.getElementById('pageCount');
                    if (pageCountSelect) {
                        pageCountSelect.value = song.pageCount;
                    }
                }
            }

            // Store for transpose
            window.setBaselineChart && window.setBaselineChart(content);

            showMessage('Info', `Viewing: ${song.title || song.name}`, 'info');

        } catch (error) {
            console.error('Error loading shared song:', error);
            showMessage('Error', 'Failed to load shared song', 'error');
        }
    }

    function enterViewOnlyMode() {
        document.body.classList.add('view-only-mode');

        // Hide editor panel
        const editorPanel = document.querySelector('.editor-panel');
        if (editorPanel) editorPanel.style.display = 'none';

        // Hide upload section
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) uploadSection.style.display = 'none';

        // Hide session section
        const sessionSection = document.querySelector('.session-section');
        if (sessionSection) sessionSection.style.display = 'none';

        // Hide save/load/update buttons
        const saveSongBtn = document.getElementById('saveSongButton');
        const loadSongBtn = document.getElementById('loadSongButton');
        const updateSongBtn = document.getElementById('updateSongButton');
        const bulkImportBtn = document.getElementById('bulkImportButton');
        const headerSaveSong = document.getElementById('headerSaveSong');
        const headerLoadSong = document.getElementById('headerLoadSong');
        if (saveSongBtn) saveSongBtn.style.display = 'none';
        if (loadSongBtn) loadSongBtn.style.display = 'none';
        if (updateSongBtn) updateSongBtn.style.display = 'none';
        if (bulkImportBtn) bulkImportBtn.style.display = 'none';
        if (headerSaveSong) headerSaveSong.style.display = 'none';
        if (headerLoadSong) headerLoadSong.style.display = 'none';

        // Add "View Only" banner
        const banner = document.createElement('div');
        banner.id = 'viewOnlyBanner';
        banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: var(--text); color: var(--bg); text-align: center; padding: 8px; font-weight: 500; z-index: 1000;';
        banner.innerHTML = '👁️ View Only Mode - <a href="' + window.location.pathname + '" style="color: white; text-decoration: underline;">Create your own charts</a>';
        document.body.prepend(banner);

        // Add top padding to body for banner
        document.body.style.paddingTop = '40px';
    }

    // Always use Firebase Cloud Function for chart analysis
    // To use local dev server instead, change to: `http://localhost:3002/api/analyze-chart`
    const API_URL = 'https://us-central1-chordsapp-e10e7.cloudfunctions.net/analyzeChartGemini';

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
    // Match chords in brackets [C] [Em] [Em7] [Cma7] [Cmaj7] [D/F#] [Gsus4] etc.
    // Pattern: Root + sharp/flat + quality (maj/ma/min/m/M/dim/aug/sus/add) + number + bass
    const CHORD_REGEX = /\[([A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\]/g;

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

    // Follow arrangement tags state
    let followArrangementEnabled = false; // Toggle for arrangement following in preview

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

    // Expose getter for baseline chart (for song-library.js save)
    window.getBaselineChart = () => baselineChart;

    // Expose getter for current transpose steps (for song-library.js save)
    window.getCurrentTransposeSteps = () => currentTransposeSteps;

    // Global function to update duration in editor (called from HTML onchange)
    window.updateDurationInEditor = () => {
        const songDurationInput = document.getElementById('songDuration');
        if (songDurationInput) {
            // Trigger the change event to update the editor
            songDurationInput.dispatchEvent(new Event('change'));
        }
    };

    // Normalize content: Convert hybrid output to clean edit format
    // Input: Hybrid format with old (Title:, Key: | BPM:) and v4 ({subtitle:}) mixed
    // Output: Clean format with Title on line 1, metadata comma-separated on line 2
    const normalizeContent = (content) => {
        if (!content) return content;

        // Strip HTML tags
        const cleanContent = content.replace(/<[^>]*>/g, '');

        // Note: Chord grids (| D . Dsus |) keep bare chords for proper display
        // The transpose function handles transposing bare chords in grids separately

        const lines = cleanContent.split('\n');
        const outputLines = [];

        // Extract metadata manually for robustness
        let title = '';
        let artist = '';
        let key = '';
        let tempo = '';
        let time = '';

        for (const line of lines) {
            const trimmed = line.trim();

            // Extract from old format: Title: Amazing Grace
            if (!title && /^Title:\s*(.+)/i.test(trimmed)) {
                title = trimmed.match(/^Title:\s*(.+)/i)[1].trim();
            }

            // Extract from old format: Key: G | BPM: 76 | Time: 3/4
            if (/^Key:\s*([A-G][#b]?)/i.test(trimmed) && trimmed.includes('|')) {
                const keyMatch = trimmed.match(/^Key:\s*([A-G][#b]?\s*(?:Major|Minor|m)?)/i);
                const bpmMatch = trimmed.match(/BPM:\s*(\d+)/i);
                const timeMatch = trimmed.match(/Time:\s*(\d+\/\d+)/i);
                if (!key && keyMatch) key = keyMatch[1].trim();
                if (!tempo && bpmMatch) tempo = bpmMatch[1];
                if (!time && timeMatch) time = timeMatch[1];
            }

            // Extract from v4 directives
            if (/^\{title:\s*([^}]+)\}/i.test(trimmed)) {
                const m = trimmed.match(/^\{title:\s*([^}]+)\}/i);
                if (!title && m) title = m[1].trim();
            }
            if (/^\{subtitle:\s*([^}]+)\}/i.test(trimmed)) {
                const m = trimmed.match(/^\{subtitle:\s*([^}]+)\}/i);
                if (!artist && m) artist = m[1].trim();
            }
            if (/^\{artist:\s*([^}]+)\}/i.test(trimmed)) {
                const m = trimmed.match(/^\{artist:\s*([^}]+)\}/i);
                if (!artist && m) artist = m[1].trim();
            }
            if (/^\{key:\s*([^}]+)\}/i.test(trimmed)) {
                const m = trimmed.match(/^\{key:\s*([^}]+)\}/i);
                if (!key && m) key = m[1].trim();
            }
            if (/^\{tempo:\s*([^}]+)\}/i.test(trimmed)) {
                const m = trimmed.match(/^\{tempo:\s*([^}]+)\}/i);
                if (!tempo && m) tempo = m[1].trim();
            }
            if (/^\{time:\s*([^}]+)\}/i.test(trimmed)) {
                const m = trimmed.match(/^\{time:\s*([^}]+)\}/i);
                if (!time && m) time = m[1].trim();
            }

            // Old format artist line
            if (!artist && /^(Artist|Subtitle|By):\s*(.+)/i.test(trimmed)) {
                const m = trimmed.match(/^(?:Artist|Subtitle|By):\s*(.+)/i);
                if (m) artist = m[1].trim();
            }
        }

        // Build header - Title on line 1
        if (title) {
            outputLines.push(title);
        }

        // Build metadata line with commas - Subtitle, Key, Tempo, Time on line 2
        const metaParts = [];
        if (artist && artist.toLowerCase() !== 'unknown') {
            metaParts.push(artist);
        }
        if (key) {
            metaParts.push(`Key: ${key}`);
        }
        if (tempo) {
            metaParts.push(`${tempo} BPM`);
        }
        if (time) {
            metaParts.push(time);
        }
        if (metaParts.length > 0) {
            outputLines.push(metaParts.join(', '));
        }

        // Process remaining lines - skip old format headers and v4 directives
        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines at the start (until we have content)
            if (!trimmed && outputLines.length <= 2) continue;

            // Skip old format metadata lines (various patterns)
            if (/^Title:\s*.+/i.test(trimmed)) continue;
            if (/^Key:\s*[A-G]/i.test(trimmed) && trimmed.includes('|')) continue;
            if (/^(Artist|Subtitle|By):\s*.+/i.test(trimmed)) continue;

            // Skip v4 metadata directives (but keep {c:} section markers)
            // Note: {layout: X} and {duration: X} are parsed but not displayed
            if (/^\{(?:title|subtitle|artist|key|tempo|time|capo|layout|duration):/i.test(trimmed)) continue;

            // Convert {c: Section:} to just Section: for clean display (Title Case)
            if (/^\{c:\s*([^}]+)\}/i.test(trimmed)) {
                const sectionMatch = trimmed.match(/^\{c:\s*([^}]+)\}/i);
                if (sectionMatch) {
                    // Convert to Title Case (e.g., "VERSE 2:" -> "Verse 2:")
                    const sectionName = sectionMatch[1].trim().replace(/\w+/g, word =>
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    );
                    outputLines.push(sectionName);
                    continue;
                }
            }

            // Keep everything else (badges, content)
            outputLines.push(line);
        }

        return outputLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    };

    // Expose globally for testing
    window.normalizeContent = normalizeContent;

    // Expose function to process AI text result through the same pipeline as image OCR
    window.processAITextResult = (transcription) => {
        if (!transcription) return;

        const cleaned = removeAnalysisLines(transcription);
        baselineChart = cleaned;
        currentTransposeSteps = 0;

        const normalizedChart = normalizeContent(cleaned);
        let visualFormat = convertToAboveLineFormat(normalizedChart, true);
        visualFormat = autoInsertArrangementLine(visualFormat);
        visualFormat = ensureMetadata(visualFormat);
        visualFormat = normalizeMetadataSpacing(visualFormat);

        visualEditor.value = reverseArrangementLineForRTL(visualFormat);

        if (songbookOutput) {
            songbookOutput.value = normalizedChart;
            setDirectionalLayout(songbookOutput, normalizedChart);
        }

        if (aiReferenceContent) {
            aiReferenceContent.textContent = cleaned;
            setDirectionalLayout(aiReferenceContent, cleaned);
        }

        extractAndDisplayKey(transcription);
        extractAndApplyLayout(transcription);

        if (transposeStepInput) transposeStepInput.value = 0;

        // Trigger editor update → preview
        visualEditor.dispatchEvent(new Event('input', { bubbles: true }));

        // Show editor section
        const editorSection = document.getElementById('editor');
        if (editorSection) editorSection.style.display = 'block';
        visualEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

        // Look for key in multiple formats:
        // 1. {key: G} directive
        // 2. Key: G (possibly followed by comma and other metadata)
        let detectedKey = null;

        // First try {key: X} directive format
        const keyDirectiveMatch = cleanedTranscription.match(/\{key:\s*([A-G][#b]?(?:\s*(?:Major|Minor|maj|min|m))?)\}/i);
        if (keyDirectiveMatch && keyDirectiveMatch[1]) {
            detectedKey = keyDirectiveMatch[1].trim();
        } else {
            // Try "Key: X" format - capture just the key, not BPM/time that may follow
            const keyTextMatch = cleanedTranscription.match(/Key:\s*([A-G][#b]?(?:\s*(?:Major|Minor|maj|min|m))?)/i);
            if (keyTextMatch && keyTextMatch[1]) {
                detectedKey = keyTextMatch[1].trim();
            }
        }

        if (detectedKey) {
            const normalizedKey = normalizeKey(detectedKey);
            console.log('✅ Key detected:', detectedKey, '→', normalizedKey);
            detectedKeySpan.textContent = normalizedKey;
            currentKey = normalizedKey;
            originalDetectedKey = normalizedKey; // Store original key for transposition
            if (keySelector) {
                keySelector.value = normalizedKey;
            }
            keyDetectionDiv.style.display = 'block';

            // Set Nashville mode to "chords" only by default after analysis
            if (nashvilleMode) {
                nashvilleMode.value = 'chords';
            }

            // Extract and set BPM from transcription
            // Look for {tempo: X} directive or "X BPM" pattern
            const tempoDirectiveMatch = cleanedTranscription.match(/\{tempo:\s*(\d+)\}/i);
            const tempoBpmMatch = cleanedTranscription.match(/(\d+)\s*BPM/i);
            if (tempoDirectiveMatch && tempoDirectiveMatch[1]) {
                const detectedTempo = tempoDirectiveMatch[1];
                console.log('✅ Tempo detected from directive:', detectedTempo);
                if (bpmInput) bpmInput.value = detectedTempo;
            } else if (tempoBpmMatch && tempoBpmMatch[1]) {
                const detectedTempo = tempoBpmMatch[1];
                console.log('✅ Tempo detected from BPM pattern:', detectedTempo);
                if (bpmInput) bpmInput.value = detectedTempo;
            } else if (bpmInput && !bpmInput.value) {
                bpmInput.value = '120';
            }

            // Extract and set Time Signature from transcription
            // Look for {time: X/Y} directive or standalone "X/Y" pattern
            const timeDirectiveMatch = cleanedTranscription.match(/\{time:\s*(\d+\/\d+)\}/i);
            const timePatternMatch = cleanedTranscription.match(/(?:^|\s|,)(\d+\/\d+)(?:\s|,|$)/m);
            if (timeDirectiveMatch && timeDirectiveMatch[1]) {
                const detectedTime = timeDirectiveMatch[1];
                console.log('✅ Time signature detected from directive:', detectedTime);
                if (timeSignature) timeSignature.value = detectedTime;
            } else if (timePatternMatch && timePatternMatch[1]) {
                const detectedTime = timePatternMatch[1];
                // Validate it's a reasonable time signature (not something like 2024/01)
                const [top, bottom] = detectedTime.split('/').map(Number);
                if (top <= 12 && [2, 4, 8, 16].includes(bottom)) {
                    console.log('✅ Time signature detected from pattern:', detectedTime);
                    if (timeSignature) timeSignature.value = detectedTime;
                } else if (timeSignature && !timeSignature.value) {
                    timeSignature.value = '4/4';
                }
            } else if (timeSignature && !timeSignature.value) {
                timeSignature.value = '4/4';
            }

            // Extract and set Duration from transcription
            // Look for {duration: M:SS} directive
            const durationDirectiveMatch = cleanedTranscription.match(/\{duration:\s*(\d+:\d{2})\}/i);
            const songDurationInput = document.getElementById('songDuration');
            if (durationDirectiveMatch && durationDirectiveMatch[1]) {
                const detectedDuration = durationDirectiveMatch[1];
                console.log('✅ Duration detected from directive:', detectedDuration);
                if (songDurationInput) songDurationInput.value = detectedDuration;
            } else if (songDurationInput) {
                // Default to 5:00 if not detected
                songDurationInput.value = '5:00';
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

    // Global variable to store detected layout from AI analysis
    let detectedLayout = null;

    /**
     * Extract and apply layout setting from transcription
     * Looks for {layout: 1} or {layout: 2} directive
     */
    const extractAndApplyLayout = (transcription) => {
        // Remove markdown code blocks if present
        const cleanedTranscription = transcription.replace(/```[a-z]*\n?/g, '').replace(/```$/g, '');

        // Look for {layout: X} directive
        const layoutMatch = cleanedTranscription.match(/\{layout:\s*(\d+)\}/i);

        if (layoutMatch && layoutMatch[1]) {
            const layoutValue = parseInt(layoutMatch[1]);
            if (layoutValue === 1 || layoutValue === 2) {
                detectedLayout = layoutValue;
                console.log('📐 Layout detected from AI:', layoutValue, 'column(s)');

                // Apply to column count dropdown and trigger full layout pipeline
                const columnCountSelect = document.getElementById('columnCount');
                if (columnCountSelect && livePreview) {
                    columnCountSelect.value = layoutValue;
                    columnCountSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('✅ Applied detected layout:', layoutValue, 'column(s)');
                }
                return layoutValue;
            }
        }

        // Default: no layout detected, use default (2 columns)
        console.log('📐 No layout directive found, using default 2 columns');
        detectedLayout = 2;
        return null;
    };

    // Expose for use in song-library.js when saving
    window.getDetectedLayout = () => detectedLayout;

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
                aiReferenceContent.innerHTML = '<p class="preview-placeholder">transcription will appear here after analysis.</p>';
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
            aiReferenceContent.innerHTML = '<p class="preview-placeholder">transcription will appear here after analysis.</p>';
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

        // Check if user is logged in first
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            // Show registration prompt for non-logged-in users
            setStatus('info', 'Sign up for free to start analyzing!');
            window.showRegistrationPrompt();
            return;
        }

        // Check subscription limits (user is logged in)
        if (window.subscriptionManager) {
            if (!window.subscriptionManager.canAnalyze()) {
                const summary = window.subscriptionManager.getUsageSummary();
                setStatus('error', `You've used all ${summary.analysesLimit} analyses this month. Upgrade to continue!`);

                // Show subscription modal
                window.showSubscriptionModal();
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

            setStatus('processing', 'Uploading to server', 30);

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

            setStatus('processing', 'analyzing chords', 60);

            const result = await response.json();

            setStatus('processing', 'Processing results', 80);

            if (result.success && result.transcription) {
                baselineChart = removeAnalysisLines(result.transcription);
                currentTransposeSteps = 0;

                // ✅ Normalize hybrid output to clean format FIRST
                const normalizedChart = normalizeContent(baselineChart);

                // AI now returns proper ChordPro format with metadata and {comment:} tags
                // Default: Show chords above lyrics (cleaner view)
                let visualFormat = convertToAboveLineFormat(normalizedChart, true);

                // ✅ Auto-insert arrangement line (V1) (C) (V2) etc.
                visualFormat = autoInsertArrangementLine(visualFormat);

                // ✅ Ensure BPM and Time Signature metadata exist with defaults
                visualFormat = ensureMetadata(visualFormat);

                // ✅ Normalize spacing around pipes in metadata
                visualFormat = normalizeMetadataSpacing(visualFormat);

                visualEditor.value = reverseArrangementLineForRTL(visualFormat);

                // Display normalized content in songbook output
                songbookOutput.value = normalizedChart;
                setDirectionalLayout(songbookOutput, normalizedChart);

                // Update AI reference preview in Step 3
                if (aiReferenceContent) {
                    aiReferenceContent.textContent = baselineChart;
                    setDirectionalLayout(aiReferenceContent, baselineChart);
                }

                // Extract and display detected key
                extractAndDisplayKey(result.transcription);

                // Extract and apply layout from AI detection (1 or 2 columns)
                extractAndApplyLayout(result.transcription);

                lastRawTranscription = result.transcription;

                transposeStepInput.value = 0;

                setStatus('processing', 'Finalizing', 95);
                // Small delay to show the final progress step
                await new Promise(resolve => setTimeout(resolve, 200));

                setStatus('success', 'transcription ready! Edit visually on the left.');

                // Show success toast notification
                window.showSuccessToast('transcription complete!');

                // Increment analysis counter
                if (window.subscriptionManager) {
                    await window.subscriptionManager.incrementAnalysisCount();
                    updateUsageDisplay();
                }

                // Reset font size to minimum (8pt) for new analysis
                if (fontSizeSlider && fontSizeValue && livePreview) {
                    fontSizeSlider.value = 8;
                    fontSizeValue.textContent = '8';
                    livePreview.style.fontSize = '8pt';
                    // Also sync side menu slider
                    const sideMenuFontSize = document.getElementById('sideMenuFontSize');
                    const sideMenuFontSizeVal = document.getElementById('sideMenuFontSizeVal');
                    if (sideMenuFontSize) sideMenuFontSize.value = 8;
                    if (sideMenuFontSizeVal) sideMenuFontSizeVal.textContent = '8pt';
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

            // ✅ Normalize hybrid output to clean format FIRST
            const normalizedChart = normalizeContent(baselineChart);

            // Default: Show chords above lyrics
            let visualFormat = convertToAboveLineFormat(normalizedChart, true);

            // ✅ Auto-insert arrangement line (V1) (C) (V2) etc.
            visualFormat = autoInsertArrangementLine(visualFormat);

            // ✅ Ensure BPM and Time Signature metadata exist with defaults
            visualFormat = ensureMetadata(visualFormat);

            // ✅ Normalize spacing around pipes in metadata
            visualFormat = normalizeMetadataSpacing(visualFormat);

            visualEditor.value = reverseArrangementLineForRTL(visualFormat);

            // Display normalized content in songbook output
            songbookOutput.value = normalizedChart;
            setDirectionalLayout(songbookOutput, normalizedChart);

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

        // DEFENSIVE: Strip any HTML tags that might have gotten into the source
        // This prevents issues with already-formatted content being transposed
        let cleanSource = source.replace(/<[^>]*>/g, '');

        console.log('📝 Source first 300 chars:', cleanSource.substring(0, 300));

        // Check if source is Chords App Format v4 (has directives like {key:} or {title:})
        const isV4Format = /\{(?:title|key|tempo|subtitle|artist|time|capo):/i.test(cleanSource);

        if (isV4Format && window.chordsAppParser) {
            console.log('🎼 Using Chords App Format v4 parser for transpose');
            // Use the new parser which handles:
            // - [Chord] brackets inline with lyrics
            // - Chord grids | G | C | D |
            // - {key: X} directive updates
            const result = window.chordsAppParser.transposeContent(cleanSource, semitoneShift);
            console.log('✅ transposeChart (v4) complete - result first 300 chars:', result.substring(0, 300));
            return result;
        }

        // Check if source has bracketed chords [C] [Em] or plain chords (B A C#m)
        const hasBrackets = cleanSource.includes('[') && CHORD_REGEX.test(cleanSource);
        console.log('Has brackets:', hasBrackets);

        if (hasBrackets) {
            // Transpose bracketed format [C] [Em] etc.
            const result = cleanSource.replace(CHORD_REGEX, (fullMatch, chord) => {
                const newChord = transposeChord(chord, semitoneShift);
                console.log(`  🎸 [${chord}] → [${newChord}]`);
                return '[' + newChord + ']';
            });
            console.log('✅ transposeChart complete - result first 300 chars:', result.substring(0, 300));
            return result;
        } else {
            // Transpose plain chord format (chord line above lyrics)
            console.log('🔄 Transposing plain chord format (line-by-line)');
            const lines = cleanSource.split('\n');
            const transposedLines = lines.map((line, index) => {
                // Skip metadata/title lines - they contain pipe-separated info or key/bpm labels
                const isMetadataLine = /\|\s*Key:\s*[^|]+\|\s*BPM:/i.test(line) ||
                                       /^(Key|Title|Artists?|Authors?|BPM|Tempo|Capo):/i.test(line) ||
                                       /\|\s*Key:/i.test(line) ||
                                       /^Key:\s*[A-G].*\|.*BPM:/i.test(line);
                if (isMetadataLine) {
                    console.log(`  ⏭️ Line ${index} is metadata, skipping:`, line.substring(0, 60));
                    return line;
                }

                // Skip arrangement lines with notation like (I) (V1) (PC) (C) (TURN) (BRK) etc.
                const isArrangementLine = /\((?:PC|CD|INT|TAG|CODA|TURN|BRK|TURNAROUND|[VBICOT])\d*\)/i.test(line);
                if (isArrangementLine) {
                    console.log(`  ⏭️ Line ${index} is arrangement line, skipping:`, line.substring(0, 60));
                    return line;
                }

                // Skip section header lines (VERSE, CHORUS, BRIDGE, etc.)
                // Matches: [VERSE 1], CHORUS:, BRIDGE 2:, Pre-Chorus, etc.
                const sectionHeaderPattern = /^[\s\[\]]*(?:VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE[- ]?CHORUS|INTERLUDE|INSTRUMENTAL|ENDING|TAG|REFRAIN|HOOK|CODA|VAMP|TURN(?:AROUND)?|SOLO)[\s\d\[\]:]*$/i;
                if (sectionHeaderPattern.test(line.trim())) {
                    console.log(`  ⏭️ Line ${index} is section header, skipping:`, line.substring(0, 60));
                    return line;
                }

                // Check if this line looks like a chord line
                // More flexible detection: line with mostly chords and whitespace

                // Strict pattern for pure chord lines (allows optional leading/trailing parens, pipes, etc.)
                const hasOnlyChords = /^[\s()\[\]|]*([A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?[\s()|\-\.\[\]]*)+[\s()\[\]|]*$/;

                // Also check: if line has chord patterns
                const chordPattern = /[A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?/g;
                const chords = line.match(chordPattern) || [];
                const hasChords = chords.length >= 1;

                // Calculate what percentage of non-whitespace content is chords
                const nonWhitespace = line.replace(/\s/g, '');
                const chordsText = chords.join('');
                const chordRatio = nonWhitespace.length > 0 ? chordsText.length / nonWhitespace.length : 0;

                // Check if line looks like lyrics (has many lowercase letters - common in English lyrics)
                const lowercaseCount = (line.match(/[a-z]/g) || []).length;
                const looksLikeLyrics = lowercaseCount > 8;

                // A line is a chord line if it has chords AND:
                // 1. Chords make up >= 40% of content, OR
                // 2. Line is short (< 80 chars) and doesn't look like lyrics, OR
                // 3. Has very few lowercase letters (< 5)
                const isShortLine = line.trim().length < 80;
                const hasFewLowercase = lowercaseCount < 5;
                const looksLikeChordLine = hasChords && (chordRatio >= 0.4 || (isShortLine && !looksLikeLyrics) || hasFewLowercase);

                if (hasOnlyChords.test(line) || looksLikeChordLine) {
                    console.log(`  📝 Line ${index} is chord line:`, line.substring(0, 60));
                    // This is a chord line - transpose each chord
                    const transposed = line.replace(/([A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g, (match, chord) => {
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
            // Skip metadata lines (Artist/Artists/Author/Authors variants)
            if (/^(Key|Title|Artists?|Authors?|BPM|Tempo|Capo):/i.test(line) || /\|\s*Key:\s*[^|]+\|\s*BPM:/i.test(line)) {
                result.push(line);
                continue;
            }

            // Skip arrangement lines with notation like (I) (V1) (PC) (C) (TURN) (BRK) etc.
            if (/\((?:PC|CD|INT|TAG|CODA|TURN|BRK|TURNAROUND|[VBICOT])\d*\)/i.test(line)) {
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

            // Skip section header lines (VERSE, CHORUS, BRIDGE, etc.)
            const sectionHeaderPattern = /^[\s\[\]]*(?:VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE[- ]?CHORUS|INTERLUDE|INSTRUMENTAL|ENDING|TAG|REFRAIN|HOOK|CODA|VAMP|TURN(?:AROUND)?|SOLO)[\s\d\[\]:]*$/i;
            if (sectionHeaderPattern.test(cleanLine)) {
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
            setStatus('error', 'Nothing to transpose yet. Load a song or analyze first.');
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

            // Check if source is Chords App Format v4
            const isV4Format = /\{(?:title|key|tempo|subtitle|artist|time|capo):/i.test(sourceChart);

            // Transpose the SongBook format (with brackets) using cumulative steps
            const transposedSongbook = transposeChart(sourceChart, currentTransposeSteps);
            console.log('📊 Transposed songbook length:', transposedSongbook.length);
            console.log('📊 Transposed songbook first 200 chars:', transposedSongbook.substring(0, 200));

            // ✅ Normalize transposed content to clean format
            const normalizedTransposed = normalizeContent(transposedSongbook);
            songbookOutput.value = normalizedTransposed;

            if (isV4Format) {
                // V4 format: Convert to above-line format for visual editor display
                console.log('🎼 Converting v4 format to above-line for editor display');
                let transposedVisual = convertToAboveLineFormat(normalizedTransposed, true);
                transposedVisual = autoInsertArrangementLine(transposedVisual);
                transposedVisual = ensureMetadata(transposedVisual);
                transposedVisual = normalizeMetadataSpacing(transposedVisual);
                visualEditor.value = reverseArrangementLineForRTL(transposedVisual);
            } else {
                // Legacy format: Convert transposed version to visual format
                console.log('🔄 Converting to above-line format...');
                let transposedVisual = convertToAboveLineFormat(normalizedTransposed, true);
                console.log('📊 Visual format length:', transposedVisual.length);
                console.log('📊 Visual format first 200 chars:', transposedVisual.substring(0, 200));

                // Add arrangement line
                transposedVisual = autoInsertArrangementLine(transposedVisual);

                // Ensure metadata format is correct
                transposedVisual = ensureMetadata(transposedVisual);
                transposedVisual = normalizeMetadataSpacing(transposedVisual);

                visualEditor.value = reverseArrangementLineForRTL(transposedVisual);
            }
        } else {
            // For loaded songs without songbook format, transpose visual format directly
            console.log('Transposing visual format directly');
            const sourceVisual = baselineVisualContent || visualEditor.value;
            let transposedVisual = transposeVisualFormat(sourceVisual, currentTransposeSteps);

            // Add arrangement line
            transposedVisual = autoInsertArrangementLine(transposedVisual);

            // Ensure metadata format is correct
            transposedVisual = ensureMetadata(transposedVisual);
            transposedVisual = normalizeMetadataSpacing(transposedVisual);

            visualEditor.value = reverseArrangementLineForRTL(transposedVisual);
        }

        // Transpose the key and update it everywhere
        if (originalDetectedKey) {
            // Check if content is v4 format
            const contentIsV4 = /\{key:/i.test(visualEditor.value);

            let newKey;
            if (contentIsV4 && window.chordsAppParser) {
                // For v4 format, the parser already updated the {key: X} directive
                // Extract the new key from the content
                const metadata = window.chordsAppParser.extractMetadata(visualEditor.value);
                newKey = metadata.key || transposeKey(originalDetectedKey, currentTransposeSteps);
            } else {
                // For legacy format, transpose the key manually
                newKey = transposeKey(originalDetectedKey, currentTransposeSteps);
            }
            console.log('Transposing key from', originalDetectedKey, 'by', currentTransposeSteps, 'steps to', newKey);

            currentKey = newKey;
            detectedKeySpan.textContent = newKey;
            if (keySelector) {
                keySelector.value = newKey;
            }

            // Update the key in the visual editor content (for legacy format)
            if (!contentIsV4) {
                let content = visualEditor.value;
                // Match key value precisely without trailing spaces (handles "Key: D Major | BPM: 75" format)
                const keyLineRegex = /^(.*Key:\s*)([A-G][#b]?\s*(?:Major|Minor|major|minor)?)/m;
                if (keyLineRegex.test(content)) {
                    content = content.replace(keyLineRegex, `$1${newKey}`);
                    visualEditor.value = content;
                }
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

        // Transpose is now auto-saved via live-mode.js saveSongPreferences()
        // to sessions/{sessionId}/playerPreferences/{uid}/{songId}/transposeSteps

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

            // Normalize the baseline chart
            const normalizedChart = normalizeContent(baselineChart);

            // Reset SongBook format to original (normalized)
            songbookOutput.value = normalizedChart;

            // Convert to visual format (from normalized content)
            let visualFormat = convertToAboveLineFormat(normalizedChart, true);

            // Re-insert arrangement line (preserve it during reset)
            visualFormat = autoInsertArrangementLine(visualFormat);

            visualEditor.value = reverseArrangementLineForRTL(visualFormat);

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

            // Transpose reset is auto-saved via live-mode.js when user transposes
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

            setStatus('processing', 'Sending to server', 30);

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
                    setStatus('processing', 're-analyzing', 65);
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

                        // ✅ Normalize hybrid output to clean format FIRST
                        const normalizedChart = normalizeContent(baselineChart);

                        // Default: Show chords above lyrics
                        const visualFormat = convertToAboveLineFormat(normalizedChart, true);
                        visualEditor.value = reverseArrangementLineForRTL(visualFormat);

                        // Display normalized content in songbook output
                        songbookOutput.value = normalizedChart;
                        setDirectionalLayout(songbookOutput, normalizedChart);

                        if (aiReferenceContent) {
                            aiReferenceContent.textContent = baselineChart;
                            setDirectionalLayout(aiReferenceContent, baselineChart);
                        }

                        extractAndDisplayKey(result.transcription);

                        // Extract and apply layout from AI detection (1 or 2 columns)
                        extractAndApplyLayout(result.transcription);

                        transposeStepInput.value = 0;
                        setStatus('success', 'Re-analysis applied! Review the updated chart.');

                        // Show success toast notification
                        window.showSuccessToast('Re-analysis complete!');

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

    // Normalize section headers to Title Case to match dropdown options
    const normalizeSectionHeader = (sectionName) => {
        // Remove trailing colon if present
        const withoutColon = sectionName.replace(/:$/, '').trim();

        // Convert to Title Case (e.g., "VERSE 1" -> "Verse 1")
        const titleCase = withoutColon.replace(/\w+/g, word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );

        // Add colon back
        return titleCase + ':';
    };

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

            // Handle row space tag {rs} - preserve as blank line
            if (line.match(/^\{rs\}$/i)) {
                formatted.push('{rs}');
                continue;
            }

            // Handle {comment: Section Name} - convert to "Section Name:" and normalize to uppercase
            if (line.match(/^\{comment:/i)) {
                const sectionName = line.replace(/^\{comment:\s*/i, '').replace(/\}$/, '').trim();
                if (compact && formatted.length > 0 && formatted[formatted.length - 1] !== '') {
                    formatted.push(''); // Add blank line before section
                }
                // Normalize section header to uppercase (e.g., "Verse 2" -> "VERSE 2:")
                const normalizedSection = normalizeSectionHeader(sectionName);
                formatted.push(normalizedSection);
                continue;
            }

            // Format ChordPro metadata lines - {title:}, {author:}, {key:}, etc.
            if (line.match(/^\{title:/i)) {
                const title = line.replace(/^\{title:\s*/i, '').replace(/\}$/, '').trim();
                const titleDisplay = title || 'Enter the Title';
                const keyDisplay = extractedKey ? extractedKey : 'C Major';
                const tempoDisplay = extractedTempo ? `BPM: ${extractedTempo}` : bpmPlaceholder;
                const timeDisplay = extractedTime ? `Time: ${extractedTime}` : 'Time: 4/4';

                // Format: Title: [title]
                formatted.push(`Title: ${titleDisplay}`);

                // Format: Authors: [author] (if exists)
                if (extractedAuthor) {
                    formatted.push(`Authors: ${extractedAuthor}`);
                }

                // Format: Key: [key] | BPM: [bpm] | Time: [time]
                const metadataLine = `Key: ${keyDisplay} | ${tempoDisplay} | ${timeDisplay}`;
                formatted.push(metadataLine);
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
                // Normalize section header to uppercase (e.g., "verse 2:" -> "VERSE 2:")
                const normalizedSection = normalizeSectionHeader(line);
                formatted.push(normalizedSection);
                continue;
            }

            // Check if line is a chord grid (| D . Dsus | Em7 |) - preserve as-is
            if (line.trim().startsWith('|') || (line.includes('|') && (line.match(/\|/g) || []).length >= 2)) {
                // Chord grid line - keep formatting intact, don't try to separate
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

    // @@@RTL DETECTOR — used everywhere to decide if content needs RTL layout
    function detectRTL(text) {
        const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return rtlChars.test(text);
    }

    // @@@RTL LAYOUT SETTER — called on every content change for editor, songbookOutput, livePreview
    // Two paths:
    //   .live-preview → toggles CSS class "rtl-content" (no dir attr — avoids reversing multi-column flow)
    //   all others    → sets dir attr + inline direction/textAlign/unicodeBidi
    function setDirectionalLayout(element, content) {
        if (!element) {
            return;
        }

        const isRTL = detectRTL(content || '');
        const direction = isRTL ? 'rtl' : 'ltr';
        const elId = element.id || element.className || element.tagName;
        console.log(`@@@RTL setDirectionalLayout | element: "${elId}" | isRTL: ${isRTL} | direction: ${direction} | contentLen: ${(content || '').length}`);

        if (element.classList.contains('live-preview')) {
            // @@@RTL livePreview: class toggle only — dir attr would break multi-column column order
            console.log(`@@@RTL   → livePreview PATH: toggling class rtl-content=${isRTL}`);
            if (isRTL) {
                element.classList.add('rtl-content');
            } else {
                element.classList.remove('rtl-content');
            }
        } else {
            // @@@RTL other elements: dir attr drives [dir="rtl"] CSS rules
            console.log(`@@@RTL   → OTHER PATH: setting dir="${direction}", direction=${direction}, textAlign=${isRTL ? 'right' : 'left'}, unicodeBidi=plaintext`);
            element.setAttribute('dir', direction);
            element.style.direction = direction;
            element.style.textAlign = isRTL ? 'right' : 'left';
            element.style.unicodeBidi = 'plaintext';
        }

        // @@@RTL preview-page ancestor: dir attr drives logo-flip CSS (.preview-page[dir="rtl"])
        const previewPage = element.closest('.preview-page');
        if (previewPage) {
            console.log(`@@@RTL   → preview-page: setting dir="${direction}"`);
            previewPage.setAttribute('dir', direction);
        }
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
            if (line.match(/^(Title:|Artists?:|Authors?:|Key:|Tempo:|Time:|Number:|BPM:|\{.*\}|.*:$|^\s*$)/)) {
                result.push(line);
                i++;
                continue;
            }

            // Check if next line exists (potential lyric line)
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];

                // Check if current line might be chords (contains chord-like patterns)
                const hasChordPattern = /[A-G](#|b)?(maj|min|m|dim|aug|sus|add)?[0-9]*(\/[A-G](#|b)?)?/.test(line);

                if (hasChordPattern && !nextLine.match(/^(Title:|Artists?:|Authors?:|Key:|.*:$)/)) {
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
        // Un-reverse arrangement line (textarea has reversed badges for RTL display)
        const songbookFormat = convertVisualToSongBook(reverseArrangementLineForRTL(visualEditor.value));
        songbookOutput.value = songbookFormat;
        setDirectionalLayout(songbookOutput, songbookOutput.value);
    };

    // @@@RTL ARRANGEMENT REVERSAL — textarea-specific trick.
    // Latin badge text like (I)(V1)(C) always renders LTR in a textarea even with dir="rtl".
    // So we store them reversed: (C)(V1)(I). The user sees (I) on the right = correct RTL start.
    // updateLivePreview() calls this again to UN-reverse before building HTML.
    const reverseArrangementLineForRTL = (content) => {
        const isRTL = detectRTL(content);
        if (!isRTL) return content;
        const arrangementLinePattern = /^([\s]*)(\([A-Z]+\d*\)(?:\s*\([A-Z]+\d*\))+)([\s]*)$/gim;
        return content.replace(arrangementLinePattern, (match, prefix, badges, suffix) => {
            const badgePattern = /\([A-Z]+\d*\)/gi;
            const badgeMatches = badges.match(badgePattern);
            if (badgeMatches && badgeMatches.length > 1) {
                return prefix + badgeMatches.reverse().join(' ') + suffix;
            }
            return match;
        });
    };

    // Section label translation map (English → Hebrew)
    const sectionTranslations = {
        he: {
            'Intro': 'הקדמה',
            'Verse': 'בית',
            'Pre-Chorus': 'קדם פזמון',
            'Chorus': 'פזמון',
            'Bridge': 'גשר',
            'Outro': 'סיום',
            'Interlude': 'אינטרלוד',
            'Instrumental': 'נגינה',
            'Tag': 'תג',
            'Ending': 'סיום',
            'Solo': 'סולו',
            'Coda': 'קודה',
            'Vamp': 'ואמפ',
            'Break': 'הפסקה',
            'Turnaround': 'מעבר',
            'Turn': 'מעבר',
            'Hook': 'הוק',
            'Refrain': 'פזמון',
        }
    };

    function translateSectionName(name) {
        const lang = document.getElementById('sectionLanguage')?.value || 'en';
        if (lang === 'en' || !sectionTranslations[lang]) return name;

        const map = sectionTranslations[lang];
        // Match "Verse 1", "Chorus 2", etc. — translate the keyword, keep the number
        const match = name.match(/^(\S+(?:-\S+)?)\s*(.*)$/);
        if (match) {
            const keyword = match[1];
            const rest = match[2]; // number, suffix, etc.
            if (map[keyword]) {
                return rest ? `${map[keyword]} ${rest}` : map[keyword];
            }
        }
        return name;
    }

    // Format Chords App Format v4 content for preview
    const formatV4ForPreview = (content, options = {}) => {
        const { enableSectionBlocks = false } = options;
        const parser = window.chordsAppParser;
        const formatted = [];
        let sectionCounter = 0;

        // Filter out music link lines from preview (YouTube, Spotify, etc.)
        const musicLinkPattern = /^(YouTube|Spotify|AppleMusic|SoundCloud|Link):\s*https?:\/\/.*/i;
        content = content.split('\n').filter(line => !musicLinkPattern.test(line.trim())).join('\n');

        console.log(`@@@RTL formatV4ForPreview ENTERED | content length: ${content.length}`); // @@@RTL

        // NOTE: No arrangement reversal needed here.
        // The dir="rtl" attribute on badge containers handles RTL display natively.

        // Strip HTML tags before parsing (output may have bold tags)
        const cleanContent = content.replace(/<[^>]*>/g, '');
        console.log(`@@@RTL   cleanContent first 300:\n${cleanContent.substring(0, 300)}`); // @@@RTL

        // Extract metadata using parser (from clean content)
        const metadata = parser.extractMetadata(cleanContent);
        const arrangement = parser.parseArrangementFull(cleanContent);
        console.log(`@@@RTL   arrangement.length: ${arrangement.length} | items: [${arrangement.map(a => a.type + ':' + (a.label || a.symbol || '?')).join(', ')}]`); // @@@RTL

        // Build section repeat map and flow chains from arrangement
        const sectionRepeatMap = {}; // { 'Bridge': 2, 'Chorus': 2 }
        const flowChains = []; // [{ startSection: 'Outro', chain: 'Outro > Intro > Verse 1' }]
        const renderedFlowChains = new Set(); // Track which chains have been rendered

        // Helper to convert badge label to full section name
        const badgeToSectionName = (label) => {
            const baseLabel = label.replace(/\d+$/, '');
            const num = label.match(/\d+$/)?.[0] || '';
            const nameMap = {
                'I': 'Intro', 'V': 'Verse', 'PC': 'Pre-Chorus', 'C': 'Chorus',
                'B': 'Bridge', 'O': 'Outro', 'INT': 'Interlude', 'TAG': 'Tag',
                'CODA': 'Coda', 'TURN': 'Turn', 'BRK': 'Break'
            };
            const baseName = nameMap[baseLabel] || baseLabel;
            return num ? `${baseName} ${num}` : baseName;
        };

        // Parse arrangement for repeats and build flow chains
        for (let i = 0; i < arrangement.length; i++) {
            const item = arrangement[i];
            if (item.type === 'badge' && item.repeat > 1) {
                const sectionName = badgeToSectionName(item.label);
                sectionRepeatMap[sectionName] = item.repeat;
            }
        }

        // Build flow chains - find sequences of badge > badge > badge...
        let i = 0;
        while (i < arrangement.length) {
            // Look for start of a flow chain (badge followed by >)
            if (arrangement[i].type === 'badge' &&
                i + 1 < arrangement.length &&
                arrangement[i + 1].type === 'flow') {

                // Start building the chain
                const chainParts = [badgeToSectionName(arrangement[i].label)];
                const startSection = badgeToSectionName(arrangement[i].label);
                let j = i + 1;

                // Continue collecting the chain
                while (j < arrangement.length && arrangement[j].type === 'flow') {
                    j++; // Skip the >
                    if (j < arrangement.length && arrangement[j].type === 'badge') {
                        chainParts.push(badgeToSectionName(arrangement[j].label));
                        j++;
                    } else {
                        break;
                    }
                }

                // If we have a valid chain (at least 2 parts)
                if (chainParts.length >= 2) {
                    flowChains.push({
                        startSection: startSection,
                        chain: chainParts.join(' > ')
                    });
                }

                i = j; // Move past the chain
            } else {
                i++;
            }
        }

        // Get Nashville mode
        const mode = nashvilleMode ? nashvilleMode.value : 'both';
        const key = currentKey || metadata.key || 'C Major';

        // Build song header
        formatted.push('<div class="song-header">');

        // Row 1: Bold Title
        if (metadata.title) {
            formatted.push(`<div class="song-title"><b>${metadata.title}</b></div>`);
        }

        // Row 2: Subtitle, Key, Tempo, Time (comma-separated)
        const metaParts = [];
        if (metadata.artist && metadata.artist.toLowerCase() !== 'unknown') {
            metaParts.push(metadata.artist);
        }
        if (metadata.key) {
            metaParts.push(`Key: ${metadata.key}`);
        }
        if (metadata.tempo) {
            metaParts.push(`${metadata.tempo} BPM`);
        } else if (bpmInput && bpmInput.value) {
            metaParts.push(`${bpmInput.value} BPM`);
        }
        if (metadata.time) {
            metaParts.push(metadata.time);
        } else if (timeSignature && timeSignature.value) {
            metaParts.push(timeSignature.value);
        }
        if (metaParts.length > 0) {
            formatted.push(`<div class="song-meta">${metaParts.join(', ')}</div>`);
        }

        // Arrangement badges with repeat counts (flow arrows only shown in chart body)
        if (arrangement.length > 0) {
            const isRTLContent = detectRTL(cleanContent);
            console.log(`@@@RTL BADGE ORDER (formatV4ForPreview) | isRTL: ${isRTLContent} | cleanContent first 80: "${cleanContent.substring(0, 80)}"`);
            let badgeItems = arrangement
                .filter(item => item.type === 'badge') // Skip flow arrows in badge row
                .map(item => {
                    const colorClass = parser.getBadgeColorClass(item.label);
                    const repeatSup = item.repeat > 1 ? `<sup class="repeat-count">${item.repeat}x</sup>` : '';
                    return `<span class="section-badge ${colorClass}">${item.label}${repeatSup}</span>`;
                });
            console.log(`@@@RTL   → badges (no JS reverse, CSS direction:rtl handles RTL): [${badgeItems.map(b => b.match(/>([^<]+)</)?.[1] || '?').join(', ')}]`);
            // @@@RTL: NO JS reversal here — the badge row inherits direction:rtl from preview-page[dir="rtl"],
            // which naturally reverses flex item order. JS reversal would double-reverse.
            const badges = badgeItems.join('');
            formatted.push(`<div class="section-badges-row">${badges}</div>`);
        }

        formatted.push('</div>'); // Close song-header

        // Process content lines (use cleanContent for parsing)
        const lines = cleanContent.split('\n');
        let currentSection = null;
        let sectionContent = [];

        const finishSection = () => {
            if (currentSection) {
                const sectionId = `section-${sectionCounter++}`;
                const sectionClass = enableSectionBlocks ? 'song-section-block' : '';

                // Extract section comment from parentheses: "Verse 1 (Play Loud)" -> name="Verse 1", comment="Play Loud"
                const sectionMatch = currentSection.match(/^([^(]+?)(?:\s*\(([^)]+)\))?\s*$/);
                const sectionName = sectionMatch ? sectionMatch[1].trim() : currentSection;
                const sectionComment = sectionMatch ? sectionMatch[2] : null;

                const blockStart = enableSectionBlocks ? `<div class="${sectionClass}" data-section-id="${sectionId}" data-section-name="${sectionName}">` : '';
                const blockEnd = enableSectionBlocks ? '</div>' : '';

                // Check if section has a repeat count from arrangement
                const repeatCount = sectionRepeatMap[sectionName] || sectionRepeatMap[currentSection];
                const repeatSuffix = repeatCount > 1 ? ` (${repeatCount}x)` : '';
                const translatedName = translateSectionName(sectionName);
                const headerText = `${translatedName}${repeatSuffix}`;

                formatted.push(blockStart);
                // Render comment INLINE as span inside header
                const commentSpan = sectionComment ? `<span class="section-comment">${sectionComment}</span>` : '';
                formatted.push(`<div class="section-header">${headerText}${commentSpan}</div>`);
                if (sectionContent.length > 0) {
                    formatted.push(...sectionContent);
                }

                // Render flow chain starting from this section (only once per chain)
                const chainFromHere = flowChains.find(fc => fc.startSection === currentSection && !renderedFlowChains.has(fc.chain));
                if (chainFromHere) {
                    formatted.push(`<div class="flow-instruction">${chainFromHere.chain}</div>`);
                    renderedFlowChains.add(chainFromHere.chain);
                }

                formatted.push(blockEnd);

                sectionContent = [];
                currentSection = null;
            }
        };

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Skip empty lines
            if (!trimmedLine) {
                continue;
            }

            // Handle row space tag {rs} - insert blank line
            if (/^\{rs\}$/i.test(trimmedLine)) {
                if (currentSection) {
                    sectionContent.push('<div class="row-space"></div>');
                } else {
                    formatted.push('<div class="row-space"></div>');
                }
                continue;
            }

            // Skip directive lines (already processed as metadata)
            // Note: {layout: X} and {duration: X} are also skipped - only used for detection
            if (/^\{(?:title|subtitle|artist|key|tempo|time|capo|layout|duration):/i.test(trimmedLine)) {
                continue;
            }

            // Skip arrangement badge line - multiple detection methods
            if (parser.BADGE_LINE_REGEX.test(trimmedLine)) {
                continue;
            }
            // Fallback: line with only badge patterns like (I), (V1), (TURN), (BRK), etc.
            if (/^[\s]*(\([A-Z]+\d*\)\s*)+[\s]*$/i.test(trimmedLine)) {
                continue;
            }

            // Skip old format header lines (AI hybrid output cleanup)
            if (/^Title:\s*.+/i.test(trimmedLine)) {
                continue;
            }
            if (/^Key:\s*[A-G].*\|.*BPM.*\|.*Time/i.test(trimmedLine)) {
                continue;
            }
            if (/^(Artist|Subtitle|By):\s*.+/i.test(trimmedLine)) {
                continue;
            }

            // Skip normalized metadata line (e.g., "Artist, Key: G, 76 BPM, 3/4" or "Loop Community, Key: F, 76 BPM, 3/4")
            // Also skip any line that contains Key: and BPM together (metadata line)
            if (/Key:\s*[A-G]/i.test(trimmedLine) && /\d+\s*BPM/i.test(trimmedLine)) {
                continue;
            }
            // Skip lines that are just author + metadata (e.g., "Loop Community, Key: F...")
            if (/^[^{}\[\]]+,\s*Key:/i.test(trimmedLine)) {
                continue;
            }

            // Skip separator lines (---, ___, etc.)
            if (/^[-_=]{2,}\s*$/.test(trimmedLine)) {
                continue;
            }

            // Skip plain title line (normalized format: first line is just the title)
            if (metadata.title && trimmedLine === metadata.title) {
                continue;
            }

            // Section marker: {c: Section Name:} or clean Section: format
            const v4SectionMatch = trimmedLine.match(/^\{c:\s*([^}]+)\}$/i);
            if (v4SectionMatch) {
                finishSection();
                // Extract section name and optional comment: "{c: Bridge: (A cappella)}" -> "Bridge (A Cappella)"
                const v4Content = v4SectionMatch[1].trim();
                const v4CommentMatch = v4Content.match(/^(.+?):\s*(\([^)]+\))$/);
                if (v4CommentMatch) {
                    // Has comment: extract section part and comment
                    const sectionPart = v4CommentMatch[1].trim().replace(/:$/, '');
                    const commentPart = v4CommentMatch[2];
                    // Title case both parts
                    const titleCased = sectionPart.replace(/\w+/g, word =>
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    );
                    currentSection = `${titleCased} ${commentPart}`;
                } else {
                    // No comment: just title case and remove trailing colon
                    currentSection = v4Content.replace(/:$/, '').replace(/\w+/g, word =>
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    );
                }
                continue;
            }

            // Clean section marker: Intro:, Verse 1:, Chorus:, etc. (optionally with comment)
            // Matches: "Verse 1:", "Chorus:", "Bridge: (A cappella)", etc.
            const sectionKeywords = /^(Intro|Verse|Pre-?Chorus|Chorus|Bridge|Outro|Interlude|Tag|Coda|Turn|Turnaround|Break|Instrumental|Solo|Ending|Vamp)/i;
            const cleanSectionMatch = trimmedLine.match(/^(.+?):\s*(\([^)]+\))?$/);
            if (sectionKeywords.test(trimmedLine) && cleanSectionMatch) {
                finishSection();
                // Extract section name and optional comment
                const sectionPart = cleanSectionMatch[1].trim();
                const commentPart = cleanSectionMatch[2] || '';
                // Convert to Title Case (e.g., "BREAK" -> "Break", "TURN 1" -> "Turn 1")
                const titleCased = sectionPart.replace(/\w+/g, word =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                );
                currentSection = commentPart ? `${titleCased} ${commentPart}` : titleCased;
                continue;
            }

            // Check if line is a chord-only line (chords above lyrics format)
            // This detects lines like "G    C    G" or "D/F#  Em7  Cma7" that appear above lyrics
            const tokens = trimmedLine.split(/\s+/).filter(t => t.length > 0);
            const isChordOnlyLine = tokens.length > 0 &&
                tokens.every(token => /^[A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add|sus2|sus4)?[0-9]*(?:\/[A-G][#b]?)?$/.test(token)) &&
                !trimmedLine.includes('|'); // Not a chord grid

            // @@@RTL trace line classification
            if (tokens.length > 0 && tokens.length <= 8 && /^[A-G]/.test(tokens[0])) {
                const tokenResults = tokens.map(t => `${t}=${/^[A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add|sus2|sus4)?[0-9]*(?:\/[A-G][#b]?)?$/.test(t)}`);
                console.log(`@@@RTL   LINE: "${trimmedLine}" | isChordOnly: ${isChordOnlyLine} | tokens: [${tokenResults.join(', ')}]`);
            }

            if (isChordOnlyLine && mode !== 'lyrics') {
                // Preserve original spacing - replace chords in-place with formatted versions
                const chordPattern = /([A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add|sus2|sus4)?[0-9]*(?:\/[A-G][#b]?)?)/g;
                const formattedChordLine = line.replace(chordPattern, (chord) => {
                    const number = chordToNashville(chord, key);
                    if (mode === 'both' && number) {
                        return `<b>${chord}|${number}</b>`;
                    } else if (mode === 'numbers' && number) {
                        return `<b>${number}</b>`;
                    } else {
                        return `<b>${chord}</b>`;
                    }
                });

                // Convert spaces to &nbsp; to absolutely preserve spacing in HTML
                const spacedChordLine = formattedChordLine.replace(/ /g, '&nbsp;');
                const chordLine = `<div class="chord-line">${spacedChordLine}</div>`;
                if (currentSection) {
                    sectionContent.push(chordLine);
                } else {
                    formatted.push(chordLine);
                }
                continue;
            }

            // Check if line is a chord grid: | G | C | D | or | [G] . [Dsus] | [Em7] |
            if (parser.isChordGrid(trimmedLine)) {
                // Format chord grid
                let formattedGrid = trimmedLine;

                // First handle bracketed chords [G] in grids (from wrapChordGridChords)
                formattedGrid = formattedGrid.replace(/\[([A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\]/g, (match, chord) => {
                    const number = chordToNashville(chord, key);
                    if (mode === 'both' && number) {
                        return `<b>${chord}|${number}</b>`;
                    } else if (mode === 'numbers' && number) {
                        return `<b>${number}</b>`;
                    } else {
                        return `<b>${chord}</b>`;
                    }
                });

                // Also handle bare chords after | or . (legacy format)
                formattedGrid = formattedGrid.replace(/([|\.\s])([A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)(?=[\s\.|]|$)/g, (match, prefix, chord) => {
                    // Skip if already formatted (contains <b>)
                    if (match.includes('<b>')) return match;
                    const number = chordToNashville(chord, key);
                    if (mode === 'both' && number) {
                        return `${prefix}<b>${chord}|${number}</b>`;
                    } else if (mode === 'numbers' && number) {
                        return `${prefix}<b>${number}</b>`;
                    } else {
                        return `${prefix}<b>${chord}</b>`;
                    }
                });

                const gridLine = `<div class="chord-grid">${formattedGrid}</div>\n`;
                if (currentSection) {
                    sectionContent.push(gridLine);
                } else {
                    formatted.push(gridLine);
                }
                continue;
            }

            // Process line with inline [Chord] brackets
            let formattedLine = trimmedLine;
            const hasChords = /\[[A-G][#b]?/.test(formattedLine);

            if (hasChords) {
                if (mode === 'lyrics') {
                    // Lyrics mode: remove chord brackets entirely
                    formattedLine = formattedLine.replace(/\[[^\]]+\]/g, '');
                } else {
                    // Style chord brackets
                    formattedLine = formattedLine.replace(/\[([A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\]/g, (match, chord) => {
                        const number = chordToNashville(chord, key);
                        if (mode === 'both' && number) {
                            return `<span class="inline-chord"><b>${chord}|${number}</b></span>`;
                        } else if (mode === 'numbers' && number) {
                            return `<span class="inline-chord"><b>${number}</b></span>`;
                        } else {
                            return `<span class="inline-chord"><b>${chord}</b></span>`;
                        }
                    });
                }
            }

            // Add line to output - wrap in lyric-line div for proper layout
            const outputLine = `<div class="lyric-line">${formattedLine}</div>`;
            if (currentSection) {
                sectionContent.push(outputLine);
            } else {
                formatted.push(outputLine);
            }
        }

        // Finish last section
        finishSection();

        // Render any remaining flow chains (for sections not in chart body)
        const remainingChains = flowChains.filter(fc => !renderedFlowChains.has(fc.chain));
        if (remainingChains.length > 0) {
            formatted.push('<div class="flow-instructions-section">');
            for (const fc of remainingChains) {
                formatted.push(`<div class="flow-instruction">${fc.chain}</div>`);
            }
            formatted.push('</div>');
        }

        return formatted.join('').replace(/^(<br\s*\/?>)+/i, '');
    };

    // Format content with structured HTML for professional display
    const formatForPreview = (content, options = {}) => {
        const { enableSectionBlocks = false } = options;

        // Filter out music link lines from preview (YouTube, Spotify, etc.)
        const musicLinkPattern = /^(YouTube|Spotify|AppleMusic|SoundCloud|Link):\s*https?:\/\/.*/i;
        content = content.split('\n').filter(line => !musicLinkPattern.test(line.trim())).join('\n');

        // NOTE: No text-level arrangement reversal needed here.
        // The dir="rtl" attribute on the badge container handles RTL display natively.

        const lines = content.split('\n');
        const formatted = [];
        let inMetadata = true;
        let metadataLines = [];
        let currentSection = null;
        let sectionContent = [];
        let sectionCounter = 0;

        // ✅ STRIP HTML TAGS from content before parsing (fixes <b>C</b> issue)
        const cleanContent = content.replace(/<[^>]*>/g, '');

        // Check if this is Chords App Format v4 or normalized format
        const isV4Format = /\{(?:title|key|tempo|subtitle|artist|time|capo):/i.test(cleanContent);
        // Normalized format: Has "Key: X" and "BPM" on same line (comma-separated metadata)
        const isNormalizedFormat = /Key:\s*[A-G][#b]?.*,.*\d+\s*BPM/i.test(cleanContent);

        // If v4 or normalized format, use the parser for metadata and structure
        if ((isV4Format || isNormalizedFormat) && window.chordsAppParser) {
            return formatV4ForPreview(content, options);
        }

        // ✅ PARSE SONG STRUCTURE FOR CIRCULAR BADGES - ONLY inline notation
        // Pattern for inline notation: (V1)2 or (C)3 or (PC)2 - number after parentheses = repeat count
        // Must try PC and CD first (two chars) before single letter
        const inlinePattern = /\((PC|CD|TURN|BRK|INT|TAG|CODA|[VBICOT])(\d*)\)(\d+)?/gi;
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
            // Check if line contains badge notation: (I), (V1), (TURN), (BRK), (TAG), etc.
            const hasBadges = /\((?:PC|CD|TURN|BRK|INT|TAG|CODA|[VBICOT])\d*\)/i.test(cleanLine);
            // Check if line contains ONLY badges (no other content except spaces)
            const onlyBadges = /^[\s]*(\([A-Z]+\d*\)\s*)+[\s]*$/i.test(cleanLine);
            return hasBadges && onlyBadges;
        };

        // ✅ Convert plain text badge line to styled badges
        const convertBadgeLineToStyled = (line) => {
            const badgePattern = /\(([A-Z]+\d*)\)/gi;
            const matches = [...line.matchAll(badgePattern)];
            if (matches.length === 0) return null;

            const isRTLContent = detectRTL(cleanContent);
            let badgeItems = matches.map(m => {
                const label = m[1].toUpperCase();
                const colorClass =
                    label.startsWith('I') && !label.startsWith('INT') ? 'badge-intro' :
                    label.startsWith('V') ? 'badge-verse' :
                    label.startsWith('C') && !label.startsWith('CD') ? 'badge-chorus' :
                    label.startsWith('B') && !label.startsWith('BRK') ? 'badge-bridge' :
                    label.startsWith('PC') ? 'badge-prechorus' :
                    label.startsWith('O') ? 'badge-outro' :
                    label.startsWith('TURN') ? 'badge-turn' :
                    label.startsWith('BRK') ? 'badge-break' :
                    label.startsWith('TAG') ? 'badge-tag' :
                    label.startsWith('INT') ? 'badge-interlude' :
                    'badge-other';
                return `<span class="section-badge ${colorClass}">${label}</span>`;
            });
            if (isRTLContent) { badgeItems = badgeItems.reverse(); } // @@@RTL BADGE ORDER — convertBadgeLineToStyled (legacy format inline badges)
            const badges = badgeItems.join('');
            return `<div class="section-badges-row">${badges}</div>`;
        };

        const finishSection = () => {
            if (currentSection) {
                const sectionId = `section-${sectionCounter++}`;
                const sectionClass = enableSectionBlocks ? 'song-section-block' : '';

                // Extract section comment from parentheses: "Verse 1 (Play Loud)" -> name="Verse 1", comment="Play Loud"
                const sectionMatch = currentSection.match(/^([^(]+?)(?:\s*\(([^)]+)\))?\s*$/);
                const sectionName = sectionMatch ? sectionMatch[1].trim() : currentSection;
                const sectionComment = sectionMatch ? sectionMatch[2] : null;

                const blockStart = enableSectionBlocks ? `<div class="${sectionClass}" data-section-id="${sectionId}" data-section-name="${sectionName}">` : '';
                const blockEnd = enableSectionBlocks ? '</div>' : '';

                formatted.push(blockStart);
                // Render comment INLINE as span inside header
                const commentSpan = sectionComment ? `<span class="section-comment">${sectionComment}</span>` : '';
                const translatedName = translateSectionName(sectionName);
                formatted.push(`<div class="section-header">${translatedName}${commentSpan}</div>`);
                if (sectionContent.length > 0) {
                    formatted.push(...sectionContent);
                }
                formatted.push(blockEnd);

                sectionContent = [];
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // First non-empty lines are metadata (title, author, key info)
            if (inMetadata && line) {
                // Check if line is a section header - if so, it's not metadata
                // Allow optional comment in parentheses: "Verse 1: (Comment)"
                const isSectionHeader = /^(VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE-CHORUS|TAG|CODA|TURN|TURNAROUND|BREAK|INTERLUDE|INSTRUMENTAL|SOLO|ENDING|VAMP)\s*\d*:?(?:\s*\([^)]+\))?$/i.test(line) ||
                                       /^(V|C|B)\s*\d+:(?:\s*\([^)]+\))?$/i.test(line);

                // Skip chord progression summary lines (e.g., "C | 1 | G | 5 D/F | 2# Em | 3")
                const isChordProgression = /^[A-G|#b/\d\s]+\|[A-G|#b/\d\s]+/.test(line);

                // ✅ Check if line is arrangement line - convert to styled badges
                const lineIsArrangement = isArrangementLine(line);
                if (lineIsArrangement) {
                    // Don't add to metadata, will be rendered as styled badges later
                    continue;
                }

                // Check if it's a metadata line (contains Key:, BPM:, Tempo:, Authors:, etc.)
                const isMetadataPattern = /Key:|BPM:|Tempo:|Time:|Authors?:|Artists?:/i.test(line) || /(Words|Music)\s+by/i.test(line);
                if (!isSectionHeader && !isChordProgression && (i < 5 || isMetadataPattern)) {
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
                        // ✅ ALWAYS SHOW METADATA TEMPLATE - wrapped in song-header container
                        formatted.push('<div class="song-header">');

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
                            const isRTLContent = detectRTL(cleanContent);
                            let badgeItems = songStructure.map(section => {
                                const label = section.num ? `${section.type}${section.num}` : section.type;
                                // Add repeat count as superscript if > 1
                                const repeatCount = section.count > 1 ? `<sup class="repeat-count">${section.count}</sup>` : '';
                                const colorClass =
                                    section.type === 'I' ? 'badge-intro' :
                                    section.type === 'V' ? 'badge-verse' :
                                    section.type === 'C' ? 'badge-chorus' :
                                    section.type === 'B' ? 'badge-bridge' :
                                    section.type === 'PC' ? 'badge-prechorus' :
                                    section.type === 'O' ? 'badge-outro' :
                                    section.type === 'TURN' ? 'badge-turn' :
                                    section.type === 'BRK' ? 'badge-break' :
                                    'badge-other';
                                return `<span class="section-badge ${colorClass}">${label}${repeatCount}</span>`;
                            });
                            if (isRTLContent) { badgeItems = badgeItems.reverse(); } // @@@RTL BADGE ORDER — formatForPreview metadata section (legacy format with explicit Key: line)
                            const badges = badgeItems.join('');
                            formatted.push(`<div class="section-badges-row">${badges}</div>`);
                        }

                        formatted.push('</div>'); // Close song-header
                        metadataLines = [];
                    }
                }
            }

            // ✅ Skip arrangement line (line with only inline notation)
            // Badges are rendered from songStructure in the song-header
            if (isArrangementLine(line)) {
                continue;
            }

            // Skip empty lines
            if (!line) {
                continue;
            }

            // Handle row space tag {rs} - insert blank line
            if (/^\{rs\}$/i.test(line)) {
                if (currentSection) {
                    sectionContent.push('<div class="row-space"></div>');
                } else {
                    formatted.push('<div class="row-space"></div>');
                }
                continue;
            }

            // Section headers (VERSE 1:, CHORUS:, TURN 1:, BREAK:, etc.) - allow optional (comment)
            if (/^(VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE-CHORUS|TAG|CODA|TURN|TURNAROUND|BREAK|INTERLUDE|INSTRUMENTAL|SOLO|ENDING|VAMP)\s*\d*:?(?:\s*\([^)]+\))?$/i.test(line) ||
                /^(V|C|B)\s*\d+:(?:\s*\([^)]+\))?$/i.test(line)) {
                // Finish previous section if exists
                finishSection();
                // Start new section - Convert to Title Case but preserve (comment)
                // First extract comment if present, then title-case the section name
                const commentMatch = line.match(/(\([^)]+\))$/);
                const comment = commentMatch ? commentMatch[1] : '';
                const sectionPart = commentMatch ? line.slice(0, -comment.length).trim() : line;
                const titleCased = sectionPart.replace(/:$/, '').replace(/\w+/g, word =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                );
                currentSection = comment ? `${titleCased} ${comment}` : titleCased;
                continue;
            }

            // Regular line (lyrics/chords)
            // Check if this is a chord-only line (has <b>chord</b> patterns and no Hebrew/Arabic lyrics)
            const cleanLineForCheck = line.replace(/<[^>]*>/g, '').trim();
            const hasRTLChars = /[\u0590-\u05FF\u0600-\u06FF]/.test(cleanLineForCheck);
            const chordTokens = cleanLineForCheck.split(/\s+/).filter(t => t.length > 0);
            // Token pattern includes Nashville numbers like "Am|6" or "G|5"
            const isChordOnlyLine = !hasRTLChars && chordTokens.length > 0 &&
                chordTokens.every(token => /^[A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add|sus2|sus4)?[0-9]*(?:\/[A-G][#b]?)?(?:\|[0-9#b]+)?$/.test(token));

            // Detect if line has chord patterns (either <b>chord</b> or bare chords)
            const hasChordBoldTags = /<b>[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?(?:\|[0-9#b]+)?<\/b>/.test(line);

            // Wrap lines in appropriate divs to preserve spacing
            let outputLine;
            if (isChordOnlyLine && hasChordBoldTags) {
                // Chord-only line: use original untrimmed line, convert spaces to &nbsp;
                const spacedLine = lines[i].replace(/ /g, '&nbsp;');
                outputLine = `<div class="chord-line">${spacedLine}</div>`;
            } else if (hasRTLChars || line.trim()) {
                // Lyric line or other content: wrap in lyric-line div
                outputLine = `<div class="lyric-line">${lines[i]}</div>`;
            } else {
                // Empty line
                outputLine = '<br>';
            }

            if (currentSection) {
                sectionContent.push(outputLine);
            } else {
                formatted.push(outputLine);
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
            result.push(...formatted);
            // Trim leading <br> tags from output
            return result.join('').replace(/^(<br\s*\/?>)+/i, '');
        }

        // Trim leading <br> tags from output
        return formatted.join('').replace(/^(<br\s*\/?>)+/i, '');
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
        // Un-reverse arrangement line (textarea has reversed badges for RTL display)
        visualContent = reverseArrangementLineForRTL(visualContent);
        console.log('Updating live preview with content length:', visualContent.length);

        // Apply arrangement order if enabled
        if (followArrangementEnabled) {
            visualContent = rebuildByArrangement(visualContent);
            console.log('Applied arrangement order, new length:', visualContent.length);
        }

        // Check if content uses v4/normalized format (has [chord] brackets or normalized metadata)
        const hasInlineBrackets = /\[[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\]/.test(visualContent);
        const isNormalizedFormat = /Key:\s*[A-G][#b]?.*,.*\d+\s*BPM/i.test(visualContent);
        const isV4Format = /\{(?:title|key|tempo|subtitle|artist|time|capo):/i.test(visualContent);

        console.log(`@@@RTL updateLivePreview | isV4: ${isV4Format} | isNormalized: ${isNormalizedFormat} | hasInlineBrackets: ${hasInlineBrackets}`);

        if (isV4Format || isNormalizedFormat) {
            // PATH A: v4 or normalized format — formatV4ForPreview handles both inline brackets AND above-line chords
            console.log(`@@@RTL   → PATH A: formatForPreview → formatV4ForPreview (v4/normalized)`);
            const formattedHTML = formatForPreview(visualContent);
            livePreview.innerHTML = formattedHTML;
        } else {
            // PATH B: legacy format only (no Key:/BPM metadata) — needs makeChordsBold preprocessing
            console.log(`@@@RTL   → PATH B: makeChordsBold + formatForPreview (legacy)`);
            visualContent = makeChordsBold(visualContent);
            const formattedHTML = formatForPreview(visualContent);
            livePreview.innerHTML = formattedHTML;
        }

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

        // Check for music links in content
        if (typeof checkForMusicLinks === 'function') {
            checkForMusicLinks();
        }
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
        const hasInlineBrackets = /\[[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\]/.test(content);
        console.log(`@@@RTL makeChordsBold | isRTL: ${isRTL} | hasInlineBrackets: ${hasInlineBrackets} | lines: ${lines.length}`);

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Handle inline [chord] bracket notation (e.g., [Am]word [G]word2)
            if (hasInlineBrackets && /\[[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\]/.test(line)) {
                const bracketPattern = /\[([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\]/g;

                if (mode === 'lyrics') {
                    // Lyrics mode: remove chord brackets entirely
                    line = line.replace(bracketPattern, '');
                    result.push(line);
                } else if (isRTL) {
                    // @@@RTL CHORD BUILDER — character-by-character: chord placed at same index as its syllable.
                    // chord-line gets direction:rtl from CSS, so index 0 anchors to the RIGHT over first Hebrew char.
                    let chordLine = '';
                    let lyricLine = '';
                    let idx = 0;

                    while (idx < line.length) {
                        if (line[idx] === '[') {
                            // Found a chord bracket
                            const endBracket = line.indexOf(']', idx);
                            if (endBracket !== -1) {
                                const chord = line.substring(idx + 1, endBracket);
                                const number = chordToNashville(chord, key);
                                let formattedChord;
                                if (mode === 'both' && number) {
                                    formattedChord = `<b>${number}|${chord}</b>`;
                                } else if (mode === 'numbers' && number) {
                                    formattedChord = `<b>${number}</b>`;
                                } else {
                                    formattedChord = `<b>${chord}</b>`;
                                }
                                chordLine += formattedChord;
                                idx = endBracket + 1;
                                continue;
                            }
                        }
                        // Regular character - add to lyrics, add space to chord line
                        lyricLine += line[idx];
                        chordLine += ' ';
                        idx++;
                    }

                    // Create chord line above lyrics with proper alignment
                    if (chordLine.trim()) {
                        const spacedChordLine = chordLine.replace(/ /g, '&nbsp;');
                        console.log(`@@@RTL CHORD BUILDER | chordLine: "${chordLine.trim()}" | lyricLine: "${lyricLine}"`);
                        result.push(`<div class="chord-line">${spacedChordLine}</div>`);
                    }
                    // Lyrics line
                    result.push(lyricLine);
                } else {
                    // LTR content: style chord brackets inline
                    line = line.replace(bracketPattern, (_, chord) => {
                        const number = chordToNashville(chord, key);
                        if (mode === 'both' && number) {
                            return `<span class="inline-chord"><b>${chord}|${number}</b></span>`;
                        } else if (mode === 'numbers' && number) {
                            return `<span class="inline-chord"><b>${number}</b></span>`;
                        } else {
                            return `<span class="inline-chord"><b>${chord}</b></span>`;
                        }
                    });
                    result.push(line);
                }
                continue;
            }

            // Skip metadata lines (combined format like "Title | Key: X | BPM: Y" or standalone)
            if (/^(Key|Title|Artist|BPM|Tempo|Capo):/i.test(line) || /\|\s*Key:\s*[^|]+\|\s*BPM:/i.test(line)) {
                result.push(line);
                continue;
            }

            // Skip arrangement lines (e.g., "(I) (V1) (PC) (C)" or "(I) · (V1) · (TURN) · (BRK)")
            const hasInlineNotation = /\((?:PC|CD|INT|TAG|CODA|TURN|BRK|TURNAROUND|[VBICOT])\d*\)/i.test(line);
            const onlyInlineNotation = /^[\s\(\)A-Z0-9·|,\-–—]+$/i.test(line) && hasInlineNotation;
            if (onlyInlineNotation) {
                result.push(line);
                continue;
            }

            // LYRICS ONLY MODE: Remove chord lines entirely, keep lyrics with proper spacing
            if (mode === 'lyrics') {
                // Keep blank lines for section separation
                if (line.trim() === '') {
                    result.push(line);
                    continue;
                }

                // Keep section headers (VERSE, CHORUS, BRIDGE, etc.)
                // Must be a standalone header, not a chord line starting with C, B, etc.
                const trimmedLine = line.trim();
                const isSectionHeader = /^(INTRO|VERSE|PRE-CHORUS|CHORUS|BRIDGE|INTERLUDE|TAG|CODA|OUTRO|TURN|BREAK)\s*\d*\s*:?$/i.test(trimmedLine) ||
                                       /^(V|PC)\d+\s*:?$/i.test(trimmedLine); // V1, V2, PC1, etc.
                if (isSectionHeader) {
                    result.push(''); // Add blank line before section header
                    result.push(line);
                    continue;
                }

                // Check if this is a chord-only line
                const hasRTLChars = /[\u0590-\u05FF\u0600-\u06FF]/.test(line);
                const chordPattern = /\b[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\b/g;
                const lineWithoutChords = line.replace(chordPattern, '').trim();

                // If line has RTL characters, it's lyrics - keep it
                if (hasRTLChars) {
                    result.push(line);
                    continue;
                }

                // If removing chords leaves the line empty, skip it (chord-only line)
                if (lineWithoutChords.length === 0) {
                    continue;
                }

                // Has English text that's not just chords - keep it
                result.push(line);
                continue;
            }

            // For RTL content, be more careful about what is a chord vs lyrics
            if (isRTL) {
                // Check if this line is a chord-only line (no Hebrew/Arabic characters)
                const hasHebrewChars = /[\u0590-\u05FF\u0600-\u06FF]/.test(line);

                // Only process chords if line has NO Hebrew/Arabic characters
                // This means it's a pure chord line above the lyrics
                if (!hasHebrewChars) {
                    // Process chord-only lines for RTL content
                    const chordPattern = /(^|\s)([A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)(\s|$)/g;
                    line = line.replace(chordPattern, (_, before, chord, after) => {
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
                // If line has Hebrew chars, leave it completely as-is (don't try to parse chords from mixed text)
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

    // Make makeChordsBold globally accessible for Live Mode
    window.makeChordsBold = makeChordsBold;

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

            // Remove any existing page break indicators (no longer showing them)
            const existingBreaks = livePreview.querySelectorAll('.page-break-indicator');
            existingBreaks.forEach(br => br.remove());
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

        // Always use 1 column for single-page overview
        columnCountSelect.value = 1;
        pageCountSelect.value = 1;

        // Set tighter line height for better fit
        livePreview.style.lineHeight = '1.1';
        if (lineHeightSlider && lineHeightValue) {
            lineHeightSlider.value = 1.1;
            lineHeightValue.textContent = '1.1';
        }

        // CRITICAL: Remove height and column constraints for accurate measurement
        livePreview.style.height = 'auto';
        livePreview.style.columns = '1';
        livePreview.style.columnFill = 'balance';

        // Target height (A4 page)
        const A4_HEIGHT_PX = 1123;
        const targetHeight = A4_HEIGHT_PX - 30;

        // Binary search for optimal font size
        let low = 8;
        let high = 50;
        let optimalFontSize = 14;

        for (let i = 0; i < 25; i++) {
            const mid = (low + high) / 2;
            livePreview.style.fontSize = mid + 'pt';

            // Force reflow
            void livePreview.offsetHeight;
            const contentHeight = livePreview.scrollHeight;

            if (contentHeight <= targetHeight) {
                low = mid;
                optimalFontSize = mid;
            } else {
                high = mid;
            }

            if (high - low < 0.2) break;
        }

        // Apply the optimal font size
        optimalFontSize = Math.floor(optimalFontSize * 2) / 2;
        livePreview.style.fontSize = optimalFontSize + 'pt';

        // Restore proper height for display
        livePreview.style.height = A4_HEIGHT_PX + 'px';
        livePreview.style.columnFill = 'auto';

        // Update the font size slider
        if (fontSizeSlider && fontSizeValue) {
            const sliderValue = Math.min(optimalFontSize, parseFloat(fontSizeSlider.max) || 24);
            fontSizeSlider.value = sliderValue;
            fontSizeValue.textContent = optimalFontSize;
        }

        // Update pagination
        setTimeout(() => {
            updatePagination();
            checkContentOverflow();
        }, 100);

        console.log(`✅ Auto-optimized: 1 column, 1 page, ${optimalFontSize}pt font`);
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
        } else {
            livePreview.style.columnGap = '0px';
        }
        livePreview.style.columnRule = 'none';

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
        pageCountSelect.addEventListener('change', () => {
            // When selecting 1 page, automatically switch to 1 column for overview
            if (parseInt(pageCountSelect.value) === 1) {
                columnCountSelect.value = '1';
                // Dispatch change event to update any dependent UI
                columnCountSelect.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                applyLayoutSettings();
            }
        });

        console.log('✅ Layout dropdowns initialized');

        // Header Auto Fit button
        const headerAutoFit = document.getElementById('headerAutoFit');
        if (headerAutoFit) {
            headerAutoFit.addEventListener('click', () => {
                autoOptimizeLayout();
                console.log('📐 Auto Fit triggered from header button');
            });
        }
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

        // Check if arrangement line already exists - don't duplicate (looks for at least 2 consecutive tags)
        if (/\((?:PC|CD|INT|TAG|CODA|TURN|BRK|TURNAROUND|[VBICOT])\d*\)[\s·]*\((?:PC|CD|INT|TAG|CODA|TURN|BRK|TURNAROUND|[VBICOT])\d*\)/i.test(content)) {
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

            // Check if this is a metadata line (Title, Key, BPM, Authors, etc.)
            const isMetadata = /^(Title|Key|BPM|Tempo|Time|Authors?|Artists?):/i.test(line) ||
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

    // ============= FOLLOW ARRANGEMENT TAGS FEATURE =============

    // Tag to section name mapping (Title Case)
    const TAG_TO_SECTION = {
        'I': 'Intro',
        'V1': 'Verse 1', 'V2': 'Verse 2', 'V3': 'Verse 3', 'V4': 'Verse 4',
        'PC': 'Pre-Chorus', 'PC1': 'Pre-Chorus', 'PC2': 'Pre-Chorus 2',
        'C': 'Chorus', 'C1': 'Chorus', 'C2': 'Chorus 2',
        'B': 'Bridge', 'B1': 'Bridge', 'B2': 'Bridge 2',
        'INT': 'Interlude',
        'TAG': 'Tag',
        'CODA': 'Coda',
        'O': 'Outro',
        'TURN': 'Turn', 'TURN1': 'Turn 1', 'TURN2': 'Turn 2',
        'BRK': 'Break', 'BRK1': 'Break 1', 'BRK2': 'Break 2'
    };

    /**
     * Extract arrangement tags from content
     * Returns array like ['I', 'V1', 'PC', 'C', 'V2', 'PC', 'C', 'B', 'C', 'O']
     */
    function getArrangementTags(content) {
        const lines = content.split('\n');

        for (const line of lines) {
            // Check if line is an arrangement line (contains multiple tags like "(V1) (C) (V2)" or "(I) · (V1) · (C)")
            const cleanLine = line.replace(/<[^>]*>/g, '').trim();
            // Match common arrangement tags: V, C, B, I, O, T, PC, CD, INT, TAG, CODA, TURN, BRK, etc.
            const hasInlineNotation = /\((?:PC|CD|INT|TAG|CODA|TURN|BRK|TURNAROUND|[VBICOT])\d*\)/i.test(cleanLine);
            // Allow letters, digits, parentheses, whitespace, middle dots (·), pipes (|), dashes, commas
            const onlyInlineNotation = /^[\s\(\)A-Z0-9·|,\-–—]+$/i.test(cleanLine) && hasInlineNotation;

            if (onlyInlineNotation) {
                // Extract all tags from this line
                const tagMatches = [...cleanLine.matchAll(/\(([A-Z\d]+)\)/gi)];
                if (tagMatches.length > 0) {
                    console.log('Found arrangement tags:', tagMatches.map(m => m[1]));
                    return tagMatches.map(m => m[1].toUpperCase());
                }
            }
        }

        console.log('No arrangement line detected in content');
        return [];
    }

    /**
     * Parse content into sections map
     * Returns: { 'Intro': 'content...', 'Verse 1': 'content...', 'Chorus': 'content...' }
     */
    function parseSectionsFromContent(content) {
        const lines = content.split('\n');
        const sections = {};
        let currentSectionName = null;
        let currentSectionContent = [];
        let metadataLines = [];
        let arrangementLine = '';
        let inMetadata = true;

        const sectionPattern = /^(VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE-CHORUS|INTERLUDE|TAG|CODA|TURN|TURNAROUND|BREAK)\s*(\d*):?$/i;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Check if it's an arrangement line
            const cleanLine = trimmedLine.replace(/<[^>]*>/g, '');
            const hasInlineNotation = /\((?:PC|CD|INT|TAG|CODA|TURN|BRK|TURNAROUND|[VBICOT])\d*\)/i.test(cleanLine);
            const isArrangementLine = /^[\s\(\)A-Z0-9·|,\-–—]+$/i.test(cleanLine) && hasInlineNotation;

            if (isArrangementLine) {
                arrangementLine = line;
                continue;
            }

            // Check if it's metadata
            const isMetadata = /^(Title|Key|BPM|Tempo|Time|Authors?|Artists?):/i.test(trimmedLine) ||
                              trimmedLine.includes('Key:') || trimmedLine.includes('BPM:') ||
                              trimmedLine.startsWith('{');

            if (inMetadata && isMetadata) {
                metadataLines.push(line);
                continue;
            }

            // Check if it's a section header
            const sectionMatch = trimmedLine.match(sectionPattern);
            if (sectionMatch) {
                inMetadata = false;

                // Save previous section if exists
                if (currentSectionName && currentSectionContent.length > 0) {
                    sections[currentSectionName] = currentSectionContent.join('\n');
                }

                // Start new section
                const sectionType = sectionMatch[1].toUpperCase();
                const sectionNum = sectionMatch[2] || '';
                currentSectionName = sectionNum ? `${sectionType} ${sectionNum}` : sectionType;
                currentSectionContent = [line]; // Include header
                continue;
            }

            // Add line to current section
            if (currentSectionName) {
                currentSectionContent.push(line);
            } else if (!inMetadata && trimmedLine) {
                // Content before any section header - treat as unnamed section
                inMetadata = false;
            }
        }

        // Save last section
        if (currentSectionName && currentSectionContent.length > 0) {
            sections[currentSectionName] = currentSectionContent.join('\n');
        }

        return {
            metadata: metadataLines.join('\n'),
            arrangementLine: arrangementLine,
            sections: sections
        };
    }

    /**
     * Rebuild content following arrangement tag order
     * Tags like (C) appearing multiple times = CHORUS repeated
     * On repeat: only show section header (tag), not full content - saves space
     */
    function rebuildByArrangement(content) {
        const tags = getArrangementTags(content);
        if (tags.length === 0) {
            console.log('No arrangement tags found, returning original content');
            return content;
        }

        const parsed = parseSectionsFromContent(content);
        const { metadata, arrangementLine, sections } = parsed;

        console.log('Arrangement tags:', tags);
        console.log('Available sections:', Object.keys(sections));

        // Build new content following tag order
        const rebuiltParts = [];
        const shownSections = new Set(); // Track sections already shown in full

        // Add metadata first
        if (metadata) {
            rebuiltParts.push(metadata);
        }

        // Add arrangement line
        if (arrangementLine) {
            rebuiltParts.push('');
            rebuiltParts.push(arrangementLine);
        }

        // Helper: case-insensitive section lookup
        const findSection = (name) => {
            // Try exact match first
            if (sections[name]) return { content: sections[name], name: name };
            // Try uppercase
            const upper = name.toUpperCase();
            if (sections[upper]) return { content: sections[upper], name: upper };
            // Try title case variations
            for (const key of Object.keys(sections)) {
                if (key.toUpperCase() === upper) {
                    return { content: sections[key], name: key };
                }
            }
            return null;
        };

        // Add sections in arrangement order
        for (const tag of tags) {
            const sectionName = TAG_TO_SECTION[tag];
            if (!sectionName) {
                console.log(`Unknown tag: ${tag}`);
                continue;
            }

            // Try to find the section (case-insensitive)
            let found = findSection(sectionName);
            let sectionContent = found?.content;
            let actualSectionName = found?.name || sectionName;

            // If not found, try without number (e.g., "CHORUS" instead of "CHORUS 1")
            if (!sectionContent) {
                const baseName = sectionName.replace(/\s*\d+$/, '');
                found = findSection(baseName);
                if (found) {
                    sectionContent = found.content;
                    actualSectionName = found.name;
                }
            }

            // If still not found for numbered tags, try the base section
            if (!sectionContent && /\d/.test(tag)) {
                const baseTag = tag.replace(/\d+$/, '');
                const baseSectionName = TAG_TO_SECTION[baseTag];
                if (baseSectionName) {
                    found = findSection(baseSectionName);
                    if (found) {
                        sectionContent = found.content;
                        actualSectionName = found.name;
                    }
                }
            }

            if (sectionContent) {
                rebuiltParts.push('');

                // Check if this section was already shown
                if (shownSections.has(actualSectionName)) {
                    // Only show the header/tag for repeat
                    rebuiltParts.push(`${actualSectionName}:`);
                } else {
                    // Show full content on first appearance
                    rebuiltParts.push(sectionContent);
                    shownSections.add(actualSectionName);
                }
            } else {
                console.log(`Section not found for tag: ${tag} (${sectionName})`);
            }
        }

        return rebuiltParts.join('\n');
    }

    // Expose toggle/set function for UI
    // If newState is provided, set to that value; otherwise toggle
    window.toggleFollowArrangement = (newState) => {
        if (typeof newState === 'boolean') {
            followArrangementEnabled = newState;
        } else {
            followArrangementEnabled = !followArrangementEnabled;
        }
        console.log('Follow arrangement:', followArrangementEnabled ? 'ON' : 'OFF');
        updateLivePreview();

        // Update checkbox visual state
        const btn = document.getElementById('followArrangementBtn');
        if (btn && btn.checked !== followArrangementEnabled) {
            btn.checked = followArrangementEnabled;
        }

        return followArrangementEnabled;
    };

    // Expose getter for current state
    window.isFollowArrangementEnabled = () => followArrangementEnabled;

    // ============= END FOLLOW ARRANGEMENT TAGS FEATURE =============

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
     * Detects both old format (BPM: 120) and normalized format (120 BPM)
     */
    function ensureMetadata(content) {
        const lines = content.split('\n');

        // Check if BPM exists - both "BPM: 120" and "120 BPM" formats
        const hasBPM = /BPM:\s*\d+/i.test(content) || /\d+\s*BPM/i.test(content);
        // Check if Time Signature exists - both "Time: 3/4" and standalone "3/4" or "4/4"
        const hasTime = /Time:\s*\d+\/\d+/i.test(content) || /,\s*\d+\/\d+/i.test(content);

        // If both exist, return content unchanged
        if (hasBPM && hasTime) {
            return content;
        }

        // Find the metadata line (line with Key: or second line after title)
        let metaLineIndex = lines.findIndex(line => /Key:/i.test(line));

        // If no Key: line, try to find the metadata line (usually line 2)
        if (metaLineIndex < 0 && lines.length >= 2) {
            // Check if line 2 looks like metadata (has comma-separated values)
            if (/,/.test(lines[1]) && !/^\{c:/.test(lines[1].trim()) && !/^\(/.test(lines[1].trim())) {
                metaLineIndex = 1;
            }
        }

        if (metaLineIndex >= 0) {
            // Add missing metadata to the metadata line
            let metaLine = lines[metaLineIndex];

            if (!hasBPM) {
                metaLine += ', 120 BPM';
            }
            if (!hasTime) {
                metaLine += ', 4/4';
            }

            lines[metaLineIndex] = metaLine;
        } else {
            // No metadata line found - add a new one at line 2
            let metadataLine = '';
            if (!hasBPM) {
                metadataLine = '120 BPM';
            }
            if (!hasTime) {
                metadataLine += (metadataLine ? ', ' : '') + '4/4';
            }
            if (metadataLine && lines.length > 0) {
                lines.splice(1, 0, metadataLine);
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
        const inlinePattern = /\((PC|CD|TURN|BRK|INT|TAG|CODA|[VBICOT])(\d*)\)(\d+)?/gi;

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

        // ✅ Detect RTL content for badge ordering
        const isRTLContent = detectRTL(content);

        // Generate badges HTML with repeat count
        let badgeItems = songStructure.map(section => {
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
                section.type === 'TURN' ? 'badge-turn' :
                section.type === 'BRK' ? 'badge-break' :
                'badge-other';
            return `<span class="section-badge ${colorClass}">${label}${repeatCount}</span>`;
        });

        if (isRTLContent) { badgeItems = badgeItems.reverse(); } // @@@RTL BADGE ORDER — updateEditorBadges DOM path (editor badge row above canvas)
        const badges = badgeItems.join('');
        badgesRow.innerHTML = badges;
        badgesRow.style.flexDirection = '';
        badgesRow.style.direction = '';
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
                visualEditor.value = reverseArrangementLineForRTL(chordProFormat);
            } else {
                // Switch to Regular Mode: Show chords above lyrics (clean display)
                const visualFormat = convertToAboveLineFormat(chordProFormat, true);
                visualEditor.value = reverseArrangementLineForRTL(visualFormat);
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

    // Re-render preview when section language changes (EN ↔ Hebrew)
    const sectionLangDropdown = document.getElementById('sectionLanguage');
    if (sectionLangDropdown) {
        sectionLangDropdown.addEventListener('change', () => {
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
            // Skip check if programmatically changed (e.g., from live mode)
            if (window._skipNashvilleCheck) return;

            // Check if user has Pro subscription for Nashville Numbers
            if (window.subscriptionManager && !window.subscriptionManager.canUseNashvilleNumbers()) {
                showAlert('Nashville Numbers is a Pro feature!\n\nUpgrade to Pro for $1.99/month to unlock Nashville Number System and unlimited analyses.');

                // Reset to "chords only" mode
                nashvilleMode.value = 'chords';

                // Show subscription modal
                window.showSubscriptionModal();
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

    // Handle song duration input change
    if (songDuration) {
        songDuration.addEventListener('change', () => {
            const newDuration = songDuration.value;
            if (!newDuration || !visualEditor) return;

            // Update the duration in the visual editor content
            let content = visualEditor.value;

            // Replace existing {duration: ...} directive
            const durationRegex = /\{duration:\s*[^}]+\}/i;
            if (durationRegex.test(content)) {
                content = content.replace(durationRegex, `{duration: ${newDuration}}`);
            } else {
                // Add after {tempo: ...} or {time: ...} or at start of metadata
                const lines = content.split('\n');
                let inserted = false;

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].match(/\{tempo:/i) || lines[i].match(/\{time:/i)) {
                        lines.splice(i + 1, 0, `{duration: ${newDuration}}`);
                        inserted = true;
                        break;
                    }
                }

                if (!inserted) {
                    // Find first directive and insert after
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].match(/^\{[a-z]+:/i)) {
                            lines.splice(i + 1, 0, `{duration: ${newDuration}}`);
                            inserted = true;
                            break;
                        }
                    }
                }

                if (!inserted) {
                    // Add at start
                    lines.unshift(`{duration: ${newDuration}}`);
                }

                content = lines.join('\n');
            }

            visualEditor.value = content;
            updateSongBookFromVisual();
            updateLivePreview();

            // Sync with Live Mode auto-scroll if active
            if (window.liveMode && window.liveMode.isActive) {
                const seconds = window.liveMode.parseTimeToSeconds(newDuration);
                window.liveMode.setAutoScrollDuration(seconds);
            }
        });
    }

    // Handle show/hide badges checkbox
    const showBadgesCheckbox = document.getElementById('showBadges');
    if (showBadgesCheckbox) {
        showBadgesCheckbox.addEventListener('change', () => {
            if (livePreview) {
                if (showBadgesCheckbox.checked) {
                    livePreview.classList.remove('hide-badges');
                } else {
                    livePreview.classList.add('hide-badges');
                }
            }
        });
    }

    // Handle plain chords toggle
    const plainChordsToggle = document.getElementById('plainChordsToggle');
    if (plainChordsToggle) {
        plainChordsToggle.addEventListener('change', () => {
            if (livePreview) {
                if (plainChordsToggle.checked) {
                    livePreview.classList.add('plain-chords');
                } else {
                    livePreview.classList.remove('plain-chords');
                }
            }
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
                    const rawKey = keyMatch[1].trim();
                    const extractedKey = normalizeKey(rawKey);
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

    // Header Live Preview button - enters Live Mode with Full Overview
    const headerLivePreview = document.getElementById('headerLivePreview');
    if (headerLivePreview) {
        headerLivePreview.addEventListener('click', () => {
            if (window.liveMode) {
                // Ensure fullOverviewMode is false before entering
                window.liveMode.fullOverviewMode = false;
                // Enter Live Mode
                window.liveMode.enter();
                // Enable Full Overview mode after content loads
                setTimeout(() => {
                    if (!window.liveMode.fullOverviewMode) {
                        window.liveMode.toggleFullOverview();
                    }
                }, 150);
            }
        });
    }

    // ============= PRINT PREVIEW PREFERENCES =============

    /**
     * Save print preview layout preferences to Firebase
     */
    async function savePrintPreviewPreferences() {
        const user = auth.currentUser;
        if (!user) {
            showAlert('Please log in to save layout preferences');
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
            saveLayoutButton.style.background = 'var(--text)';
            saveLayoutButton.style.color = 'var(--bg)';
            setTimeout(() => {
                saveLayoutButton.textContent = originalText;
                saveLayoutButton.style.background = '';
                saveLayoutButton.style.color = '';
            }, 2000);
        } catch (error) {
            console.error('❌ Error saving layout preferences:', error);
            showAlert('Failed to save layout preferences. Please try again.');
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
                    } else {
                        livePreview.style.columnGap = '0px';
                    }
                    livePreview.style.columnRule = 'none';
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

    if (livePreviewToggle) {
        livePreviewToggle.addEventListener('click', () => {
            // Enter fullscreen Live Mode with Full Overview
            if (window.liveMode) {
                // Close the side menu first
                const sideMenu = document.getElementById('sideMenu');
                const overlay = document.getElementById('overlay');
                if (sideMenu) sideMenu.classList.remove('open');
                if (overlay) overlay.classList.remove('visible');
                document.body.style.overflow = '';

                // Enter Live Mode
                window.liveMode.enter();

                // Enable Full Overview mode after a short delay to ensure Live Mode is ready
                setTimeout(() => {
                    if (!window.liveMode.fullOverviewMode) {
                        window.liveMode.toggleFullOverview();
                    }
                }, 100);
            }
        });
    }

    // Legacy Live Preview Mode code (kept for reference but no longer used)
    /*
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
                livePreviewToggle.style.background = 'var(--text)';
                livePreviewToggle.style.color = 'var(--bg)';

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
                livePreviewToggle.style.background = '';
                livePreviewToggle.style.color = '';

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
    */

    // ============= SUBSCRIPTION SYSTEM INTEGRATION =============

    /**
     * Update usage display in header and subscription modal
     */
    function updateUsageDisplay() {
        if (!window.subscriptionManager) {
            console.log('⚠️ updateUsageDisplay: subscriptionManager not available');
            return;
        }

        const summary = window.subscriptionManager.getUsageSummary();
        console.log('📊 Subscription summary:', summary);

        // Update header usage indicator
        const headerIndicator = document.getElementById('headerUsageIndicator');
        const headerText = document.getElementById('headerUsageText');
        const currentUser = firebase.auth().currentUser;

        if (headerIndicator && headerText) {
            // Only show for logged-in users with FREE or BASIC tier
            if (currentUser && (summary.tier === 'FREE' || summary.tier === 'BASIC')) {
                headerIndicator.style.display = 'block';
                const remaining = summary.analysesRemaining;
                if (remaining === 'Unlimited') {
                    headerText.textContent = '∞';
                } else {
                    headerText.textContent = `${remaining}/${summary.analysesLimit}`;

                    // Change style if running low
                    if (remaining <= 1) {
                        headerIndicator.style.background = 'var(--text)';
                        headerText.style.color = 'var(--bg)';
                    } else {
                        headerIndicator.style.background = 'transparent';
                        headerText.style.color = 'var(--text)';
                    }
                }
            } else {
                // Hide for non-logged-in users or Pro users
                headerIndicator.style.display = 'none';
            }
        }

        // Update side menu tier badge
        const sideMenuTierBadge = document.getElementById('sideMenuTierBadge');
        if (sideMenuTierBadge) {
            if (summary.tier === 'PRO') {
                sideMenuTierBadge.textContent = 'Pro';
                sideMenuTierBadge.style.background = 'var(--text)';
                sideMenuTierBadge.style.color = 'var(--bg)';
            } else if (summary.tier === 'BASIC') {
                sideMenuTierBadge.textContent = 'Basic';
                sideMenuTierBadge.style.background = 'transparent';
                sideMenuTierBadge.style.color = 'var(--text)';
                sideMenuTierBadge.style.border = '1px solid var(--border)';
            } else if (summary.tier === 'BOOK') {
                sideMenuTierBadge.textContent = 'Book';
                sideMenuTierBadge.style.background = 'transparent';
                sideMenuTierBadge.style.color = 'var(--text)';
                sideMenuTierBadge.style.border = '1px solid var(--border)';
            } else {
                sideMenuTierBadge.textContent = 'Free';
                sideMenuTierBadge.style.background = 'transparent';
                sideMenuTierBadge.style.color = 'var(--text)';
                sideMenuTierBadge.style.border = '1px solid var(--border)';
            }
        }

        // Update side menu usage indicator
        const sideMenuUsageText = document.getElementById('sideMenuUsageText');
        const sideMenuUpgradeButton = document.getElementById('sideMenuUpgradeButton');

        if (sideMenuUsageText) {
            if (summary.tier === 'PRO') {
                sideMenuUsageText.textContent = '∞ Unlimited analyses';
            } else {
                const remaining = summary.analysesRemaining;
                sideMenuUsageText.textContent = `${remaining}/${summary.analysesLimit} analyses left`;
            }
        }

        // Update side menu scans indicator (for BOOK tier users)
        const sideMenuScansIndicator = document.getElementById('sideMenuScansIndicator');
        const sideMenuScansText = document.getElementById('sideMenuScansText');
        if (sideMenuScansIndicator && sideMenuScansText && window.subscriptionManager) {
            const purchasedScans = window.subscriptionManager.getPurchasedScans() || 0;
            // Show for BOOK tier users who have purchased scans
            if (summary.tier === 'BOOK' || purchasedScans > 0) {
                sideMenuScansIndicator.style.display = 'block';
                sideMenuScansText.textContent = purchasedScans;
            } else {
                sideMenuScansIndicator.style.display = 'none';
            }
        }

        if (sideMenuUpgradeButton) {
            sideMenuUpgradeButton.style.display = (summary.tier === 'FREE' || summary.tier === 'BASIC') ? 'block' : 'none';
        }

        // Update usage text in subscription modal
        const usageIndicator = document.getElementById('usageIndicator');
        const usageText = document.getElementById('usageText');

        if (usageIndicator && usageText) {
            const currentUser = firebase.auth().currentUser;
            usageIndicator.style.display = 'block';

            if (currentUser && window.subscriptionManager) {
                // Logged-in user: show current plan and usage
                usageText.textContent = `Current: ${summary.tierName} Plan | Analyses used this month: ${summary.analysesUsed}/${summary.analysesLimit === -1 ? '∞' : summary.analysesLimit}`;

                // Change to red when limit reached (not for unlimited Pro users)
                const atLimit = summary.analysesLimit !== -1 && summary.analysesUsed >= summary.analysesLimit;
                if (atLimit) {
                    usageIndicator.style.background = 'var(--text)';
                    usageIndicator.style.borderColor = 'var(--text)';
                    usageText.style.color = 'var(--bg)';
                } else {
                    usageIndicator.style.background = 'transparent';
                    usageIndicator.style.borderColor = 'var(--border)';
                    usageText.style.color = '';
                }
            } else {
                // Non-logged-in user: show welcome message
                usageText.textContent = 'Sign up to start your free plan with 3 scans/month';
                usageIndicator.style.background = 'transparent';
                usageIndicator.style.borderColor = 'var(--border)';
                usageText.style.color = '';
            }
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

        // Update Nashville Numbers mode UI - disable only Nashville options, not the whole select
        if (nashvilleMode) {
            // Always keep select enabled for Chords/Lyrics options
            nashvilleMode.disabled = false;
            nashvilleMode.style.opacity = '1';

            // Disable/enable Nashville-specific options based on subscription
            const nashvilleOptions = nashvilleMode.querySelectorAll('option[value="both"], option[value="numbers"]');
            nashvilleOptions.forEach(opt => {
                if (!summary.canUseNashville) {
                    opt.disabled = true;
                    opt.textContent = opt.value === 'both' ? 'Nash+Chords ⭐' : 'Nashville ⭐';
                } else {
                    opt.disabled = false;
                    opt.textContent = opt.value === 'both' ? 'Nash+Chords' : 'Nashville';
                }
            });

            // If currently on a Nashville mode without access, switch to chords
            if (!summary.canUseNashville && (nashvilleMode.value === 'both' || nashvilleMode.value === 'numbers')) {
                nashvilleMode.value = 'chords';
            }

            nashvilleMode.title = summary.canUseNashville
                ? 'Select display mode'
                : 'Chords/Lyrics available • Nashville requires Pro';
        }
    }

    /**
     * Initialize subscription buttons and modals
     */
    function initSubscriptionUI() {
        // Upgrade button click (header)
        const upgradeButton = document.getElementById('upgradeButton');
        if (upgradeButton) {
            upgradeButton.addEventListener('click', () => {
                window.showSubscriptionModal();
            });
        }

        // Side menu upgrade button click
        const sideMenuUpgradeButton = document.getElementById('sideMenuUpgradeButton');
        if (sideMenuUpgradeButton) {
            sideMenuUpgradeButton.addEventListener('click', () => {
                window.showSubscriptionModal();
                // Close side menu when opening subscription modal
                if (typeof closeSideMenu === 'function') {
                    closeSideMenu();
                }
            });
        }

        // My Subscription button click
        const mySubscriptionBtn = document.getElementById('mySubscriptionBtn');
        if (mySubscriptionBtn) {
            mySubscriptionBtn.addEventListener('click', () => {
                window.showSubscriptionModal();
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

        // Features Modal
        const showAllFeaturesBtn = document.getElementById('showAllFeaturesBtn');
        if (showAllFeaturesBtn) {
            showAllFeaturesBtn.addEventListener('click', () => {
                const modal = document.getElementById('featuresModal');
                if (modal) modal.style.display = 'flex';
            });
        }

        // Raw AI Output Toggle
        const showRawOutputBtn = document.getElementById('showRawOutputBtn');
        const aiReferencePreview = document.getElementById('aiReferencePreview');
        if (showRawOutputBtn && aiReferencePreview) {
            showRawOutputBtn.addEventListener('click', () => {
                const isVisible = aiReferencePreview.style.display !== 'none';
                aiReferencePreview.style.display = isVisible ? 'none' : 'block';
                showRawOutputBtn.textContent = isVisible ? '👁️ Raw' : '👁️ Hide';
                showRawOutputBtn.style.background = 'var(--text)';
                showRawOutputBtn.style.color = 'var(--bg)';
            });
        }

        const featuresModalClose = document.getElementById('featuresModalClose');
        if (featuresModalClose) {
            featuresModalClose.addEventListener('click', () => {
                const modal = document.getElementById('featuresModal');
                if (modal) modal.style.display = 'none';
            });
        }

        const featuresModal = document.getElementById('featuresModal');
        if (featuresModal) {
            featuresModal.addEventListener('click', (e) => {
                if (e.target === featuresModal) {
                    featuresModal.style.display = 'none';
                }
            });
        }

        const featuresModalUpgrade = document.getElementById('featuresModalUpgrade');
        if (featuresModalUpgrade) {
            featuresModalUpgrade.addEventListener('click', () => {
                const featuresModal = document.getElementById('featuresModal');
                if (featuresModal) featuresModal.style.display = 'none';
                window.showSubscriptionModal();
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

            // Create Book one-time purchase button
            window.paypalSubscriptionManager.createBookPurchaseButton('paypal-book-button');

            // Create scan pack buttons
            window.paypalSubscriptionManager.createScanPackButton('SCAN_STARTER', 'paypal-scan-starter');
            window.paypalSubscriptionManager.createScanPackButton('SCAN_VALUE', 'paypal-scan-value');
            window.paypalSubscriptionManager.createScanPackButton('SCAN_BUNDLE', 'paypal-scan-bundle');

        } catch (error) {
            console.error('Failed to initialize PayPal buttons:', error);
        }
    }

    /**
     * Update subscription modal to show current plan
     */
    async function updateSubscriptionModal() {
        try {
            const currentUser = firebase.auth().currentUser;
            const isLoggedIn = !!currentUser;
            const currentTier = isLoggedIn && window.subscriptionManager ? window.subscriptionManager.getCurrentTier() || 'FREE' : null;
            const tiers = ['free', 'basic', 'pro', 'book'];

            // Ensure PayPal SDK is loaded before creating buttons (only for logged-in users)
            if (isLoggedIn && window.paypalSubscriptionManager && !window.paypalSubscriptionManager.isSDKLoaded) {
                try {
                    await window.paypalSubscriptionManager.init();
                } catch (e) {
                    console.error('Failed to initialize PayPal SDK:', e);
                }
            }

            tiers.forEach(tier => {
                const card = document.getElementById(`pricing-card-${tier}`);
                const actionDiv = document.getElementById(`pricing-${tier}-action`);
                if (!card || !actionDiv) return;

                const isCurrentPlan = isLoggedIn && tier.toUpperCase() === currentTier;

                // Highlight current plan card
                if (isCurrentPlan) {
                    card.style.border = '2px solid var(--text)';
                    card.style.boxShadow = 'none';
                } else {
                    card.style.border = '1px solid var(--border)';
                    card.style.boxShadow = 'none';
                }

                if (!isLoggedIn) {
                    // Non-logged-in user: show signup buttons
                    if (tier === 'free') {
                        actionDiv.innerHTML = '<button class="signup-free-btn" style="width: 100%; padding: 12px 16px; background: transparent; color: var(--text); border: 1px solid var(--border); font-size: 14px; font-weight: 600; cursor: pointer;">Register Now for Free</button>';
                    } else if (tier === 'book') {
                        actionDiv.innerHTML = '<button class="signup-book-btn" style="width: 100%; padding: 12px 16px; background: transparent; color: var(--text); border: 1px solid var(--border); font-size: 14px; font-weight: 600; cursor: pointer;">Sign Up to Get Book</button>';
                    } else {
                        actionDiv.innerHTML = `<button class="signup-${tier}-btn" style="width: 100%; padding: 12px 16px; background: transparent; color: var(--text); border: 1px solid var(--border); font-size: 14px; font-weight: 600; cursor: pointer;">Sign Up to Start</button>`;
                    }
                } else if (isCurrentPlan) {
                    // Show "Current Plan" button
                    actionDiv.innerHTML = '<button class="ghost-button" style="width: 100%; background: var(--text); border-color: var(--text); color: var(--bg);" disabled>✓ Current Plan</button>';
                } else if (tier === 'free') {
                    // Free tier - no action needed if user is on paid plan
                    actionDiv.innerHTML = '';
                } else if (tier === 'book') {
                    // Book tier - one-time purchase button
                    actionDiv.innerHTML = '<div id="paypal-book-button" style="min-height: 45px;"></div>';
                    if (window.paypalSubscriptionManager) {
                        window.paypalSubscriptionManager.createBookPurchaseButton('paypal-book-button');
                    }
                } else {
                    // Show PayPal button for upgrades (Basic/Pro subscriptions)
                    actionDiv.innerHTML = `<div id="paypal-${tier}-button" style="min-height: 45px;"></div>`;
                    // Re-initialize PayPal button for this tier
                    if (window.paypalSubscriptionManager) {
                        window.paypalSubscriptionManager.createSubscriptionButton(tier.toUpperCase(), `paypal-${tier}-button`);
                    }
                }
            });

            // Show/hide scan packs section for Book users
            const scanPacksSection = document.getElementById('scanPacksSection');
            const currentScansCount = document.getElementById('currentScansCount');
            if (scanPacksSection) {
                if (isLoggedIn && currentTier === 'BOOK') {
                    scanPacksSection.style.display = 'block';
                    if (currentScansCount && window.subscriptionManager) {
                        currentScansCount.textContent = window.subscriptionManager.getPurchasedScans();
                    }
                    // Initialize scan pack buttons
                    if (window.paypalSubscriptionManager) {
                        window.paypalSubscriptionManager.createScanPackButton('SCAN_STARTER', 'paypal-scan-starter');
                        window.paypalSubscriptionManager.createScanPackButton('SCAN_VALUE', 'paypal-scan-value');
                        window.paypalSubscriptionManager.createScanPackButton('SCAN_BUNDLE', 'paypal-scan-bundle');
                    }
                } else {
                    scanPacksSection.style.display = 'none';
                }
            }

            // Show/hide sign-in link based on login state
            const signInLink = document.getElementById('subscriptionSignInLink');
            const loginLink = document.getElementById('subscriptionLoginLink');
            if (signInLink) {
                signInLink.style.display = isLoggedIn ? 'none' : 'block';
            }
            if (loginLink) {
                loginLink.onclick = (e) => {
                    e.preventDefault();
                    document.getElementById('subscriptionModal').style.display = 'none';
                    if (window.chordsAuth) window.chordsAuth.showAuthModal('login');
                };
            }

            // Add click handlers for signup buttons (non-logged-in users)
            if (!isLoggedIn) {
                document.querySelectorAll('.signup-free-btn').forEach(btn => {
                    btn.onclick = () => {
                        document.getElementById('subscriptionModal').style.display = 'none';
                        window.pendingPlanAfterSignup = null;
                        if (window.chordsAuth) window.chordsAuth.showAuthModal('signup');
                    };
                });
                document.querySelectorAll('.signup-basic-btn').forEach(btn => {
                    btn.onclick = () => {
                        document.getElementById('subscriptionModal').style.display = 'none';
                        window.pendingPlanAfterSignup = 'BASIC';
                        if (window.chordsAuth) window.chordsAuth.showAuthModal('signup');
                    };
                });
                document.querySelectorAll('.signup-pro-btn').forEach(btn => {
                    btn.onclick = () => {
                        document.getElementById('subscriptionModal').style.display = 'none';
                        window.pendingPlanAfterSignup = 'PRO';
                        if (window.chordsAuth) window.chordsAuth.showAuthModal('signup');
                    };
                });
                document.querySelectorAll('.signup-book-btn').forEach(btn => {
                    btn.onclick = () => {
                        document.getElementById('subscriptionModal').style.display = 'none';
                        window.pendingPlanAfterSignup = 'BOOK';
                        if (window.chordsAuth) window.chordsAuth.showAuthModal('signup');
                    };
                });
            }
        } catch (error) {
            console.error('Error updating subscription modal:', error);
        }
    }

    // Make updateSubscriptionModal globally accessible
    window.updateSubscriptionModal = updateSubscriptionModal;

    // Global function to show subscription modal
    window.showSubscriptionModal = async function() {
        const modal = document.getElementById('subscriptionModal');
        if (modal) {
            // Refresh usage data from Firebase before showing modal
            if (window.subscriptionManager) {
                await window.subscriptionManager.refreshUserUsage();
                updateUsageDisplay();
            }
            modal.style.display = 'flex';
            await updateSubscriptionModal();
        }
    };

    // Global function to show registration prompt for non-logged-in users
    // Now shows the subscription modal directly with all plans
    window.showRegistrationPrompt = function() {
        window.showSubscriptionModal();
    };

    // Hide registration prompt
    function hideRegistrationPrompt() {
        const modal = document.getElementById('registrationPromptModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Setup registration prompt modal event listeners
    (function setupRegistrationPromptModal() {
        // Close button
        const closeBtn = document.getElementById('registrationPromptClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideRegistrationPrompt);
        }

        // Register for FREE button
        const registerFreeBtn = document.getElementById('registerFreeBtn');
        if (registerFreeBtn) {
            registerFreeBtn.addEventListener('click', () => {
                hideRegistrationPrompt();
                window.pendingPlanAfterSignup = null; // Free plan, no PayPal needed
                if (window.chordsAuth) {
                    window.chordsAuth.showAuthModal('signup');
                }
            });
        }

        // Register for BASIC button
        const registerBasicBtns = document.querySelectorAll('.register-basic-btn');
        registerBasicBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                hideRegistrationPrompt();
                window.pendingPlanAfterSignup = 'BASIC'; // Will show subscription modal after signup
                if (window.chordsAuth) {
                    window.chordsAuth.showAuthModal('signup');
                }
            });
        });

        // Register for PRO button
        const registerProBtns = document.querySelectorAll('.register-pro-btn');
        registerProBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                hideRegistrationPrompt();
                window.pendingPlanAfterSignup = 'PRO'; // Will show subscription modal after signup
                if (window.chordsAuth) {
                    window.chordsAuth.showAuthModal('signup');
                }
            });
        });

        // Register for BOOK button (one-time purchase)
        const registerBookBtns = document.querySelectorAll('.register-book-btn');
        registerBookBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                hideRegistrationPrompt();
                window.pendingPlanAfterSignup = 'BOOK'; // Will show subscription modal after signup
                if (window.chordsAuth) {
                    window.chordsAuth.showAuthModal('signup');
                }
            });
        });

        // Login link
        const loginFromPrompt = document.getElementById('loginFromPrompt');
        if (loginFromPrompt) {
            loginFromPrompt.addEventListener('click', (e) => {
                e.preventDefault();
                hideRegistrationPrompt();
                // Open auth modal in login mode
                if (window.chordsAuth) {
                    window.chordsAuth.showAuthModal('login');
                }
            });
        }

        // Close on overlay click
        const modal = document.getElementById('registrationPromptModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideRegistrationPrompt();
                }
            });
        }
    })();

    /**
     * Handle subscription changes
     */
    function handleSubscriptionChange(data) {
        console.log('Subscription changed:', data);
        updateUsageDisplay();
        updateSubscriptionModal();

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

                // Check if user selected a paid plan before signup
                if (window.pendingPlanAfterSignup) {
                    const selectedPlan = window.pendingPlanAfterSignup;
                    window.pendingPlanAfterSignup = null; // Clear the pending plan
                    // Show subscription modal so they can complete the purchase
                    setTimeout(() => {
                        window.showSubscriptionModal();
                    }, 500);
                }
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
            transposeSteps: currentTransposeSteps || 0,
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
            visualEditor.value = reverseArrangementLineForRTL(songData.content);
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
        const normalizedKey = normalizeKey(songData.originalKey);
        if (keySelector) {
            keySelector.value = normalizedKey;
        }
        // Also update global currentKey
        currentKey = normalizedKey;

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
        originalDetectedKey = normalizedKey;
        currentTransposeSteps = 0;

        // Regenerate preview first
        updateSongBookFromVisual();

        // Check for music links in the loaded song
        if (typeof checkForMusicLinks === 'function') {
            checkForMusicLinks();
        }

        // Per-song preferences (transpose, etc.) are now handled by Live Mode
        // via loadSongPreferences() in updateFromBroadcast()

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
                showAlert('Creating sessions requires a PRO subscription ($1.99/mo)');
                window.showSubscriptionModal();
                return;
            }
            window.sessionUI.showCreateSessionModal();
        });
    }

    const joinSessionBtn = document.getElementById('joinSessionBtn');
    if (joinSessionBtn) {
        joinSessionBtn.addEventListener('click', () => {
            if (!window.subscriptionManager || !window.subscriptionManager.canJoinSession()) {
                showAlert('Joining sessions requires at least a BASIC subscription ($0.99/mo)');
                window.showSubscriptionModal();
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
            showAlert('Song content not available');
            return;
        }

        // Load the song into the editor
        const visualEditor = document.getElementById('visualEditor');
        const keySelector = document.getElementById('keySelector');
        const bpmInput = document.getElementById('bpmInput');

        if (visualEditor) {
            visualEditor.value = reverseArrangementLineForRTL(song.content);
        }

        const normalizedKey = normalizeKey(song.originalKey);
        if (keySelector && song.originalKey) {
            keySelector.value = normalizedKey;
        }
        // Also update global currentKey
        currentKey = normalizedKey;

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
        originalDetectedKey = normalizedKey;
        currentTransposeSteps = 0;

        // Regenerate preview
        updateSongBookFromVisual();
        updateEditorBadges(); // ✅ Update badges in edit mode

        // Check for music links in the loaded song
        if (typeof checkForMusicLinks === 'function') {
            checkForMusicLinks();
        }

        // If leader, broadcast this song
        if (window.sessionManager && window.sessionManager.isLeader) {
            await broadcastCurrentSong();
            console.log(`📡 Loaded and broadcast: ${song.name}`);
        }

        // Close the session controls modal
        window.sessionUI.hideSessionControls();
    };

    // Listen for song loaded from library - process baselineChart and display
    window.addEventListener('songLoaded', async (event) => {
        const detail = event.detail || {};
        const loadedBaseline = detail.baselineChart;

        if (loadedBaseline) {
            console.log('=== SONG LOADED EVENT ===');
            console.log('Baseline length:', loadedBaseline.length);

            // Store baseline for transpose operations
            baselineChart = loadedBaseline;
            currentTransposeSteps = 0;

            // ✅ Normalize hybrid content to clean format FIRST
            const normalizedChart = normalizeContent(loadedBaseline);

            // Convert ChordPro to visual format (same as analyze flow)
            let visualFormat = convertToAboveLineFormat(normalizedChart, true);

            // Auto-insert arrangement line
            visualFormat = autoInsertArrangementLine(visualFormat);

            // Ensure metadata exists
            visualFormat = ensureMetadata(visualFormat);

            // Normalize spacing
            visualFormat = normalizeMetadataSpacing(visualFormat);

            // Store as baseline visual content for direct transpose
            baselineVisualContent = visualFormat;

            // Display in editor
            visualEditor.value = reverseArrangementLineForRTL(visualFormat);
            setDirectionalLayout(visualEditor, visualFormat);

            // Update songbook output (normalized)
            songbookOutput.value = normalizedChart;
            setDirectionalLayout(songbookOutput, normalizedChart);

            // Reset transpose input
            transposeStepInput.value = 0;

            // Extract and display key if provided
            if (detail.originalKey) {
                originalDetectedKey = detail.originalKey;
                currentKey = detail.originalKey;
                detectedKeySpan.textContent = detail.originalKey;
            } else {
                extractAndDisplayKey(loadedBaseline);
            }

            // Apply saved layout settings if available
            if (livePreview) {
                // Font Size
                if (detail.fontSize && fontSizeSlider && fontSizeValue) {
                    fontSizeSlider.value = detail.fontSize;
                    fontSizeValue.textContent = detail.fontSize;
                    livePreview.style.fontSize = detail.fontSize + 'pt';
                    const sideMenuFontSize = document.getElementById('sideMenuFontSize');
                    const sideMenuFontSizeVal = document.getElementById('sideMenuFontSizeVal');
                    if (sideMenuFontSize) sideMenuFontSize.value = detail.fontSize;
                    if (sideMenuFontSizeVal) sideMenuFontSizeVal.textContent = detail.fontSize + 'pt';
                }

                // Line Height
                if (detail.lineHeight) {
                    const lineHeightSlider = document.getElementById('lineHeightSlider');
                    const lineHeightValue = document.getElementById('lineHeightValue');
                    if (lineHeightSlider) lineHeightSlider.value = detail.lineHeight;
                    if (lineHeightValue) lineHeightValue.textContent = detail.lineHeight;
                    livePreview.style.lineHeight = detail.lineHeight;
                }

                // Char Spacing
                if (detail.charSpacing !== null && detail.charSpacing !== undefined) {
                    const charSpacingSlider = document.getElementById('charSpacingSlider');
                    const charSpacingValue = document.getElementById('charSpacingValue');
                    if (charSpacingSlider) charSpacingSlider.value = detail.charSpacing;
                    if (charSpacingValue) charSpacingValue.textContent = detail.charSpacing;
                    livePreview.style.letterSpacing = detail.charSpacing + 'px';
                }

                // Column Count
                if (detail.columnCount) {
                    const columnCountSelect = document.getElementById('columnCount');
                    if (columnCountSelect) {
                        columnCountSelect.value = detail.columnCount;
                        livePreview.style.columns = detail.columnCount;
                    }
                }

                // Page Count
                if (detail.pageCount) {
                    const pageCountSelect = document.getElementById('pageCount');
                    if (pageCountSelect) {
                        pageCountSelect.value = detail.pageCount;
                    }
                }
            }

            // Update live preview
            updateLivePreview();
            updateEditorBadges();

            console.log('Visual format loaded, length:', visualFormat.length);
        }

        // Broadcast to session if leader (after content is loaded)
        setTimeout(async () => {
            if (window.sessionManager && window.sessionManager.isLeader && window.sessionManager.activeSession) {
                await broadcastCurrentSong();
            }
        }, 500);
    });

    // ============= END LIVE SESSION INTEGRATION =============

    // ============= SECTION HEADER EDITOR WITH DROPDOWNS =============

    // Section options for dropdown (Title Case)
    const sectionOptions = [
        'Intro',
        'Verse 1', 'Verse 2', 'Verse 3', 'Verse 4',
        'Pre-Chorus', 'Pre-Chorus 1', 'Pre-Chorus 2',
        'Chorus', 'Chorus 1', 'Chorus 2',
        'Bridge', 'Bridge 1', 'Bridge 2',
        'Interlude',
        'Tag',
        'Coda',
        'Outro',
        'Turn', 'Turn 1', 'Turn 2',
        'Break', 'Break 1', 'Break 2'
    ];

    // Create section editor dropdown overlay
    const sectionEditorOverlay = document.createElement('div');
    sectionEditorOverlay.id = 'sectionEditorOverlay';
    sectionEditorOverlay.style.cssText = `
        position: absolute;
        display: none;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 0;
        padding: 12px;
        box-shadow: none;
        z-index: 10000;
        min-width: 200px;
    `;

    const sectionSelect = document.createElement('select');
    sectionSelect.id = 'sectionTypeSelect';
    sectionSelect.style.cssText = `
        width: 100%;
        padding: 8px;
        font-size: 14px;
        border: 1px solid var(--border);
        border-radius: 0;
        background: var(--bg);
        color: var(--text);
        cursor: pointer;
        margin-bottom: 8px;
    `;

    sectionOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        sectionSelect.appendChild(opt);
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px;';

    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply';
    applyButton.style.cssText = `
        flex: 1;
        padding: 6px 12px;
        background: var(--text);
        color: var(--bg);
        border: none;
        border-radius: 0;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
        flex: 1;
        padding: 6px 12px;
        background: transparent;
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 0;
        cursor: pointer;
        font-size: 13px;
    `;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.style.cssText = `
        width: 100%;
        margin-top: 8px;
        padding: 6px 12px;
        background: var(--text);
        color: var(--bg);
        border: none;
        border-radius: 0;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
    `;

    buttonContainer.appendChild(applyButton);
    buttonContainer.appendChild(cancelButton);
    sectionEditorOverlay.appendChild(sectionSelect);
    sectionEditorOverlay.appendChild(buttonContainer);
    sectionEditorOverlay.appendChild(removeButton);
    document.body.appendChild(sectionEditorOverlay);

    let currentEditingLine = null;
    let currentEditingLineNumber = null;

    // Function to show section editor
    function showSectionEditor(lineText, lineNumber, clickX, clickY) {
        const sectionMatch = lineText.match(/^(INTRO|VERSE|PRE-CHORUS|CHORUS|BRIDGE|INTERLUDE|TAG|CODA|OUTRO|TURN|BREAK|CHOURS)[\s\d]*:?/i);

        if (sectionMatch) {
            currentEditingLine = lineText.trim();
            currentEditingLineNumber = lineNumber;

            // Try to find matching option (case-insensitive)
            const currentSection = currentEditingLine.replace(':', '').trim();
            const matchingOption = sectionOptions.find(opt =>
                opt.toLowerCase() === currentSection.toLowerCase()
            );

            if (matchingOption) {
                sectionSelect.value = matchingOption;
            } else {
                // Default to Chorus if no match (covers typos like "CHOURS")
                sectionSelect.value = 'Chorus';
            }

            // Position overlay with proper scroll compensation
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;

            let leftPos = clickX + scrollX + 10;
            let topPos = clickY + scrollY + 10;

            // Make sure it doesn't go off screen
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (leftPos + 220 > viewportWidth + scrollX) {
                leftPos = viewportWidth + scrollX - 220;
            }

            if (topPos + 150 > viewportHeight + scrollY) {
                topPos = clickY + scrollY - 160;
            }

            sectionEditorOverlay.style.left = leftPos + 'px';
            sectionEditorOverlay.style.top = topPos + 'px';
            sectionEditorOverlay.style.display = 'block';

            // Focus the select
            sectionSelect.focus();
        }
    }

    // Function to hide section editor
    function hideSectionEditor() {
        sectionEditorOverlay.style.display = 'none';
        currentEditingLine = null;
        currentEditingLineNumber = null;
    }

    // Apply section change
    applyButton.addEventListener('click', () => {
        if (currentEditingLineNumber !== null) {
            const newSection = sectionSelect.value + ':';
            const lines = visualEditor.value.split('\n');
            lines[currentEditingLineNumber] = newSection;
            visualEditor.value = lines.join('\n');

            // Update SongBook and preview
            updateSongBookFromVisual();
            updateLivePreview();

            hideSectionEditor();
        }
    });

    // Cancel editing
    cancelButton.addEventListener('click', hideSectionEditor);

    // Remove section header entirely
    removeButton.addEventListener('click', () => {
        if (currentEditingLineNumber !== null) {
            const lines = visualEditor.value.split('\n');
            lines.splice(currentEditingLineNumber, 1); // Remove the line
            visualEditor.value = lines.join('\n');

            // Update SongBook and preview
            updateSongBookFromVisual();
            updateLivePreview();

            hideSectionEditor();
        }
    });

    // Click on visualEditor to detect section headers
    if (visualEditor) {
        visualEditor.addEventListener('click', (e) => {
            const textarea = e.target;
            const cursorPos = textarea.selectionStart;
            const textBeforeCursor = textarea.value.substring(0, cursorPos);
            const lineNumber = textBeforeCursor.split('\n').length - 1;
            const lines = textarea.value.split('\n');
            const currentLine = lines[lineNumber];

            // Check if this line is a section header
            const isSectionHeader = /^(INTRO|VERSE|PRE-CHORUS|CHORUS|BRIDGE|INTERLUDE|TAG|CODA|OUTRO|TURN|BREAK|CHOURS)[\s\d]*:?/i.test(currentLine.trim());

            if (isSectionHeader) {
                // Show editor at click position
                const rect = textarea.getBoundingClientRect();
                showSectionEditor(currentLine, lineNumber, e.clientX, e.clientY);
            }
        });
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (sectionEditorOverlay.style.display === 'block' &&
            !sectionEditorOverlay.contains(e.target) &&
            e.target !== visualEditor) {
            hideSectionEditor();
        }
    });

    // ============= END SECTION HEADER EDITOR =============

    // ============= ARRANGEMENT TAG EDITOR =============
    // Arrangement tag options for dropdown (with repeat counts and flow arrow)
    const arrangementTagOptions = [
        '(I)', '(I)2x', '(I)3x',     // Intro with repeats
        '(V1)', '(V2)', '(V3)', '(V4)',  // Verses
        '(PC)', '(PC1)', '(PC2)',  // Pre-Chorus
        '(C)', '(C)2x', '(C1)', '(C2)',  // Chorus with repeats
        '(B)', '(B)2x', '(B1)', '(B2)',  // Bridge with repeats
        '(INT)',  // Interlude
        '(TAG)', '(TAG)2x',  // Tag with repeat
        '(CODA)', // Coda
        '(O)',    // Outro
        '(TURN)', '(TURN1)', '(TURN2)',  // Turn
        '(BRK)', '(BRK1)', '(BRK2)',  // Break
        '>'  // Flow arrow (go to)
    ];

    // Create arrangement tag editor dropdown overlay (compact layout like section editor)
    const arrangementEditorOverlay = document.createElement('div');
    arrangementEditorOverlay.id = 'arrangementEditorOverlay';
    arrangementEditorOverlay.style.cssText = `
        position: absolute;
        display: none;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 0;
        padding: 12px;
        z-index: 10000;
        box-shadow: none;
        min-width: 200px;
    `;

    const arrangementSelect = document.createElement('select');
    arrangementSelect.style.cssText = `
        width: 100%;
        padding: 8px;
        font-size: 14px;
        border: 1px solid var(--border);
        border-radius: 0;
        background: var(--bg);
        color: var(--text);
        cursor: pointer;
        margin-bottom: 8px;
    `;

    arrangementTagOptions.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        arrangementSelect.appendChild(option);
    });

    const arrangementButtonContainer = document.createElement('div');
    arrangementButtonContainer.style.cssText = 'display: flex; gap: 8px;';

    const arrangementApplyButton = document.createElement('button');
    arrangementApplyButton.textContent = 'Apply';
    arrangementApplyButton.style.cssText = `
        flex: 1;
        padding: 6px 12px;
        background: var(--text);
        color: var(--bg);
        border: none;
        border-radius: 0;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
    `;

    const arrangementCancelButton = document.createElement('button');
    arrangementCancelButton.textContent = 'Cancel';
    arrangementCancelButton.style.cssText = `
        flex: 1;
        padding: 6px 12px;
        background: transparent;
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 0;
        cursor: pointer;
        font-size: 13px;
    `;

    const arrangementRemoveButton = document.createElement('button');
    arrangementRemoveButton.textContent = 'Remove';
    arrangementRemoveButton.style.cssText = `
        width: 100%;
        margin-top: 8px;
        padding: 6px 12px;
        background: var(--text);
        color: var(--bg);
        border: none;
        border-radius: 0;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
    `;

    arrangementButtonContainer.appendChild(arrangementApplyButton);
    arrangementButtonContainer.appendChild(arrangementCancelButton);
    arrangementEditorOverlay.appendChild(arrangementSelect);
    arrangementEditorOverlay.appendChild(arrangementButtonContainer);
    arrangementEditorOverlay.appendChild(arrangementRemoveButton);
    document.body.appendChild(arrangementEditorOverlay);

    let currentEditingTag = null;
    let currentEditingTagPosition = null; // {lineIndex, tagIndex}

    function showArrangementEditor(tag, lineIndex, tagIndex, clickX, clickY) {
        currentEditingTag = tag;
        currentEditingTagPosition = { lineIndex, tagIndex };

        // Set current value in dropdown
        const cleanTag = tag.trim();
        if (arrangementTagOptions.includes(cleanTag)) {
            arrangementSelect.value = cleanTag;
        } else {
            arrangementSelect.value = '(C)'; // Default to chorus
        }

        // Position overlay with proper scroll compensation
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

        let leftPos = clickX + scrollX + 10;
        let topPos = clickY + scrollY + 10;

        // Make sure it doesn't go off screen
        if (leftPos + 180 > viewportWidth + scrollX) {
            leftPos = viewportWidth + scrollX - 180;
        }

        arrangementEditorOverlay.style.left = leftPos + 'px';
        arrangementEditorOverlay.style.top = topPos + 'px';
        arrangementEditorOverlay.style.display = 'block';
        arrangementSelect.focus();
    }

    function hideArrangementEditor() {
        arrangementEditorOverlay.style.display = 'none';
        currentEditingTag = null;
        currentEditingTagPosition = null;
    }

    function applyArrangementTagChange() {
        if (!currentEditingTagPosition || !visualEditor) return;

        const newTag = arrangementSelect.value;
        const lines = visualEditor.value.split('\n');
        const { lineIndex, tagIndex } = currentEditingTagPosition;

        if (lineIndex < 0 || lineIndex >= lines.length) return;

        const line = lines[lineIndex];
        // Split line into tags (each tag is like "(V1)" or "(C)")
        const tagMatches = [...line.matchAll(/\([A-Z\d]+\)/g)];

        if (tagIndex < 0 || tagIndex >= tagMatches.length) return;

        const match = tagMatches[tagIndex];
        const startPos = match.index;
        const endPos = startPos + match[0].length;

        // Replace the tag
        const newLine = line.substring(0, startPos) + newTag + line.substring(endPos);
        lines[lineIndex] = newLine;

        visualEditor.value = lines.join('\n');

        // Trigger update
        updateSongBookFromVisual();
        updateLivePreview();
        updateEditorBadges();

        hideArrangementEditor();
    }

    // Apply button click
    arrangementApplyButton.addEventListener('click', applyArrangementTagChange);

    // Remove tag function
    function removeArrangementTag() {
        if (!currentEditingTagPosition || !visualEditor) return;

        const lines = visualEditor.value.split('\n');
        const { lineIndex, tagIndex } = currentEditingTagPosition;

        if (lineIndex < 0 || lineIndex >= lines.length) return;

        const line = lines[lineIndex];
        // Split line into tags (each tag is like "(V1)" or "(C)")
        const tagMatches = [...line.matchAll(/\([A-Z\d]+\)/g)];

        if (tagIndex < 0 || tagIndex >= tagMatches.length) return;

        const match = tagMatches[tagIndex];
        const startPos = match.index;
        const endPos = startPos + match[0].length;

        // Remove the tag and any trailing space
        let newLine = line.substring(0, startPos) + line.substring(endPos);
        // Clean up extra spaces
        newLine = newLine.replace(/\s+/g, ' ').trim();

        lines[lineIndex] = newLine;

        visualEditor.value = lines.join('\n');

        // Trigger update
        updateSongBookFromVisual();
        updateLivePreview();
        updateEditorBadges();

        hideArrangementEditor();
    }

    // Remove button click
    arrangementRemoveButton.addEventListener('click', removeArrangementTag);

    // Cancel button click
    arrangementCancelButton.addEventListener('click', hideArrangementEditor);

    // Enter key to apply
    arrangementSelect.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyArrangementTagChange();
        } else if (e.key === 'Escape') {
            hideArrangementEditor();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            // Allow Delete/Backspace to remove tag
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                removeArrangementTag();
            }
        }
    });

    // Click detection on arrangement tags in visual editor
    if (visualEditor) {
        visualEditor.addEventListener('click', (e) => {
            const textarea = e.target;
            const cursorPos = textarea.selectionStart;
            const lines = textarea.value.split('\n');

            // Find which line was clicked
            let charCount = 0;
            let lineIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                if (cursorPos <= charCount + lines[i].length) {
                    lineIndex = i;
                    break;
                }
                charCount += lines[i].length + 1; // +1 for newline
            }

            if (lineIndex === -1) return;

            const currentLine = lines[lineIndex];
            const posInLine = cursorPos - charCount;

            // Check if line is an arrangement line (contains multiple tags like "(V1) (C) (V2)")
            const isArrangementLine = /\([A-Z\d]+\)/.test(currentLine) &&
                                      currentLine.split(/\([A-Z\d]+\)/).length > 2;

            if (isArrangementLine) {
                // Find which tag was clicked
                const tagMatches = [...currentLine.matchAll(/\([A-Z\d]+\)/g)];

                for (let i = 0; i < tagMatches.length; i++) {
                    const match = tagMatches[i];
                    const tagStart = match.index;
                    const tagEnd = tagStart + match[0].length;

                    if (posInLine >= tagStart && posInLine <= tagEnd) {
                        // Clicked on this tag
                        showArrangementEditor(match[0], lineIndex, i, e.clientX, e.clientY);
                        break;
                    }
                }
            }
        });
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (arrangementEditorOverlay.style.display === 'block' &&
            !arrangementEditorOverlay.contains(e.target) &&
            e.target !== visualEditor) {
            hideArrangementEditor();
        }
    });

    // ============= END ARRANGEMENT TAG EDITOR =============

    // Initialize subscription UI
    initSubscriptionUI();

    // Initialize music links section
    initMusicSection();
});

// ============= MUSIC LINKS FUNCTIONALITY =============

// Platform configurations
const MUSIC_PLATFORMS = {
    youtube: {
        name: 'YouTube',
        contentKey: 'YouTube',
        pattern: /(?:youtube\.com|youtu\.be)/i,
        extractId: (url) => {
            const patterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
                /^([a-zA-Z0-9_-]{11})$/
            ];
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) return match[1];
            }
            return null;
        },
        embedType: 'iframe',
        getEmbedUrl: (id) => `https://www.youtube.com/embed/${id}?rel=0`
    },
    spotify: {
        name: 'Spotify',
        contentKey: 'Spotify',
        pattern: /open\.spotify\.com/i,
        embedType: 'link'
    },
    apple: {
        name: 'Apple Music',
        contentKey: 'AppleMusic',
        pattern: /music\.apple\.com/i,
        embedType: 'link'
    },
    soundcloud: {
        name: 'SoundCloud',
        contentKey: 'SoundCloud',
        pattern: /soundcloud\.com/i,
        embedType: 'link'
    },
    generic: {
        name: 'Link',
        contentKey: 'Link',
        pattern: null,
        embedType: 'link'
    }
};

// Current music links state
let currentMusicLinks = {};

/**
 * Initialize Music section on page load
 */
function initMusicSection() {
    checkForMusicLinks();

    // Add input listener for platform detection
    const input = document.getElementById('musicUrlInput');
    if (input) {
        input.addEventListener('input', detectPlatformFromInput);
    }
}

/**
 * Detect platform from URL as user types
 */
function detectPlatformFromInput() {
    const input = document.getElementById('musicUrlInput');
    const detectedDiv = document.getElementById('detectedPlatform');
    const detectedName = document.getElementById('detectedPlatformName');

    if (!input || !detectedDiv || !detectedName) return;

    const url = input.value.trim();
    if (!url) {
        detectedDiv.style.display = 'none';
        return;
    }

    const platform = detectPlatform(url);
    if (platform) {
        detectedName.textContent = MUSIC_PLATFORMS[platform].name;
        detectedDiv.style.display = 'block';
    } else {
        detectedDiv.style.display = 'none';
    }
}

/**
 * Detect which platform a URL belongs to
 */
function detectPlatform(url) {
    if (!url) return null;

    for (const [key, platform] of Object.entries(MUSIC_PLATFORMS)) {
        if (platform.pattern && platform.pattern.test(url)) {
            return key;
        }
    }

    // Check if it's a valid URL for generic link
    try {
        new URL(url);
        return 'generic';
    } catch {
        return null;
    }
}

/**
 * Open the Music link modal
 */
function openMusicModal() {
    const modal = document.getElementById('musicModal');
    const input = document.getElementById('musicUrlInput');
    const error = document.getElementById('musicUrlError');
    const detectedDiv = document.getElementById('detectedPlatform');

    if (modal) {
        modal.style.display = 'flex';
        if (input) {
            input.value = '';
            input.focus();
            if (error) error.style.display = 'none';
            if (detectedDiv) detectedDiv.style.display = 'none';

            // Add Enter key support
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveMusicLink();
                } else if (e.key === 'Escape') {
                    closeMusicModal();
                }
            };
        }
    }
}

/**
 * Close the Music link modal
 */
function closeMusicModal() {
    const modal = document.getElementById('musicModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Save the music link from the modal
 */
function saveMusicLink() {
    const input = document.getElementById('musicUrlInput');
    const error = document.getElementById('musicUrlError');
    const url = input?.value?.trim() || '';

    if (!url) {
        if (error) error.style.display = 'block';
        return;
    }

    const platform = detectPlatform(url);

    if (!platform) {
        if (error) {
            error.textContent = 'Please enter a valid URL';
            error.style.display = 'block';
        }
        return;
    }

    // For YouTube, validate the video ID
    if (platform === 'youtube') {
        const videoId = MUSIC_PLATFORMS.youtube.extractId(url);
        if (!videoId) {
            if (error) {
                error.textContent = 'Please enter a valid YouTube URL';
                error.style.display = 'block';
            }
            return;
        }
    }

    // Save the link
    currentMusicLinks[platform] = url;
    updateMusicLinkInContent(platform, url);
    updateMusicUI();

    // Close modal
    closeMusicModal();
}

/**
 * Update or add music link in the editor content
 */
function updateMusicLinkInContent(platform, url) {
    const visualEditor = document.getElementById('visualEditor');
    if (!visualEditor) return;

    const contentKey = MUSIC_PLATFORMS[platform].contentKey;
    let content = visualEditor.value;
    const linePattern = new RegExp(`^${contentKey}:\\s*https?:\\/\\/[^\\n]+$`, 'm');

    if (linePattern.test(content)) {
        // Update existing line
        content = content.replace(linePattern, `${contentKey}: ${url}`);
    } else {
        // Add line after metadata
        const lines = content.split('\n');
        let insertIndex = 0;

        // Find insertion point after metadata
        for (let i = 0; i < Math.min(lines.length, 15); i++) {
            const line = lines[i].trim();
            if (line.match(/^(Key|BPM|Time|Author|Title|YouTube|Spotify|AppleMusic|SoundCloud|Link):/i) || line === '' || i < 3) {
                insertIndex = i + 1;
            }
        }

        lines.splice(insertIndex, 0, `${contentKey}: ${url}`);
        content = lines.join('\n');
    }

    visualEditor.value = content;
    triggerEditorUpdate();
}

/**
 * Remove a music link
 */
function removeMusicLink(platform) {
    const visualEditor = document.getElementById('visualEditor');
    if (!visualEditor) return;

    const contentKey = MUSIC_PLATFORMS[platform].contentKey;
    let content = visualEditor.value;
    const linePattern = new RegExp(`^${contentKey}:\\s*https?:\\/\\/[^\\n]*\\n?`, 'm');
    content = content.replace(linePattern, '');
    visualEditor.value = content;

    delete currentMusicLinks[platform];
    updateMusicUI();
    triggerEditorUpdate();
}

/**
 * Check for music links in content and update UI
 */
function checkForMusicLinks() {
    const visualEditor = document.getElementById('visualEditor');
    if (!visualEditor) return;

    const content = visualEditor.value;
    currentMusicLinks = {};

    // Check for each platform
    for (const [key, platform] of Object.entries(MUSIC_PLATFORMS)) {
        const pattern = new RegExp(`^${platform.contentKey}:\\s*(https?:\\/\\/[^\\n]+)`, 'm');
        const match = content.match(pattern);
        if (match && match[1]) {
            currentMusicLinks[key] = match[1].trim();
        }
    }

    updateMusicUI();
}

/**
 * Update the music section UI based on current links
 */
function updateMusicUI() {
    const addBtn = document.getElementById('musicAddBtn');
    const youtubeContainer = document.getElementById('youtubePlayerContainer');
    const youtubeIframe = document.getElementById('youtubeIframe');
    const linksRow = document.getElementById('musicLinksRow');

    const hasYoutube = !!currentMusicLinks.youtube;

    // YouTube player
    if (hasYoutube && youtubeContainer && youtubeIframe) {
        const videoId = MUSIC_PLATFORMS.youtube.extractId(currentMusicLinks.youtube);
        if (videoId) {
            youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
            youtubeContainer.style.display = 'block';
        }
    } else if (youtubeContainer) {
        youtubeContainer.style.display = 'none';
        if (youtubeIframe) youtubeIframe.src = '';
    }

    // Other platform buttons
    if (linksRow) {
        let hasVisibleLinks = false;

        // Spotify
        const spotifyBtn = document.getElementById('spotifyLinkBtn');
        if (spotifyBtn) {
            if (currentMusicLinks.spotify) {
                spotifyBtn.href = currentMusicLinks.spotify;
                spotifyBtn.style.display = 'inline-flex';
                hasVisibleLinks = true;
            } else {
                spotifyBtn.style.display = 'none';
            }
        }

        // Apple Music
        const appleBtn = document.getElementById('appleLinkBtn');
        if (appleBtn) {
            if (currentMusicLinks.apple) {
                appleBtn.href = currentMusicLinks.apple;
                appleBtn.style.display = 'inline-flex';
                hasVisibleLinks = true;
            } else {
                appleBtn.style.display = 'none';
            }
        }

        // SoundCloud
        const soundcloudBtn = document.getElementById('soundcloudLinkBtn');
        if (soundcloudBtn) {
            if (currentMusicLinks.soundcloud) {
                soundcloudBtn.href = currentMusicLinks.soundcloud;
                soundcloudBtn.style.display = 'inline-flex';
                hasVisibleLinks = true;
            } else {
                soundcloudBtn.style.display = 'none';
            }
        }

        // Generic Link
        const genericBtn = document.getElementById('genericLinkBtn');
        const genericText = document.getElementById('genericLinkText');
        if (genericBtn) {
            if (currentMusicLinks.generic) {
                genericBtn.href = currentMusicLinks.generic;
                genericBtn.style.display = 'inline-flex';
                // Try to show domain name
                try {
                    const domain = new URL(currentMusicLinks.generic).hostname.replace('www.', '');
                    if (genericText) genericText.textContent = domain;
                } catch {
                    if (genericText) genericText.textContent = 'Link';
                }
                hasVisibleLinks = true;
            } else {
                genericBtn.style.display = 'none';
            }
        }

        linksRow.style.display = hasVisibleLinks ? 'flex' : 'none';
    }

    // Always show add button so user can add more links
    if (addBtn) {
        addBtn.style.display = 'flex';
    }
}

/**
 * Trigger editor content update
 */
function triggerEditorUpdate() {
    if (typeof updateSongBookFromVisual === 'function') {
        updateSongBookFromVisual();
    }
    if (typeof updateLivePreview === 'function') {
        updateLivePreview();
    }
}

// Make functions globally accessible
window.openMusicModal = openMusicModal;
window.closeMusicModal = closeMusicModal;
window.saveMusicLink = saveMusicLink;
window.removeMusicLink = removeMusicLink;
window.checkForMusicLinks = checkForMusicLinks;

// Backward compatibility aliases
window.openYoutubeModal = openMusicModal;
window.closeYoutubeModal = closeMusicModal;
window.saveYoutubeLink = saveMusicLink;
window.removeYoutubeLink = () => removeMusicLink('youtube');
window.checkForYoutubeLink = checkForMusicLinks;

// ============= END MUSIC LINKS FUNCTIONALITY =============
