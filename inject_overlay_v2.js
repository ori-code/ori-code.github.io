const fs = require('fs');
const path = '/Volumes/1TB_EXFAT/Development www.TheFaithSound.com/ori-code.github.io/ChordsApp/www/indextestui.html';
let content = fs.readFileSync(path, 'utf8');

// Remove the old overlay
content = content.replace(/<style>\s*\/\* --- Onboarding Overlay Styles --- \*\/[\s\S]*?<\/style>/, '');
content = content.replace(/<div id="welcomeOverlay">[\s\S]*?<\/div>/, '');

const cssToInject = `
    <style>
        /* --- Minimalist Onboarding Overlay Styles --- */
        #welcomeOverlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: var(--bg);
            color: var(--text);
            z-index: 99999;
            overflow-y: auto;
            padding: 60px 5%;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .welcome-header {
            text-align: center;
            margin-bottom: 60px;
            max-width: 800px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .welcome-logo {
            font-weight: 900;
            font-size: 1.5rem;
            letter-spacing: -1px;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .welcome-logo-box {
            width: 30px;
            height: 30px;
            background: var(--text);
        }

        .welcome-header h1 {
            font-size: clamp(3rem, 8vw, 5rem);
            font-weight: 900;
            line-height: 0.9;
            margin-bottom: 1.5rem;
            letter-spacing: -2px;
            text-transform: uppercase;
        }

        .start-app-btn {
            margin-top: 2rem;
            padding: 1.2rem 4rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            background: var(--text);
            color: var(--bg);
            border: 2px solid var(--text);
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s ease;
        }

        .start-app-btn:hover {
            background: transparent;
            color: var(--text);
        }

        .welcome-features {
            display: flex;
            flex-direction: column;
            gap: 40px;
            width: 100%;
            max-width: 900px;
            margin-bottom: 100px;
        }

        .w-feature-row {
            display: grid;
            grid-template-columns: 120px 1fr;
            gap: 40px;
            padding: 40px 0;
            border-bottom: 1px solid var(--border);
            align-items: start;
        }

        .w-feature-row:last-child {
            border-bottom: none;
        }

        @media (max-width: 768px) {
            .w-feature-row {
                grid-template-columns: 1fr;
                text-align: center;
                gap: 20px;
            }
            .w-illustration { justify-content: center; }
        }

        .w-feature-content h3 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 1rem;
            letter-spacing: -1px;
            text-transform: uppercase;
        }

        .w-feature-content p {
            font-size: 1.1rem;
            color: var(--text-muted);
            margin-bottom: 1.5rem;
            line-height: 1.6;
            max-width: 600px;
        }

        .w-feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
        }

        .w-feature-list li {
            font-size: 0.95rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .w-feature-list li::before {
            content: "✓";
            font-weight: 900;
        }

        .plan-badge {
            display: inline-block;
            margin-top: 15px;
            padding: 4px 12px;
            border: 1px solid var(--border);
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .w-illustration {
            width: 100%;
            height: 120px;
            display: flex;
            align-items: flex-start;
        }

        .w-illustration svg {
            width: 80px;
            height: 80px;
            fill: none;
            stroke: var(--text);
            stroke-width: 1.5;
            stroke-linecap: square;
            stroke-linejoin: miter;
        }

        /* --- Minimalist Animations --- */
        /* 1. Scan: moving horizontal line */
        .anim-scan line.scan-line { animation: scanDown 2.5s infinite ease-in-out; }
        @keyframes scanDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(14px); } }

        /* 2. Editor: cursor blink and select */
        .anim-editor rect.cursor { animation: blink 1s infinite step-end; }
        .anim-editor path.select { animation: selectMove 3s infinite ease-in-out; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes selectMove { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }

        /* 3. Share: pulse outward */
        .anim-share path.wave { animation: sharePulse 2s infinite ease-out; transform-origin: left bottom; }
        .anim-share path.wave:nth-child(2) { animation-delay: 0.3s; }
        @keyframes sharePulse { 0% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.2; transform: scale(0.8); } }

        /* 4. Library: stacking books */
        .anim-library rect { animation: stackMove 3s infinite alternate ease-in-out; }
        .anim-library rect:nth-child(2) { animation-delay: 0.2s; }
        .anim-library rect:nth-child(3) { animation-delay: 0.4s; }
        @keyframes stackMove { 0% { transform: translateX(0); } 100% { transform: translateX(3px); } }

        /* 5. Pads & Metronome: waveform / pendulum */
        .anim-pads line.wave { animation: eqMove 1s infinite alternate ease-in-out; transform-origin: bottom; }
        .anim-pads line.wave:nth-child(1) { animation-delay: 0.1s; }
        .anim-pads line.wave:nth-child(2) { animation-delay: 0.4s; }
        .anim-pads line.wave:nth-child(3) { animation-delay: 0.2s; }
        .anim-pads line.wave:nth-child(4) { animation-delay: 0.5s; }
        .anim-pads line.wave:nth-child(5) { animation-delay: 0.3s; }
        @keyframes eqMove { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }
    </style>
`;

const htmlToInject = `
    <div id="welcomeOverlay">
        <div class="welcome-header">
            <div class="welcome-logo">
                <div class="welcome-logo-box"></div>
                aChordim
            </div>
            <h1>PURE. FAST.<br>WORSHIP.</h1>
            <button class="start-app-btn" onclick="document.getElementById('welcomeOverlay').style.display='none'">Launch App</button>
        </div>

        <div class="welcome-features">
            <!-- Feature 1: Recognition -->
            <div class="w-feature-row">
                <div class="w-illustration anim-scan">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line class="scan-line" x1="5" y1="5" x2="19" y2="5"></line>
                    </svg>
                </div>
                <div class="w-feature-content">
                    <h3>Instant Chord Recognition</h3>
                    <p>Simply snap a photo or upload any chord sheet image. We instantly recognize chords, lyrics, and song structure - even from blurry photos or handwritten notes!</p>
                    <ul class="w-feature-list">
                        <li>Works with any image - photos, screenshots, PDFs, scans</li>
                        <li>Multi-language - Hebrew, English, Spanish, Portuguese & more</li>
                        <li>Smart detection - automatically finds key, BPM, and time signature</li>
                        <li>Handles complex chords - slash chords, extensions, alterations</li>
                    </ul>
                </div>
            </div>

            <!-- Feature 2: Editor -->
            <div class="w-feature-row">
                <div class="w-illustration anim-editor">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                        <line x1="7" y1="8" x2="17" y2="8"></line>
                        <path class="select" d="M7 12h5"></path>
                        <rect class="cursor" x="13" y="11" width="2" height="3" fill="currentColor" stroke="none"></rect>
                        <line x1="7" y1="16" x2="14" y2="16"></line>
                    </svg>
                </div>
                <div class="w-feature-content">
                    <h3>Powerful Visual Editor</h3>
                    <p>Perfect your charts with our intuitive click-to-edit interface. No more struggling with text formatting - just click any chord and change it instantly.</p>
                    <ul class="w-feature-list">
                        <li>One-click transpose - change keys instantly for any vocalist</li>
                        <li>Nashville Numbers - switch between names and numbers (Pro)</li>
                        <li>Full customization - fonts, sizes, spacing, columns, margins</li>
                        <li>Auto-fit to page - perfect formatting for any paper size</li>
                    </ul>
                </div>
            </div>

            <!-- Feature 3: Share/Live -->
            <div class="w-feature-row">
                <div class="w-illustration anim-share">
                    <svg viewBox="0 0 24 24">
                        <rect x="4" y="6" width="16" height="12" rx="2"></rect>
                        <path class="wave" d="M4 18c4-4 10-4 16 0"></path>
                        <path class="wave" d="M4 14c4-4 10-4 16 0"></path>
                        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"></circle>
                    </svg>
                </div>
                <div class="w-feature-content">
                    <h3>Share, Print & Present Live</h3>
                    <p>From practice to performance - share your charts however you need them. Print beautiful copies, project on screen, or share with your whole band in real-time.</p>
                    <ul class="w-feature-list">
                        <li>Print-ready output - professional quality every time</li>
                        <li>Save as image - high-resolution PNG for sharing</li>
                        <li>Live Preview mode - full-screen display for projectors & screens</li>
                        <li>Real-time sessions - band members see changes instantly</li>
                    </ul>
                </div>
            </div>

            <!-- Feature 4: Library -->
            <div class="w-feature-row">
                <div class="w-illustration anim-library">
                    <svg viewBox="0 0 24 24">
                        <rect x="4" y="4" width="16" height="4"></rect>
                        <rect x="4" y="10" width="16" height="4"></rect>
                        <rect x="4" y="16" width="16" height="4"></rect>
                    </svg>
                </div>
                <div class="w-feature-content">
                    <h3>Your Personal Song Library</h3>
                    <p>Build your ultimate worship collection. Save every song, organize by service or event, and access your library from anywhere. Never lose a chart again!</p>
                    <ul class="w-feature-list">
                        <li>Unlimited songs - save your entire repertoire</li>
                        <li>Custom songbooks - organize by service, event, or theme</li>
                        <li>Smart search - find songs by title, lyrics, or key</li>
                        <li>Cloud sync - access from any device, anytime</li>
                    </ul>
                    <div class="plan-badge">Available with Basic & Pro plans</div>
                </div>
            </div>

            <!-- Feature 5: Pads/Metronome -->
            <div class="w-feature-row">
                <div class="w-illustration anim-pads">
                    <svg viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <line class="wave" x1="6" y1="16" x2="6" y2="8"></line>
                        <line class="wave" x1="9" y1="16" x2="9" y2="10"></line>
                        <line class="wave" x1="12" y1="16" x2="12" y2="6"></line>
                        <line class="wave" x1="15" y1="16" x2="15" y2="11"></line>
                        <line class="wave" x1="18" y1="16" x2="18" y2="8"></line>
                    </svg>
                </div>
                <div class="w-feature-content">
                    <h3>Ambient Pads & Metronome</h3>
                    <p>Create the perfect atmosphere for worship. Our built-in ambient pads provide beautiful, continuous background music, while the integrated metronome keeps your band in perfect time.</p>
                    <ul class="w-feature-list">
                        <li>Key-matched pads - automatically syncs to your song</li>
                        <li>Multiple sounds - warm, bright, atmospheric options</li>
                        <li>Perfect transitions - smooth flow between songs</li>
                        <li>Visual metronome - stay on beat with customizable visuals and sounds</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <button class="start-app-btn" style="margin-bottom: 60px;" onclick="document.getElementById('welcomeOverlay').style.display='none'">Start Using aChordim</button>
    </div>
`;

content = content.replace('</head>', cssToInject + '\n</head>');
content = content.replace('<body>', '<body>\n' + htmlToInject);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated overlay.');
