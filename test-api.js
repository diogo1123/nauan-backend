
const API_URL = 'http://localhost:3001/api';

async function test() {
    console.log('Starting API Tests...');

    // 1. Availability
    try {
        const res = await fetch(`${API_URL}/availability`);
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            console.log('Availability Response:', JSON.stringify(data).substring(0, 100) + '...');
            if (Array.isArray(data)) console.log(`✅ GET /availability passed. Count: ${data.length}`);
            else console.log('❌ GET /availability failed. Not an array.');
        } catch (e) {
            console.log('❌ GET /availability failed. Invalid JSON:', text.substring(0, 100));
        }
    } catch (e) {
        console.log('❌ Connection failed:', e.message);
        return;
    }

    // 2. Create Booking
    let bookingId;
    try {
        const booking = {
            id: "TEST-BOOKING-1",
            customerName: "Test User",
            totalAmount: 100000,
            status: "pending"
        };
        const res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        const data = await res.json();
        bookingId = data.id;
        console.log(`Created booking: ${JSON.stringify(data)}`);
        if (res.status === 201 || res.status === 200) console.log('✅ POST /bookings passed');
    } catch (e) {
        console.log('❌ POST /bookings failed', e);
    }

    // 3. Get Bookings
    try {
        const res = await fetch(`${API_URL}/bookings`);
        const data = await res.json();
        if (Array.isArray(data)) {
            const found = data.find(b => b.id === bookingId);
            if (found) console.log('✅ GET /bookings passed (found created booking)');
            else console.log('❌ GET /bookings failed (created booking not found)');
        } else {
            console.log('❌ GET /bookings response is not array:', JSON.stringify(data));
        }
    } catch (e) {
        console.log('❌ GET /bookings failed', e);
    }

    // 4. Update Booking
    if (bookingId) {
        try {
            const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'confirmed' })
            });
            const data = await res.json();
            if (data.status === 'confirmed') console.log('✅ PATCH /bookings passed');
            else console.log('❌ PATCH /bookings failed:', data);
        } catch (e) {
            console.log('❌ PATCH /bookings failed', e);
        }

        // 5. Delete Booking
        try {
            const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
                method: 'DELETE'
            });
            if (res.status === 200) console.log('✅ DELETE /bookings passed');
            else console.log('❌ DELETE /bookings failed');
        } catch (e) {
            console.log('❌ DELETE /bookings failed', e);
        }
    }
}

test();
