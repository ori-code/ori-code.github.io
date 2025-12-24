// Firebase Authentication for ChordsAppClaude

class ChordsAuthManager {
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
            this.showMessage('Password reset email sent!', 'success');
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
            throw error;
        }
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

            if (signInButton) {
                signInButton.textContent = displayName;
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
            if (sideMenuSignOut) {
                sideMenuSignOut.onclick = () => this.signOut();
            }
            if (sideMenuMySubscription) {
                sideMenuMySubscription.onclick = () => {
                    const modal = document.getElementById('subscriptionModal');
                    if (modal) modal.style.display = 'flex';
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

            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to alert if message div doesn't exist
            alert(message);
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
            'auth/too-many-requests': 'Too many attempts. Try again later.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed.',
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
