// Firebase Authentication for aChordimClaude

class ChordsAuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionId = null;
        this.sessionListener = null;
        this.DEFAULT_MAX_SESSIONS = 1; // Default: 1 device per user (admin can increase)
        this.init();
    }

    init() {
        // Listen for auth state changes
        auth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            this.updateUI();
            console.log('Auth state changed:', user ? user.email : 'Not logged in');

            if (user) {
                // Hide Controls and Editor panels on login
                this.hideControlsAndEditor();

                // Check if this is a returning user (page refresh) with no local session
                const localSessionId = localStorage.getItem('chordsapp_session_id');
                if (!localSessionId) {
                    // Returning user - register a new session
                    await this.registerSession(user.uid);
                }
                // Start listening for session changes
                this.startSessionListener(user.uid);

                // Load user branding (logo + custom text) from Firebase
                if (window.loadBrandingFromFirebase) {
                    window.loadBrandingFromFirebase();
                }
            } else {
                // Stop listening when logged out
                this.stopSessionListener();
            }
        });
    }

    // Generate unique session ID
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Get max sessions allowed for user (admin-configurable)
    async getMaxSessions(userId) {
        try {
            const snapshot = await firebase.database().ref(`users/${userId}/maxSessions`).once('value');
            return snapshot.val() || this.DEFAULT_MAX_SESSIONS;
        } catch (error) {
            console.error('Error getting maxSessions:', error);
            return this.DEFAULT_MAX_SESSIONS;
        }
    }

    // Register new session in Firebase (may kick out oldest device if over limit)
    async registerSession(userId) {
        this.sessionId = this.generateSessionId();
        localStorage.setItem('chordsapp_session_id', this.sessionId);

        try {
            const database = firebase.database();
            const sessionsRef = database.ref(`users/${userId}/activeSessions`);

            // Get current sessions and max allowed
            const [sessionsSnapshot, maxSessions] = await Promise.all([
                sessionsRef.once('value'),
                this.getMaxSessions(userId)
            ]);

            let sessions = sessionsSnapshot.val() || {};
            let sessionsArray = Object.entries(sessions).map(([key, val]) => ({ key, ...val }));

            // Sort by timestamp (oldest first)
            sessionsArray.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

            // Remove oldest sessions if we're at or over the limit
            while (sessionsArray.length >= maxSessions) {
                const oldest = sessionsArray.shift();
                if (oldest) {
                    await database.ref(`users/${userId}/activeSessions/${oldest.key}`).remove();
                    console.log('Removed oldest session:', oldest.key);
                }
            }

            // Add new session
            const newSessionRef = sessionsRef.push();
            await newSessionRef.set({
                sessionId: this.sessionId,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                userAgent: navigator.userAgent.substring(0, 100)
            });

            console.log('Session registered:', this.sessionId, `(max: ${maxSessions})`);
        } catch (error) {
            console.error('Error registering session:', error);
        }
    }

    // Start listening for session changes (to detect if this session was kicked out)
    startSessionListener(userId) {
        // Stop any existing listener first
        this.stopSessionListener();

        const localSessionId = localStorage.getItem('chordsapp_session_id');
        if (!localSessionId) return;

        this.sessionListener = firebase.database().ref(`users/${userId}/activeSessions`);
        this.sessionListener.on('value', (snapshot) => {
            const sessions = snapshot.val();

            // Check if our session still exists
            if (sessions) {
                const sessionExists = Object.values(sessions).some(s => s.sessionId === localSessionId);
                if (!sessionExists) {
                    // Our session was removed - we've been kicked out
                    console.log('Session no longer valid - kicked out by another device');
                    this.forceLogout();
                }
            } else {
                // No sessions at all - force logout
                console.log('No active sessions found');
                this.forceLogout();
            }
        });
    }

    // Stop session listener
    stopSessionListener() {
        if (this.sessionListener) {
            this.sessionListener.off();
            this.sessionListener = null;
        }
    }

    // Remove current session from Firebase on logout
    async removeCurrentSession(userId) {
        const localSessionId = localStorage.getItem('chordsapp_session_id');
        if (!localSessionId || !userId) return;

        try {
            const sessionsRef = firebase.database().ref(`users/${userId}/activeSessions`);
            const snapshot = await sessionsRef.once('value');
            const sessions = snapshot.val();

            if (sessions) {
                for (const [key, session] of Object.entries(sessions)) {
                    if (session.sessionId === localSessionId) {
                        await firebase.database().ref(`users/${userId}/activeSessions/${key}`).remove();
                        console.log('Session removed on logout:', localSessionId);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Error removing session:', error);
        }
    }

    // Force logout (called when this device is kicked out)
    async forceLogout() {
        this.stopSessionListener();
        localStorage.removeItem('chordsapp_session_id');

        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error during force logout:', error);
        }

        // Show notification to user
        this.showKickedOutModal();
    }

    // Show modal when user is kicked out
    showKickedOutModal() {
        const message = 'You have been logged out because the maximum number of devices was reached.';

        // Use custom showAlert if available, otherwise wait for it
        if (window.showAlert) {
            showAlert(message);
        } else {
            // Wait a bit for showAlert to be defined, then try again
            setTimeout(() => {
                if (window.showAlert) {
                    showAlert(message);
                }
            }, 500);
        }
    }

    // Sign up with email and password
    async signUp(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);

            if (displayName) {
                await userCredential.user.updateProfile({
                    displayName: displayName
                });
            }

            // Register session for single-device login
            await this.registerSession(userCredential.user.uid);

            this.showMessage('Account created successfully!', 'success');
            this.closeAuthModal();
            return userCredential.user;
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);

            // Register session for single-device login (kicks out other devices)
            await this.registerSession(userCredential.user.uid);

            this.showMessage('Signed in successfully!', 'success');
            this.closeAuthModal();
            return userCredential.user;
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            // Use popup for GitHub Pages hosting (redirect requires Firebase Hosting)
            const result = await auth.signInWithPopup(provider);
            if (result && result.user) {
                // Register session for single-device login (kicks out other devices)
                await this.registerSession(result.user.uid);

                this.showMessage('Signed in with Google successfully!', 'success');
                this.closeAuthModal();
                console.log('Google sign-in successful:', result.user.email);
            }
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    // Sign out
    async signOut() {
        try {
            // Remove session from Firebase before signing out
            if (this.currentUser) {
                await this.removeCurrentSession(this.currentUser.uid);
            }

            // Clean up session
            this.stopSessionListener();
            localStorage.removeItem('chordsapp_session_id');
            this.sessionId = null;

            await auth.signOut();
            this.showMessage('Signed out successfully!', 'success');
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            this.showMessage('Password reset email sent!', 'success');
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    // Hide Controls and Editor panels on login
    hideControlsAndEditor() {
        // Clear localStorage to reset preferences
        localStorage.setItem('chordsapp-show-controls', 'false');
        localStorage.setItem('chordsapp-show-editor', 'false');

        // Update checkboxes
        const sideMenuShowControls = document.getElementById('sideMenuShowControls');
        const sideMenuShowEditor = document.getElementById('sideMenuShowEditor');
        if (sideMenuShowControls) sideMenuShowControls.checked = false;
        if (sideMenuShowEditor) sideMenuShowEditor.checked = false;

        // Hide the panels
        const editorActionsSection = document.querySelector('.editor-actions-section');
        const sessionSection = document.querySelector('.session-section');
        const advancedControls = document.getElementById('advancedControls');
        const editorSection = document.getElementById('editor');

        if (editorActionsSection) editorActionsSection.style.display = 'none';
        if (sessionSection) sessionSection.style.display = 'none';
        if (advancedControls) advancedControls.style.display = 'none';
        if (editorSection) editorSection.style.display = 'none';

        // Update toggle buttons to inactive state
        const toggleControlsBtn = document.getElementById('toggleControlsBtn');
        const toggleControlsBtn2 = document.getElementById('toggleControlsBtn2');
        const toggleEditorBtn = document.getElementById('toggleEditorBtn');
        const toggleEditorBtn2 = document.getElementById('toggleEditorBtn2');

        if (toggleControlsBtn) toggleControlsBtn.classList.remove('active');
        if (toggleControlsBtn2) toggleControlsBtn2.classList.remove('active');
        if (toggleEditorBtn) toggleEditorBtn.classList.remove('active');
        if (toggleEditorBtn2) toggleEditorBtn2.classList.remove('active');

        console.log('Controls and Editor panels hidden on login');
    }

    // Update UI based on auth state
    updateUI() {
        const signInButton = document.getElementById('signInButton');
        const userProfileBtn = document.getElementById('userProfileBtn');

        // Side menu user profile elements
        const sideMenuUserProfile = document.getElementById('sideMenuUserProfile');
        const sideMenuUserName = document.getElementById('sideMenuUserName');
        const sideMenuUserAvatar = document.getElementById('sideMenuUserAvatar');
        const sideMenuSignOut = document.getElementById('sideMenuSignOut');
        const sideMenuMySubscription = document.getElementById('sideMenuMySubscription');

        if (this.currentUser) {
            // User is signed in
            const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            // Get initials (e.g., "Ori Dobosh" -> "OD")
            const initials = displayName.split(' ').map(n => n.charAt(0).toUpperCase()).join('');

            if (signInButton) {
                signInButton.textContent = initials || displayName.charAt(0).toUpperCase();
                signInButton.title = displayName; // Show full name on hover
                signInButton.onclick = () => this.showProfileMenu();
            }

            // Update side menu user profile
            if (sideMenuUserProfile) {
                sideMenuUserProfile.style.display = 'block';
            }
            if (sideMenuUserName) {
                sideMenuUserName.textContent = displayName;
            }
            if (sideMenuUserAvatar) {
                sideMenuUserAvatar.textContent = displayName.charAt(0).toUpperCase();
            }
            // Show branding controls when logged in
            const brandingInput = document.getElementById('brandingTextInput');
            if (brandingInput) brandingInput.style.display = 'block';
            const toggleBrandingBtn = document.getElementById('toggleAchordimBrandingBtn');
            if (toggleBrandingBtn) toggleBrandingBtn.style.display = 'inline-block';
            if (sideMenuSignOut) {
                sideMenuSignOut.onclick = () => this.signOut();
            }
            if (sideMenuMySubscription) {
                sideMenuMySubscription.onclick = () => {
                    // Use global function to refresh usage data before showing modal
                    if (window.showSubscriptionModal) {
                        window.showSubscriptionModal();
                    } else {
                        const modal = document.getElementById('subscriptionModal');
                        if (modal) modal.style.display = 'flex';
                    }
                };
            }
        } else {
            // User is signed out
            if (signInButton) {
                signInButton.textContent = 'Sign In';
                signInButton.onclick = () => this.showAuthModal('login');
            }

            // Hide side menu user profile
            if (sideMenuUserProfile) {
                sideMenuUserProfile.style.display = 'none';
            }
            // Hide branding controls when logged out
            const brandingInput = document.getElementById('brandingTextInput');
            if (brandingInput) brandingInput.style.display = 'none';
            const toggleBrandingBtn = document.getElementById('toggleAchordimBrandingBtn');
            if (toggleBrandingBtn) toggleBrandingBtn.style.display = 'none';
        }
    }

    // Show profile menu
    showProfileMenu() {
        const menu = document.getElementById('profileMenu');
        if (menu) {
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        }
    }

    // Show authentication modal
    showAuthModal(mode = 'login') {
        const modal = document.getElementById('authModal');
        const loginForm = document.getElementById('loginFormContainer');
        const signupForm = document.getElementById('signupFormContainer');
        const resetForm = document.getElementById('resetFormContainer');

        if (modal) {
            modal.style.display = 'flex';

            // Hide all forms
            if (loginForm) loginForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'none';
            if (resetForm) resetForm.style.display = 'none';

            // Show requested form
            if (mode === 'login' && loginForm) {
                loginForm.style.display = 'block';
            } else if (mode === 'signup' && signupForm) {
                signupForm.style.display = 'block';
            } else if (mode === 'reset' && resetForm) {
                resetForm.style.display = 'block';
            }
        }
    }

    // Close authentication modal
    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'none';
        }
        // Clear forms
        document.querySelectorAll('#authModal form').forEach(form => form.reset());
    }

    // Show message
    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('authMessage');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `auth-message ${type}`;
            messageDiv.style.display = 'block';
            messageDiv.style.background = 'var(--text)';
            messageDiv.style.color = 'var(--bg)';
            messageDiv.style.border = '1px solid var(--border)';

            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        } else if (window.showAlert) {
            // Fallback to custom alert if message div doesn't exist
            showAlert(message);
        } else {
            // Last resort - wait for showAlert
            setTimeout(() => {
                if (window.showAlert) showAlert(message);
            }, 500);
        }
    }

    // Get user-friendly error messages
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/invalid-login-credentials': 'Invalid email or password. Please check and try again.',
            'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/too-many-requests': 'Too many attempts. Try again later.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed.',
            'auth/cancelled-popup-request': 'Sign-in was cancelled.',
            'auth/network-request-failed': 'Network error. Check your connection.'
        };
        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize
const chordsAuth = new ChordsAuthManager();
window.chordsAuth = chordsAuth;

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Close modal
    const closeBtn = document.getElementById('closeAuthModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => chordsAuth.closeAuthModal());
    }

    // Close on outside click
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) chordsAuth.closeAuthModal();
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await chordsAuth.signIn(email, password);
        });
    }

    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            await chordsAuth.signUp(email, password, name);
        });
    }

    // Reset form
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            await chordsAuth.resetPassword(email);
        });
    }

    // Form switchers
    const switchToSignup = document.getElementById('switchToSignup');
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            chordsAuth.showAuthModal('signup');
        });
    }

    const switchToLogin = document.querySelectorAll('.switchToLogin');
    switchToLogin.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            chordsAuth.showAuthModal('login');
        });
    });

    const switchToReset = document.getElementById('switchToReset');
    if (switchToReset) {
        switchToReset.addEventListener('click', (e) => {
            e.preventDefault();
            chordsAuth.showAuthModal('reset');
        });
    }

    // Google sign-in
    const googleBtns = document.querySelectorAll('.google-signin-btn');
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => chordsAuth.signInWithGoogle());
    });

    // Sign out from profile menu
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            chordsAuth.signOut();
            const menu = document.getElementById('profileMenu');
            if (menu) menu.style.display = 'none';
        });
    }

    // Close profile menu when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('profileMenu');
        const signInButton = document.getElementById('signInButton');
        if (menu && signInButton && !signInButton.contains(e.target) && !menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });
});
