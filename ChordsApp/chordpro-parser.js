// Chords App Format v4 Parser
// Handles parsing and manipulation of the new ChordPro-like format

const chordsAppParser = {
    // ============== REGEX PATTERNS ==============

    // Matches chords in brackets: [G], [Am7], [F#m], [C/G], [Dsus4], [Cadd9], [Cmaj7], [Cma7]
    // Pattern: Root + optional sharp/flat + optional quality (maj/ma/min/m/M/dim/aug/sus/add) + optional number + optional bass
    // Also captures optional +/- modifiers after bracket for half-step adjustment: [G]+, [C]-, [Em]++, [D]---
    CHORD_REGEX: /\[([A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\]([+-]+)?/g,

    // Matches directives: {title: value}, {key: G}, etc.
    DIRECTIVE_REGEX: /\{(\w+):\s*([^}]*)\}/g,

    // Matches section markers: {c: Verse 1:}, {c: Chorus:}
    SECTION_REGEX: /\{c:\s*([^}]+)\}/g,

    // Matches arrangement badge line: (I) (V1) (C) (V2) (C) (O) or with repeats/arrows: (I)2x (V1) (C) > (I)
    BADGE_LINE_REGEX: /^[\s]*((\([A-Z]+\d*\)(\d+x)?\s*)|>\s*)+[\s]*$/i,

    // Matches individual badges: (I), (V1), (PC), (C), (B), (O), (TURN), (BRK), etc.
    BADGE_REGEX: /\(([A-Z]+\d*)\)/g,

    // Matches badge with optional repeat count: (I)2x, (C)3x
    BADGE_WITH_REPEAT_REGEX: /\(([A-Z]+\d*)\)(\d+)?x?/gi,

    // Matches chord grids: | G | C | D |
    CHORD_GRID_REGEX: /^\s*\|[^|]+\|/,

    // Note values for transposition
    NOTES: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    NOTES_FLAT: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],

    // ============== PARSE FUNCTIONS ==============

    /**
     * Parse all directives from content
     * @param {string} content - The chord chart content
     * @returns {Object} - Key-value pairs of directives
     */
    parseDirectives(content) {
        const directives = {};
        const regex = /\{(\w+):\s*([^}]*)\}/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const key = match[1].toLowerCase();
            const value = match[2].trim();
            // Skip section markers (c: is for comments/sections)
            if (key !== 'c') {
                directives[key] = value;
            }
        }

        return directives;
    },

    /**
     * Parse the arrangement badge line with repeat counts and flow arrows
     * @param {string} content - The chord chart content
     * @returns {Array} - Array of items: {type: 'badge', label: 'I', repeat: 2} or {type: 'flow'}
     *                    For backwards compatibility, also supports returning simple strings
     */
    parseArrangement(content, returnObjects = false) {
        const lines = content.split('\n');
        const items = [];

        for (const line of lines) {
            // Check if line contains badges (with optional repeats and flow arrows)
            if (this.BADGE_LINE_REGEX.test(line)) {
                console.log('📋 PARSER: Found badge line:', line.trim());
                // Parse the line token by token
                // Split by spaces but keep track of position
                const tokens = line.trim().split(/\s+/);
                console.log('📋 PARSER: Tokens:', tokens);

                for (const token of tokens) {
                    // Check for flow arrow
                    if (token === '>') {
                        items.push(returnObjects ? { type: 'flow' } : '>');
                        continue;
                    }

                    // Check for badge with optional repeat: (I), (I)2x, (C)3x
                    const badgeMatch = token.match(/^\(([A-Z]+\d*)\)(\d+)?x?$/i);
                    if (badgeMatch) {
                        const label = badgeMatch[1].toUpperCase();
                        const repeat = badgeMatch[2] ? parseInt(badgeMatch[2]) : 1;

                        if (returnObjects) {
                            items.push({ type: 'badge', label, repeat });
                        } else {
                            // For backwards compatibility, return just the label
                            items.push(label);
                        }
                    }
                }
                break; // Only parse first badge line
            }
        }

        return items;
    },

    /**
     * Parse arrangement with full object structure (new API)
     * @param {string} content - The chord chart content
     * @returns {Array} - Array of {type: 'badge'|'flow', label?, repeat?}
     */
    parseArrangementFull(content) {
        return this.parseArrangement(content, true);
    },

    /**
     * Parse all section markers from content
     * Detects both {c: Section:} format and clean Section: format
     * @param {string} content - The chord chart content
     * @returns {Array} - Array of {name, startIndex, endIndex} objects
     */
    parseSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let index = 0;

        // Section keywords to detect clean format
        const sectionKeywords = /^(Intro|Verse|Pre-?Chorus|Chorus|Bridge|Outro|Interlude|Tag|Coda|Turn|Turnaround|Break|Instrumental|Solo|Ending|Vamp)/i;

        for (const line of lines) {
            const trimmed = line.trim();

            // Match {c: Section:} format
            const v4Match = trimmed.match(/^\{c:\s*([^}]+)\}/i);
            if (v4Match) {
                sections.push({
                    name: v4Match[1].trim().replace(/:$/, ''),
                    index: index,
                    fullMatch: v4Match[0]
                });
            }
            // Match clean Section: format (e.g., "Intro:", "Verse 1:", "Chorus:")
            else if (sectionKeywords.test(trimmed) && trimmed.endsWith(':')) {
                sections.push({
                    name: trimmed.replace(/:$/, ''),
                    index: index,
                    fullMatch: trimmed
                });
            }

            index += line.length + 1; // +1 for newline
        }

        return sections;
    },

    /**
     * Find all chords in a line
     * @param {string} line - A single line of text
     * @returns {Array} - Array of {chord, index} objects
     */
    parseChords(line) {
        const chords = [];
        const regex = /\[([A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\]/g;
        let match;

        while ((match = regex.exec(line)) !== null) {
            chords.push({
                chord: match[1],
                index: match.index,
                fullMatch: match[0]
            });
        }

        return chords;
    },

    /**
     * Check if a line is a chord grid
     * @param {string} line - A single line of text
     * @returns {boolean}
     */
    isChordGrid(line) {
        return this.CHORD_GRID_REGEX.test(line.trim());
    },

    /**
     * Check if a line is a section marker
     * Detects both {c: Section:} format and clean Section: format
     * @param {string} line - A single line of text
     * @returns {boolean}
     */
    isSectionMarker(line) {
        const trimmed = line.trim();
        // Match {c: Section:} format
        if (/^\{c:\s*[^}]+\}\s*$/.test(trimmed)) return true;
        // Match clean Section: format
        const sectionKeywords = /^(Intro|Verse|Pre-?Chorus|Chorus|Bridge|Outro|Interlude|Tag|Coda|Turn|Turnaround|Break|Instrumental|Solo|Ending|Vamp)/i;
        return sectionKeywords.test(trimmed) && trimmed.endsWith(':');
    },

    /**
     * Check if a line is a directive
     * @param {string} line - A single line of text
     * @returns {boolean}
     */
    isDirective(line) {
        return /^\s*\{(?!c:)\w+:\s*[^}]*\}\s*$/.test(line);
    },

    // ============== TRANSPOSE FUNCTIONS ==============

    /**
     * Get note index (0-11)
     * @param {string} note - Note name like 'C', 'F#', 'Bb'
     * @returns {number} - Index 0-11
     */
    getNoteIndex(note) {
        // Normalize note
        const normalized = note.charAt(0).toUpperCase() + note.slice(1);

        let idx = this.NOTES.indexOf(normalized);
        if (idx === -1) {
            idx = this.NOTES_FLAT.indexOf(normalized);
        }

        // Handle enharmonic equivalents
        if (idx === -1) {
            const enharmonics = {
                'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10,
                'C#': 1, 'D#': 3, 'F#': 6, 'G#': 8, 'A#': 10,
                'E#': 5, 'B#': 0, 'Fb': 4, 'Cb': 11
            };
            idx = enharmonics[normalized] ?? -1;
        }

        return idx;
    },

    /**
     * Transpose a single chord
     * @param {string} chord - Chord like 'Am7', 'F#m', 'C/G'
     * @param {number} semitones - Steps to transpose (+/-)
     * @param {boolean} useFlats - Use flats instead of sharps
     * @returns {string} - Transposed chord
     */
    transposeChord(chord, semitones, useFlats = false) {
        if (!chord || semitones === 0) return chord;

        // Parse chord: root + quality + bass
        const match = chord.match(/^([A-G][#b]?)(.*)$/);
        if (!match) return chord;

        const root = match[1];
        let suffix = match[2];

        // Check for bass note
        let bassNote = '';
        const bassMatch = suffix.match(/\/([A-G][#b]?)$/);
        if (bassMatch) {
            bassNote = bassMatch[1];
            suffix = suffix.replace(/\/[A-G][#b]?$/, '');
        }

        // Transpose root
        const rootIdx = this.getNoteIndex(root);
        if (rootIdx === -1) return chord;

        const newRootIdx = (rootIdx + semitones + 120) % 12;
        const noteArray = useFlats ? this.NOTES_FLAT : this.NOTES;
        const newRoot = noteArray[newRootIdx];

        // Transpose bass if present
        let newBass = '';
        if (bassNote) {
            const bassIdx = this.getNoteIndex(bassNote);
            if (bassIdx !== -1) {
                const newBassIdx = (bassIdx + semitones + 120) % 12;
                newBass = '/' + noteArray[newBassIdx];
            }
        }

        return newRoot + suffix + newBass;
    },

    /**
     * Transpose all chords in a line
     * @param {string} line - Line with [chord] brackets
     * @param {number} semitones - Steps to transpose
     * @param {boolean} useFlats - Use flats instead of sharps
     * @returns {string} - Line with transposed chords
     */
    transposeLine(line, semitones, useFlats = false) {
        if (semitones === 0) return line;

        return line.replace(this.CHORD_REGEX, (match, chord) => {
            const transposed = this.transposeChord(chord, semitones, useFlats);
            return '[' + transposed + ']';
        });
    },

    /**
     * Transpose entire content including key directive
     * @param {string} content - Full chord chart
     * @param {number} semitones - Steps to transpose
     * @param {boolean} useFlats - Use flats instead of sharps
     * @returns {string} - Transposed content
     */
    transposeContent(content, semitones, useFlats = false) {
        if (semitones === 0) return content;

        // Transpose all chords in brackets
        let result = content.replace(this.CHORD_REGEX, (match, chord) => {
            const transposed = this.transposeChord(chord, semitones, useFlats);
            return '[' + transposed + ']';
        });

        // Also transpose chords in chord grids (without brackets)
        // Chord grids: | G . Dsus | Em7 | C/G |
        // Need to match chords after | OR after . OR at word boundaries within grid lines
        const lines = result.split('\n');
        const transposedLines = lines.map(line => {
            // Check if line is a chord grid (starts with | or contains multiple |)
            if (line.trim().startsWith('|') || (line.includes('|') && line.includes(' '))) {
                // Transpose all bare chords in this grid line
                // Match: chords after | or . or space, NOT already in brackets
                return line.replace(/([|\.\s])([A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)(?=[\s\.|]|$)/g,
                    (match, prefix, chord) => {
                        // Skip if this is actually part of a bracketed chord (already handled)
                        const transposed = this.transposeChord(chord, semitones, useFlats);
                        return prefix + transposed;
                    }
                );
            }
            return line;
        });
        result = transposedLines.join('\n');

        // Update {key: X} directive
        result = this.updateKeyDirective(result, semitones, useFlats);

        return result;
    },

    /**
     * Update the key directive after transposition
     * @param {string} content - Content with {key: X} directive
     * @param {number} semitones - Steps transposed
     * @param {boolean} useFlats - Use flats
     * @returns {string} - Content with updated key
     */
    updateKeyDirective(content, semitones, useFlats = false) {
        return content.replace(/\{key:\s*([^}]+)\}/i, (match, keyValue) => {
            // Parse key: could be "G", "G Major", "Am", "A Minor"
            const keyMatch = keyValue.match(/^([A-G][#b]?)\s*(.*)?$/i);
            if (!keyMatch) return match;

            const keyRoot = keyMatch[1];
            const keyQuality = keyMatch[2] || '';

            const transposedRoot = this.transposeChord(keyRoot, semitones, useFlats);
            return '{key: ' + transposedRoot + (keyQuality ? ' ' + keyQuality : '') + '}';
        });
    },

    // ============== UTILITY FUNCTIONS ==============

    /**
     * Extract metadata for display
     * @param {string} content - Chord chart content
     * @returns {Object} - {title, artist, key, tempo, time}
     */
    extractMetadata(content) {
        const directives = this.parseDirectives(content);

        // Start with v4 directive values
        let title = directives.title || directives.t || '';
        let artist = directives.subtitle || directives.st || directives.artist || '';
        let key = directives.key || '';
        let tempo = directives.tempo || '';
        let time = directives.time || '';
        let capo = directives.capo || '';

        // Fallback: Parse old format and normalized format lines
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();

            // Old format: Title: Amazing Grace
            if (!title) {
                const titleMatch = trimmed.match(/^Title:\s*(.+)/i);
                if (titleMatch) title = titleMatch[1].trim();
            }

            // Normalized format: First line is plain title (no directives, no Key:, no badges)
            if (!title && i === 0 && trimmed &&
                !trimmed.startsWith('{') &&
                !trimmed.startsWith('(') &&
                !/^(Title|Key|Artist|By):/i.test(trimmed)) {
                title = trimmed;
            }

            // Old format: Key: G | BPM: 76 | Time: 3/4
            if (!key || !tempo || !time) {
                const metaMatch = trimmed.match(/^Key:\s*([A-G][#b]?\s*(?:Major|Minor|m)?)\s*\|\s*BPM:\s*(\d+)\s*\|\s*Time:\s*(\d+\/\d+)/i);
                if (metaMatch) {
                    if (!key) key = metaMatch[1].trim();
                    if (!tempo) tempo = metaMatch[2].trim();
                    if (!time) time = metaMatch[3].trim();
                }
            }

            // Normalized format: "Artist, Key: G, 76 BPM, 3/4" (comma-separated metadata line)
            if (i <= 2 && /,/.test(trimmed) && /Key:/i.test(trimmed)) {
                // Extract key from comma format
                if (!key) {
                    const keyMatch = trimmed.match(/Key:\s*([A-G][#b]?\s*(?:Major|Minor|m)?)/i);
                    if (keyMatch) key = keyMatch[1].trim();
                }
                // Extract tempo (N BPM format)
                if (!tempo) {
                    const tempoMatch = trimmed.match(/(\d+)\s*BPM/i);
                    if (tempoMatch) tempo = tempoMatch[1];
                }
                // Extract time signature
                if (!time) {
                    const timeMatch = trimmed.match(/,\s*(\d+\/\d+)/);
                    if (timeMatch) time = timeMatch[1];
                }
                // Extract artist (first part before Key:)
                if (!artist) {
                    const artistMatch = trimmed.match(/^([^,]+),\s*Key:/i);
                    if (artistMatch && artistMatch[1].toLowerCase() !== 'unknown') {
                        artist = artistMatch[1].trim();
                    }
                }
            }

            // Old format: Artist: or By:
            if (!artist) {
                const artistMatch = trimmed.match(/^(?:Artist|By|Subtitle):\s*(.+)/i);
                if (artistMatch) artist = artistMatch[1].trim();
            }

            // Stop after first few lines (metadata is at top)
            if (trimmed.startsWith('{c:') || trimmed.startsWith('|') || /^\[/.test(trimmed)) {
                break;
            }
        }

        return { title, artist, key, tempo, time, capo };
    },

    /**
     * Get badge color class for a badge code
     * @param {string} badge - Badge code like 'I', 'V1', 'C', 'PC'
     * @returns {string} - CSS class name
     */
    getBadgeColorClass(badge) {
        const type = badge.replace(/\d+$/, '').toUpperCase();

        const colorMap = {
            'I': 'badge-intro',
            'V': 'badge-verse',
            'PC': 'badge-prechorus',
            'C': 'badge-chorus',
            'B': 'badge-bridge',
            'O': 'badge-outro',
            'INT': 'badge-interlude',
            'TAG': 'badge-tag',
            'CODA': 'badge-coda',
            'TURN': 'badge-turn',
            'BRK': 'badge-break'
        };

        return colorMap[type] || 'badge-other';
    },

    /**
     * Convert section name to badge code
     * @param {string} sectionName - Like "Verse 1", "Chorus", "Pre-Chorus"
     * @returns {string} - Badge code like "V1", "C", "PC"
     */
    sectionToBadge(sectionName) {
        const name = sectionName.toLowerCase().trim().replace(/:$/, '');

        // Check for numbered sections
        const numMatch = name.match(/(\d+)$/);
        const num = numMatch ? numMatch[1] : '';
        const baseName = name.replace(/\s*\d+$/, '').trim();

        const badgeMap = {
            'intro': 'I',
            'verse': 'V',
            'pre-chorus': 'PC',
            'prechorus': 'PC',
            'chorus': 'C',
            'bridge': 'B',
            'outro': 'O',
            'interlude': 'INT',
            'tag': 'TAG',
            'coda': 'CODA',
            'turn': 'TURN',
            'turnaround': 'TURN',
            'break': 'BRK'
        };

        const badge = badgeMap[baseName] || baseName.charAt(0).toUpperCase();
        return badge + num;
    },

    /**
     * Strip all format markers for plain text
     * @param {string} content - Formatted content
     * @returns {string} - Plain text without markers
     */
    stripFormatting(content) {
        return content
            .replace(/\{[^}]+\}/g, '') // Remove directives
            .replace(/\[[^\]]+\]/g, '') // Remove chord brackets (keep chord text?)
            .replace(/\|/g, '') // Remove grid bars
            .replace(/^\s*\([A-Z]+\d*\)\s*/gm, '') // Remove inline badges
            .trim();
    },

    /**
     * Wrap bare chords in chord grids with brackets for consistent parsing
     * Converts: | G . Dsus | Em7 | to: | [G] . [Dsus] | [Em7] |
     * @param {string} content - Content with chord grids
     * @returns {string} - Content with bracketed chords in grids
     */
    wrapChordGridChords(content) {
        const lines = content.split('\n');
        const wrappedLines = lines.map(line => {
            // Check if line is a chord grid (starts with | or has multiple |)
            if (line.trim().startsWith('|') || (line.includes('|') && (line.match(/\|/g) || []).length >= 2)) {
                // Wrap bare chords (not already in brackets)
                // Match: chord after | or . or space, not followed by ] (already bracketed)
                return line.replace(/([|\.\s])([A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)(?=[\s\.|]|$)/g,
                    (match, prefix, chord) => {
                        // Don't wrap if already inside brackets
                        return prefix + '[' + chord + ']';
                    }
                );
            }
            return line;
        });
        return wrappedLines.join('\n');
    }
};

// Expose globally
window.chordsAppParser = chordsAppParser;

console.log('Chords App Parser v4 loaded');
