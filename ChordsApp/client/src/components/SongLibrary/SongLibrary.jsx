import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, database, googleProvider } from '../../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, off } from 'firebase/database';
import SongViewer from '../SongViewer/SongViewer';

const SongLibrary = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSong, setSelectedSong] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const songsRef = ref(database, `users/${currentUser.uid}/songs`);
                onValue(songsRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        const songList = Object.entries(data).map(([id, song]) => ({
                            id,
                            ...song
                        }));
                        songList.sort((a, b) => b.updatedAt - a.updatedAt);
                        setSongs(songList);
                    } else {
                        setSongs([]);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching songs:", error);
                    setLoading(false);
                });
            } else {
                setSongs([]);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in:", error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setSelectedSong(null);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (selectedSong) {
        return (
            <SongViewer song={selectedSong} onClose={() => setSelectedSong(null)} />
        );
    }

    return (
        <section className="song-library-container" style={{ marginTop: '40px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '20px',
                borderBottom: '4px solid var(--border-main)',
                paddingBottom: '16px'
            }}>
                <h2 style={{ margin: 0, border: 'none', padding: 0 }}>{t('library.title')}</h2>
                <div>
                    {!user ? (
                        <button onClick={handleSignIn}>{t('nav.sync')}</button>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>{user.displayName.toUpperCase()}</span>
                            <button className="ghost-button" onClick={handleSignOut}>{t('nav.logout')}</button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div>LOADING...</div>
            ) : !user ? (
                <div style={{ border: '2px dashed var(--border-main)', padding: '40px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 600 }}>{t('library.signin_prompt')}</p>
                </div>
            ) : songs.length === 0 ? (
                <div style={{ border: '2px dashed var(--border-main)', padding: '40px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 600 }}>{t('library.empty')}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', borderTop: '2px solid var(--border-main)' }}>
                    {songs.map(song => (
                        <div key={song.id}
                            onClick={() => setSelectedSong(song)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '16px 0',
                                borderBottom: '1px solid var(--border-main)',
                                cursor: 'pointer'
                            }}
                            className="song-row">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '-0.02em', border: 'none' }}>
                                    {song.title || song.name || t('library.untitled')}
                                </h3>
                                <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                                    {song.artist ? song.artist.toUpperCase() : t('library.unknown_artist')}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <span style={{ fontWeight: 700, border: '1px solid var(--border-main)', padding: '2px 6px', fontSize: '0.8rem' }}>
                                    {song.key || 'C'}
                                </span>
                                {song.bpm && <span style={{ fontSize: '0.8rem' }}>{song.bpm} BPM</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default SongLibrary;
