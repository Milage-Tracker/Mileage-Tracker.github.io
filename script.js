document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const startLocationInput = document.getElementById('start-location');
    const endLocationInput = document.getElementById('end-location');
    const purposeInput = document.getElementById('purpose');
    const distanceInput = document.getElementById('distance');
    const tripList = document.getElementById('trip-list');

    // --- FIREBASE AUTH LOGIC START ---
    const firebaseConfig = {
        apiKey: "AIzaSyClCS--vMtgqiAJ5I4DOoo_7ZofzgygF3w",
        authDomain: "milage-tracker-aeb71.firebaseapp.com",
        projectId: "milage-tracker-aeb71",
        storageBucket: "milage-tracker-aeb71.firebasestorage.app",
        messagingSenderId: "1033990559453",
        appId: "1:1033990559453:web:71f88d296c878800012d34"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Initialize Firestore
    const db = firebase.firestore();

    const auth = firebase.auth();

    // --- HIDE APP UNTIL LOGGED IN ---
    const appContainer = document.getElementById('app-container');
    const googleSigninContainer = document.getElementById('google-signin-container');
    function showAppForUser(user) {
        if (user) {
            // Hide Google sign-in, show app
            if (googleSigninContainer) googleSigninContainer.style.display = 'none';
            if (appContainer) {
                // Show everything except the Google sign-in
                Array.from(appContainer.children).forEach(child => {
                    if (child !== googleSigninContainer) child.style.display = '';
                });
            }
        } else {
            // Show only Google sign-in
            if (googleSigninContainer) googleSigninContainer.style.display = '';
            if (appContainer) {
                Array.from(appContainer.children).forEach(child => {
                    if (child !== googleSigninContainer) child.style.display = 'none';
                });
            }
        }
    }
    // Initial hide (in case of flash)
    if (appContainer) {
        Array.from(appContainer.children).forEach(child => {
            if (child !== googleSigninContainer) child.style.display = 'none';
        });
    }
    // Listen for auth state
    auth.onAuthStateChanged(user => {
        showAppForUser(user);
        if (!user) {
            // Optionally, clear profile info
            if (profileEmail) profileEmail.textContent = '';
            if (profileModalEmail) profileModalEmail.textContent = '';
        }
    });

    // Profile/Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    const profileModal = document.getElementById('profile-modal');
    const profileClose = document.getElementById('profile-close');
    const profileSave = document.getElementById('profile-save');
    const profileEmail = document.getElementById('profile-email');
    const profileModalEmail = document.getElementById('profile-modal-email');
    const profilePassword = document.getElementById('profile-password');
    const profileMessage = document.getElementById('profile-message');

    function updateProfileUI() {
        if (auth.currentUser && profileEmail && profileModalEmail) {
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
    if (profileModal && profilePassword && profileMessage) {
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                updateProfileUI();
                profileModal.style.display = 'flex';
                profilePassword.value = '';
                profileMessage.textContent = '';
            });
        }
    }
    if (profileClose && profileModal) {
        profileClose.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });
    }
    if (profileSave && profilePassword && profileMessage) {
        profileSave.addEventListener('click', () => {
            const newPassword = profilePassword.value;
            profileMessage.textContent = '';
            if (!newPassword || newPassword.length < 6) {
                profileMessage.textContent = 'Password must be at least 6 characters.';
                profileMessage.style.color = '#c0392b';
                return;
            }
            if (auth.currentUser) {
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
            }
        });
    }
    // Hide modal on outside click
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) profileModal.style.display = 'none';
        });
    }

    const profileDelete = document.createElement('button');
    profileDelete.id = 'profile-delete';
    profileDelete.textContent = 'Delete Account';
    // Removed inline styles, now handled by CSS
    if (profileModal) {
        // Insert before the message div
        const msgDiv = profileModal.querySelector('#profile-message');
        if (msgDiv) profileModal.querySelector('div').appendChild(profileDelete);
    }

    // Delete account logic
    if (profileDelete && profileMessage) {
        profileDelete.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
            profileMessage.textContent = '';
            profileMessage.style.color = '#c0392b';
            try {
                const user = auth.currentUser;
                if (!user) throw new Error('No user logged in.');
                // Delete all trips from Firestore
                const tripsCol = db.collection('users').doc(user.uid).collection('trips');
                const tripsSnap = await tripsCol.get();
                const batch = db.batch();
                tripsSnap.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                // Delete user document
                await db.collection('users').doc(user.uid).delete();
                // Delete Firebase Auth account
                await user.delete();
                alert('Account deleted.');
                window.location.href = 'index.html';
            } catch (err) {
                if (err.code === 'auth/requires-recent-login') {
                    profileMessage.textContent = 'Please log out and log in again before deleting your account.';
                } else {
                    profileMessage.textContent = err.message || 'Error deleting account.';
                }
            }
        });
    }
    // --- FIREBASE AUTH LOGIC END ---

    // Hamburger menu toggle for mobile nav
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            const isOpen = navLinks.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', isOpen);
        });
        // Optional: close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
                navLinks.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // --- LOCAL STORAGE TRIP LOGIC ---
    function getLocalTrips() {
        const local = localStorage.getItem('localTrips');
        return local ? JSON.parse(local) : [];
    }
    function saveLocalTrips(trips) {
        localStorage.setItem('localTrips', JSON.stringify(trips));
    }
    function addTripToLocal(trip) {
        const trips = getLocalTrips();
        trips.push(trip);
        saveLocalTrips(trips);
    }
    function clearLocalTrips() {
        localStorage.removeItem('localTrips');
    }

    // --- FIRESTORE TRIP STORAGE START ---
    // Helper: Get Firestore trips collection for current user
    function getTripsCollection() {
        if (!auth.currentUser) return null;
        return db.collection('users').doc(auth.currentUser.uid).collection('trips');
    }

    // Load trips from Firestore
    async function loadTripsFromFirestore() {
        const tripsCol = getTripsCollection();
        if (!tripsCol) return [];
        const snapshot = await tripsCol.orderBy('date').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Save a new trip to Firestore
    async function addTripToFirestore(trip) {
        const tripsCol = getTripsCollection();
        if (!tripsCol) return;
        await tripsCol.add(trip);
    }

    // Update a trip in Firestore
    async function updateTripInFirestore(id, trip) {
        const tripsCol = getTripsCollection();
        if (!tripsCol) return;
        await tripsCol.doc(id).set(trip);
    }

    // Delete a trip from Firestore
    async function deleteTripFromFirestore(id) {
        const tripsCol = getTripsCollection();
        if (!tripsCol) return;
        await tripsCol.doc(id).delete();
    }

    let trips = [];
    let currentEditIndex = null;

    // On login, merge local trips into Firestore
    async function mergeLocalTripsToFirestore() {
        const localTrips = getLocalTrips();
        if (localTrips.length && auth.currentUser) {
            for (const trip of localTrips) {
                await addTripToFirestore(trip);
            }
            clearLocalTrips();
        }
    }

    // Wait for auth before loading trips
    // Modified: also load from localStorage if logged out
    async function loadTripsForCurrentState() {
        if (auth.currentUser) {
            await mergeLocalTripsToFirestore();
            return await loadTripsFromFirestore();
        } else {
            return getLocalTrips();
        }
    }

    const authBtn = document.getElementById('auth-btn');
    const localStorageMessage = document.getElementById('local-storage-message');
    const loginSignupLink = document.getElementById('login-signup-link');

    function updateAuthUI(user) {
        // Always re-query the profileBtn in case DOM changed
        const profileBtn = document.getElementById('profile-btn');
        if (authBtn) {
            if (user) {
                authBtn.textContent = 'Logout';
                authBtn.classList.remove('login-btn');
                authBtn.classList.add('logout-btn');
                authBtn.onclick = async () => {
                    await auth.signOut();
                    updateAuthUI(null);
                    if (profileModal) profileModal.style.display = 'none';
                };
                if (profileBtn) profileBtn.style.display = 'inline-block';
            } else {
                authBtn.textContent = 'Login / Sign Up';
                authBtn.classList.remove('logout-btn');
                authBtn.classList.add('login-btn');
                authBtn.onclick = () => {
                    window.location.href = 'login.html';
                };
                if (profileBtn) profileBtn.style.display = 'none';
            }
        }
        if (localStorageMessage) {
            localStorageMessage.style.display = user ? 'none' : '';
        }
    }

    auth.onAuthStateChanged(async user => {
        updateAuthUI(user);
        if (user) {
            updateProfileUI();
        }
        trips = await loadTripsForCurrentState();
        renderTrips();
    });

    if (loginSignupLink) {
        loginSignupLink.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'login.html';
        };
    }

    async function renderTrips() {
        if (!tripList) return;
        // Save open dropdowns
        const openYears = new Set();
        const openMonths = new Set();
        document.querySelectorAll('.trip-year-dropdown[open]').forEach(d => openYears.add(d.querySelector('summary').textContent));
        document.querySelectorAll('.trip-month-dropdown[open]').forEach(d => {
            const parentYear = d.closest('.trip-year-dropdown')?.querySelector('summary')?.textContent;
            const month = d.querySelector('summary').textContent;
            if (parentYear && month) openMonths.add(parentYear + '|' + month);
        });

        tripList.innerHTML = '';
        if (!trips.length) return;

        // Get current year and month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-based

        // Group trips by year and month
        const grouped = {};
        trips.forEach((trip, index) => {
            const [year, month] = trip.date.split('-');
            if (!grouped[year]) grouped[year] = {};
            if (!grouped[year][month]) grouped[year][month] = [];
            grouped[year][month].push({ ...trip, index });
        });

        // Render current month trips inside a box styled like dropdowns
        const thisMonthTrips = grouped[currentYear] && grouped[currentYear][String(currentMonth).padStart(2, '0')];
        if (thisMonthTrips && thisMonthTrips.length) {
            const thisMonthDetails = document.createElement('details');
            thisMonthDetails.className = 'trip-year-dropdown';
            thisMonthDetails.open = true;
            const thisMonthSummary = document.createElement('summary');
            // Add month name and year in parenthesis
            const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' });
            thisMonthSummary.textContent = `This Month (${monthName} ${currentYear})`;
            thisMonthDetails.appendChild(thisMonthSummary);
            thisMonthTrips.forEach(({ index, ...trip }) => {
                const listItem = createTripListItem(trip, index);
                thisMonthDetails.appendChild(listItem);
            });
            tripList.appendChild(thisMonthDetails);
        }

        // Render dropdowns for other years/months
        Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
            if (Number(year) === currentYear) {
                const months = Object.keys(grouped[year]).filter(m => Number(m) !== currentMonth);
                if (months.length) {
                    const yearDetails = document.createElement('details');
                    yearDetails.className = 'trip-year-dropdown';
                    const yearSummary = document.createElement('summary');
                    yearSummary.textContent = year;
                    yearDetails.appendChild(yearSummary);
                    // Restore open state
                    if (openYears.has(year)) yearDetails.open = true;
                    months.sort((a, b) => b - a).forEach(month => {
                        const monthDetails = document.createElement('details');
                        monthDetails.className = 'trip-month-dropdown';
                        const monthSummary = document.createElement('summary');
                        const monthNum = parseInt(month, 10);
                        const monthName = new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long' });
                        monthSummary.textContent = monthName;
                        monthDetails.appendChild(monthSummary);
                        // Restore open state
                        if (openMonths.has(year + '|' + monthName)) monthDetails.open = true;
                        grouped[year][month].forEach(({ index, ...trip }) => {
                            const listItem = createTripListItem(trip, index);
                            monthDetails.appendChild(listItem);
                        });
                        yearDetails.appendChild(monthDetails);
                    });
                    tripList.appendChild(yearDetails);
                }
            } else {
                const yearDetails = document.createElement('details');
                yearDetails.className = 'trip-year-dropdown';
                const yearSummary = document.createElement('summary');
                yearSummary.textContent = year;
                yearDetails.appendChild(yearSummary);
                if (openYears.has(year)) yearDetails.open = true;
                Object.keys(grouped[year]).sort((a, b) => b - a).forEach(month => {
                    const monthDetails = document.createElement('details');
                    monthDetails.className = 'trip-month-dropdown';
                    const monthSummary = document.createElement('summary');
                    const monthNum = parseInt(month, 10);
                    const monthName = new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long' });
                    monthSummary.textContent = monthName;
                    monthDetails.appendChild(monthSummary);
                    if (openMonths.has(year + '|' + monthName)) monthDetails.open = true;
                    grouped[year][month].forEach(({ index, ...trip }) => {
                        const listItem = createTripListItem(trip, index);
                        monthDetails.appendChild(listItem);
                    });
                    yearDetails.appendChild(monthDetails);
                });
                tripList.appendChild(yearDetails);
            }
        });
    }

    function createTripListItem(trip, index) {
        const listItem = document.createElement('li');
        listItem.textContent = `${trip.date} - ${trip.distance} miles`;
        if (trip.startLocation) listItem.textContent += ` (From: ${trip.startLocation})`;
        if (trip.endLocation) listItem.textContent += ` (To: ${trip.endLocation})`;
        if (trip.purpose) listItem.textContent += ` - Purpose: ${trip.purpose}`;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'trip-actions';

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => toggleInlineEdit(index, listItem));
        actionsDiv.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteTrip(index));
        actionsDiv.appendChild(deleteButton);

        listItem.appendChild(actionsDiv);
        return listItem;
    }

    async function toggleInlineEdit(index, listItem) {
        const trip = trips[index];
        const form = document.createElement('form');
        form.className = 'inline-edit-form';
        form.innerHTML = `
            <div class="inline-edit-fields">
                <input type="date" id="inline-edit-date" value="${trip.date}" required />
                <input type="text" id="inline-edit-start-location" value="${trip.startLocation || ''}" placeholder="Start Location" />
                <input type="text" id="inline-edit-end-location" value="${trip.endLocation || ''}" placeholder="End Location" />
                <input type="text" id="inline-edit-purpose" value="${trip.purpose || ''}" placeholder="Purpose" />
                <input type="number" id="inline-edit-distance" value="${trip.distance}" required placeholder="Distance (miles)" step="0.01" min="0" />
            </div>
            <div class="inline-edit-actions">
                <button type="submit">Save</button>
                <button type="button" id="inline-cancel">Cancel</button>
            </div>
        `;
        listItem.innerHTML = '';
        listItem.appendChild(form);
        form.addEventListener('submit', async (e) => {
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
            if (auth.currentUser) {
                await updateTripInFirestore(trip.id, updatedTrip);
                trips = await loadTripsFromFirestore();
            } else {
                const localTrips = getLocalTrips();
                localTrips[index] = updatedTrip;
                saveLocalTrips(localTrips);
                trips = localTrips;
            }
            renderTrips();
        });
        form.querySelector('#inline-cancel').addEventListener('click', () => {
            renderTrips();
        });
    }

    async function deleteTrip(index) {
        const trip = trips[index];
        if (!confirm('Are you sure you want to delete this trip?')) return;
        if (auth.currentUser) {
            await deleteTripFromFirestore(trip.id);
            trips = await loadTripsFromFirestore();
        } else {
            const localTrips = getLocalTrips();
            localTrips.splice(index, 1);
            saveLocalTrips(localTrips);
            trips = localTrips;
        }
        renderTrips();
    }

    // Add Trip Modal logic
    const showAddTripBtn = document.getElementById('show-add-trip');
    const addTripModal = new bootstrap.Modal(document.getElementById('addTripModal'));
    const addTripForm = document.getElementById('add-trip-form');
    const cancelAddTripBtn = document.getElementById('cancel-add-trip');

    function openAddTripModal() {
        if (addTripModal) addTripModal.show();
    }
    function closeAddTripModal() {
        if (addTripModal) addTripModal.hide();
        if (addTripForm) addTripForm.reset();
    }
    if (cancelAddTripBtn) cancelAddTripBtn.addEventListener('click', closeAddTripModal);
    const addTripModalElement = document.getElementById('addTripModal');
    if (addTripModalElement) {
        addTripModalElement.addEventListener('click', (e) => {
            if (e.target === addTripModalElement) closeAddTripModal();
        });
    }
    if (addTripForm) {
        addTripForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const date = document.getElementById('date').value;
            const startLocation = document.getElementById('start-location').value.trim();
            const endLocation = document.getElementById('end-location').value.trim();
            const purpose = document.getElementById('purpose').value.trim();
            const distance = parseFloat(document.getElementById('distance').value);
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
            if (auth.currentUser) {
                await addTripToFirestore(newTrip);
                trips = await loadTripsFromFirestore();
            } else {
                addTripToLocal(newTrip);
                trips = getLocalTrips();
            }
            renderTrips();
            closeAddTripModal();
        });
    }

    // PDF Export logic
    function addExportPdfButton() {
        if (document.getElementById('export-pdf')) return;
        const btn = document.createElement('button');
        btn.id = 'export-pdf';
        btn.textContent = 'Export Trips to PDF';
        btn.addEventListener('click', exportTripsToPdf);
        const filters = document.getElementById('export-filters');
        if (filters && filters.parentNode) filters.parentNode.insertBefore(btn, filters.nextSibling);
    }

    // --- Export Range Logic ---
    const exportRange = document.getElementById('export-range');
    const customRangeFields = document.getElementById('custom-range-fields');
    if (exportRange && customRangeFields) {
        exportRange.addEventListener('change', function () {
            if (this.value === 'custom') {
                customRangeFields.style.display = '';
            } else {
                customRangeFields.style.display = 'none';
            }
        });
    }

    function getExportDateRange() {
        const now = new Date();
        let start, end;
        switch ((exportRange && exportRange.value) || 'this-month') {
            case 'this-month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last-month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this-year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case 'last-year':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31);
                break;
            case 'custom':
                const s = document.getElementById('custom-start').value;
                const e = document.getElementById('custom-end').value;
                if (s && e) {
                    start = new Date(s);
                    end = new Date(e);
                }
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        // Set time to cover whole days
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    function filterTripsByDate(trips, range) {
        if (!range.start || !range.end) return trips;
        return trips.filter(trip => {
            const d = new Date(trip.date);
            return d >= range.start && d <= range.end;
        });
    }

    function getExportHeading(rangeType, range) {
        const now = new Date();
        switch (rangeType) {
            case 'this-month':
                return `Miles Driven Log\nThis Month (${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()})`;
            case 'last-month': {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return `Miles Driven Log\nLast Month (${lastMonth.toLocaleString('default', { month: 'long' })} ${lastMonth.getFullYear()})`;
            }
            case 'this-year':
                return `Miles Driven Log\nThis Year (${now.getFullYear()})`;
            case 'last-year':
                return `Miles Driven Log\nLast Year (${now.getFullYear() - 1})`;
            case 'custom':
                if (range.start && range.end) {
                    return `Miles Driven Log\n${range.start.toLocaleDateString()} to ${range.end.toLocaleDateString()}`;
                }
                return 'Miles Driven Log\nCustom Range';
            default:
                return 'Miles Driven Log';
        }
    }

    function getPrintFilename(rangeType, range) {
        const now = new Date();
        switch (rangeType) {
            case 'this-month':
                return `MilesDriven_${now.toLocaleString('default', { month: 'long' })}_${now.getFullYear()}`;
            case 'last-month': {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return `MilesDriven_${lastMonth.toLocaleString('default', { month: 'long' })}_${lastMonth.getFullYear()}`;
            }
            case 'this-year':
                return `MilesDriven_${now.getFullYear()}`;
            case 'last-year':
                return `MilesDriven_${now.getFullYear() - 1}`;
            case 'all-time':
                return 'MilesDriven_All_Time';
            case 'custom':
                if (range.start && range.end) {
                    // Use the original input values to avoid timezone shift
                    const s = document.getElementById('custom-start-modal').value;
                    const e = document.getElementById('custom-end-modal').value;
                    if (s && e) {
                        return `MilesDriven_${s.replace(/-/g, '_')}_to_${e.replace(/-/g, '_')}`;
                    }
                }
                return 'MilesDriven_Custom_Range';
            default:
                return 'MilesDriven';
        }
    }

    async function exportTripsToPdf() {
        if (!trips.length) {
            alert('No trips to export.');
            return;
        }
        const rangeType = (exportRange && exportRange.value) || 'this-month';
        const range = getExportDateRange();
        const filteredTrips = filterTripsByDate(trips, range);
        if (!filteredTrips.length) {
            alert('No trips found for the selected range.');
            return;
        }
        // Group filtered trips by year and month for export
        const grouped = {};
        filteredTrips.forEach(trip => {
            const [year, month] = trip.date.split('-');
            if (!grouped[year]) grouped[year] = {};
            if (!grouped[year][month]) grouped[year][month] = [];
            grouped[year][month].push(trip);
        });
        // Build PDF content with styled tables
        const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
        let y = 40;
        let page = 1;
        const addFooter = () => {
            const pageHeight = doc.internal.pageSize.height || 792; // fallback for letter size
            doc.setFontSize(9);
            doc.setTextColor('#888');
            const dateStr = 'Exported: ' + new Date().toLocaleString();
            doc.text(dateStr, 40, pageHeight - 20);
            doc.text('Page ' + page, 520, pageHeight - 20);
        };
        doc.setFontSize(20);
        doc.setTextColor('#21618c');
        doc.text(getExportHeading(rangeType, range), 40, y);
        y += 50;
        Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
            doc.setFontSize(16);
            doc.setTextColor('#2980b9');
            doc.text(year, 40, y);
            y += 22;
            Object.keys(grouped[year]).sort((a, b) => b - a).forEach(month => {
                const monthNum = parseInt(month, 10);
                const monthName = new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long' });
                doc.setFontSize(14);
                doc.setTextColor('#2980b9');
                doc.text('  ' + monthName, 50, y);
                y += 18;
                // Table headers with blue background, bold
                doc.setFontSize(11);
                doc.setTextColor('#fff');
                doc.setFillColor(41, 128, 185); // #2980b9
                doc.setFont(undefined, 'bold');
                const headers = ['Date', 'Distance', 'From', 'To', 'Purpose'];
                let x = 60;
                let colWidths = [90, 80, 90, 90, 120]; // Increase Date and Distance columns
                let headerHeight = 18;
                doc.rect(x - 2, y - headerHeight + 4, colWidths.reduce((a, b) => a + b, 0) + 8, headerHeight, 'F');
                headers.forEach((h, i) => {
                    doc.text(h, x + 4, y);
                    x += colWidths[i];
                });
                doc.setFont(undefined, 'normal');
                y += headerHeight;
                // Table rows with alternating background
                let monthTotal = 0;
                grouped[year][month].forEach((trip, idx) => {
                    x = 60;
                    const row = [
                        trip.date,
                        trip.distance + ' mi',
                        trip.startLocation || '',
                        trip.endLocation || '',
                        trip.purpose || ''
                    ];
                    monthTotal += parseFloat(trip.distance) || 0;
                    // Calculate wrapped lines for each cell and max lines for the row
                    let cellLinesArr = [];
                    let maxLines = 1;
                    row.forEach((cell, i) => {
                        let cellText = String(cell);
                        let maxCellWidth = colWidths[i] - 8;
                        let lines = [];
                        let remaining = cellText;
                        while (remaining.length > 0) {
                            let fit = remaining.length;
                            while (fit > 0 && doc.getTextWidth(remaining.slice(0, fit)) > maxCellWidth) {
                                fit--;
                            }
                            if (fit === 0) fit = 1;
                            lines.push(remaining.slice(0, fit));
                            remaining = remaining.slice(fit);
                        }
                        cellLinesArr.push(lines);
                        if (lines.length > maxLines) maxLines = lines.length;
                    });
                    let rowHeight = maxLines * 14 + 8; // Increase line height and add extra vertical padding
                    // Alternate row color, draw after maxLines is known
                    if (idx % 2 === 0) {
                        doc.setFillColor(234, 243, 250); // #eaf3fa
                        doc.rect(x - 2, y - 12, colWidths.reduce((a, b) => a + b, 0) + 8, rowHeight + 8, 'F');
                    }
                    doc.setTextColor('#222');
                    let cellX = x;
                    row.forEach((cell, i) => {
                        let lines = cellLinesArr[i];
                        // Center vertically in the row
                        let totalTextHeight = lines.length * 14;
                        let startY = y + ((rowHeight - totalTextHeight) / 2) + 2;
                        let lineY = startY;
                        lines.forEach(line => {
                            const textX = cellX + 10 + (colWidths[i] - 20 - doc.getTextWidth(line)) / 2;
                            doc.text(line, textX, lineY, { align: 'left' });
                            lineY += 14;
                        });
                        cellX += colWidths[i];
                    });
                    y += rowHeight + 2; // Add extra space between rows
                    if (y > 780) {
                        addFooter();
                        doc.addPage();
                        page++;
                        y = 40;
                        doc.setFontSize(14);
                        doc.setTextColor('#2980b9');
                    }
                });
                // Summary row for month
                doc.setFont(undefined, 'bold');
                doc.setTextColor('#21618c');
                doc.text('Total Miles:', 60, y + 8); // Add vertical space before total
                doc.text(monthTotal.toFixed(2) + ' mi', 134 + 60, y + 8, { align: 'right' });
                doc.setFont(undefined, 'normal');
                doc.setTextColor('#222');
                y += 26; // Add more space after total row
                if (y > 780) {
                    addFooter();
                    doc.addPage();
                    page++;
                    y = 40;
                }
                y += 10;
            });
            y += 8;
        });
        addFooter();
        doc.save(getPrintFilename(rangeType, range) + '.pdf');
    }

    // Export PDF Modal logic
    const showExportModalBtn = document.getElementById('show-export-modal');
    const exportModal = new bootstrap.Modal(document.getElementById('export-modal'));
    const exportRangeModal = document.getElementById('export-range-modal');
    const customRangeFieldsModal = document.getElementById('custom-range-fields-modal');
    const customStartModal = document.getElementById('custom-start-modal');
    const customEndModal = document.getElementById('custom-end-modal');
    const exportPdfModalBtn = document.getElementById('export-pdf-modal');

    function openExportModal() {
        exportModal.show();
        if (exportRangeModal) exportRangeModal.value = 'this-month';
        if (customRangeFieldsModal) customRangeFieldsModal.style.display = 'none';
    }
    function closeExportModal() {
        exportModal.hide();
        if (customStartModal) customStartModal.value = '';
        if (customEndModal) customEndModal.value = '';
    }
    if (showExportModalBtn) showExportModalBtn.addEventListener('click', openExportModal);

    if (exportRangeModal && customRangeFieldsModal) {
        exportRangeModal.addEventListener('change', function () {
            if (this.value === 'custom') {
                customRangeFieldsModal.style.display = '';
            } else {
                customRangeFieldsModal.style.display = 'none';
            }
        });
    }

    function getExportDateRangeModal() {
        const now = new Date();
        let start, end;
        switch ((exportRangeModal && exportRangeModal.value) || 'this-month') {
            case 'this-month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last-month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this-year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case 'last-year':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31);
                break;
            case 'all-time':
                start = null;
                end = null;
                break;
            case 'custom':
                const s = customStartModal && customStartModal.value;
                const e = customEndModal && customEndModal.value;
                if (s && e) {
                    start = new Date(s);
                    end = new Date(e);
                }
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    function filterTripsByDateModal(trips, range) {
        if (!range.start || !range.end) return trips;
        return trips.filter(trip => {
            const d = new Date(trip.date);
            return d >= range.start && d <= range.end;
        });
    }

    function getExportHeadingModal(rangeType, range) {
        const now = new Date();
        switch (rangeType) {
            case 'this-month':
                return `Miles Driven Log\nThis Month (${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()})`;
            case 'last-month': {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return `Miles Driven Log\nLast Month (${lastMonth.toLocaleString('default', { month: 'long' })} ${lastMonth.getFullYear()})`;
            }
            case 'this-year':
                return `Miles Driven Log\nThis Year (${now.getFullYear()})`;
            case 'last-year':
                return `Miles Driven Log\nLast Year (${now.getFullYear() - 1})`;
            case 'all-time':
                return 'Miles Driven Log\nAll Time';
            case 'custom':
                if (range.start && range.end) {
                    // Use the original input values to avoid timezone shift
                    const s = document.getElementById('custom-start-modal').value;
                    const e = document.getElementById('custom-end-modal').value;
                    if (s && e) {
                        return `Miles Driven Log\n${s} to ${e}`;
                    }
                }
                return 'Miles Driven Log\nCustom Range';
            default:
                return 'Miles Driven Log';
        }
    }

    if (exportPdfModalBtn) {
        exportPdfModalBtn.addEventListener('click', async () => {
            if (!trips.length) {
                alert('No trips to export.');
                return;
            }
            const rangeType = (exportRangeModal && exportRangeModal.value) || 'this-month';
            const range = getExportDateRangeModal();
            const filteredTrips = filterTripsByDateModal(trips, range);
            if (!filteredTrips.length) {
                alert('No trips found for the selected range.');
                return;
            }
            // Group filtered trips by year and month for export
            const grouped = {};
            filteredTrips.forEach(trip => {
                const [year, month] = trip.date.split('-');
                if (!grouped[year]) grouped[year] = {};
                if (!grouped[year][month]) grouped[year][month] = [];
                grouped[year][month].push(trip);
            });
            // Build PDF content with styled tables
            const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
            let y = 40;
            let page = 1;
            const addFooter = () => {
                const pageHeight = doc.internal.pageSize.height || 792; // fallback for letter size
                doc.setFontSize(9);
                doc.setTextColor('#888');
                const dateStr = 'Exported: ' + new Date().toLocaleString();
                doc.text(dateStr, 40, pageHeight - 20);
                doc.text('Page ' + page, 520, pageHeight - 20);
            };
            doc.setFontSize(20);
            doc.setTextColor('#21618c');
            doc.text(getExportHeadingModal(rangeType, range), 40, y);
            y += 50;
            Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
                doc.setFontSize(16);
                doc.setTextColor('#2980b9');
                doc.text(year, 40, y);
                y += 22;
                Object.keys(grouped[year]).sort((a, b) => b - a).forEach(month => {
                    const monthNum = parseInt(month, 10);
                    const monthName = new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long' });
                    doc.setFontSize(14);
                    doc.setTextColor('#2980b9');
                    doc.text('  ' + monthName, 50, y);
                    y += 18;
                    // Table headers with blue background, bold
                    doc.setFontSize(11);
                    doc.setTextColor('#fff');
                    doc.setFillColor(41, 128, 185); // #2980b9
                    doc.setFont(undefined, 'bold');
                    const headers = ['Date', 'Distance', 'From', 'To', 'Purpose'];
                    let x = 60;
                    let colWidths = [90, 80, 90, 90, 120]; // Increase Date and Distance columns
                    let headerHeight = 18;
                    doc.rect(x - 2, y - headerHeight + 4, colWidths.reduce((a, b) => a + b, 0) + 8, headerHeight, 'F');
                    headers.forEach((h, i) => {
                        doc.text(h, x + 4, y);
                        x += colWidths[i];
                    });
                    doc.setFont(undefined, 'normal');
                    y += headerHeight;
                    // Table rows with alternating background
                    let monthTotal = 0;
                    grouped[year][month].forEach((trip, idx) => {
                        x = 60;
                        const row = [
                            trip.date,
                            trip.distance + ' mi',
                            trip.startLocation || '',
                            trip.endLocation || '',
                            trip.purpose || ''
                        ];
                        monthTotal += parseFloat(trip.distance) || 0;
                        // Calculate wrapped lines for each cell and max lines for the row
                        let cellLinesArr = [];
                        let maxLines = 1;
                        row.forEach((cell, i) => {
                            let cellText = String(cell);
                            let maxCellWidth = colWidths[i] - 8;
                            let lines = [];
                            let remaining = cellText;
                            while (remaining.length > 0) {
                                let fit = remaining.length;
                                while (fit > 0 && doc.getTextWidth(remaining.slice(0, fit)) > maxCellWidth) {
                                    fit--;
                                }
                                if (fit === 0) fit = 1;
                                lines.push(remaining.slice(0, fit));
                                remaining = remaining.slice(fit);
                            }
                            cellLinesArr.push(lines);
                            if (lines.length > maxLines) maxLines = lines.length;
                        });
                        let rowHeight = maxLines * 14 + 8; // Increase line height and add extra vertical padding
                        // Alternate row color, draw after maxLines is known
                        if (idx % 2 === 0) {
                            doc.setFillColor(234, 243, 250); // #eaf3fa
                            doc.rect(x - 2, y - 12, colWidths.reduce((a, b) => a + b, 0) + 8, rowHeight + 8, 'F');
                        }
                        doc.setTextColor('#222');
                        let cellX = x;
                        row.forEach((cell, i) => {
                            let lines = cellLinesArr[i];
                            // Center vertically in the row
                            let totalTextHeight = lines.length * 14;
                            let startY = y + ((rowHeight - totalTextHeight) / 2) + 2;
                            let lineY = startY;
                            lines.forEach(line => {
                                const textX = cellX + 10 + (colWidths[i] - 20 - doc.getTextWidth(line)) / 2;
                                doc.text(line, textX, lineY, { align: 'left' });
                                lineY += 14;
                            });
                            cellX += colWidths[i];
                        });
                        y += rowHeight + 2; // Add extra space between rows
                        if (y > 780) {
                            addFooter();
                            doc.addPage();
                            page++;
                            y = 40;
                            doc.setFontSize(14);
                            doc.setTextColor('#2980b9');
                        }
                    });
                    // Summary row for month
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor('#21618c');
                    doc.text('Total Miles:', 60, y + 8); // Add vertical space before total
                    doc.text(monthTotal.toFixed(2) + ' mi', 134 + 60, y + 8, { align: 'right' });
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor('#222');
                    y += 26; // Add more space after total row
                    if (y > 780) {
                        addFooter();
                        doc.addPage();
                        page++;
                        y = 40;
                    }
                    y += 10;
                });
                y += 8;
            });
            addFooter();
            doc.save(getPrintFilename(rangeType, range) + '.pdf');
            closeExportModal();
        });
    }

    addExportPdfButton();
});