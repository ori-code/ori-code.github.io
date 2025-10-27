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

        // Open Save Song Modal
        saveSongBtn.addEventListener('click', () => {
            const user = firebase.auth().currentUser;
            if (!user) {
                showMessage('Error', 'Please sign in to save songs', 'error');
                return;
            }

            const content = visualEditor.value.trim();
            if (!content) {
                showMessage('Error', 'No content to save. Please add chords and lyrics first.', 'error');
                return;
            }

            // Reset to new song mode
            resetToNewSongMode();

            songNameInput.value = '';
            saveSongModal.style.display = 'flex';
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

            try {
                // Save to Firebase Realtime Database
                const database = firebase.database();
                const songRef = database.ref('users/' + user.uid + '/songs').push();

                await songRef.set({
                    name: songName,
                    content: content, // Visual editor content
                    printPreview: printPreviewText, // Formatted preview text
                    transposeSteps: currentTransposeSteps,
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

            try {
                // Update in Firebase Realtime Database
                const database = firebase.database();
                const songRef = database.ref('users/' + user.uid + '/songs/' + currentLoadedSong.id);

                await songRef.update({
                    content: content,
                    printPreview: printPreviewText,
                    transposeSteps: currentTransposeSteps,
                    originalKey: detectedKey,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                });

                showMessage('Success', `"${currentLoadedSong.name}" updated successfully!`, 'success');
            } catch (error) {
                console.error('Error updating song:', error);
                showMessage('Error', 'Failed to update song: ' + error.message, 'error');
            }
        });

        // Open Load Song Modal
        loadSongBtn.addEventListener('click', async () => {
            const user = firebase.auth().currentUser;
            if (!user) {
                showMessage('Error', 'Please sign in to load songs', 'error');
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
                    songList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px 20px;">No songs saved yet. Save your first song to start building your library!</p>';
                } else {
                    // Convert songs object to array and sort by date
                    const songsArray = Object.entries(songs).map(([id, data]) => ({
                        id,
                        ...data
                    })).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

                    // Create song list items
                    songsArray.forEach(song => {
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
                                    songItem.remove();

                                    // Check if list is empty
                                    if (songList.children.length === 0) {
                                        songList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px 20px;">No songs saved yet.</p>';
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
                            // Load visual editor content
                            visualEditor.value = song.content;

                            // Restore transpose steps if saved
                            const transposeStepsInput = document.getElementById('transposeSteps');
                            if (transposeStepsInput && song.transposeSteps !== undefined) {
                                transposeStepsInput.value = song.transposeSteps;
                            }

                            // Store currently loaded song for update functionality
                            currentLoadedSong = {
                                id: song.id,
                                name: song.name
                            };

                            // Trigger input event to update preview
                            visualEditor.dispatchEvent(new Event('input'));

                            // Show loaded message with key info if available
                            let message = `"${song.name}" loaded!`;
                            if (song.originalKey) {
                                message += ` (Original Key: ${song.originalKey})`;
                            }
                            showMessage('Success', message, 'success');
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

                        songList.appendChild(songItem);
                    });
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
