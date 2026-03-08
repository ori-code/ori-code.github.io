// Theme Toggle for aChordim — Binary Dark/Light

class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.init();
    }

    init() {
        const savedTheme = localStorage.getItem('chordsapp-theme') || 'dark';
        this.setTheme(savedTheme, false);

        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }

        const sideMenuDarkMode = document.getElementById('sideMenuDarkMode');
        if (sideMenuDarkMode) {
            sideMenuDarkMode.checked = savedTheme === 'dark';
            sideMenuDarkMode.addEventListener('change', () => {
                const newTheme = sideMenuDarkMode.checked ? 'dark' : 'light';
                this.setTheme(newTheme, true);
            });
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme, true);
    }

    setTheme(theme, animate = true) {
        this.currentTheme = theme;

        if (animate) {
            document.body.style.transition = 'background-color 0.2s ease, color 0.2s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 200);
        }

        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        // Update toggle button text or icon
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            const moonIcon = document.getElementById('moonIcon');
            const sunIcon = document.getElementById('sunIcon');
            if (moonIcon && sunIcon) {
                if (theme === 'light') {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                } else {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                }
            } else {
                toggleBtn.textContent = theme === 'dark' ? 'Light' : 'Dark';
            }
        }

        localStorage.setItem('chordsapp-theme', theme);

        const sideMenuDarkMode = document.getElementById('sideMenuDarkMode');
        if (sideMenuDarkMode) {
            sideMenuDarkMode.checked = theme === 'dark';
        }

        // Sync live mode theme toggle label
        const liveModeThemeToggle = document.getElementById('liveModeThemeToggle');
        if (liveModeThemeToggle) {
            liveModeThemeToggle.textContent = theme === 'dark' ? 'White' : 'Black';
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();
window.themeManager = themeManager;
