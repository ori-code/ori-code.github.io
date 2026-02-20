// offline-store.js — IndexedDB wrapper for offline song/book caching
(function () {
    'use strict';

    const DB_NAME = 'achordim-offline';
    const DB_VERSION = 1;
    let db = null;

    function open() {
        if (db) return Promise.resolve(db);
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                // Songs store
                if (!database.objectStoreNames.contains('songs')) {
                    const songs = database.createObjectStore('songs', { keyPath: 'id' });
                    songs.createIndex('userId', 'userId', { unique: false });
                    songs.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
                // Books store
                if (!database.objectStoreNames.contains('books')) {
                    const books = database.createObjectStore('books', { keyPath: 'id' });
                    books.createIndex('userId', 'userId', { unique: false });
                }
                // Meta store (sync timestamps, counts)
                if (!database.objectStoreNames.contains('meta')) {
                    database.createObjectStore('meta', { keyPath: 'key' });
                }
            };
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
            request.onerror = (event) => {
                console.error('IndexedDB open error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Helper: run a transaction and return a promise
    function tx(storeName, mode, fn) {
        return open().then(database => {
            return new Promise((resolve, reject) => {
                const transaction = database.transaction(storeName, mode);
                const store = transaction.objectStore(storeName);
                const result = fn(store);
                transaction.oncomplete = () => resolve(result._value);
                transaction.onerror = (e) => reject(e.target.error);
                // For single get/getAll requests, capture the result
                if (result instanceof IDBRequest) {
                    result.onsuccess = () => { result._value = result.result; };
                }
            });
        });
    }

    // --- Songs ---

    async function getAllSongs(userId) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('songs', 'readonly');
            const store = transaction.objectStore('songs');
            const index = store.index('userId');
            const request = index.getAll(userId);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function putSong(userId, songId, songData) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('songs', 'readwrite');
            const store = transaction.objectStore('songs');
            store.put({ ...songData, id: songId, userId });
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    async function putSongs(userId, songsMap) {
        if (!songsMap || typeof songsMap !== 'object') return;
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('songs', 'readwrite');
            const store = transaction.objectStore('songs');
            for (const [songId, songData] of Object.entries(songsMap)) {
                store.put({ ...songData, id: songId, userId });
            }
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    async function deleteSong(userId, songId) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('songs', 'readwrite');
            const store = transaction.objectStore('songs');
            store.delete(songId);
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    async function deleteAllSongs(userId) {
        const songs = await getAllSongs(userId);
        if (songs.length === 0) return;
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('songs', 'readwrite');
            const store = transaction.objectStore('songs');
            for (const song of songs) {
                store.delete(song.id);
            }
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    // --- Meta (sync timestamps) ---

    async function getLastSyncTime(userId) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('meta', 'readonly');
            const store = transaction.objectStore('meta');
            const request = store.get('lastSync_' + userId);
            request.onsuccess = () => resolve(request.result ? request.result.value : 0);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function setLastSyncTime(userId, ts) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('meta', 'readwrite');
            const store = transaction.objectStore('meta');
            store.put({ key: 'lastSync_' + userId, value: ts });
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    async function getSyncCount(userId) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('meta', 'readonly');
            const store = transaction.objectStore('meta');
            const request = store.get('syncCount_' + userId);
            request.onsuccess = () => resolve(request.result ? request.result.value : 0);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function incrementSyncCount(userId) {
        const count = await getSyncCount(userId);
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('meta', 'readwrite');
            const store = transaction.objectStore('meta');
            store.put({ key: 'syncCount_' + userId, value: count + 1 });
            transaction.oncomplete = () => resolve(count + 1);
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    // --- Books ---

    async function getAllBooks(userId) {
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('books', 'readonly');
            const store = transaction.objectStore('books');
            const index = store.index('userId');
            const request = index.getAll(userId);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function putBooks(userId, booksMap) {
        if (!booksMap || typeof booksMap !== 'object') return;
        const database = await open();
        // Clear existing books for this user first, then add new ones
        const existing = await getAllBooks(userId);
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('books', 'readwrite');
            const store = transaction.objectStore('books');
            // Remove old
            for (const book of existing) {
                store.delete(book.id);
            }
            // Add new
            for (const [bookId, bookData] of Object.entries(booksMap)) {
                store.put({ ...bookData, id: bookId, userId });
            }
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    async function deleteAllBooks(userId) {
        const books = await getAllBooks(userId);
        if (books.length === 0) return;
        const database = await open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction('books', 'readwrite');
            const store = transaction.objectStore('books');
            for (const book of books) {
                store.delete(book.id);
            }
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    // --- Public API ---
    window.offlineStore = {
        open,
        getAllSongs,
        putSong,
        putSongs,
        deleteSong,
        deleteAllSongs,
        getLastSyncTime,
        setLastSyncTime,
        getSyncCount,
        incrementSyncCount,
        getAllBooks,
        putBooks,
        deleteAllBooks,
    };

    // Open DB eagerly on load
    open().catch(err => console.warn('IndexedDB init deferred:', err));
})();
