// login.js
// Firebase Auth logic for login/signup/reset page

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyClCS--vMtgqiAJ5I4DOoo_7ZofzgygF3w",
    authDomain: "milage-tracker-aeb71.firebaseapp.com",
    projectId: "milage-tracker-aeb71",
    storageBucket: "milage-tracker-aeb71.firebasestorage.app",
    messagingSenderId: "1033990559453",
    appId: "1:1033990559453:web:71f88d296c878800012d34"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function () {
    // Show login container on page load
    var loginContainer = document.getElementById('login-container');
    if (loginContainer) loginContainer.style.display = 'block';

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const resetForm = document.getElementById('reset-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showResetBtn = document.getElementById('show-reset');
    const cancelSignupBtn = document.getElementById('cancel-signup');
    const cancelResetBtn = document.getElementById('cancel-reset');
    const loginError = document.getElementById('login-error');
    const loginSuccess = document.getElementById('login-success');

    // Toggle forms
    if (showSignupBtn) showSignupBtn.addEventListener('click', () => {
        if (loginForm) loginForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'block';
        if (resetForm) resetForm.style.display = 'none';
        if (loginError) loginError.style.display = 'none';
        if (loginSuccess) loginSuccess.style.display = 'none';
    });
    if (showResetBtn) showResetBtn.addEventListener('click', () => {
        if (loginForm) loginForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'none';
        if (resetForm) resetForm.style.display = 'block';
        if (loginError) loginError.style.display = 'none';
        if (loginSuccess) loginSuccess.style.display = 'none';
    });
    if (cancelSignupBtn) cancelSignupBtn.addEventListener('click', () => {
        if (loginForm) loginForm.style.display = 'block';
        if (signupForm) signupForm.style.display = 'none';
        if (resetForm) resetForm.style.display = 'none';
        if (loginError) loginError.style.display = 'none';
        if (loginSuccess) loginSuccess.style.display = 'none';
    });
    if (cancelResetBtn) cancelResetBtn.addEventListener('click', () => {
        if (loginForm) loginForm.style.display = 'block';
        if (signupForm) signupForm.style.display = 'none';
        if (resetForm) resetForm.style.display = 'none';
        if (loginError) loginError.style.display = 'none';
        if (loginSuccess) loginSuccess.style.display = 'none';
    });

    // Login
    if (loginForm) loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        if (!email || !password) {
            if (loginError) {
                loginError.textContent = 'Please enter both email and password.';
                loginError.style.display = 'block';
            }
            return;
        }
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                if (loginError) loginError.style.display = 'none';
                window.location.href = 'index.html';
            })
            .catch(error => {
                if (loginError) {
                    loginError.textContent = error.message;
                    loginError.style.display = 'block';
                }
            });
    });

    // Signup
    if (signupForm) signupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        if (!email || !password) {
            if (loginError) {
                loginError.textContent = 'Please enter both email and password.';
                loginError.style.display = 'block';
            }
            return;
        }
        if (password.length < 6) {
            if (loginError) {
                loginError.textContent = 'Password must be at least 6 characters.';
                loginError.style.display = 'block';
            }
            return;
        }
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                if (loginSuccess) {
                    loginSuccess.textContent = 'Signup successful! You can now log in.';
                    loginSuccess.style.display = 'block';
                }
                if (loginError) loginError.style.display = 'none';
                signupForm.reset();
                setTimeout(() => {
                    if (loginForm) loginForm.style.display = '';
                    if (signupForm) signupForm.style.display = 'none';
                    if (loginSuccess) loginSuccess.style.display = 'none';
                }, 1500);
            })
            .catch(error => {
                if (loginError) {
                    loginError.textContent = error.message;
                    loginError.style.display = 'block';
                }
                if (loginSuccess) loginSuccess.style.display = 'none';
            });
    });

    // Reset password
    if (resetForm) resetForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('reset-email').value.trim();
        if (!email) {
            if (loginError) {
                loginError.textContent = 'Please enter your email address.';
                loginError.style.display = 'block';
            }
            return;
        }
        auth.sendPasswordResetEmail(email)
            .then(() => {
                if (loginSuccess) {
                    loginSuccess.textContent = 'Password reset email sent!';
                    loginSuccess.style.display = 'block';
                }
                if (loginError) loginError.style.display = 'none';
                resetForm.reset();
            })
            .catch(error => {
                if (loginError) {
                    loginError.textContent = error.message;
                    loginError.style.display = 'block';
                }
                if (loginSuccess) loginSuccess.style.display = 'none';
            });
    });

    // Redirect to app if already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'index.html';
        }
    });
});