document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const startLocationInput = document.getElementById('start-location');
    const endLocationInput = document.getElementById('end-location');
    const purposeInput = document.getElementById('purpose');
    const distanceInput = document.getElementById('distance');
    const addTripButton = document.getElementById('add-trip');
    const tripList = document.getElementById('trip-list');
    const exportDataButton = document.getElementById('export-data');
    const filterInputs = document.getElementById('filter-inputs');
    const exportFilterRadios = document.getElementsByName('export-filter');

    // --- FIREBASE AUTH LOGIC START ---
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

    // Redirect to login if not logged in
    if (!auth.currentUser) {
        auth.onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'login.html';
            }
        });
    }

    function isLoggedIn() {
        return !!auth.currentUser;
    }
    function showLogin() {
        loginContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
    function showApp() {
        loginContainer.style.display = 'none';
        appContainer.style.display = '';
    }
    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            showApp();
        } else {
            showLogin();
        }
    });
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        // Firebase uses email for login, so you may want to require email or append a domain
        auth.signInWithEmailAndPassword(username, password)
            .then(() => {
                loginError.style.display = 'none';
            })
            .catch(error => {
                loginError.textContent = error.message;
                loginError.style.display = 'block';
            });
    });

    const signupForm = document.getElementById('signup-form');
    const resetForm = document.getElementById('reset-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showResetBtn = document.getElementById('show-reset');
    const cancelSignupBtn = document.getElementById('cancel-signup');
    const cancelResetBtn = document.getElementById('cancel-reset');
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

    // Profile/Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const profileClose = document.getElementById('profile-close');
    const profileSave = document.getElementById('profile-save');
    const profileEmail = document.getElementById('profile-email');
    const profileModalEmail = document.getElementById('profile-modal-email');
    const profilePassword = document.getElementById('profile-password');
    const profileMessage = document.getElementById('profile-message');

    function updateProfileUI() {
        if (auth.currentUser) {
            profileEmail.textContent = auth.currentUser.email;
            profileModalEmail.textContent = auth.currentUser.email;
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                location.reload();
            });
        });
    }
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            updateProfileUI();
            profileModal.style.display = 'flex';
            profilePassword.value = '';
            profileMessage.textContent = '';
        });
    }
    if (profileClose) {
        profileClose.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });
    }
    if (profileSave) {
        profileSave.addEventListener('click', () => {
            const newPassword = profilePassword.value;
            profileMessage.textContent = '';
            if (!newPassword || newPassword.length < 6) {
                profileMessage.textContent = 'Password must be at least 6 characters.';
                profileMessage.style.color = '#c0392b';
                return;
            }
            auth.currentUser.updatePassword(newPassword)
                .then(() => {
                    profileMessage.textContent = 'Password updated!';
                    profileMessage.style.color = '#27ae60';
                    profilePassword.value = '';
                })
                .catch(error => {
                    profileMessage.textContent = error.message;
                    profileMessage.style.color = '#c0392b';
                });
        });
    }
    // Hide modal on outside click
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) profileModal.style.display = 'none';
        });
    }
    // Update profile UI on login
    auth.onAuthStateChanged(user => {
        if (user) updateProfileUI();
    });
    // --- FIREBASE AUTH LOGIC END ---

    let trips = loadTrips();
    let editTripIndex = null;
    let currentEditIndex = null;

    renderTrips();

    addTripButton.addEventListener('click', addTrip);
    exportDataButton.addEventListener('click', exportTrips);

    exportFilterRadios.forEach(radio => {
        radio.addEventListener('change', updateFilterInputs);
    });

    function addTrip() {
        const date = dateInput.value;
        const startLocation = startLocationInput.value.trim();
        const endLocation = endLocationInput.value.trim();
        const purpose = purposeInput.value.trim();
        const distance = parseFloat(distanceInput.value);

        if (!date || isNaN(distance)) {
            alert('Please enter a valid date and distance.');
            return;
        }

        const newTrip = {
            date,
            startLocation,
            endLocation,
            purpose,
            distance
        };

        trips.push(newTrip);
        saveTrips();
        renderTrips();

        // Clear input fields after adding
        dateInput.value = '';
        startLocationInput.value = '';
        endLocationInput.value = '';
        purposeInput.value = '';
        distanceInput.value = '';
    }

    function renderTrips() {
        tripList.innerHTML = '';
        trips.forEach((trip, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${trip.date} - ${trip.distance} miles`;
            if (trip.startLocation) listItem.textContent += ` (From: ${trip.startLocation})`;
            if (trip.endLocation) listItem.textContent += ` (To: ${trip.endLocation})`;
            if (trip.purpose) listItem.textContent += ` - Purpose: ${trip.purpose}`;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'trip-actions';

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => toggleInlineEdit(index, listItem));
            actionsDiv.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteTrip(index));
            actionsDiv.appendChild(deleteButton);

            listItem.appendChild(actionsDiv);
            tripList.appendChild(listItem);
        });
    }

    function toggleInlineEdit(index, listItem) {
        // Remove any existing inline editor
        const existing = document.getElementById('inline-edit-form');
        if (existing) existing.remove();
        if (currentEditIndex === index) {
            currentEditIndex = null;
            return;
        }
        currentEditIndex = index;
        const trip = trips[index];
        const form = document.createElement('form');
        form.id = 'inline-edit-form';
        form.className = 'inline-edit-form';
        form.innerHTML = `
            <div class="inline-edit-fields">
                <input type="date" id="inline-edit-date" value="${trip.date}" required />
                <input type="text" id="inline-edit-start-location" value="${trip.startLocation || ''}" placeholder="Start Location" />
                <input type="text" id="inline-edit-end-location" value="${trip.endLocation || ''}" placeholder="End Location" />
                <input type="text" id="inline-edit-purpose" value="${trip.purpose || ''}" placeholder="Purpose" />
                <input type="number" id="inline-edit-distance" value="${trip.distance}" required placeholder="Distance (miles)" />
            </div>
            <div class="inline-edit-actions">
                <button type="submit">Save</button>
                <button type="button" id="inline-cancel">Cancel</button>
            </div>
        `;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedTrip = {
                date: form.querySelector('#inline-edit-date').value,
                startLocation: form.querySelector('#inline-edit-start-location').value.trim(),
                endLocation: form.querySelector('#inline-edit-end-location').value.trim(),
                purpose: form.querySelector('#inline-edit-purpose').value.trim(),
                distance: parseFloat(form.querySelector('#inline-edit-distance').value)
            };
            if (!updatedTrip.date || isNaN(updatedTrip.distance)) {
                alert('Please enter a valid date and distance.');
                return;
            }
            trips[index] = updatedTrip;
            saveTrips();
            renderTrips();
            currentEditIndex = null;
        });
        form.querySelector('#inline-cancel').addEventListener('click', () => {
            form.remove();
            currentEditIndex = null;
        });
        listItem.insertAdjacentElement('afterend', form);
    }

    function deleteTrip(index) {
        trips.splice(index, 1);
        saveTrips();
        renderTrips();
    }

    function saveTrips() {
        localStorage.setItem('trips', JSON.stringify(trips));
    }

    function loadTrips() {
        const storedTrips = localStorage.getItem('trips');
        return storedTrips ? JSON.parse(storedTrips) : [];
    }

    function updateFilterInputs() {
        const selected = document.querySelector('input[name="export-filter"]:checked').value;
        filterInputs.innerHTML = '';
        if (selected === 'range') {
            filterInputs.innerHTML = `
                <input type="date" id="filter-start" style="margin-left:5px;"> to
                <input type="date" id="filter-end">`;
        } else if (selected === 'month') {
            filterInputs.innerHTML = `
                <input type="month" id="filter-month" style="margin-left:5px;">`;
        } else if (selected === 'year') {
            filterInputs.innerHTML = `
                <input type="number" id="filter-year" min="1900" max="2100" placeholder="Year" style="width:80px;margin-left:5px;">`;
        }
    }
    updateFilterInputs();

    function getFilteredTrips() {
        const selected = document.querySelector('input[name="export-filter"]:checked').value;
        if (selected === 'all') {
            return trips;
        } else if (selected === 'range') {
            const start = document.getElementById('filter-start').value;
            const end = document.getElementById('filter-end').value;
            if (!start || !end) return [];
            return trips.filter(trip => trip.date >= start && trip.date <= end);
        } else if (selected === 'month') {
            const month = document.getElementById('filter-month').value;
            if (!month) return [];
            // month is in format YYYY-MM
            return trips.filter(trip => trip.date && trip.date.startsWith(month));
        } else if (selected === 'year') {
            const year = document.getElementById('filter-year').value;
            if (!year) return [];
            return trips.filter(trip => trip.date && trip.date.startsWith(year + '-'));
        }
        return trips;
    }

    function exportTrips() {
        const filteredTrips = getFilteredTrips();
        if (filteredTrips.length === 0) {
            alert('No trips to export for the selected filter.');
            return;
        }
        // Determine header text for the export
        let headerText = 'Mileage Log';
        const selected = document.querySelector('input[name="export-filter"]:checked').value;
        if (selected === 'range') {
            const start = document.getElementById('filter-start').value;
            const end = document.getElementById('filter-end').value;
            if (start && end) {
                headerText += ` (From ${start} to ${end})`;
            }
        } else if (selected === 'month') {
            const month = document.getElementById('filter-month').value;
            if (month) {
                // Correct month index: JS Date months are 0-based, but input is 1-based
                const [y, m] = month.split('-');
                const monthIndex = parseInt(m, 10) - 1; // Subtract 1 for correct month
                const monthName = new Date(y, monthIndex).toLocaleString('default', { month: 'long' });
                headerText += ` (${monthName} ${y})`;
            }
        } else if (selected === 'year') {
            const year = document.getElementById('filter-year').value;
            if (year) {
                headerText += ` (${year})`;
            }
        } else {
            headerText += ' (All Time)';
        }
        const columns = [
            { header: 'Date', dataKey: 'date' },
            { header: 'Start Location', dataKey: 'startLocation' },
            { header: 'End Location', dataKey: 'endLocation' },
            { header: 'Purpose', dataKey: 'purpose' },
            { header: 'Distance (miles)', dataKey: 'distance' }
        ];
        const rows = filteredTrips.map(trip => ({
            date: trip.date,
            startLocation: trip.startLocation,
            endLocation: trip.endLocation,
            purpose: trip.purpose,
            distance: trip.distance
        }));
        const doc = new window.jspdf.jsPDF();
        doc.text(headerText, 14, 16);
        doc.autoTable({
            columns: columns,
            body: rows,
            startY: 22,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] }
        });
        doc.save('mileage_log.pdf');
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service worker registered:', registration);
            })
            .catch(error => {
                console.log('Service worker registration failed:', error);
            });
    });
}