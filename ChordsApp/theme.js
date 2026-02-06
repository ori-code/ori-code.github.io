// Theme Toggle for aChordimClaude

class ThemeManager {
    constructor() {
        this.themes = ['dark', 'light', 'notion'];
        this.currentTheme = 'dark'; // default theme
        this.init();
    }

    init() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('chordsapp-theme') || 'dark';
        this.setTheme(savedTheme, false);

        // Setup toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.cycleTheme());
        }

        // Setup side menu checkbox (for legacy dark/light toggle)
        const sideMenuDarkMode = document.getElementById('sideMenuDarkMode');
        if (sideMenuDarkMode) {
            sideMenuDarkMode.checked = savedTheme === 'dark';
            sideMenuDarkMode.addEventListener('change', () => {
                const newTheme = sideMenuDarkMode.checked ? 'dark' : 'light';
                this.setTheme(newTheme, true);
            });
        }
    }

    cycleTheme() {
        // Cycle through: dark -> light -> notion -> dark
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.setTheme(this.themes[nextIndex], true);
    }

    toggleTheme() {
        // Legacy toggle between dark and light
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme, true);
    }

    setTheme(theme, animate = true) {
        this.currentTheme = theme;

        // Add transition class for smooth animation
        if (animate) {
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        }

        // Handle stylesheet switching for Notion theme
        const mainStyles = document.getElementById('mainStyles');
        const notionStyles = document.getElementById('notionStyles');
        
        if (theme === 'notion') {
            // Load Notion stylesheet if not already loaded
            if (!notionStyles) {
                const link = document.createElement('link');
                link.id = 'notionStyles';
                link.rel = 'stylesheet';
                link.href = 'styles-notion.css';
                document.head.appendChild(link);
            } else {
                notionStyles.disabled = false;
            }
            // Disable main styles
            if (mainStyles) mainStyles.disabled = true;
            document.documentElement.setAttribute('data-theme', 'notion');
            this.updateIcon('notion');
        } else {
            // Enable main styles, disable Notion
            if (mainStyles) mainStyles.disabled = false;
            if (notionStyles) notionStyles.disabled = true;
            
            if (theme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
                this.updateIcon('sun');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                this.updateIcon('moon');
            }
        }

        // Save to localStorage
        localStorage.setItem('chordsapp-theme', theme);

        // Sync side menu checkbox
        const sideMenuDarkMode = document.getElementById('sideMenuDarkMode');
        if (sideMenuDarkMode) {
            sideMenuDarkMode.checked = theme === 'dark';
        }
    }

    updateIcon(icon) {
        const themeIcon = document.getElementById('themeIcon');
        if (!themeIcon) return;

        if (icon === 'sun') {
            // Sun icon (for light mode)
            themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
        } else if (icon === 'notion') {
            // Notion icon (square with N-like design)
            themeIcon.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect><path d="M7 7h6l-4 10h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>';
        } else {
            // Moon icon (for dark mode)
            themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();
window.themeManager = themeManager;

console.log('Theme manager initialized with Notion support');
