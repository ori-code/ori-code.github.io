# Firebase Authentication Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project
4. Enable Google Analytics (optional)

## Step 2: Enable Authentication Methods

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Enable the following providers:
   - **Email/Password**: Click on it → Enable → Save
   - **Google**: Click on it → Enable → Select project support email → Save

## Step 3: Register Your Web App

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web icon** (</>) to add a web app
4. Give your app a nickname (e.g., "The Faith Sound Website")
5. **Check** "Also set up Firebase Hosting" if you want to use Firebase Hosting
6. Click "Register app"

## Step 4: Get Your Firebase Configuration

After registering your app, you'll see your Firebase configuration object. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Copy this configuration!** You'll need it in the next step.

## Step 5: Update Firebase Configuration File

1. Open the file: `js/firebase-config.js`
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY_HERE",
    authDomain: "your-actual-project.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-actual-project.appspot.com",
    messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
    appId: "YOUR_ACTUAL_APP_ID"
};
```

## Step 6: Add Authentication to Your HTML Pages

### Add to your `index.html` (or any page where you want authentication):

#### 1. Add Firebase SDK and your scripts in the `<head>` section:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

<!-- Auth CSS -->
<link rel="stylesheet" href="css/auth.css">
```

#### 2. Add your auth scripts before closing `</body>` tag:

```html
<!-- Firebase Configuration and Auth Logic -->
<script src="js/firebase-config.js"></script>
<script src="js/auth.js"></script>
```

#### 3. Add auth buttons to your navigation menu:

Replace or add to your existing navigation:

```html
<!-- Auth Buttons (shown when NOT logged in) -->
<div id="authButtons">
    <button id="loginBtn">Log In</button>
    <button id="signupBtn">Sign Up</button>
</div>

<!-- User Profile (shown when logged in) -->
<div id="userProfile" style="display: none;">
    <span id="userName">User</span>
    <button id="signOutBtn">Sign Out</button>
</div>
```

#### 4. Add the authentication modal before closing `</body>` tag:

Copy the entire modal HTML from `auth-modal-template.html` and paste it before `</body>`.

## Step 7: Protect Content (Optional)

To make content visible only to authenticated users, add the class `protected-content`:

```html
<div class="protected-content">
    <h2>Members Only</h2>
    <p>This content is only visible to logged-in users.</p>
</div>
```

This content will automatically show/hide based on authentication state.

## Step 8: Configure Authorized Domains

1. Go to Firebase Console → **Authentication** → **Settings** tab
2. Scroll to "Authorized domains"
3. Add your domains:
   - `localhost` (for testing)
   - `ori-code.github.io` (your GitHub Pages domain)
   - Any custom domain you're using

## Step 9: Test Your Authentication

1. Open your website in a browser
2. Click the "Sign Up" button
3. Create a test account with email/password
4. Try signing out and signing in again
5. Test the "Forgot Password" functionality
6. Test Google Sign-In

## Features Included

✅ **Email/Password Authentication**
- Sign up with email and password
- Sign in with email and password
- Password reset via email

✅ **Google Sign-In**
- One-click sign in with Google account

✅ **User Profile**
- Display user name when logged in
- Sign out button

✅ **Protected Content**
- Show/hide content based on authentication state
- Automatic UI updates

✅ **Error Handling**
- User-friendly error messages
- Form validation

## JavaScript API Usage

You can use the authentication system programmatically:

```javascript
// Check if user is authenticated
if (authManager.isAuthenticated()) {
    console.log('User is logged in');
}

// Get current user
const user = authManager.getCurrentUser();
if (user) {
    console.log('User email:', user.email);
    console.log('User name:', user.displayName);
}

// Sign out programmatically
authManager.signOut();

// Show login modal programmatically
authManager.showAuthModal('login');
```

## Customization

### Styling

Edit `css/auth.css` to customize the appearance:
- Change colors (search for `var(--color-primary)`)
- Adjust button styles
- Modify modal appearance

### Authentication Logic

Edit `js/auth.js` to:
- Add custom behavior after login/signup
- Integrate with your backend API
- Add additional authentication providers (Facebook, Twitter, etc.)

## Security Best Practices

1. **Never commit your Firebase config to public repos** if it contains sensitive data
2. **Set up Firebase Security Rules** in Firestore/Database
3. **Use HTTPS** for production
4. **Enable reCAPTCHA** in Firebase Auth settings to prevent abuse
5. **Monitor authentication in Firebase Console** for suspicious activity

## Troubleshooting

### "Firebase is not defined" error
- Make sure Firebase SDK scripts are loaded before your custom scripts
- Check the order of script tags in your HTML

### Authentication not working
- Check browser console for errors
- Verify your Firebase configuration is correct
- Ensure authentication methods are enabled in Firebase Console
- Check that your domain is authorized in Firebase settings

### Google Sign-In popup blocked
- Allow popups in your browser
- Or use redirect method instead of popup (modify auth.js)

## Need Help?

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- Check browser console for detailed error messages

## Next Steps

After setting up authentication, you can:
1. Store user data in Firestore
2. Add email verification
3. Implement role-based access control
4. Add more authentication providers
5. Create user profiles and dashboards

---

Happy coding! 🚀
