const fs = require('fs');
const path = '/Volumes/1TB_EXFAT/Development www.TheFaithSound.com/ori-code.github.io/ChordsApp/www/indextestui.html';
let content = fs.readFileSync(path, 'utf8');

const cssToInject = `
    <style>
        /* --- Onboarding Overlay Styles --- */
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
            padding: 40px 5%;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .welcome-header {
            text-align: center;
            margin-bottom: 40px;
            max-width: 800px;
        }

        .welcome-header h1 {
            font-size: clamp(2.5rem, 8vw, 4.5rem);
            font-weight: 900;
            line-height: 1;
            margin-bottom: 1rem;
            letter-spacing: -2px;
            text-transform: uppercase;
        }

        .welcome-header p {
            font-size: 1.2rem;
            color: var(--text-muted);
            margin-bottom: 2rem;
        }

        .start-app-btn {
            padding: 1rem 3rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: var(--text);
            color: var(--bg);
            border: none;
            cursor: pointer;
            font-size: 1.1rem;
            transition: opacity 0.2s;
            border-radius: 4px;
        }

        .start-app-btn:hover {
            opacity: 0.8;
        }

        .welcome-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            width: 100%;
            max-width: 1200px;
            margin-bottom: 60px;
        }

        .w-feature-box {
            padding: 3rem 2rem;
            border: 2px solid var(--border);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            background: var(--bg-card);
        }

        .w-feature-box h3 {
            font-size: 1.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-transform: uppercase;
        }

        .w-feature-box p {
            color: var(--text-muted);
            font-size: 0.95rem;
            line-height: 1.5;
        }

        .w-illustration {
            width: 100%;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
        }

        .w-illustration svg {
            width: 80px;
            height: 80px;
            fill: none;
            stroke: var(--text);
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        /* --- Animations --- */
        .anim-library line { animation: lineMove 2s infinite alternate ease-in-out; }
        .anim-library line:nth-child(4) { animation-delay: 0.5s; }
        @keyframes lineMove { from { transform: translateX(0); } to { transform: translateX(5px); } }

        .anim-sync path { animation: syncPulse 2s infinite ease-out; transform-origin: center bottom; }
        .anim-sync path:nth-child(1) { animation-delay: 0.6s; }
        .anim-sync path:nth-child(2) { animation-delay: 0.3s; }
        @keyframes syncPulse { 0% { opacity: 0.3; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.3; transform: scale(0.9); } }

        .anim-scan { position: relative; }
        .scan-bar { position: absolute; width: 60px; height: 2px; background: var(--text); top: 20%; left: 50%; transform: translateX(-50%); animation: scanMove 3s infinite ease-in-out; z-index: 10; }
        @keyframes scanMove { 0%, 100% { top: 30%; opacity: 0; } 50% { top: 70%; opacity: 1; } }

        .anim-transpose polyline, .anim-transpose line { animation: transposeSlide 3s infinite ease-in-out; }
        @keyframes transposeSlide { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(5px, -5px); } }

        .anim-pads circle, .anim-pads path { animation: breathe 4s infinite ease-in-out; transform-origin: center; }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }

        .anim-midi line { animation: keyPress 1.5s infinite alternate ease-in-out; }
        .anim-midi line:nth-child(2) { animation-delay: 0.2s; }
        .anim-midi line:nth-child(3) { animation-delay: 0.4s; }
        .anim-midi line:nth-child(4) { animation-delay: 0.6s; }
        @keyframes keyPress { 0%, 100% { stroke-dasharray: 100; stroke-dashoffset: 0; } 50% { stroke-dashoffset: 20; } }
    </style>
`;

const htmlToInject = `
    <div id="welcomeOverlay">
        <div class="welcome-header">
            <h1>SOUND<br>PURELY.</h1>
            <p>The essential toolkit for modern worship leaders. Zero noise. Pure function.</p>
            <button class="start-app-btn" onclick="document.getElementById('welcomeOverlay').style.display='none'">Enter App</button>
        </div>

        <div class="welcome-features">
            <div class="w-feature-box">
                <div class="w-illustration">
                    <svg viewBox="0 0 24 24" class="anim-library">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        <line x1="8" y1="6" x2="16" y2="6"></line>
                        <line x1="8" y1="10" x2="16" y2="10"></line>
                    </svg>
                </div>
                <h3>Library</h3>
                <p>Every song you own, organized in a brutalist, distraction-free interface. Search instantly. Play immediately.</p>
            </div>

            <div class="w-feature-box">
                <div class="w-illustration">
                    <svg viewBox="0 0 24 24" class="anim-sync">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                        <circle cx="12" cy="20" r="1" fill="currentColor"></circle>
                    </svg>
                </div>
                <h3>Live Sync</h3>
                <p>Connect your team. One leader, infinite followers. Synchronized chord changes across every device on stage.</p>
            </div>

            <div class="w-feature-box">
                <div class="w-illustration anim-scan">
                    <div class="scan-bar"></div>
                    <svg viewBox="0 0 24 24">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                </div>
                <h3>Intelligent Scan</h3>
                <p>Snap a photo of your paper charts. Our AI converts them into interactive digital chord sheets in seconds.</p>
            </div>

            <div class="w-feature-box">
                <div class="w-illustration">
                    <svg viewBox="0 0 24 24" class="anim-transpose">
                        <polyline points="16 3 21 3 21 8"></polyline>
                        <line x1="4" y1="20" x2="21" y2="3"></line>
                        <polyline points="21 16 21 21 16 21"></polyline>
                        <line x1="15" y1="15" x2="21" y2="21"></line>
                        <line x1="4" y1="4" x2="9" y2="9"></line>
                    </svg>
                </div>
                <h3>Transpose</h3>
                <p>Change keys instantly. Our engine recalculates every chord perfectly, maintaining the musical structure.</p>
            </div>

            <div class="w-feature-box">
                <div class="w-illustration">
                    <svg viewBox="0 0 24 24" class="anim-pads">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <circle cx="12" cy="12" r="4"></circle>
                        <path d="M12 8v8M8 12h8" opacity="0.5"></path>
                    </svg>
                </div>
                <h3>Ambient Pads</h3>
                <p>Fill the room with high-quality atmospheric pads. Seamless transitions between every key.</p>
            </div>

            <div class="w-feature-box">
                <div class="w-illustration">
                    <svg viewBox="0 0 24 24" class="anim-midi">
                        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                        <line x1="7" y1="5" x2="7" y2="19"></line>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="17" y1="5" x2="17" y2="19"></line>
                    </svg>
                </div>
                <h3>MIDI Control</h3>
                <p>Trigger transitions and pads with your feet. Full MIDI mapping for professional hands-free operation.</p>
            </div>
        </div>
    </div>
`;

content = content.replace('</head>', cssToInject + '\n</head>');
content = content.replace('<body>', '<body>\n' + htmlToInject);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully injected overlay.');
