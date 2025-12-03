// Song Library - Save and Load Songs to/from Firebase
(function() {
    'use strict';

    // Wait for Firebase to be initialized
    function initSongLibrary() {
        const saveSongBtn = document.getElementById('saveSongButton');
        const loadSongBtn = document.getElementById('loadSongButton');
        const updateSongBtn = document.getElementById('updateSongButton');
        const saveSongModal = document.getElementById('saveSongModal');
        const loadSongModal = document.getElementById('loadSongModal');
        const saveSongClose = document.getElementById('saveSongClose');
        const loadSongClose = document.getElementById('loadSongClose');
        const saveSongCancel = document.getElementById('saveSongCancel');
        const loadSongCancel = document.getElementById('loadSongCancel');
        const saveSongConfirm = document.getElementById('saveSongConfirm');
        const songNameInput = document.getElementById('songNameInput');
        const songList = document.getElementById('songList');
        const visualEditor = document.getElementById('visualEditor');

        // Track currently loaded song for update functionality
        let currentLoadedSong = null;

        // Function to reset to "new song" mode
        function resetToNewSongMode() {
            currentLoadedSong = null;
        }

        // Show custom message (reuse existing modal system)
        function showMessage(title, message, type = 'info') {
            const authMessage = document.getElementById('authMessage');
            if (authMessage) {
                authMessage.textContent = message;
                authMessage.style.display = 'block';
                authMessage.style.background = type === 'error' ? 'rgba(255, 59, 92, 0.9)' : 'rgba(79, 209, 139, 0.9)';
                authMessage.style.color = '#fff';
                setTimeout(() => {
                    authMessage.style.display = 'none';
                }, 3000);
            }
        }

        // Function to extract title from content
        function extractTitleFromContent(content) {
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                // Skip empty lines, chord lines, and Key/BPM lines
                if (!trimmed ||
                    /^[A-G][#b]?/.test(trimmed) ||
                    /^Key:/i.test(trimmed) ||
                    /^BPM:/i.test(trimmed) ||
                    /^\d+\s*$/.test(trimmed)) {
                    continue;
                }

                // Extract title - remove leading numbers like "171. "
                const titleMatch = trimmed.match(/^(?:\d+\.\s*)?(.+)/);
                if (titleMatch && titleMatch[1]) {
                    return titleMatch[1].trim();
                }
            }
            return '';
        }

        // Open Save Song Modal
        saveSongBtn.addEventListener('click', () => {
            const user = firebase.auth().currentUser;
            if (!user) {
                showMessage('Error', 'Please sign in to save songs', 'error');
                return;
            }

            // Check subscription - only Basic and Pro can save
            if (window.subscriptionManager && !window.subscriptionManager.canSaveSongs()) {
                showMessage('Error', 'Saving songs requires Basic ($0.99/mo) or Pro ($1.99/mo) subscription', 'error');

                // Show subscription modal
                setTimeout(() => {
                    const modal = document.getElementById('subscriptionModal');
                    if (modal) {
                        modal.style.display = 'flex';
                    }
                }, 500);
                return;
            }

            const content = visualEditor.value.trim();
            if (!content) {
                showMessage('Error', 'No content to save. Please add chords and lyrics first.', 'error');
                return;
            }

            // Check required fields: Key and BPM
            const keySelector = document.getElementById('keySelector');
            const bpmInput = document.getElementById('bpmInput');
            const bpmValue = bpmInput ? parseInt(bpmInput.value) : 0;

            if (!bpmValue || bpmValue < 40 || bpmValue > 240) {
                showMessage('Error', 'Please enter a valid BPM (40-240) before saving', 'error');
                // Highlight the BPM field
                if (bpmInput) {
                    bpmInput.style.border = '2px solid #ef4444';
                    bpmInput.focus();
                    setTimeout(() => {
                        bpmInput.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    }, 3000);
                }
                return;
            }

            // Reset to new song mode
            resetToNewSongMode();

            // Auto-fill with extracted title + Key + BPM format
            const extractedTitle = extractTitleFromContent(content);
            const keyValue = keySelector ? keySelector.value : 'C Major';

            // Build formatted name: "Title | Key: E Major | BPM: 120"
            const formattedName = `${extractedTitle} | Key: ${keyValue} | BPM: ${bpmValue}`;
            songNameInput.value = formattedName;
            saveSongModal.style.display = 'flex';

            // Focus and select the text for easy editing
            if (formattedName) {
                setTimeout(() => {
                    songNameInput.focus();
                    songNameInput.select();
                }, 100);
            }
        });

        // Close Save Song Modal
        saveSongClose.addEventListener('click', () => {
            saveSongModal.style.display = 'none';
        });

        saveSongCancel.addEventListener('click', () => {
            saveSongModal.style.display = 'none';
        });

        // Save Song to Firebase
        saveSongConfirm.addEventListener('click', async () => {
            const user = firebase.auth().currentUser;
            if (!user) {
                showMessage('Error', 'Please sign in to save songs', 'error');
                saveSongModal.style.display = 'none';
                return;
            }

            const songName = songNameInput.value.trim();
            if (!songName) {
                showMessage('Error', 'Please enter a song name', 'error');
                return;
            }

            const content = visualEditor.value.trim();
            if (!content) {
                showMessage('Error', 'No content to save', 'error');
                saveSongModal.style.display = 'none';
                return;
            }

            // Get print preview content (the formatted text from livePreview)
            const livePreview = document.getElementById('livePreview');
            const printPreviewText = livePreview ? livePreview.textContent : content;

            // Get transpose information
            const transposeStepsInput = document.getElementById('transposeSteps');
            const currentTransposeSteps = transposeStepsInput ? parseInt(transposeStepsInput.value) || 0 : 0;

            // Get key from keySelector (required field)
            const keySelector = document.getElementById('keySelector');
            const originalKey = keySelector ? keySelector.value : 'C Major';

            // Get BPM (required field - already validated)
            const bpmInput = document.getElementById('bpmInput');
            const bpm = bpmInput ? parseInt(bpmInput.value) : null;

            // Get ORIGINAL baseline (untransposed) SongBook format for proper transpose on load
            const baselineChart = window.getBaselineChart ? window.getBaselineChart() : '';
            const actualTransposeSteps = window.getCurrentTransposeSteps ? window.getCurrentTransposeSteps() : 0;

            // ============= EXTRACT METADATA FROM CONTENT =============
            // Extract title from songName (before " | Key:" if present)
            const titleMatch = songName.match(/^([^|]+?)(?:\s*\|\s*Key:|$)/);
            const title = titleMatch ? titleMatch[1].trim() : songName.trim();

            // Extract author from content or baselineChart
            let author = '';
            const authorMatch = (content + '\n' + baselineChart).match(/\{author:\s*([^\}]+)\}/i) ||
                               (content + '\n' + baselineChart).match(/^([^\n]+)\n([A-Z][^\n]+)$/m);
            if (authorMatch) {
                author = authorMatch[1].trim();
            }

            // Extract time signature from ChordPro format or visual format
            let timeSignature = '';
            const timeMatch = (content + '\n' + baselineChart).match(/\{time:\s*([^\}]+)\}/i) ||
                             (content + '\n' + baselineChart).match(/Time:\s*(\d+\/\d+)/i);
            if (timeMatch) {
                timeSignature = timeMatch[1].trim();
            }
            // If not found in content, get from dropdown
            if (!timeSignature) {
                const timeSignatureDropdown = document.getElementById('timeSignature');
                if (timeSignatureDropdown) {
                    timeSignature = timeSignatureDropdown.value;
                }
            }

            try {
                // Save to Firebase Realtime Database
                const database = firebase.database();
                const songRef = database.ref('users/' + user.uid + '/songs').push();

                await songRef.set({
                    // Legacy field for backwards compatibility
                    name: songName,

                    // ✅ NEW STRUCTURED METADATA FIELDS
                    title: title,
                    author: author || '',
                    key: originalKey,
                    bpm: bpm,
                    timeSignature: timeSignature || '',

                    // Content storage
                    content: content, // Visual editor content (current state, possibly transposed)
                    baselineChart: baselineChart, // ORIGINAL untransposed chart for transpose reference
                    printPreview: printPreviewText, // Formatted preview text

                    // Transpose state
                    transposeSteps: actualTransposeSteps, // Current transpose state
                    originalKey: originalKey, // Key from selector (required)

                    // Timestamps
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                });

                showMessage('Success', `"${songName}" saved to your library!`, 'success');
                saveSongModal.style.display = 'none';
            } catch (error) {
                console.error('Error saving song:', error);
                showMessage('Error', 'Failed to save song: ' + error.message, 'error');
            }
        });

        // Update Song Button
        updateSongBtn.addEventListener('click', async () => {
            const user = firebase.auth().currentUser;
            if (!user) {
                showMessage('Error', 'Please sign in to update songs', 'error');
                return;
            }

            // Check subscription - only Basic and Pro can update
            if (window.subscriptionManager && !window.subscriptionManager.canSaveSongs()) {
                showMessage('Error', 'Updating songs requires Basic ($0.99/mo) or Pro ($1.99/mo) subscription', 'error');

                // Show subscription modal
                setTimeout(() => {
                    const modal = document.getElementById('subscriptionModal');
                    if (modal) {
                        modal.style.display = 'flex';
                    }
                }, 500);
                return;
            }

            if (!currentLoadedSong) {
                showMessage('Error', 'Please load a song first before updating. Use the Load button to select a song.', 'error');
                return;
            }

            const content = visualEditor.value.trim();
            if (!content) {
                showMessage('Error', 'No content to save', 'error');
                return;
            }

            // Check required fields: BPM
            const bpmInput = document.getElementById('bpmInput');
            const bpmValue = bpmInput ? parseInt(bpmInput.value) : 0;

            if (!bpmValue || bpmValue < 40 || bpmValue > 240) {
                showMessage('Error', 'Please enter a valid BPM (40-240) before updating', 'error');
                // Highlight the BPM field
                if (bpmInput) {
                    bpmInput.style.border = '2px solid #ef4444';
                    bpmInput.focus();
                    setTimeout(() => {
                        bpmInput.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    }, 3000);
                }
                return;
            }

            // Get print preview content (the formatted text from livePreview)
            const livePreview = document.getElementById('livePreview');
            const printPreviewText = livePreview ? livePreview.textContent : content;

            // Get transpose information
            const transposeStepsInput = document.getElementById('transposeSteps');
            const currentTransposeSteps = transposeStepsInput ? parseInt(transposeStepsInput.value) || 0 : 0;

            // Get key from keySelector (required field)
            const keySelector = document.getElementById('keySelector');
            const originalKey = keySelector ? keySelector.value : 'C Major';

            // Get ORIGINAL baseline (untransposed) SongBook format for proper transpose on load
            const baselineChart = window.getBaselineChart ? window.getBaselineChart() : '';
            const actualTransposeSteps = window.getCurrentTransposeSteps ? window.getCurrentTransposeSteps() : 0;

            // ============= EXTRACT METADATA FROM CONTENT =============
            // Extract title from current song name (before " | Key:" if present)
            const songName = currentLoadedSong.name || '';
            const titleMatch = songName.match(/^([^|]+?)(?:\s*\|\s*Key:|$)/);
            const title = titleMatch ? titleMatch[1].trim() : songName.trim();

            // Extract author from content or baselineChart
            let author = '';
            const authorMatch = (content + '\n' + baselineChart).match(/\{author:\s*([^\}]+)\}/i) ||
                               (content + '\n' + baselineChart).match(/^([^\n]+)\n([A-Z][^\n]+)$/m);
            if (authorMatch) {
                author = authorMatch[1].trim();
            }

            // Extract time signature from ChordPro format or visual format
            let timeSignature = '';
            const timeMatch = (content + '\n' + baselineChart).match(/\{time:\s*([^\}]+)\}/i) ||
                             (content + '\n' + baselineChart).match(/Time:\s*(\d+\/\d+)/i);
            if (timeMatch) {
                timeSignature = timeMatch[1].trim();
            }
            // If not found in content, get from dropdown
            if (!timeSignature) {
                const timeSignatureDropdown = document.getElementById('timeSignature');
                if (timeSignatureDropdown) {
                    timeSignature = timeSignatureDropdown.value;
                }
            }

            try {
                // Update in Firebase Realtime Database
                const database = firebase.database();
                const songRef = database.ref('users/' + user.uid + '/songs/' + currentLoadedSong.id);

                await songRef.update({
                    // ✅ UPDATE STRUCTURED METADATA FIELDS
                    title: title,
                    author: author || '',
                    key: originalKey,
                    bpm: bpmValue,
                    timeSignature: timeSignature || '',

                    // Content storage
                    content: content,
                    baselineChart: baselineChart,
                    printPreview: printPreviewText,

                    // Transpose state
                    transposeSteps: actualTransposeSteps,
                    originalKey: originalKey,

                    // Timestamp
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                });

                showMessage('Success', `"${currentLoadedSong.name}" updated successfully!`, 'success');
            } catch (error) {
                console.error('Error updating song:', error);
                showMessage('Error', 'Failed to update song: ' + error.message, 'error');
            }
        });

        // Function to create a single song item DOM element
        function createSongItem(song, user, database) {
            const songItem = document.createElement('div');
            songItem.style.cssText = 'padding: 16px; margin-bottom: 12px; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.2s ease; display: flex; justify-content: space-between; align-items: center;';

            const songInfo = document.createElement('div');
            songInfo.style.cssText = 'flex: 1;';

            // ✅ DISPLAY TITLE FROM STRUCTURED FIELD
            const songTitle = document.createElement('div');
            songTitle.textContent = song.title || song.name;
            songTitle.style.cssText = 'font-weight: 600; color: var(--text); margin-bottom: 4px; font-size: 1.05rem;';

            // ✅ DISPLAY AUTHOR IF AVAILABLE
            if (song.author) {
                const songAuthor = document.createElement('div');
                songAuthor.textContent = song.author;
                songAuthor.style.cssText = 'font-size: 0.9rem; color: var(--text-muted); margin-bottom: 6px; font-style: italic;';
                songInfo.appendChild(songTitle);
                songInfo.appendChild(songAuthor);
            } else {
                songInfo.appendChild(songTitle);
            }

            // ✅ METADATA BADGES (Key, BPM, Time Signature)
            const metadataRow = document.createElement('div');
            metadataRow.style.cssText = 'display: flex; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;';

            if (song.key || song.originalKey) {
                const keyBadge = document.createElement('span');
                keyBadge.textContent = `Key: ${song.key || song.originalKey}`;
                if (song.transposeSteps && song.transposeSteps !== 0) {
                    keyBadge.textContent += ` (${song.transposeSteps > 0 ? '+' : ''}${song.transposeSteps})`;
                }
                keyBadge.style.cssText = 'background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;';
                metadataRow.appendChild(keyBadge);
            }

            if (song.bpm) {
                const bpmBadge = document.createElement('span');
                bpmBadge.textContent = `${song.bpm} BPM`;
                bpmBadge.style.cssText = 'background: rgba(34, 197, 94, 0.15); color: #22c55e; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;';
                metadataRow.appendChild(bpmBadge);
            }

            if (song.timeSignature) {
                const timeBadge = document.createElement('span');
                timeBadge.textContent = song.timeSignature;
                timeBadge.style.cssText = 'background: rgba(168, 85, 247, 0.15); color: #a855f7; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;';
                metadataRow.appendChild(timeBadge);
            }

            if (metadataRow.children.length > 0) {
                songInfo.appendChild(metadataRow);
            }

            // Last edited date
            const songDate = document.createElement('div');
            const date = new Date(song.updatedAt || song.createdAt);
            songDate.textContent = 'Last edited: ' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            songDate.style.cssText = 'font-size: 0.8rem; color: var(--text-muted);';
            songInfo.appendChild(songDate);

            // Add to Session button
            const addToSessionBtn = document.createElement('button');
            addToSessionBtn.textContent = '➕';
            addToSessionBtn.style.cssText = 'background: transparent; border: none; font-size: 1.2rem; cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s ease; margin-right: 4px;';
            addToSessionBtn.title = 'Add to session playlist';

            addToSessionBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Check if user has an active session or is PRO
                if (!window.sessionManager) {
                    showMessage('Error', 'Session manager not available', 'error');
                    return;
                }

                // ✅ STORE SONG DATA WITH NEW STRUCTURED FIELDS
                window.pendingSongToAdd = {
                    // Legacy field
                    name: song.name,

                    // NEW STRUCTURED METADATA
                    title: song.title || song.name || 'Untitled',
                    author: song.author || '',
                    key: song.key || song.originalKey || 'Unknown',
                    bpm: song.bpm || null,
                    timeSignature: song.timeSignature || '',

                    // Content
                    content: song.baselineChart || song.songbookFormat || song.content,

                    // Transpose state
                    originalKey: song.originalKey || 'Unknown'
                };

                // Close load song modal
                loadSongModal.style.display = 'none';

                // Open My Sessions modal
                const mySessionsModal = document.getElementById('mySessionsModal');
                if (mySessionsModal) {
                    mySessionsModal.style.display = 'flex';
                    // Trigger loading sessions if function exists
                    if (window.loadMySessions) {
                        window.loadMySessions();
                    }
                    showMessage('Info', `Select a session to add "${song.name}"`, 'info');
                } else {
                    showMessage('Error', 'Sessions modal not found', 'error');
                }
            });

            addToSessionBtn.addEventListener('mouseenter', () => {
                addToSessionBtn.style.background = 'rgba(79, 209, 139, 0.2)';
            });

            addToSessionBtn.addEventListener('mouseleave', () => {
                addToSessionBtn.style.background = 'transparent';
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.style.cssText = 'background: transparent; border: none; font-size: 1.2rem; cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s ease;';
            deleteBtn.title = 'Delete song';

            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${song.name}"?`)) {
                    try {
                        await database.ref('users/' + user.uid + '/songs/' + song.id).remove();
                        showMessage('Success', `"${song.name}" deleted`, 'success');

                        // Remove from global array
                        window.allLoadedSongs = window.allLoadedSongs.filter(s => s.id !== song.id);

                        // Re-render list
                        if (window.triggerSongListRerender) {
                            window.triggerSongListRerender();
                        }
                    } catch (error) {
                        console.error('Error deleting song:', error);
                        showMessage('Error', 'Failed to delete song', 'error');
                    }
                }
            });

            deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.background = 'rgba(255, 59, 92, 0.2)';
            });

            deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.background = 'transparent';
            });

            songItem.appendChild(songInfo);
            songItem.appendChild(addToSessionBtn);
            songItem.appendChild(deleteBtn);

            // Load song on click
            songItem.addEventListener('click', () => {
                // Get the ORIGINAL baseline (untransposed) - same as analyze
                const baseline = song.baselineChart || song.songbookFormat || '';

                console.log('=== LOADING SONG ===');
                console.log('Song name:', song.name);
                console.log('Has baselineChart:', !!song.baselineChart);
                console.log('Has songbookFormat:', !!song.songbookFormat);
                console.log('Baseline length:', baseline.length);
                console.log('First 200 chars:', baseline.substring(0, 200));

                // Store currently loaded song for update functionality (BEFORE dispatching event)
                currentLoadedSong = {
                    id: song.id,
                    name: song.name
                };

                // Set global song name for session-ui
                window.currentSongName = song.name;

                if (baseline) {
                    // Set up app.js state for proper transposition
                    if (window.setBaselineChart) {
                        window.setBaselineChart(baseline);
                    }
                    if (window.setOriginalKey && song.originalKey) {
                        window.setOriginalKey(song.originalKey);
                    }

                    // Set key selector to song's original key
                    const keySelector = document.getElementById('keySelector');
                    if (keySelector && song.originalKey) {
                        keySelector.value = song.originalKey;
                    }

                    // Set BPM input
                    const bpmInput = document.getElementById('bpmInput');
                    if (bpmInput && song.bpm) {
                        bpmInput.value = song.bpm;
                    }

                    // Set Time signature
                    const timeSignature = document.getElementById('timeSignature');
                    if (timeSignature && song.timeSignature) {
                        timeSignature.value = song.timeSignature;
                    }

                    // Dispatch custom event - app.js will use ANALYZE logic
                    window.dispatchEvent(new CustomEvent('songLoaded', {
                        detail: {
                            baselineChart: baseline,
                            originalKey: song.originalKey || '',
                            bpm: song.bpm || null,
                            timeSignature: song.timeSignature || '4/4',
                            songName: song.name
                        }
                    }));
                } else {
                    // OLD SONG - no baseline saved, need to reconstruct
                    console.warn('⚠️ OLD SONG FORMAT - No baseline found. Converting from visual content...');

                    visualEditor.value = song.content;

                    // Convert visual format back to songbook format to use as baseline
                    const songbookOutput = document.getElementById('songbookOutput');
                    if (songbookOutput) {
                        // Trigger conversion
                        visualEditor.dispatchEvent(new Event('input'));

                        // Wait a moment for the conversion, then set as baseline
                        setTimeout(() => {
                            const reconstructedBaseline = songbookOutput.value;
                            console.log('Reconstructed baseline length:', reconstructedBaseline.length);
                            console.log('Reconstructed baseline first 200 chars:', reconstructedBaseline.substring(0, 200));

                            // Dispatch event with reconstructed baseline
                            window.dispatchEvent(new CustomEvent('songLoaded', {
                                detail: {
                                    baselineChart: reconstructedBaseline
                                }
                            }));

                            showMessage('Info', 'Old song format detected. Please UPDATE this song to fix transpose permanently.', 'info');
                        }, 100);
                    } else {
                        visualEditor.dispatchEvent(new Event('input'));
                    }
                }

                // Reset transpose input to 0 (same as after analyze)
                const transposeStepsInput = document.getElementById('transposeStepInput');
                if (transposeStepsInput) {
                    transposeStepsInput.value = 0;
                }

                // Show loaded message with key info
                let message = `"${song.name}" loaded!`;
                if (song.originalKey) {
                    message += ` (Original Key: ${song.originalKey})`;
                }
                if (baseline) {
                    showMessage('Success', message, 'success');
                }
                loadSongModal.style.display = 'none';
            });

            songItem.addEventListener('mouseenter', () => {
                songItem.style.background = 'var(--primary-soft)';
                songItem.style.borderColor = 'var(--primary)';
            });

            songItem.addEventListener('mouseleave', () => {
                songItem.style.background = 'var(--bg-soft)';
                songItem.style.borderColor = 'var(--border)';
            });

            return songItem;
        }

        // Function to render the song list
        window.triggerSongListRerender = function() {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const database = firebase.database();
            songList.innerHTML = '';

            // Apply filters and sorting
            const displaySongs = window.filterAndSortSongs ? window.filterAndSortSongs() : window.allLoadedSongs;

            if (!displaySongs || displaySongs.length === 0) {
                if (window.allLoadedSongs && window.allLoadedSongs.length > 0) {
                    songList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px 20px;">No songs match your filters. Try adjusting your search criteria.</p>';
                } else {
                    songList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px 20px;">No songs saved yet. Save your first song to start building your library!</p>';
                }
            } else {
                displaySongs.forEach(song => {
                    const songItem = createSongItem(song, user, database);
                    songList.appendChild(songItem);
                });
            }
        };

        // Open Load Song Modal
        loadSongBtn.addEventListener('click', async () => {
            const user = firebase.auth().currentUser;
            if (!user) {
                showMessage('Error', 'Please sign in to load songs', 'error');
                return;
            }

            // Check subscription - only Basic and Pro can load
            if (window.subscriptionManager && !window.subscriptionManager.canSaveSongs()) {
                showMessage('Error', 'Loading songs requires Basic ($0.99/mo) or Pro ($1.99/mo) subscription', 'error');

                // Show subscription modal
                setTimeout(() => {
                    const modal = document.getElementById('subscriptionModal');
                    if (modal) {
                        modal.style.display = 'flex';
                    }
                }, 500);
                return;
            }

            // Load songs from Firebase
            try {
                const database = firebase.database();
                const songsRef = database.ref('users/' + user.uid + '/songs');
                const snapshot = await songsRef.once('value');
                const songs = snapshot.val();

                // Clear song list
                songList.innerHTML = '';

                if (!songs || Object.keys(songs).length === 0) {
                    window.allLoadedSongs = [];
                    songList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px 20px;">No songs saved yet. Save your first song to start building your library!</p>';
                } else {
                    // Convert songs object to array and store globally
                    window.allLoadedSongs = Object.entries(songs).map(([id, data]) => ({
                        id,
                        ...data
                    }));

                    console.log('✅ Loaded', window.allLoadedSongs.length, 'songs into memory');

                    // Reset filters
                    if (window.resetSongFilters) {
                        window.resetSongFilters();
                    }

                    // Render with filters applied
                    window.triggerSongListRerender();
                }

                loadSongModal.style.display = 'flex';
            } catch (error) {
                console.error('Error loading songs:', error);
                showMessage('Error', 'Failed to load songs: ' + error.message, 'error');
            }
        });

        // Close Load Song Modal
        loadSongClose.addEventListener('click', () => {
            loadSongModal.style.display = 'none';
        });

        loadSongCancel.addEventListener('click', () => {
            loadSongModal.style.display = 'none';
        });

        // Close modals on outside click
        saveSongModal.addEventListener('click', (e) => {
            if (e.target === saveSongModal) {
                saveSongModal.style.display = 'none';
            }
        });

        loadSongModal.addEventListener('click', (e) => {
            if (e.target === loadSongModal) {
                loadSongModal.style.display = 'none';
            }
        });

        // Allow Enter key to save
        songNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveSongConfirm.click();
            }
        });
    }

    // ============= MIGRATION FUNCTION FOR EXISTING SONGS =============
    /**
     * Migrate existing songs to new structured format
     * Call this function from browser console: window.migrateSongDatabase()
     */
    async function migrateSongDatabase() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('❌ Please log in first');
            return;
        }

        console.log('🔄 Starting song database migration...');

        try {
            const database = firebase.database();
            const songsRef = database.ref(`users/${user.uid}/songs`);
            const snapshot = await songsRef.once('value');
            const songs = snapshot.val();

            if (!songs) {
                console.log('✅ No songs to migrate');
                return;
            }

            let migratedCount = 0;
            let skippedCount = 0;

            for (const [songId, song] of Object.entries(songs)) {
                // Skip if already has structured fields
                if (song.title && song.author !== undefined) {
                    console.log(`⏭️  Skipping "${song.name}" - already migrated`);
                    skippedCount++;
                    continue;
                }

                console.log(`🔄 Migrating: "${song.name}"`);

                // Extract title from name (before " | Key:")
                const titleMatch = song.name.match(/^([^|]+?)(?:\s*\|\s*Key:|$)/);
                const title = titleMatch ? titleMatch[1].trim() : song.name.trim();

                // Extract author from content or baselineChart
                let author = '';
                const content = (song.content || '') + '\n' + (song.baselineChart || '');
                const authorMatch = content.match(/\{author:\s*([^\}]+)\}/i) ||
                                   content.match(/^([^\n]+)\n([A-Z][^\n]+)$/m);
                if (authorMatch) {
                    author = authorMatch[1].trim();
                }

                // Extract time signature
                let timeSignature = '';
                const timeMatch = content.match(/\{time:\s*([^\}]+)\}/i);
                if (timeMatch) {
                    timeSignature = timeMatch[1].trim();
                }

                // Update with new structured fields
                await database.ref(`users/${user.uid}/songs/${songId}`).update({
                    title: title,
                    author: author || '',
                    key: song.originalKey || 'C Major',
                    timeSignature: timeSignature || ''
                });

                console.log(`✅ Migrated: "${title}" (Author: ${author || 'N/A'}, Time: ${timeSignature || 'N/A'})`);
                migratedCount++;
            }

            console.log(`\n🎉 Migration complete!`);
            console.log(`   ✅ Migrated: ${migratedCount} songs`);
            console.log(`   ⏭️  Skipped: ${skippedCount} songs`);
            console.log(`\n📊 Total songs: ${migratedCount + skippedCount}`);

        } catch (error) {
            console.error('❌ Migration error:', error);
        }
    }

    // Make migration function globally accessible
    window.migrateSongDatabase = migrateSongDatabase;

    // Initialize when DOM is ready and Firebase is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initSongLibrary, 500);
        });
    } else {
        setTimeout(initSongLibrary, 500);
    }
})();
