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

            // Reset to new song mode
            resetToNewSongMode();

            // Auto-fill with extracted title
            const extractedTitle = extractTitleFromContent(content);
            songNameInput.value = extractedTitle;
            saveSongModal.style.display = 'flex';

            // Focus and select the text for easy editing
            if (extractedTitle) {
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

            // Get detected key if available
            const detectedKeyElement = document.getElementById('detectedKey');
            const detectedKey = detectedKeyElement ? detectedKeyElement.textContent : '';

            // Get ORIGINAL baseline (untransposed) SongBook format for proper transpose on load
            const baselineChart = window.getBaselineChart ? window.getBaselineChart() : '';
            const actualTransposeSteps = window.getCurrentTransposeSteps ? window.getCurrentTransposeSteps() : 0;

            try {
                // Save to Firebase Realtime Database
                const database = firebase.database();
                const songRef = database.ref('users/' + user.uid + '/songs').push();

                await songRef.set({
                    name: songName,
                    content: content, // Visual editor content (current state, possibly transposed)
                    baselineChart: baselineChart, // ORIGINAL untransposed chart for transpose reference
                    printPreview: printPreviewText, // Formatted preview text
                    transposeSteps: actualTransposeSteps, // Current transpose state
                    originalKey: detectedKey,
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

            // Get print preview content (the formatted text from livePreview)
            const livePreview = document.getElementById('livePreview');
            const printPreviewText = livePreview ? livePreview.textContent : content;

            // Get transpose information
            const transposeStepsInput = document.getElementById('transposeSteps');
            const currentTransposeSteps = transposeStepsInput ? parseInt(transposeStepsInput.value) || 0 : 0;

            // Get detected key if available
            const detectedKeyElement = document.getElementById('detectedKey');
            const detectedKey = detectedKeyElement ? detectedKeyElement.textContent : '';

            // Get ORIGINAL baseline (untransposed) SongBook format for proper transpose on load
            const baselineChart = window.getBaselineChart ? window.getBaselineChart() : '';
            const actualTransposeSteps = window.getCurrentTransposeSteps ? window.getCurrentTransposeSteps() : 0;

            try {
                // Update in Firebase Realtime Database
                const database = firebase.database();
                const songRef = database.ref('users/' + user.uid + '/songs/' + currentLoadedSong.id);

                await songRef.update({
                    content: content,
                    baselineChart: baselineChart,
                    printPreview: printPreviewText,
                    transposeSteps: actualTransposeSteps,
                    originalKey: detectedKey,
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

            const songTitle = document.createElement('div');
            songTitle.textContent = song.name;
            songTitle.style.cssText = 'font-weight: 600; color: var(--text); margin-bottom: 4px;';

            const songDate = document.createElement('div');
            const date = new Date(song.updatedAt || song.createdAt);
            songDate.textContent = 'Last edited: ' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            songDate.style.cssText = 'font-size: 0.85rem; color: var(--text-muted);';

            songInfo.appendChild(songTitle);
            songInfo.appendChild(songDate);

            // Add key information if available
            if (song.originalKey) {
                const songKey = document.createElement('div');
                songKey.textContent = `Key: ${song.originalKey}`;
                if (song.transposeSteps && song.transposeSteps !== 0) {
                    songKey.textContent += ` (Transposed ${song.transposeSteps > 0 ? '+' : ''}${song.transposeSteps})`;
                }
                songKey.style.cssText = 'font-size: 0.85rem; color: var(--primary); margin-top: 2px; font-weight: 500;';
                songInfo.appendChild(songKey);
            }

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

                if (baseline) {
                    // Dispatch custom event - app.js will use ANALYZE logic
                    window.dispatchEvent(new CustomEvent('songLoaded', {
                        detail: {
                            baselineChart: baseline
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

    // Initialize when DOM is ready and Firebase is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initSongLibrary, 500);
        });
    } else {
        setTimeout(initSongLibrary, 500);
    }
})();
