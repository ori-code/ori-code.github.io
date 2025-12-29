// Song Search and Filter Functionality
// This module adds search and filter capabilities to the Load Song modal

(function() {
    'use strict';

    // Store for all songs and current filtered list
    window.allLoadedSongs = [];
    window.filteredSongs = [];

    // Function to extract BPM from content
    window.extractBPM = function(content) {
        if (!content) return null;
        const bpmMatch = content.match(/BPM[:\s]*(\d+)/i);
        return bpmMatch ? parseInt(bpmMatch[1]) : null;
    };

    // Function to normalize key for comparison
    window.normalizeKey = function(key) {
        if (!key) return '';
        // Extract just the root note (e.g., "E Major" -> "E", "A Minor" -> "Am")
        const match = key.match(/([A-G][#b]?)\s*(Major|Minor|maj|min)?/i);
        if (!match) return key.toUpperCase();

        const root = match[1];
        const quality = match[2];

        if (quality && quality.toLowerCase().includes('min')) {
            return root + 'm';
        }
        return root;
    };

    // Function to filter and sort songs
    window.filterAndSortSongs = function() {
        const searchInput = document.getElementById('songSearchInput');
        const keyFilter = document.getElementById('songKeyFilter');
        const sortBySelect = document.getElementById('songSortBy');
        const bookFilter = document.getElementById('bookFilter');

        if (!searchInput || !keyFilter || !sortBySelect) return window.allLoadedSongs;

        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedKey = keyFilter.value;
        const sortBy = sortBySelect.value;
        const selectedBook = bookFilter ? bookFilter.value : 'all';

        let filtered = [...window.allLoadedSongs];

        // Apply book filter first
        if (selectedBook && selectedBook !== 'all') {
            const userBooks = window.getUserBooks ? window.getUserBooks() : [];
            const book = userBooks.find(b => b.id === selectedBook);
            if (book && book.songIds && book.songIds.length > 0) {
                filtered = filtered.filter(song => book.songIds.includes(song.id));
            } else {
                // Book has no songs
                filtered = [];
            }
        }

        // Apply search filter (searches in name AND content/lyrics)
        if (searchTerm) {
            filtered = filtered.filter(song => {
                const nameMatch = song.name.toLowerCase().includes(searchTerm);
                const contentMatch = song.content && song.content.toLowerCase().includes(searchTerm);
                return nameMatch || contentMatch;
            });
        }

        // Apply key filter
        if (selectedKey) {
            filtered = filtered.filter(song => {
                const songKey = window.normalizeKey(song.originalKey);
                return songKey === selectedKey;
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'bpm':
                    const bpmA = window.extractBPM(a.content) || 0;
                    const bpmB = window.extractBPM(b.content) || 0;
                    return bpmB - bpmA; // Higher BPM first
                case 'key':
                    const keyA = window.normalizeKey(a.originalKey);
                    const keyB = window.normalizeKey(b.originalKey);
                    return keyA.localeCompare(keyB);
                case 'date':
                default:
                    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
            }
        });

        window.filteredSongs = filtered;
        return filtered;
    };

    // Reset filters when modal opens (but keep book selection)
    window.resetSongFilters = function() {
        const searchInput = document.getElementById('songSearchInput');
        const keyFilter = document.getElementById('songKeyFilter');
        const sortBySelect = document.getElementById('songSortBy');
        // NOTE: Don't reset bookFilter - user's book selection should persist

        if (searchInput) searchInput.value = '';
        if (keyFilter) keyFilter.value = '';
        if (sortBySelect) sortBySelect.value = 'date';
    };

    // Initialize event listeners
    function initSongSearchFilter() {
        const searchInput = document.getElementById('songSearchInput');
        const keyFilter = document.getElementById('songKeyFilter');
        const sortBySelect = document.getElementById('songSortBy');
        const bookFilter = document.getElementById('bookFilter');

        if (!searchInput || !keyFilter || !sortBySelect) {
            console.warn('Search/filter elements not found, retrying...');
            return;
        }

        console.log('✅ Search/filter initialized');

        // Add event listeners
        searchInput.addEventListener('input', () => {
            if (window.triggerSongListRerender) {
                window.triggerSongListRerender();
            }
        });

        keyFilter.addEventListener('change', () => {
            if (window.triggerSongListRerender) {
                window.triggerSongListRerender();
            }
        });

        sortBySelect.addEventListener('change', () => {
            if (window.triggerSongListRerender) {
                window.triggerSongListRerender();
            }
        });

        // Book filter change listener
        if (bookFilter) {
            bookFilter.addEventListener('change', () => {
                // Store the selection for persistence
                window.selectedBookId = bookFilter.value;
                if (window.triggerSongListRerender) {
                    window.triggerSongListRerender();
                }
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initSongSearchFilter, 700);
        });
    } else {
        setTimeout(initSongSearchFilter, 700);
    }
})();
