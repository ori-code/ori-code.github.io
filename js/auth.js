// Firebase Authentication Logic

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateUI();
            console.log('Auth state changed:', user ? user.email : 'Not logged in');
        });
    }

    // Sign up with email and password
    async signUp(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);

            // Update user profile with display name
            if (displayName) {
                await userCredential.user.updateProfile({
                    displayName: displayName
                });
            }

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
            const result = await auth.signInWithPopup(provider);
            this.showMessage('Signed in with Google successfully!', 'success');
            this.closeAuthModal();
            return result.user;
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    // Sign out
    async signOut() {
        try {
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
            this.showMessage('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    // Update UI based on auth state
    updateUI() {
        const authButtons = document.getElementById('authButtons');
        const userProfile = document.getElementById('userProfile');
        const userName = document.getElementById('userName');
        const protectedContent = document.querySelectorAll('.protected-content');

        if (this.currentUser) {
            // User is signed in
            if (authButtons) authButtons.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.displayName || this.currentUser.email;

            // Show protected content
            protectedContent.forEach(el => {
                el.style.display = 'block';
            });
        } else {
            // User is signed out
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';

            // Hide protected content
            protectedContent.forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    // Show authentication modal
    showAuthModal(mode = 'login') {
        const modal = document.getElementById('authModal');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const resetForm = document.getElementById('resetForm');

        if (modal) {
            modal.style.display = 'flex';

            // Hide all forms first
            if (loginForm) loginForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'none';
            if (resetForm) resetForm.style.display = 'none';

            // Show the requested form
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
    }

    // Show message to user
    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('authMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `auth-message ${type}`;
            messageEl.style.display = 'block';

            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }

    // Get user-friendly error messages
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };

        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// Export for global use
window.authManager = authManager;

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => authManager.showAuthModal('login'));
    }

    // Signup button
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.addEventListener('click', () => authManager.showAuthModal('signup'));
    }

    // Sign out button
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => authManager.signOut());
    }

    // Close modal button
    const closeModalBtn = document.getElementById('closeAuthModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => authManager.closeAuthModal());
    }

    // Close modal when clicking outside
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authManager.closeAuthModal();
            }
        });
    }

    // Login form submission
    const loginFormEl = document.querySelector('#loginForm form');
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await authManager.signIn(email, password);
        });
    }

    // Signup form submission
    const signupFormEl = document.querySelector('#signupForm form');
    if (signupFormEl) {
        signupFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            await authManager.signUp(email, password, name);
        });
    }

    // Reset password form submission
    const resetFormEl = document.querySelector('#resetForm form');
    if (resetFormEl) {
        resetFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            await authManager.resetPassword(email);
        });
    }

    // Switch between forms
    const switchToSignup = document.getElementById('switchToSignup');
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            authManager.showAuthModal('signup');
        });
    }

    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            authManager.showAuthModal('login');
        });
    }

    const switchToReset = document.getElementById('switchToReset');
    if (switchToReset) {
        switchToReset.addEventListener('click', (e) => {
            e.preventDefault();
            authManager.showAuthModal('reset');
        });
    }

    // Google sign-in buttons
    const googleLoginBtns = document.querySelectorAll('.google-signin-btn');
    googleLoginBtns.forEach(btn => {
        btn.addEventListener('click', () => authManager.signInWithGoogle());
    });
});
