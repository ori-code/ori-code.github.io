import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import chordsAppParser from '../../utils/chordProParser';

const SongViewer = ({ song, onClose }) => {
    const { t } = useTranslation();
    const [transposeSteps, setTransposeSteps] = useState(0);
    const [content, setContent] = useState('');
    const [metadata, setMetadata] = useState({});

    useEffect(() => {
        if (song) {
            const initialContent = song.content || '';
            setContent(initialContent);
            const meta = chordsAppParser.extractMetadata(initialContent);
            setMetadata(meta);
            if (song.transposeSteps) {
                setTransposeSteps(song.transposeSteps);
            }
        }
    }, [song]);

    const handleTranspose = (steps) => {
        const newSteps = transposeSteps + steps;
        setTransposeSteps(newSteps);
    };

    const transposedContent = React.useMemo(() => {
        if (!song || !song.content) return '';
        const sourceContent = song.baselineChart || song.content;
        return chordsAppParser.transposeContent(sourceContent, transposeSteps);
    }, [song, transposeSteps]);

    if (!song) return null;

    return (
        <div className="song-viewer" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--bg-primary)',
            zIndex: 100,
            overflowY: 'auto',
            padding: '20px'
        }}>
            <div className="container">
                <div className="viewer-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '40px',
                    borderBottom: '2px solid var(--border-main)',
                    paddingBottom: '20px',
                    paddingTop: '20px'
                }}>
                    <button className="ghost-button" onClick={onClose}>{t('viewer.back')}</button>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-main)' }}>
                            <button className="ghost-button" onClick={() => handleTranspose(-1)} style={{ padding: '8px 12px' }}>-</button>
                            <span style={{ padding: '0 12px', fontWeight: 700 }}>
                                {transposeSteps > 0 ? '+' : ''}{transposeSteps}
                            </span>
                            <button className="ghost-button" onClick={() => handleTranspose(1)} style={{ padding: '8px 12px' }}>+</button>
                        </div>
                        <button>{t('viewer.print')}</button>
                    </div>
                </div>

                <div className="viewer-content">
                    <h1 style={{ marginBottom: '8px', fontSize: '2.5rem', lineHeight: 1.1 }}>{song.title}</h1>
                    <div style={{ marginBottom: '40px', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {song.artist && <span>{song.artist} • </span>}
                        {t('viewer.key')} <span style={{ fontWeight: 700 }}>{chordsAppParser.transposeChord(metadata.key, transposeSteps)}</span>
                    </div>

                    <pre style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '16px',
                        lineHeight: '1.8',
                        color: 'var(--text-primary)',
                        columnCount: song.columnCount || 1, // Basic support for columns
                        columnGap: '40px'
                    }}>
                        {transposedContent}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default SongViewer;
