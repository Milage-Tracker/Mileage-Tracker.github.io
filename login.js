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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

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
showSignupBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    signupForm.style.display = '';
    resetForm.style.display = 'none';
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';
});
showResetBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    signupForm.style.display = 'none';
    resetForm.style.display = '';
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';
});
cancelSignupBtn.addEventListener('click', () => {
    loginForm.style.display = '';
    signupForm.style.display = 'none';
    resetForm.style.display = 'none';
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';
});
cancelResetBtn.addEventListener('click', () => {
    loginForm.style.display = '';
    signupForm.style.display = 'none';
    resetForm.style.display = 'none';
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';
});

// Login
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginError.style.display = 'none';
            window.location.href = 'index.html';
        })
        .catch(error => {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
        });
});

// Signup
signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            loginSuccess.textContent = 'Signup successful! You can now log in.';
            loginSuccess.style.display = 'block';
            loginError.style.display = 'none';
            signupForm.reset();
            setTimeout(() => {
                loginForm.style.display = '';
                signupForm.style.display = 'none';
                loginSuccess.style.display = 'none';
            }, 1500);
        })
        .catch(error => {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
            loginSuccess.style.display = 'none';
        });
});

// Reset password
resetForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value.trim();
    auth.sendPasswordResetEmail(email)
        .then(() => {
            loginSuccess.textContent = 'Password reset email sent!';
            loginSuccess.style.display = 'block';
            loginError.style.display = 'none';
            resetForm.reset();
        })
        .catch(error => {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
            loginSuccess.style.display = 'none';
        });
});

// Redirect to app if already logged in
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        window.location.href = 'index.html';
    }
});
