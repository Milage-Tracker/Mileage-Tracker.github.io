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

    let trips = loadTrips();
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

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.style.marginLeft = '10px';
            deleteButton.addEventListener('click', () => deleteTrip(index));
            listItem.appendChild(deleteButton);

            tripList.appendChild(listItem);
        });
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

        // Prepare table columns and rows
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

        // Create PDF
        const doc = new window.jspdf.jsPDF();
        doc.text('Mileage Log', 14, 16);
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