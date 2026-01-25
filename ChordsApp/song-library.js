// Song Library - Save and Load Songs to/from Firebase
(function() {
    'use strict';

    // ============= BULK SELECTION STATE =============
    let bulkSelectionMode = false;
    let selectedSongIds = new Set();

    // ============= BOOKS STATE =============
    let currentBookFilter = 'all'; // 'all' or bookId
    let userBooks = [];            // Array of user's books

    // Function to update the bulk action bar UI
    function updateBulkActionBar() {
        const countEl = document.getElementById('bulkSelectedCount');
        const actionBar = document.getElementById('bulkActionBar');
        const selectAllBtn = document.getElementById('bulkSelectAll');

        if (countEl) {
            countEl.textContent = `${selectedSongIds.size} selected`;
        }

        // Update select all button text
        if (selectAllBtn && window.filteredSongs) {
            const allSelected = window.filteredSongs.length > 0 &&
                                window.filteredSongs.every(s => selectedSongIds.has(s.id));
            selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
        }
    }

    // Function to toggle bulk selection mode
    function toggleBulkSelectionMode() {
        bulkSelectionMode = !bulkSelectionMode;
        selectedSongIds.clear();

        const toggleBtn = document.getElementById('bulkSelectToggle');
        const actionBar = document.getElementById('bulkActionBar');

        if (toggleBtn) {
            if (bulkSelectionMode) {
                toggleBtn.textContent = '✖️ Cancel';
                toggleBtn.style.background = 'rgba(239, 68, 68, 0.2)';
                toggleBtn.style.borderColor = '#ef4444';
            } else {
                toggleBtn.textContent = '☑️ Select';
                toggleBtn.style.background = '';
                toggleBtn.style.borderColor = '';
            }
        }

        if (actionBar) {
            actionBar.style.display = bulkSelectionMode ? 'block' : 'none';
        }

        // Re-render the list to show/hide checkboxes
        if (window.triggerSongListRerender) {
            window.triggerSongListRerender();
        }

        updateBulkActionBar();
    }

    // Function to reset bulk selection when modal closes
    function resetBulkSelection() {
        bulkSelectionMode = false;
        selectedSongIds.clear();

        const toggleBtn = document.getElementById('bulkSelectToggle');
        const actionBar = document.getElementById('bulkActionBar');

        if (toggleBtn) {
            toggleBtn.textContent = '☑️ Select';
            toggleBtn.style.background = '';
            toggleBtn.style.borderColor = '';
        }

        if (actionBar) {
            actionBar.style.display = 'none';
        }
    }

    // Expose for external use
    window.isBulkSelectionMode = function() { return bulkSelectionMode; };
    window.getSelectedSongIds = function() { return selectedSongIds; };
    window.resetBulkSelection = resetBulkSelection;

    // ============= BOOKS MANAGEMENT FUNCTIONS =============

    // Load all books for current user
    async function loadUserBooks() {
        const user = firebase.auth().currentUser;
        if (!user) return [];

        try {
            const database = firebase.database();
            const snapshot = await database.ref(`users/${user.uid}/books`).once('value');
            const books = snapshot.val();

            userBooks = books ? Object.entries(books).map(([id, data]) => ({id, ...data})) : [];
            return userBooks;
        } catch (error) {
            console.error('Error loading books:', error);
            return [];
        }
    }

    // Populate the book filter dropdown
    function populateBookFilter() {
        const bookFilter = document.getElementById('bookFilter');
        if (!bookFilter) return;

        // Get the saved selection (from window or current state)
        const savedSelection = window.selectedBookId || currentBookFilter || 'all';

        // Clear existing options except "All Songs"
        bookFilter.innerHTML = '<option value="all">📚 All Songs</option>';

        // Add Public Songs option (special global book)
        const publicOption = document.createElement('option');
        publicOption.value = '__PUBLIC__';
        publicOption.textContent = '🌐 Public Songs';
        publicOption.style.cssText = 'font-weight: bold; color: #22c55e;';
        if (savedSelection === '__PUBLIC__') {
            publicOption.selected = true;
        }
        bookFilter.appendChild(publicOption);

        // Add separator (disabled option)
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '──────────────';
        bookFilter.appendChild(separator);

        // Add user books
        userBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `📖 ${book.name}`;
            if (book.id === savedSelection) {
                option.selected = true;
            }
            bookFilter.appendChild(option);
        });

        // Update current state
        currentBookFilter = savedSelection;
    }

    // Create a new book
    async function createBook(name) {
        const user = firebase.auth().currentUser;
        if (!user) return null;

        try {
            const database = firebase.database();
            const bookRef = database.ref(`users/${user.uid}/books`).push();

            await bookRef.set({
                name: name.trim(),
                songIds: [],
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });

            // Reload books and refresh UI
            await loadUserBooks();
            populateBookFilter();
            renderBooksList();

            return bookRef.key;
        } catch (error) {
            console.error('Error creating book:', error);
            return null;
        }
    }

    // Delete a book
    async function deleteBook(bookId) {
        const user = firebase.auth().currentUser;
        if (!user) return false;

        try {
            await firebase.database().ref(`users/${user.uid}/books/${bookId}`).remove();

            // If we were viewing this book, switch to All Songs
            if (currentBookFilter === bookId) {
                currentBookFilter = 'all';
            }

            // Reload books and refresh UI
            await loadUserBooks();
            populateBookFilter();
            renderBooksList();

            if (window.triggerSongListRerender) {
                window.triggerSongListRerender();
            }

            return true;
        } catch (error) {
            console.error('Error deleting book:', error);
            return false;
        }
    }

    // Add song(s) to a book
    async function addSongsToBook(bookId, songIds) {
        const user = firebase.auth().currentUser;
        if (!user) return false;

        try {
            const database = firebase.database();
            const bookRef = database.ref(`users/${user.uid}/books/${bookId}`);
            const snapshot = await bookRef.once('value');
            const book = snapshot.val();

            if (!book) return false;

            const existingSongIds = book.songIds || [];
            const newSongIds = [...new Set([...existingSongIds, ...songIds])];

            await bookRef.update({
                songIds: newSongIds,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });

            // Reload books to update local state
            await loadUserBooks();

            return true;
        } catch (error) {
            console.error('Error adding songs to book:', error);
            return false;
        }
    }

    // Remove song from a book
    async function removeSongFromBook(bookId, songId) {
        const user = firebase.auth().currentUser;
        if (!user) return false;

        try {
            const database = firebase.database();
            const bookRef = database.ref(`users/${user.uid}/books/${bookId}`);
            const snapshot = await bookRef.once('value');
            const book = snapshot.val();

            if (!book) return false;

            const updatedSongIds = (book.songIds || []).filter(id => id !== songId);

            await bookRef.update({
                songIds: updatedSongIds,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });

            // Reload books and refresh UI
            await loadUserBooks();

            if (window.triggerSongListRerender) {
                window.triggerSongListRerender();
            }

            return true;
        } catch (error) {
            console.error('Error removing song from book:', error);
            return false;
        }
    }

    // Render books list in the management modal
    function renderBooksList() {
        const booksList = document.getElementById('booksList');
        if (!booksList) return;

        if (userBooks.length === 0) {
            booksList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No books yet. Create your first book above!</p>';
            return;
        }

        booksList.innerHTML = '';

        userBooks.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 8px;';

            const bookInfo = document.createElement('div');
            bookInfo.innerHTML = `
                <div style="font-weight: 600; color: var(--text);">📖 ${book.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${(book.songIds || []).length} songs</div>
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.style.cssText = 'background: transparent; border: none; font-size: 1.2rem; cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s ease;';
            deleteBtn.title = 'Delete book';

            deleteBtn.addEventListener('click', async () => {
                if (confirm(`Delete book "${book.name}"? (Songs will NOT be deleted)`)) {
                    const success = await deleteBook(book.id);
                    if (success) {
                        showMessage('Success', `Book "${book.name}" deleted`, 'success');
                    } else {
                        showMessage('Error', 'Failed to delete book', 'error');
                    }
                }
            });

            deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.background = 'rgba(255, 59, 92, 0.2)';
            });

            deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.background = 'transparent';
            });

            bookItem.appendChild(bookInfo);
            bookItem.appendChild(deleteBtn);
            booksList.appendChild(bookItem);
        });
    }

    // Show "Add to Book" selection modal
    function showAddToBookModal(songIds) {
        // If no books exist, prompt to create one
        if (userBooks.length === 0) {
            showMessage('Info', 'Create a book first before adding songs', 'info');
            const booksModal = document.getElementById('booksModal');
            if (booksModal) {
                booksModal.style.display = 'flex';
                renderBooksList();
            }
            return;
        }

        const addToBookModal = document.getElementById('addToBookModal');
        const addToBookList = document.getElementById('addToBookList');

        if (!addToBookModal || !addToBookList) return;

        addToBookList.innerHTML = '';

        userBooks.forEach(book => {
            const bookOption = document.createElement('div');
            bookOption.style.cssText = 'padding: 14px; margin-bottom: 8px; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;';

            bookOption.innerHTML = `
                <div style="font-weight: 600; color: var(--text);">📖 ${book.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${(book.songIds || []).length} songs</div>
            `;

            bookOption.addEventListener('click', async () => {
                const success = await addSongsToBook(book.id, songIds);
                if (success) {
                    showMessage('Success', `Added ${songIds.length} song${songIds.length > 1 ? 's' : ''} to "${book.name}"`, 'success');
                    addToBookModal.style.display = 'none';

                    // Reset bulk selection
                    if (window.resetBulkSelection) {
                        window.resetBulkSelection();
                    }
                    if (window.triggerSongListRerender) {
                        window.triggerSongListRerender();
                    }
                } else {
                    showMessage('Error', 'Failed to add songs to book', 'error');
                }
            });

            bookOption.addEventListener('mouseenter', () => {
                bookOption.style.background = 'var(--primary-soft)';
                bookOption.style.borderColor = 'var(--primary)';
            });

            bookOption.addEventListener('mouseleave', () => {
                bookOption.style.background = 'var(--bg-soft)';
                bookOption.style.borderColor = 'var(--border)';
            });

            addToBookList.appendChild(bookOption);
        });

        addToBookModal.style.display = 'flex';
    }

    // Expose book functions for external use
    window.loadUserBooks = loadUserBooks;
    window.createBook = createBook;
    window.deleteBook = deleteBook;
    window.addSongsToBook = addSongsToBook;
    window.removeSongFromBook = removeSongFromBook;
    window.showAddToBookModal = showAddToBookModal;
    window.getCurrentBookFilter = function() { return currentBookFilter; };
    window.getUserBooks = function() { return userBooks; };

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

            // First, check for {title: X} directive (v4 format)
            for (const line of lines) {
                const titleDirective = line.match(/\{title:\s*([^}]+)\}/i);
                if (titleDirective && titleDirective[1]) {
                    return titleDirective[1].trim();
                }
            }

            // Fallback: find first non-metadata line
            for (const line of lines) {
                const trimmed = line.trim();
                // Skip empty lines, chord lines, Key/BPM lines, and metadata lines
                if (!trimmed ||
                    /^[A-G][#b]?\s/.test(trimmed) ||           // Chord lines
                    /^Key:/i.test(trimmed) ||                   // Key: X lines
                    /^BPM:/i.test(trimmed) ||                   // BPM: X lines
                    /Key:\s*[A-G]/i.test(trimmed) ||           // Lines containing Key: anywhere
                    /\d+\s*BPM/i.test(trimmed) ||              // Lines containing BPM
                    /^\d+\s*$/.test(trimmed) ||                // Just numbers
                    /^\{/.test(trimmed) ||                     // Directive lines
                    /^\(/.test(trimmed)) {                     // Badge lines
                    continue;
                }

                // Extract title - remove leading numbers like "171. "
                const titleMatch = trimmed.match(/^(?:\d+\.\s*)?(.+)/);
                if (titleMatch && titleMatch[1]) {
                    let title = titleMatch[1].trim();
                    // Strip "Title: " prefix if present (from AI analysis output)
                    if (title.toLowerCase().startsWith('title:')) {
                        title = title.substring(6).trim();
                    }
                    return title;
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
                    if (window.showSubscriptionModal) {
                        window.showSubscriptionModal();
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

            // Auto-fill with just the extracted title (key/BPM/time saved separately)
            const extractedTitle = extractTitleFromContent(content);
            songNameInput.value = extractedTitle || '';
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
            // Try {author: X} first, then {subtitle: X} as fallback
            let author = '';
            const combinedContent = content + '\n' + baselineChart;
            const authorMatch = combinedContent.match(/\{author:\s*([^\}]+)\}/i) ||
                               combinedContent.match(/\{subtitle:\s*([^\}]+)\}/i);
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

            // Extract duration from content {duration: M:SS}
            let duration = '';
            const durationMatch = (content + '\n' + baselineChart).match(/\{duration:\s*(\d+:\d{2})\}/i);
            if (durationMatch) {
                duration = durationMatch[1].trim();
            }
            // If not found in content, get from duration input field
            if (!duration) {
                const durationInput = document.getElementById('songDuration');
                if (durationInput && durationInput.value) {
                    duration = durationInput.value;
                }
            }

            try {
                // Save to Firebase Realtime Database
                const database = firebase.database();
                const songRef = database.ref('users/' + user.uid + '/songs').push();

                // Get all current layout settings
                const fontSizeSlider = document.getElementById('fontSizeSlider');
                const lineHeightSlider = document.getElementById('lineHeightSlider');
                const charSpacingSlider = document.getElementById('charSpacingSlider');
                const columnCountSelect = document.getElementById('columnCount');
                const pageCountSelect = document.getElementById('pageCount');

                const layoutSettings = {
                    fontSize: fontSizeSlider ? parseFloat(fontSizeSlider.value) : 8,
                    lineHeight: lineHeightSlider ? parseFloat(lineHeightSlider.value) : 1.5,
                    charSpacing: charSpacingSlider ? parseFloat(charSpacingSlider.value) : 0,
                    columnCount: columnCountSelect ? columnCountSelect.value : '2',
                    pageCount: pageCountSelect ? pageCountSelect.value : '1'
                };

                await songRef.set({
                    // Legacy field for backwards compatibility
                    name: songName,

                    // ✅ NEW STRUCTURED METADATA FIELDS
                    title: title,
                    author: author || '',
                    key: originalKey,
                    bpm: bpm,
                    timeSignature: timeSignature || '',
                    duration: duration || '',

                    // Content storage
                    content: content, // Visual editor content (current state, possibly transposed)
                    baselineChart: baselineChart, // ORIGINAL untransposed chart for transpose reference
                    printPreview: printPreviewText, // Formatted preview text

                    // Transpose state
                    transposeSteps: actualTransposeSteps, // Current transpose state
                    originalKey: originalKey, // Key from selector (required)

                    // Display/Layout settings
                    fontSize: layoutSettings.fontSize,
                    lineHeight: layoutSettings.lineHeight,
                    charSpacing: layoutSettings.charSpacing,
                    columnCount: layoutSettings.columnCount,
                    pageCount: layoutSettings.pageCount,

                    // Timestamps
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                });

                // If a book is selected, automatically add the song to that book
                const bookFilter = document.getElementById('bookFilter');
                const selectedBookId = bookFilter ? bookFilter.value : 'all';
                if (selectedBookId && selectedBookId !== 'all') {
                    await addSongsToBook(selectedBookId, [songRef.key]);
                    const selectedBook = userBooks.find(b => b.id === selectedBookId);
                    const bookName = selectedBook ? selectedBook.name : 'book';
                    showMessage('Success', `"${songName}" saved to "${bookName}"!`, 'success');
                } else {
                    showMessage('Success', `"${songName}" saved to your library!`, 'success');
                }
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
                    if (window.showSubscriptionModal) {
                        window.showSubscriptionModal();
                    }
                }, 500);
                return;
            }

            // Use window version as fallback (in case closure lost sync)
            const songToUpdate = currentLoadedSong || window.currentLoadedSong;

            if (!songToUpdate || !songToUpdate.id) {
                console.log('currentLoadedSong:', currentLoadedSong);
                console.log('window.currentLoadedSong:', window.currentLoadedSong);
                showMessage('Error', 'Please load a song first before updating. Use the Load button to select a song.', 'error');
                return;
            }

            // Sync the local variable
            currentLoadedSong = songToUpdate;

            console.log('Updating song:', songToUpdate.id, songToUpdate.name);

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

            // Get transpose state
            const actualTransposeSteps = window.getCurrentTransposeSteps ? window.getCurrentTransposeSteps() : 0;

            // FIX: When no transpose is applied (steps = 0), use the CURRENT edited content as baseline
            // This ensures edits are saved properly. Only use old baseline when transpose is active.
            let baselineChart;
            if (actualTransposeSteps === 0) {
                // No transpose - the editor content IS the new baseline
                baselineChart = content;
                console.log('Update: Using edited content as baseline (no transpose)');
            } else {
                // Transpose active - keep the original untransposed baseline
                baselineChart = window.getBaselineChart ? window.getBaselineChart() : content;
                console.log('Update: Keeping original baseline (transpose active:', actualTransposeSteps, ')');
            }

            // ============= EXTRACT METADATA FROM CONTENT =============
            // Extract title from current song name (before " | Key:" if present)
            const songName = songToUpdate.name || '';
            const titleMatch = songName.match(/^([^|]+?)(?:\s*\|\s*Key:|$)/);
            const title = titleMatch ? titleMatch[1].trim() : songName.trim();

            // Extract author from content or baselineChart
            // Try {author: X} first, then {subtitle: X} as fallback
            let author = '';
            const combinedContent = content + '\n' + baselineChart;
            const authorMatch = combinedContent.match(/\{author:\s*([^\}]+)\}/i) ||
                               combinedContent.match(/\{subtitle:\s*([^\}]+)\}/i);
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

            // Extract duration from content {duration: M:SS}
            let duration = '';
            const durationMatch = (content + '\n' + baselineChart).match(/\{duration:\s*(\d+:\d{2})\}/i);
            if (durationMatch) {
                duration = durationMatch[1].trim();
            }
            // If not found in content, get from duration input field
            if (!duration) {
                const durationInput = document.getElementById('songDuration');
                if (durationInput && durationInput.value) {
                    duration = durationInput.value;
                }
            }

            try {
                // Update in Firebase Realtime Database
                const database = firebase.database();
                const songRef = database.ref('users/' + user.uid + '/songs/' + songToUpdate.id);

                // Get all current layout settings
                const fontSizeSlider = document.getElementById('fontSizeSlider');
                const lineHeightSlider = document.getElementById('lineHeightSlider');
                const charSpacingSlider = document.getElementById('charSpacingSlider');
                const columnCountSelect = document.getElementById('columnCount');
                const pageCountSelect = document.getElementById('pageCount');

                const layoutSettings = {
                    fontSize: fontSizeSlider ? parseFloat(fontSizeSlider.value) : 8,
                    lineHeight: lineHeightSlider ? parseFloat(lineHeightSlider.value) : 1.5,
                    charSpacing: charSpacingSlider ? parseFloat(charSpacingSlider.value) : 0,
                    columnCount: columnCountSelect ? columnCountSelect.value : '2',
                    pageCount: pageCountSelect ? pageCountSelect.value : '1'
                };

                await songRef.update({
                    // ✅ UPDATE STRUCTURED METADATA FIELDS
                    title: title,
                    author: author || '',
                    key: originalKey,
                    bpm: bpmValue,
                    timeSignature: timeSignature || '',
                    duration: duration || '',

                    // Content storage
                    content: content,
                    baselineChart: baselineChart,
                    printPreview: printPreviewText,

                    // Transpose state
                    transposeSteps: actualTransposeSteps,
                    originalKey: originalKey,

                    // Display/Layout settings
                    fontSize: layoutSettings.fontSize,
                    lineHeight: layoutSettings.lineHeight,
                    charSpacing: layoutSettings.charSpacing,
                    columnCount: layoutSettings.columnCount,
                    pageCount: layoutSettings.pageCount,

                    // Timestamp
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                });

                // Sync to active session playlist if song is there
                if (window.sessionManager && window.sessionManager.activeSession) {
                    await window.sessionManager.updateSongInPlaylist(songToUpdate.id, {
                        title: title,
                        author: author,
                        content: content,
                        key: originalKey,
                        originalKey: originalKey,
                        bpm: bpmValue,
                        timeSignature: timeSignature,
                        duration: duration,
                        baselineChart: baselineChart
                    });
                }

                // Refresh Live Mode if currently viewing this song
                if (window.liveMode && window.liveMode.currentSongId === songToUpdate.id) {
                    window.liveMode.currentSongContent = content;
                    window.liveMode.currentKey = originalKey;
                    window.liveMode.updateDisplay();
                    console.log('🔄 Refreshed Live Mode with updated song content');
                }

                showMessage('Success', `"${songToUpdate.name}" updated successfully!`, 'success');
            } catch (error) {
                console.error('Error updating song:', error);
                showMessage('Error', 'Failed to update song: ' + error.message, 'error');
            }
        });

        // Function to create a single song item DOM element
        function createSongItem(song, user, database) {
            const songItem = document.createElement('div');
            const isSelected = selectedSongIds.has(song.id);
            songItem.style.cssText = `padding: 16px; margin-bottom: 12px; background: ${isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-soft)'}; border: 1px solid ${isSelected ? '#3b82f6' : 'var(--border)'}; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; display: flex; justify-content: space-between; align-items: center;`;
            songItem.dataset.songId = song.id;

            // Add checkbox for bulk selection mode
            if (bulkSelectionMode) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = isSelected;
                checkbox.style.cssText = 'width: 20px; height: 20px; margin-right: 12px; cursor: pointer; accent-color: #3b82f6;';
                checkbox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (checkbox.checked) {
                        selectedSongIds.add(song.id);
                    } else {
                        selectedSongIds.delete(song.id);
                    }
                    // Update the item's visual style
                    songItem.style.background = checkbox.checked ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-soft)';
                    songItem.style.borderColor = checkbox.checked ? '#3b82f6' : 'var(--border)';
                    updateBulkActionBar();
                });
                songItem.appendChild(checkbox);
            }

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

            addToSessionBtn.addEventListener('click', async (e) => {
                e.stopPropagation();

                // Check if user has an active session or is PRO
                if (!window.sessionManager) {
                    showMessage('Error', 'Session manager not available', 'error');
                    return;
                }

                // ✅ STORE SONG DATA WITH NEW STRUCTURED FIELDS
                const songData = {
                    // Legacy field
                    name: song.name,

                    // NEW STRUCTURED METADATA
                    title: song.title || song.name || 'Untitled',
                    author: song.author || '',
                    key: song.key || song.originalKey || 'Unknown',
                    bpm: song.bpm || null,
                    timeSignature: song.timeSignature || '',

                    // Content - prioritize baselineChart, fallback to content
                    content: song.baselineChart || song.content || song.songbookFormat,

                    // Transpose state
                    originalKey: song.originalKey || 'Unknown'
                };

                // If adding from Session Controls with an active session, add directly
                if (window.addingToSessionPlaylist && window.sessionManager.activeSession && window.sessionManager.isLeader) {
                    try {
                        await window.sessionManager.addSongToPlaylist(songData);
                        showMessage('Success', `Added "${song.name}" to playlist`, 'success');
                        loadSongModal.style.display = 'none';
                        window.addingToSessionPlaylist = false;

                        // Reopen session controls and refresh playlist
                        if (window.sessionUI) {
                            window.sessionUI.showSessionControls();
                        }
                    } catch (error) {
                        console.error('Error adding to playlist:', error);
                        showMessage('Error', 'Failed to add song to playlist', 'error');
                    }
                    return;
                }

                // Otherwise, store and open My Sessions modal
                window.pendingSongToAdd = songData;

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

            // Public toggle button (globe icon)
            const publicBtn = document.createElement('button');
            const isPublic = song.isPublic === true;
            publicBtn.textContent = '🌐';
            publicBtn.style.cssText = `background: ${isPublic ? 'rgba(34, 197, 94, 0.2)' : 'transparent'}; border: ${isPublic ? '1px solid #22c55e' : 'none'}; font-size: 1.2rem; cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s ease; margin-right: 4px;`;
            publicBtn.title = isPublic ? 'Make private (click to unpublish)' : 'Make public (share with everyone)';

            publicBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await togglePublicSong(song, user, !isPublic);
            });

            publicBtn.addEventListener('mouseenter', () => {
                publicBtn.style.background = isPublic ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)';
            });

            publicBtn.addEventListener('mouseleave', () => {
                publicBtn.style.background = isPublic ? 'rgba(34, 197, 94, 0.2)' : 'transparent';
            });

            // Share button
            const shareBtn = document.createElement('button');
            shareBtn.textContent = '🔗';
            shareBtn.style.cssText = 'background: transparent; border: none; font-size: 1.2rem; cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s ease; margin-right: 4px;';
            shareBtn.title = 'Share song link';

            shareBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await shareSong(song, user);
            });

            shareBtn.addEventListener('mouseenter', () => {
                shareBtn.style.background = 'rgba(59, 130, 246, 0.2)';
            });

            shareBtn.addEventListener('mouseleave', () => {
                shareBtn.style.background = 'transparent';
            });

            songItem.appendChild(songInfo);

            // Different buttons for public songs vs user's own songs
            if (song.isPublicSong) {
                // Public songs: show only "Open in Live Mode" button
                const openBtn = document.createElement('button');
                openBtn.textContent = '▶️ Open';
                openBtn.style.cssText = 'background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #22c55e; font-size: 0.9rem; cursor: pointer; padding: 8px 16px; border-radius: 6px; transition: background 0.2s ease; font-weight: 500;';
                openBtn.title = 'Open in Live Mode';

                openBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    // Enter public view mode
                    if (window.liveMode && window.liveMode.enterPublicViewMode) {
                        loadSongModal.style.display = 'none';
                        await window.liveMode.enterPublicViewMode(song, song.id);
                    } else {
                        console.error('Live Mode not available');
                    }
                });

                openBtn.addEventListener('mouseenter', () => {
                    openBtn.style.background = 'rgba(34, 197, 94, 0.3)';
                });

                openBtn.addEventListener('mouseleave', () => {
                    openBtn.style.background = 'rgba(34, 197, 94, 0.2)';
                });

                songItem.appendChild(openBtn);
            } else {
                // User's own songs: show all action buttons
                songItem.appendChild(addToSessionBtn);
                songItem.appendChild(publicBtn);
                songItem.appendChild(shareBtn);
                songItem.appendChild(deleteBtn);
            }

            // Load song on click (or toggle selection in bulk mode)
            songItem.addEventListener('click', () => {
                // In bulk selection mode, toggle selection instead of loading
                if (bulkSelectionMode) {
                    const checkbox = songItem.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        if (checkbox.checked) {
                            selectedSongIds.add(song.id);
                        } else {
                            selectedSongIds.delete(song.id);
                        }
                        songItem.style.background = checkbox.checked ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-soft)';
                        songItem.style.borderColor = checkbox.checked ? '#3b82f6' : 'var(--border)';
                        updateBulkActionBar();
                    }
                    return;
                }

                // Get the ORIGINAL baseline (untransposed) - prioritize baselineChart, fallback to content
                const baseline = song.baselineChart || song.content || song.songbookFormat || '';

                console.log('=== LOADING SONG ===');
                console.log('Song name:', song.name);
                console.log('Has baselineChart:', !!song.baselineChart);
                console.log('Has content:', !!song.content);
                console.log('Has songbookFormat:', !!song.songbookFormat);
                console.log('Baseline length:', baseline.length);
                console.log('First 200 chars:', baseline.substring(0, 200));
                console.log('🎵 YouTube in baselineChart:', song.baselineChart?.includes('YouTube:') || false);
                console.log('🎵 YouTube in content:', song.content?.includes('YouTube:') || false);
                console.log('🎵 content first 500 chars:', song.content?.substring(0, 500) || 'N/A');

                // Store currently loaded song for update functionality (BEFORE dispatching event)
                currentLoadedSong = {
                    id: song.id,
                    name: song.name
                };

                // Expose for debugging and external access
                window.currentLoadedSong = currentLoadedSong;
                console.log('✅ Song loaded for update - ID:', song.id);

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
                            rawContent: song.content || '', // Include raw content for music links
                            originalKey: song.originalKey || '',
                            bpm: song.bpm || null,
                            timeSignature: song.timeSignature || '4/4',
                            songName: song.name,
                            // Layout settings
                            fontSize: song.fontSize || null,
                            lineHeight: song.lineHeight || null,
                            charSpacing: song.charSpacing !== undefined ? song.charSpacing : null,
                            columnCount: song.columnCount || null,
                            pageCount: song.pageCount || null
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
                                    baselineChart: reconstructedBaseline,
                                    // Layout settings
                                    fontSize: song.fontSize || null,
                                    lineHeight: song.lineHeight || null,
                                    charSpacing: song.charSpacing !== undefined ? song.charSpacing : null,
                                    columnCount: song.columnCount || null,
                                    pageCount: song.pageCount || null
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
                    if (window.showSubscriptionModal) {
                        window.showSubscriptionModal();
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

                // Load and populate books
                await loadUserBooks();
                populateBookFilter();

                loadSongModal.style.display = 'flex';
            } catch (error) {
                console.error('Error loading songs:', error);
                showMessage('Error', 'Failed to load songs: ' + error.message, 'error');
            }
        });

        // Close Load Song Modal
        loadSongClose.addEventListener('click', () => {
            resetBulkSelection();
            loadSongModal.style.display = 'none';
            window.addingToSessionPlaylist = false;
        });

        loadSongCancel.addEventListener('click', () => {
            resetBulkSelection();
            loadSongModal.style.display = 'none';
            window.addingToSessionPlaylist = false;
        });

        // ============= BULK SELECTION BUTTON HANDLERS =============
        const bulkSelectToggle = document.getElementById('bulkSelectToggle');
        const bulkSelectAll = document.getElementById('bulkSelectAll');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const bulkAddToSession = document.getElementById('bulkAddToSession');

        if (bulkSelectToggle) {
            bulkSelectToggle.addEventListener('click', toggleBulkSelectionMode);
        }

        if (bulkSelectAll) {
            bulkSelectAll.addEventListener('click', () => {
                const displaySongs = window.filteredSongs || window.allLoadedSongs || [];
                const allSelected = displaySongs.length > 0 &&
                                    displaySongs.every(s => selectedSongIds.has(s.id));

                if (allSelected) {
                    // Deselect all
                    displaySongs.forEach(s => selectedSongIds.delete(s.id));
                } else {
                    // Select all visible songs
                    displaySongs.forEach(s => selectedSongIds.add(s.id));
                }

                // Re-render to update checkboxes
                if (window.triggerSongListRerender) {
                    window.triggerSongListRerender();
                }
                updateBulkActionBar();
            });
        }

        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', async () => {
                if (selectedSongIds.size === 0) {
                    showMessage('Info', 'No songs selected', 'info');
                    return;
                }

                const count = selectedSongIds.size;
                if (!confirm(`Are you sure you want to delete ${count} song${count > 1 ? 's' : ''}? This cannot be undone.`)) {
                    return;
                }

                const user = firebase.auth().currentUser;
                if (!user) {
                    showMessage('Error', 'Please sign in to delete songs', 'error');
                    return;
                }

                const database = firebase.database();
                let successCount = 0;
                let errorCount = 0;

                for (const songId of selectedSongIds) {
                    try {
                        await database.ref('users/' + user.uid + '/songs/' + songId).remove();
                        successCount++;
                        // Remove from global array
                        window.allLoadedSongs = window.allLoadedSongs.filter(s => s.id !== songId);
                    } catch (error) {
                        console.error('Error deleting song:', songId, error);
                        errorCount++;
                    }
                }

                // Clear selection
                selectedSongIds.clear();
                updateBulkActionBar();

                // Re-render list
                if (window.triggerSongListRerender) {
                    window.triggerSongListRerender();
                }

                if (errorCount > 0) {
                    showMessage('Warning', `Deleted ${successCount}, failed ${errorCount}`, 'error');
                } else {
                    showMessage('Success', `${successCount} song${successCount > 1 ? 's' : ''} deleted`, 'success');
                }
            });
        }

        if (bulkAddToSession) {
            bulkAddToSession.addEventListener('click', () => {
                if (selectedSongIds.size === 0) {
                    showMessage('Info', 'No songs selected', 'info');
                    return;
                }

                // Get selected songs data
                const selectedSongs = window.allLoadedSongs.filter(s => selectedSongIds.has(s.id));

                // Store songs for batch add
                window.pendingSongsToAdd = selectedSongs.map(song => ({
                    name: song.name,
                    title: song.title || song.name || 'Untitled',
                    author: song.author || '',
                    key: song.key || song.originalKey || 'Unknown',
                    bpm: song.bpm || null,
                    timeSignature: song.timeSignature || '',
                    content: song.baselineChart || song.content || song.songbookFormat,
                    originalKey: song.originalKey || 'Unknown'
                }));

                // Close load song modal
                resetBulkSelection();
                loadSongModal.style.display = 'none';

                // Open My Sessions modal
                const mySessionsModal = document.getElementById('mySessionsModal');
                if (mySessionsModal) {
                    mySessionsModal.style.display = 'flex';
                    if (window.loadMySessions) {
                        window.loadMySessions();
                    }
                    showMessage('Info', `Select a session to add ${selectedSongs.length} song${selectedSongs.length > 1 ? 's' : ''}`, 'info');
                } else {
                    showMessage('Error', 'Sessions modal not found', 'error');
                }
            });
        }

        // ============= BOOKS MANAGEMENT EVENT HANDLERS =============
        const bulkAddToBook = document.getElementById('bulkAddToBook');
        const manageBooksBtn = document.getElementById('manageBooksBtn');
        const booksModal = document.getElementById('booksModal');
        const booksClose = document.getElementById('booksClose');
        const booksModalCancel = document.getElementById('booksModalCancel');
        const createBookBtn = document.getElementById('createBookBtn');
        const newBookNameInput = document.getElementById('newBookName');
        const addToBookModal = document.getElementById('addToBookModal');
        const addToBookClose = document.getElementById('addToBookClose');
        const addToBookCancel = document.getElementById('addToBookCancel');

        // Bulk Add to Book button
        if (bulkAddToBook) {
            bulkAddToBook.addEventListener('click', () => {
                if (selectedSongIds.size === 0) {
                    showMessage('Info', 'No songs selected', 'info');
                    return;
                }

                showAddToBookModal(Array.from(selectedSongIds));
            });
        }

        // Manage Books button - opens books modal
        if (manageBooksBtn) {
            manageBooksBtn.addEventListener('click', () => {
                if (booksModal) {
                    renderBooksList();
                    booksModal.style.display = 'flex';
                }
            });
        }

        // Close Books Modal
        if (booksClose) {
            booksClose.addEventListener('click', () => {
                if (booksModal) booksModal.style.display = 'none';
            });
        }

        if (booksModalCancel) {
            booksModalCancel.addEventListener('click', () => {
                if (booksModal) booksModal.style.display = 'none';
            });
        }

        // Create Book button
        if (createBookBtn && newBookNameInput) {
            createBookBtn.addEventListener('click', async () => {
                const bookName = newBookNameInput.value.trim();
                if (!bookName) {
                    showMessage('Error', 'Please enter a book name', 'error');
                    return;
                }

                const bookId = await createBook(bookName);
                if (bookId) {
                    showMessage('Success', `Book "${bookName}" created!`, 'success');
                    newBookNameInput.value = '';
                } else {
                    showMessage('Error', 'Failed to create book', 'error');
                }
            });

            // Allow Enter key to create book
            newBookNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    createBookBtn.click();
                }
            });
        }

        // Close Add to Book Modal
        if (addToBookClose) {
            addToBookClose.addEventListener('click', () => {
                if (addToBookModal) addToBookModal.style.display = 'none';
            });
        }

        if (addToBookCancel) {
            addToBookCancel.addEventListener('click', () => {
                if (addToBookModal) addToBookModal.style.display = 'none';
            });
        }

        // Close modals on outside click - Books Modal
        if (booksModal) {
            booksModal.addEventListener('click', (e) => {
                if (e.target === booksModal) {
                    booksModal.style.display = 'none';
                }
            });
        }

        // Close modals on outside click - Add to Book Modal
        if (addToBookModal) {
            addToBookModal.addEventListener('click', (e) => {
                if (e.target === addToBookModal) {
                    addToBookModal.style.display = 'none';
                }
            });
        }

        // Close modals on outside click
        saveSongModal.addEventListener('click', (e) => {
            if (e.target === saveSongModal) {
                saveSongModal.style.display = 'none';
            }
        });

        loadSongModal.addEventListener('click', (e) => {
            if (e.target === loadSongModal) {
                loadSongModal.style.display = 'none';
                window.addingToSessionPlaylist = false;
            }
        });

        // Allow Enter key to save
        songNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveSongConfirm.click();
            }
        });

        // ============= BULK IMPORT FUNCTIONALITY =============
        const bulkImportButton = document.getElementById('bulkImportButton');
        const bulkImportInput = document.getElementById('bulkImportInput');

        if (bulkImportButton && bulkImportInput) {
            bulkImportButton.addEventListener('click', () => {
                const user = firebase.auth().currentUser;
                if (!user) {
                    showMessage('Error', 'Please sign in to import songs', 'error');
                    return;
                }

                // Check subscription
                if (window.subscriptionManager && !window.subscriptionManager.canSaveSongs()) {
                    showMessage('Error', 'Importing songs requires Basic ($0.99/mo) or Pro ($1.99/mo) subscription', 'error');
                    return;
                }

                bulkImportInput.click();
            });

            bulkImportInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;

                const user = firebase.auth().currentUser;
                if (!user) {
                    showMessage('Error', 'Please sign in to import songs', 'error');
                    return;
                }

                const database = firebase.database();
                let successCount = 0;
                let errorCount = 0;
                const totalFiles = files.length;

                showMessage('Info', `Importing ${totalFiles} songs...`, 'info');

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    try {
                        let content = await file.text();

                        // Extract song title from content or filename
                        let songName = extractSongTitle(content, file.name);

                        // Check if content is v4 format
                        const isV4Format = /\{(?:title|key|tempo|subtitle|artist|time|capo):/i.test(content);

                        // Extract metadata from content before cleaning
                        let keyMatch, tempoMatch, timeMatch, authorMatch;

                        if (isV4Format && window.chordsAppParser) {
                            // Use v4 parser for metadata extraction
                            const metadata = window.chordsAppParser.extractMetadata(content);
                            keyMatch = metadata.key ? [null, metadata.key] : null;
                            tempoMatch = metadata.tempo ? [null, metadata.tempo] : null;
                            timeMatch = metadata.time ? [null, metadata.time] : null;
                            authorMatch = metadata.artist ? [null, metadata.artist] : null;
                            // For v4 format, keep the content as-is (don't clean directives)
                        } else {
                            // Legacy format extraction
                            keyMatch = content.match(/\{key:\s*([^}]+)\}/i);
                            tempoMatch = content.match(/\{tempo:\s*([^}]+)\}/i);
                            timeMatch = content.match(/\{time:\s*([^}]+)\}/i);
                            authorMatch = content.match(/\{author:\s*([^}]+)\}/i) ||
                                         content.match(/\{subtitle:\s*([^}]+)\}/i);
                            // Clean unnecessary tags from content (legacy format only)
                            content = cleanChordProContent(content);
                        }

                        const songData = {
                            name: songName,
                            content: content,
                            printPreviewText: content,
                            baselineChart: content,
                            currentTransposeSteps: 0,
                            key: keyMatch ? keyMatch[1].trim() : '',
                            bpm: tempoMatch ? tempoMatch[1].trim() : '120',
                            time: timeMatch ? timeMatch[1].trim() : '4/4',
                            author: authorMatch ? authorMatch[1].trim() : '',
                            createdAt: firebase.database.ServerValue.TIMESTAMP,
                            updatedAt: firebase.database.ServerValue.TIMESTAMP
                        };

                        // Save to Firebase
                        const songsRef = database.ref(`users/${user.uid}/songs`);
                        await songsRef.push(songData);
                        successCount++;

                        // Update progress
                        if ((i + 1) % 5 === 0 || i === files.length - 1) {
                            showMessage('Info', `Importing... ${i + 1}/${totalFiles}`, 'info');
                        }

                    } catch (error) {
                        console.error(`Error importing ${file.name}:`, error);
                        errorCount++;
                    }
                }

                // Reset input for future imports
                bulkImportInput.value = '';

                // Show final result
                if (errorCount === 0) {
                    showMessage('Success', `Successfully imported ${successCount} songs!`, 'success');
                } else {
                    showMessage('Warning', `Imported ${successCount} songs, ${errorCount} failed`, 'warning');
                }
            });
        }

        // ============= SHARE SONG FUNCTIONALITY =============
        async function shareSong(song, user) {
            try {
                // If song is already public, just copy the public link
                if (song.isPublic) {
                    const publicUrl = `${window.location.origin}${window.location.pathname}?public=${song.id}`;
                    await navigator.clipboard.writeText(publicUrl);
                    showMessage('Copied!', 'Public song link copied to clipboard.', 'success');
                    return;
                }

                const database = firebase.database();

                // Generate unique slug (8 chars)
                const slug = generateSlug();

                // Prepare public song data
                const publicSongData = {
                    name: song.name,
                    title: song.title || song.name,
                    content: song.content || song.baselineChart || '',
                    baselineChart: song.baselineChart || song.content || '',
                    key: song.key || song.originalKey || '',
                    bpm: song.bpm || '120',
                    time: song.timeSignature || '4/4',
                    author: song.author || '',
                    // Layout settings
                    fontSize: song.fontSize || 8.5,
                    lineHeight: song.lineHeight || 1.5,
                    charSpacing: song.charSpacing !== undefined ? song.charSpacing : 0,
                    columnCount: song.columnCount || '2',
                    pageCount: song.pageCount || '1',
                    ownerUid: user.uid,
                    sharedAt: firebase.database.ServerValue.TIMESTAMP
                };

                // Save to public-songs collection
                await database.ref(`public-songs/${slug}`).set(publicSongData);

                // Generate shareable link
                const shareUrl = `${window.location.origin}${window.location.pathname}?song=${slug}`;

                // Copy to clipboard
                await navigator.clipboard.writeText(shareUrl);

                showMessage('Success', 'Link copied to clipboard!', 'success');
                console.log('Shared song URL:', shareUrl);

            } catch (error) {
                console.error('Error sharing song:', error);
                showMessage('Error', 'Failed to share song: ' + error.message, 'error');
            }
        }

        // ============= PUBLIC SONGS FUNCTIONALITY =============

        // Toggle a song's public status
        async function togglePublicSong(song, user, makePublic) {
            try {
                const database = firebase.database();

                if (makePublic) {
                    // Copy song to public-songs using same songId
                    const publicSongData = {
                        title: song.title || song.name,
                        author: song.author || '',
                        content: song.content || song.baselineChart || '',
                        baselineChart: song.baselineChart || song.content || '',
                        key: song.key || song.originalKey || '',
                        bpm: song.bpm || '120',
                        timeSignature: song.timeSignature || '4/4',
                        fontSize: song.fontSize || 8.5,
                        lineHeight: song.lineHeight || 1.5,
                        columnCount: song.columnCount || '2',
                        ownerUid: user.uid,
                        publishedAt: firebase.database.ServerValue.TIMESTAMP
                    };

                    await database.ref(`public-songs/${song.id}`).set(publicSongData);

                    // Mark in user's song as public
                    await database.ref(`users/${user.uid}/songs/${song.id}/isPublic`).set(true);

                    // Generate and copy public link
                    const publicUrl = `${window.location.origin}${window.location.pathname}?public=${song.id}`;
                    await navigator.clipboard.writeText(publicUrl);

                    showMessage('Success', 'Song is now public! Link copied to clipboard.', 'success');
                    console.log('🌐 Published song:', song.name, 'URL:', publicUrl);
                } else {
                    // Unpublish - remove from public-songs
                    await database.ref(`public-songs/${song.id}`).remove();
                    await database.ref(`users/${user.uid}/songs/${song.id}/isPublic`).set(false);

                    showMessage('Success', 'Song is now private.', 'success');
                    console.log('🔒 Unpublished song:', song.name);
                }

                // Update song in memory
                song.isPublic = makePublic;

                // Re-render list to update button state
                if (window.triggerSongListRerender) {
                    window.triggerSongListRerender();
                }

            } catch (error) {
                console.error('Error toggling public status:', error);
                showMessage('Error', 'Failed to update public status: ' + error.message, 'error');
            }
        }

        // Load all public songs from public-songs collection
        async function loadPublicSongs() {
            try {
                const database = firebase.database();
                const snapshot = await database.ref('public-songs').once('value');
                const publicSongs = snapshot.val() || {};

                // Convert to array with IDs
                return Object.entries(publicSongs).map(([id, data]) => ({
                    id,
                    ...data,
                    name: data.title, // Use title as name for display
                    isPublicSong: true // Flag to identify public songs
                }));
            } catch (error) {
                console.error('Error loading public songs:', error);
                return [];
            }
        }

        // Expose for external use
        window.loadPublicSongs = loadPublicSongs;

        // Generate unique 8-character slug
        function generateSlug() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let slug = '';
            for (let i = 0; i < 8; i++) {
                slug += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return slug;
        }

        // Helper function to clean unnecessary ChordPro tags
        function cleanChordProContent(content) {
            // Tags to remove completely (formatting/display tags)
            const tagsToRemove = [
                /\{subtitle:[^}]*\}/gi,
                /\{st:[^}]*\}/gi,
                /\{textfont:[^}]*\}/gi,
                /\{textsize:[^}]*\}/gi,
                /\{chordfont:[^}]*\}/gi,
                /\{chordsize:[^}]*\}/gi,
                /\{columns:[^}]*\}/gi,
                /\{col:[^}]*\}/gi,
                /\{column_break\}/gi,
                /\{cb\}/gi,
                /\{new_page\}/gi,
                /\{np\}/gi,
                /\{pagetype:[^}]*\}/gi,
                /\{define:[^}]*\}/gi,
                /\{grid[^}]*\}/gi,
                /\{no_grid\}/gi,
                /\{ng\}/gi,
                /\{titles:[^}]*\}/gi,
                /\{new_song\}/gi,
                /\{ns\}/gi,
                /\{start_of_tab\}/gi,
                /\{sot\}/gi,
                /\{end_of_tab\}/gi,
                /\{eot\}/gi,
                /\{start_of_grid\}/gi,
                /\{sog\}/gi,
                /\{end_of_grid\}/gi,
                /\{eog\}/gi,
                /\{image:[^}]*\}/gi,
                /\{musicpath:[^}]*\}/gi,
            ];

            let cleaned = content;
            for (const pattern of tagsToRemove) {
                cleaned = cleaned.replace(pattern, '');
            }

            // Remove empty lines left behind (multiple consecutive blank lines → single blank line)
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

            // Trim leading/trailing whitespace
            cleaned = cleaned.trim();

            return cleaned;
        }

        // Helper function to extract song title from content or filename
        function extractSongTitle(content, filename) {
            // Try to get title from {title:} tag
            const titleMatch = content.match(/\{title:\s*([^}]+)\}/i);
            if (titleMatch) {
                return titleMatch[1].trim();
            }

            // Try first non-empty line that's not a metadata tag
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('#')) {
                    // Remove leading numbers like "171. "
                    const cleaned = trimmed.replace(/^\d+\.\s*/, '');
                    if (cleaned) return cleaned.substring(0, 100); // Limit length
                }
            }

            // Fall back to filename without extension
            return filename.replace(/\.(txt|cho|chordpro|chopro)$/i, '');
        }
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
                // Try {author: X} first, then {subtitle: X} as fallback
                let author = '';
                const content = (song.content || '') + '\n' + (song.baselineChart || '');
                const authorMatch = content.match(/\{author:\s*([^\}]+)\}/i) ||
                                   content.match(/\{subtitle:\s*([^\}]+)\}/i);
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

    // ============= CLEAN LIBRARY SONGS FUNCTION =============
    /**
     * Clean all songs in library by removing unnecessary ChordPro tags
     * Call this function from browser console: window.cleanLibrarySongs()
     */
    async function cleanLibrarySongs() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('❌ Please log in first');
            return;
        }

        console.log('🧹 Starting library cleanup...');

        // Tags to remove (same as in bulk import)
        const tagsToRemove = [
            /\{subtitle:[^}]*\}/gi,
            /\{st:[^}]*\}/gi,
            /\{textfont:[^}]*\}/gi,
            /\{textsize:[^}]*\}/gi,
            /\{chordfont:[^}]*\}/gi,
            /\{chordsize:[^}]*\}/gi,
            /\{columns:[^}]*\}/gi,
            /\{col:[^}]*\}/gi,
            /\{column_break\}/gi,
            /\{cb\}/gi,
            /\{new_page\}/gi,
            /\{np\}/gi,
            /\{pagetype:[^}]*\}/gi,
            /\{define:[^}]*\}/gi,
            /\{grid[^}]*\}/gi,
            /\{no_grid\}/gi,
            /\{ng\}/gi,
            /\{titles:[^}]*\}/gi,
            /\{new_song\}/gi,
            /\{ns\}/gi,
            /\{start_of_tab\}/gi,
            /\{sot\}/gi,
            /\{end_of_tab\}/gi,
            /\{eot\}/gi,
            /\{start_of_grid\}/gi,
            /\{sog\}/gi,
            /\{end_of_grid\}/gi,
            /\{eog\}/gi,
            /\{image:[^}]*\}/gi,
            /\{musicpath:[^}]*\}/gi,
        ];

        function cleanContent(content) {
            if (!content) return content;
            let cleaned = content;
            for (const pattern of tagsToRemove) {
                cleaned = cleaned.replace(pattern, '');
            }
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
            return cleaned.trim();
        }

        try {
            const database = firebase.database();
            const songsRef = database.ref(`users/${user.uid}/songs`);
            const snapshot = await songsRef.once('value');
            const songs = snapshot.val();

            if (!songs) {
                console.log('✅ No songs to clean');
                return;
            }

            let cleanedCount = 0;
            let skippedCount = 0;
            const total = Object.keys(songs).length;

            for (const [songId, song] of Object.entries(songs)) {
                const originalContent = song.content || '';
                const cleanedContent = cleanContent(originalContent);

                // Check if content actually changed
                if (cleanedContent === originalContent) {
                    skippedCount++;
                    continue;
                }

                // Update song with cleaned content
                const updates = {
                    content: cleanedContent,
                    printPreviewText: cleanContent(song.printPreviewText || ''),
                    baselineChart: cleanContent(song.baselineChart || ''),
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                };

                await songsRef.child(songId).update(updates);
                cleanedCount++;
                console.log(`✅ Cleaned: "${song.name}"`);
            }

            console.log('\n🎉 Library cleanup complete!');
            console.log(`   ✅ Cleaned: ${cleanedCount} songs`);
            console.log(`   ⏭️  Skipped (already clean): ${skippedCount} songs`);
            console.log(`   📊 Total: ${total} songs`);

        } catch (error) {
            console.error('❌ Cleanup error:', error);
        }
    }

    window.cleanLibrarySongs = cleanLibrarySongs;

    // Initialize when DOM is ready and Firebase is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initSongLibrary, 500);
        });
    } else {
        setTimeout(initSongLibrary, 500);
    }
})();
