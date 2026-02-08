import { useState, useEffect, useRef, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { useTranslation } from 'react-i18next';
import chordsAppParser from '../../utils/chordProParser';
import './SongEditor.css';


/**
 * Detect if text contains Hebrew characters
 */
const isRTL = (text) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
};

/**
 * Format chord with superscript for qualities
 * E.g., "Esus2" -> "E<sup>sus2</sup>", "C#m7" -> "C#<sup>m7</sup>", "Em/G" -> "E<sup>m</sup>/G"
 */
const formatChord = (chord) => {
    if (!chord) return { root: '', quality: '', bass: '' };

    // Handle slash chords (e.g., "Em/G", "A/C#")
    const slashIndex = chord.indexOf('/');
    let mainChord = chord;
    let bass = '';

    if (slashIndex > 0) {
        mainChord = chord.slice(0, slashIndex);
        bass = chord.slice(slashIndex + 1);
    }

    // Match: root (with optional #/b) + quality
    const match = mainChord.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return { root: chord, quality: '', bass: '' };

    const root = match[1];
    const quality = match[2];

    return { root, quality: quality || '', bass };
};

/**
 * Check if line should be skipped (metadata, arrangement, analysis, etc.)
 */
const shouldSkipLine = (trimmed) => {
    // Skip empty lines
    if (!trimmed) return true;

    // Skip metadata directives
    if (/^\{(title|subtitle|key|tempo|time|duration|layout|capo|artist):/.test(trimmed)) return true;

    // Skip arrangement pattern lines like (I)(V1)(C)(V1)(C)...
    if (/^\s*[\(`]?[IVCBOTPS]\d?[\)`]?\s*[\(`]?[IVCBOTPS]/i.test(trimmed)) return true;
    if (/\([IVCBOTPS]\d?\)\s*\([IVCBOTPS]/i.test(trimmed)) return true;

    // Skip lines that are just arrangement badges
    if (/^[\s\(\)IVCBOTPS\d,\s`]+$/i.test(trimmed) && trimmed.length < 50) return true;

    // Skip Analysis lines
    if (/^Analysis:/i.test(trimmed)) return true;
    if (/prevalence of/i.test(trimmed)) return true;

    // Skip lines with just backticks or dashes
    if (/^[`\-─]+$/.test(trimmed)) return true;
    if (/^---/.test(trimmed)) return true;

    // Skip markdown code block markers
    if (/^```/.test(trimmed)) return true;
    if (/```$/.test(trimmed)) return true;

    // Skip end section markers
    if (/^\{(?:eov|eoc|eob)\}$/i.test(trimmed)) return true;

    return false;
};

/**
 * Parse content into structured sections with metadata
 */
const parseContentToSections = (content) => {
    if (!content) return [];

    const lines = content.split('\n');
    const sections = [];
    let currentSection = { name: '', type: '', lines: [], notes: '' };
    let skipUntilNextSection = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Check for section start markers first
        const sectionMatch = trimmed.match(/^\{(?:c|sov|soc|sob):\s*([^}]+)\}/i);
        if (sectionMatch) {
            if (currentSection.name || currentSection.lines.length > 0) {
                sections.push(currentSection);
            }
            const sectionName = sectionMatch[1].replace(/:$/, '').trim();

            // Check if this is an "analysis" or "outro" with analysis - skip it
            if (/analysis/i.test(sectionName)) {
                skipUntilNextSection = true;
                currentSection = { name: '', type: '', lines: [], notes: '' };
                continue;
            }

            skipUntilNextSection = false;
            currentSection = {
                name: sectionName,
                type: getSectionType(sectionName),
                lines: [],
                notes: ''
            };
            continue;
        }

        // Check for clean section markers (e.g., "Verse 1:", "Chorus:")
        const cleanSectionMatch = trimmed.match(/^(Intro|Verse|Pre-?Chorus|Chorus|Bridge|Outro|Interlude|Tag|Coda|Turn|Break|Instrumental|Solo|Vamp)(\s*\d*)?:?\s*$/i);
        if (cleanSectionMatch) {
            if (currentSection.name || currentSection.lines.length > 0) {
                sections.push(currentSection);
            }
            const sectionName = trimmed.replace(/:$/, '').trim();
            skipUntilNextSection = false;
            currentSection = {
                name: sectionName.toUpperCase(),
                type: getSectionType(sectionName),
                lines: [],
                notes: ''
            };
            continue;
        }

        // Skip if we're in a section that should be skipped (like analysis)
        if (skipUntilNextSection) continue;

        // Skip lines that should be filtered
        if (shouldSkipLine(trimmed)) continue;

        // Skip badge lines
        if (chordsAppParser.BADGE_LINE_REGEX && chordsAppParser.BADGE_LINE_REGEX.test(trimmed)) {
            continue;
        }

        // Add line to current section
        if (trimmed) {
            currentSection.lines.push(line);
        }
    }

    // Add last section (but not if it's empty or analysis-related)
    if ((currentSection.name || currentSection.lines.length > 0) && !skipUntilNextSection) {
        // Filter out sections that only have analysis content
        const hasRealContent = currentSection.lines.some(l =>
            !shouldSkipLine(l.trim()) && !/^Analysis:/i.test(l.trim())
        );
        if (hasRealContent || currentSection.lines.length === 0) {
            sections.push(currentSection);
        }
    }

    // Filter out sections with no name that only contain arrangement/analysis lines
    return sections.filter(section => {
        if (!section.name) {
            // Check if unnamed section has real content
            return section.lines.some(l => {
                const t = l.trim();
                return t && !shouldSkipLine(t);
            });
        }
        return true;
    });
};

/**
 * Get section type for badge color
 */
const getSectionType = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('intro')) return 'intro';
    if (lower.includes('verse')) return 'verse';
    if (lower.includes('pre')) return 'prechorus';
    if (lower.includes('chorus')) return 'chorus';
    if (lower.includes('bridge')) return 'bridge';
    if (lower.includes('outro')) return 'outro';
    if (lower.includes('tag')) return 'tag';
    if (lower.includes('interlude')) return 'interlude';
    return 'other';
};

/**
 * Get badge abbreviation
 */
const getBadgeAbbrev = (name) => {
    const lower = name.toLowerCase();
    const numMatch = name.match(/\d+/);
    const num = numMatch ? numMatch[0] : '';

    if (lower.includes('intro')) return 'I';
    if (lower.includes('verse')) return 'V' + num;
    if (lower.includes('pre-chorus') || lower.includes('prechorus')) return 'PC' + num;
    if (lower.includes('chorus')) return 'C';
    if (lower.includes('bridge')) return 'B' + num;
    if (lower.includes('outro')) return 'O';
    if (lower.includes('tag')) return 'Ta';
    if (lower.includes('interlude')) return 'Int';
    if (lower.includes('post')) return 'Po';
    if (lower.includes('riff') || lower.includes('ref')) return 'Rf';
    return name.charAt(0).toUpperCase();
};

/**
 * Comprehensive chord regex pattern
 * Matches: A, Am, A7, Am7, Amaj7, Asus4, Aadd9, A/G, Am/G, A#m7/Gb, etc.
 */
const CHORD_PATTERN = /\[([A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add|7|9|11|13|6)*\d*(?:\/[A-G][#b]?)?)\]/g;

/**
 * Check if a line is purely a chord grid (no lyrics)
 */
const isChordOnlyLine = (line) => {
    const trimmed = line.trim();
    // Remove chord brackets and check if anything meaningful remains
    const withoutChords = trimmed.replace(CHORD_PATTERN, '').replace(/[\s|]+/g, '');
    // If nothing left after removing chords, or only punctuation/numbers, it's a chord grid
    return withoutChords.length === 0 || /^[\s\d|.\-]+$/.test(withoutChords);
};

/**
 * Parse a line - determine if it's a chord grid or chord+lyric line
 */
const parseLine = (line) => {
    const trimmed = line.trim();

    // Check if it's a chord grid (chords only, no lyrics)
    if (isChordOnlyLine(trimmed) || (chordsAppParser.isChordGrid && chordsAppParser.isChordGrid(trimmed))) {
        // Extract chords from the line
        const chords = [];
        const regex = new RegExp(CHORD_PATTERN.source, 'g');
        let match;
        while ((match = regex.exec(trimmed)) !== null) {
            chords.push(match[1]);
        }
        if (chords.length > 0) {
            return { type: 'grid', chords };
        }
    }

    // Parse chord+lyric line
    const parts = [];
    let lastIndex = 0;
    const regex = new RegExp(CHORD_PATTERN.source, 'g');
    let match;

    while ((match = regex.exec(line)) !== null) {
        // Text before this chord belongs to previous chord
        if (match.index > lastIndex) {
            const text = line.slice(lastIndex, match.index);
            if (parts.length > 0) {
                parts[parts.length - 1].lyric += text;
            } else if (text.trim()) {
                parts.push({ chord: '', lyric: text });
            }
        }
        parts.push({ chord: match[1], lyric: '' });
        lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < line.length) {
        const text = line.slice(lastIndex);
        if (parts.length > 0) {
            parts[parts.length - 1].lyric += text;
        } else if (text.trim()) {
            parts.push({ chord: '', lyric: text });
        }
    }

    return { type: 'lyric', parts };
};

/**
 * Chord component with superscript quality and slash bass
 */
const Chord = ({ chord, editable, onEdit }) => {
    const { root, quality, bass } = formatChord(chord);

    return (
        <span
            className="chord"
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={onEdit}
        >
            {root}
            {quality && <sup>{quality}</sup>}
            {bass && <span className="chord-bass">/{bass}</span>}
        </span>
    );
};

/**
 * ChordGrid component - displays chord progression
 * RTL display order is handled by CSS dir="rtl" - no JS reverse needed
 */
const ChordGrid = ({ chords }) => {
    return (
        <div className="chord-grid">
            {chords.map((chord, idx) => (
                <Chord key={idx} chord={chord} />
            ))}
        </div>
    );
};

/**
 * LyricLine component - renders a line with chords ABOVE lyrics
 * For RTL: stacked layout - chord row above, lyrics row below (like standard chord sheets)
 * For LTR: paired inline elements
 */
const LyricLine = ({ parts, isRtl }) => {
    if (isRtl) {
        // RTL: Stacked rows - chords on top, lyrics below (like first editor)
        const chords = parts.filter(p => p.chord);
        const lyrics = parts.map(p => p.lyric).join(' ');

        return (
            <div className="lyric-line lyric-line-rtl-stacked">
                <div className="rtl-chords-row">
                    {chords.map((part, idx) => (
                        <span key={idx} className="rtl-chord"><Chord chord={part.chord} /></span>
                    ))}
                </div>
                <div className="rtl-lyrics-row">{lyrics}</div>
            </div>
        );
    }

    // LTR: paired inline as before
    return (
        <div className="lyric-line">
            {parts.map((part, idx) => (
                <span key={idx} className="chord-lyric-pair">
                    <span className="chord-above">
                        {part.chord ? <Chord chord={part.chord} /> : <span>&nbsp;</span>}
                    </span>
                    <span className="lyric-below">{part.lyric || '\u00A0'}</span>
                </span>
            ))}
        </div>
    );
};

/**
 * Section component with badge and border
 */
const SectionBox = ({ section, sectionIndex, isRtl }) => {
    const badge = getBadgeAbbrev(section.name, sectionIndex);
    const badgeClass = `badge-${section.type}`;

    return (
        <div className={`section-box ${badgeClass}`}>
            <div className="section-header-row">
                <div className="section-title">
                    <span className={`section-badge ${badgeClass}`}>{badge}</span>
                    <span className="section-name">{section.name}</span>
                </div>
                {section.notes && (
                    <span className="section-notes">{section.notes}</span>
                )}
            </div>
            <div className="section-content">
                {section.lines.map((line, lineIdx) => {
                    const parsed = parseLine(line);
                    if (parsed.type === 'grid') {
                        return <ChordGrid key={lineIdx} chords={parsed.chords} />;
                    }
                    return (
                        <LyricLine
                            key={lineIdx}
                            parts={parsed.parts}
                            isRtl={isRtl}
                        />
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Arrangement badges row
 */
const ArrangementBadges = ({ arrangement, sections }) => {
    // Build badges from sections if arrangement not available
    const badges = arrangement.length > 0
        ? arrangement
        : sections.map((s, i) => getBadgeAbbrev(s.name, i));

    if (badges.length === 0) return null;

    return (
        <div className="arrangement-row">
            {badges.map((badge, idx) => {
                const type = getSectionTypeFromBadge(badge);
                return (
                    <span key={idx} className={`arr-badge badge-${type}`}>
                        {badge}
                    </span>
                );
            })}
        </div>
    );
};

const getSectionTypeFromBadge = (badge) => {
    const b = badge.toUpperCase().replace(/\d+/g, '');
    const map = {
        'I': 'intro', 'V': 'verse', 'PC': 'prechorus',
        'C': 'chorus', 'B': 'bridge', 'O': 'outro',
        'TA': 'tag', 'INT': 'interlude', 'PO': 'prechorus',
        'RF': 'other'
    };
    return map[b] || 'other';
};

/**
 * A4 Print Preview
 */
const A4PrintPreview = ({ content, metadata, transposeSteps, fontSize, columns, showArrangement = true }) => {
    const previewRef = useRef(null);

    const rtl = isRTL(content);
    const arrangement = chordsAppParser.parseArrangement(content);

    // Transpose content if needed
    const displayContent = transposeSteps !== 0
        ? chordsAppParser.transposeContent(content, transposeSteps)
        : content;

    const sections = parseContentToSections(displayContent);
    const displayKey = transposeSteps !== 0
        ? chordsAppParser.transposeChord(metadata.key, transposeSteps)
        : metadata.key;

    return (
        <div className="a4-preview-container">
            <div
                ref={previewRef}
                className={`a4-page ${rtl ? 'rtl-page' : ''}`}
                style={{ fontSize: `${fontSize}px` }}
                dir={rtl ? 'rtl' : 'ltr'}
            >
                {/* Page Header */}
                <div className="page-header" dir={rtl ? 'rtl' : 'ltr'}>
                    <h1 className="song-title">{metadata.title || 'Untitled'}</h1>
                    {metadata.artist && !/unknown/i.test(metadata.artist) && (
                        <div className="song-artist">{metadata.artist}</div>
                    )}
                    <div className="song-meta">
                        {displayKey && <span><strong>Key:</strong> {displayKey}</span>}
                        {metadata.tempo && <span><strong>Tempo:</strong> {metadata.tempo}</span>}
                        {metadata.time && <span><strong>Time:</strong> {metadata.time}</span>}
                    </div>
                </div>

                {/* Arrangement Badges */}
                {showArrangement && <ArrangementBadges arrangement={arrangement} sections={sections} />}

                {/* Sections */}
                <div
                    className="sheet-body"
                    style={{ columnCount: columns }}
                    dir={rtl ? 'rtl' : 'ltr'}
                >
                    {sections.map((section, idx) => (
                        <SectionBox
                            key={idx}
                            section={section}
                            sectionIndex={idx}
                            isRtl={rtl}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * ChordPro Editor Panel
 */
const ChordProEditor = ({ content, onChange }) => {
    return (
        <div className="chordpro-editor">
            <div className="editor-header">ChordPro</div>
            <textarea
                value={content}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
            />
        </div>
    );
};

/**
 * Main SongEditor Component
 */
const SongEditor = ({ song, onClose, onSave }) => {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [metadata, setMetadata] = useState({});
    const [transposeSteps, setTransposeSteps] = useState(0);
    const [fontSize, setFontSize] = useState(14);
    const [showEditor, setShowEditor] = useState(false);
    const [columns, setColumns] = useState(1);
    const [showArrangement, setShowArrangement] = useState(true);

    useEffect(() => {
        if (song) {
            const initialContent = song.content || '';
            setContent(initialContent);
            setMetadata(chordsAppParser.extractMetadata(initialContent));
            if (song.transposeSteps) {
                setTransposeSteps(song.transposeSteps);
            }
        }
    }, [song]);

    const handleTranspose = (steps) => {
        setTransposeSteps(prev => prev + steps);
    };

    const handleFontSize = (delta) => {
        setFontSize(prev => Math.max(10, Math.min(24, prev + delta)));
    };

    const handleEditorChange = useCallback((newContent) => {
        setContent(newContent);
        setMetadata(chordsAppParser.extractMetadata(newContent));
    }, []);

    const handleSave = () => {
        onSave?.({ ...song, content, transposeSteps });
    };

    if (!song) return null;

    return (
        <div className="song-editor-overlay">
            <div className="song-editor">
                {/* Toolbar */}
                <div className="editor-toolbar">
                    <button className="ghost-btn" onClick={onClose}>
                        ← {t('common.back', 'Back')}
                    </button>

                    <div className="toolbar-center">
                        <div className="tool-group">
                            <span className="tool-label">Transpose</span>
                            <button onClick={() => handleTranspose(-1)}>-</button>
                            <span className="tool-value">{transposeSteps > 0 ? '+' : ''}{transposeSteps}</span>
                            <button onClick={() => handleTranspose(1)}>+</button>
                        </div>

                        <div className="tool-group">
                            <span className="tool-label">Size</span>
                            <button onClick={() => handleFontSize(-1)}>-</button>
                            <span className="tool-value">{fontSize}</span>
                            <button onClick={() => handleFontSize(1)}>+</button>
                        </div>

                        <div className="tool-group">
                            <button
                                onClick={() => setColumns(1)}
                                style={{ fontWeight: columns === 1 ? 700 : 400, background: columns === 1 ? '#000' : 'transparent', color: columns === 1 ? '#fff' : '#000' }}
                            >
                                1 Col
                            </button>
                            <button
                                onClick={() => setColumns(2)}
                                style={{ fontWeight: columns === 2 ? 700 : 400, background: columns === 2 ? '#000' : 'transparent', color: columns === 2 ? '#fff' : '#000' }}
                            >
                                2 Col
                            </button>
                        </div>

                        <div className="tool-group">
                            <button
                                onClick={() => setShowArrangement(!showArrangement)}
                                style={{ fontWeight: showArrangement ? 700 : 400, background: showArrangement ? '#000' : 'transparent', color: showArrangement ? '#fff' : '#000' }}
                            >
                                Arr
                            </button>
                        </div>
                    </div>

                    <div className="toolbar-right">
                        <button
                            className={showEditor ? 'active' : ''}
                            onClick={() => setShowEditor(!showEditor)}
                        >
                            {t('editor.code', 'Code')}
                        </button>
                        <button onClick={() => window.print()}>
                            {t('editor.print', 'Print')}
                        </button>
                        <button className="primary-btn" onClick={handleSave}>
                            {t('editor.save', 'Save')}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className={`editor-main ${showEditor ? 'with-panel' : ''}`}>
                    <A4PrintPreview
                        content={content}
                        metadata={metadata}
                        transposeSteps={transposeSteps}
                        fontSize={fontSize}
                        columns={columns}
                        showArrangement={showArrangement}
                    />

                    {showEditor && (
                        <ChordProEditor
                            content={content}
                            onChange={handleEditorChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SongEditor;
