import express from 'express';
import { readData, writeData } from '../utils/storage.js';

export const router = express.Router();

const FILE_NAME = 'availability.json';

// --- SEEDING LOGIC (Copied/Adapted from frontend) ---
// --- SEEDING LOGIC ---
const generateAvailabilityData = async () => {
    let furnitureData = await readData('furniture.json');

    // Seed furniture if missing
    if (!furnitureData || furnitureData.length === 0) {
        console.log('Seeding initial furniture data...');
        furnitureData = [
            { id: 'party-bed-1', name: 'PARTY bed A1', area: 'pool', capacity: 6, basePrice: 2000000, isActive: true },
            { id: 'party-bed-2', name: 'PARTY bed A2', area: 'pool', capacity: 6, basePrice: 2000000, isActive: true },
            { id: 'party-bed-3', name: 'PARTY bed A3', area: 'pool', capacity: 6, basePrice: 2000000, isActive: true },
            { id: 'party-super-1', name: 'Party Super Bed B1', area: 'pool', capacity: 10, basePrice: 3500000, isActive: true },
            { id: 'party-super-2', name: 'Party Super Bed B2', area: 'pool', capacity: 10, basePrice: 3500000, isActive: true },
            { id: 'vip-bed-1', name: 'VIP BED 1', area: 'vip', capacity: 6, basePrice: 2500000, isActive: true },
            { id: 'vip-bed-2', name: 'VIP BED 2', area: 'vip', capacity: 6, basePrice: 2500000, isActive: true },
            { id: 'vip-cabana-1', name: 'VIP CABANA 1', area: 'vip', capacity: 15, basePrice: 12500000, isActive: true },
            { id: 'garden-table-1', name: 'Garden Table 1', area: 'garden', capacity: 8, basePrice: 1000000, isActive: true },
            { id: 'garden-table-2', name: 'Garden Table 2', area: 'garden', capacity: 8, basePrice: 1000000, isActive: true },
            { id: 'garden-bed-1', name: 'Garden Bed 1', area: 'garden', capacity: 6, basePrice: 1500000, isActive: true },
            { id: 'garden-bed-2', name: 'Garden Bed 2', area: 'garden', capacity: 6, basePrice: 1500000, isActive: true },
        ];
        await writeData('furniture.json', furnitureData);
    }

    const slots = [];
    const today = new Date();

    // Generate for next 90 days
    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const date = new Date(today);
        date.setDate(today.getDate() + dayOffset);
        const dateStr = date.toISOString().split('T')[0];

        furnitureData.forEach(furniture => {
            if (!furniture.isActive) return;

            // Random booked count (0 to capacity) - lower prob of full booking for demo
            const booked = Math.random() > 0.7 ? Math.floor(Math.random() * (furniture.capacity + 1)) : 0;

            // Dynamic pricing based on day
            let priceMultiplier = 1;
            const dayOfWeek = date.getDay();

            // Weekend pricing (Friday, Saturday, Sunday)
            if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
                priceMultiplier = 1.2;
            }

            // Peak season (December - January)
            const month = date.getMonth();
            if (month === 11 || month === 0) {
                priceMultiplier *= 1.3;
            }

            slots.push({
                id: `${furniture.id}-${dateStr}`,
                date: dateStr,
                furnitureId: furniture.id,
                furnitureName: furniture.name,
                area: furniture.area,
                capacity: furniture.capacity,
                booked,
                price: Math.round(furniture.basePrice * priceMultiplier),
                isAvailable: booked < furniture.capacity,
            });
        });
    }

    return slots;
};
// ----------------------------------------------------

// GET availability (creates if missing)
router.get('/', async (req, res) => {
    try {
        let slots = await readData(FILE_NAME);

        if (!slots || slots.length === 0) {
            console.log('Seeding initial availability data...');
            slots = await generateAvailabilityData();
            await writeData(FILE_NAME, slots);
        }

        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

// POST book a slot (update specific slot)
router.post('/book', async (req, res) => {
    try {
        const { furnitureId, date } = req.body;

        const slots = await readData(FILE_NAME);
        const slotIndex = slots.findIndex(s => s.furnitureId === furnitureId && s.date === date);

        if (slotIndex === -1) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        const slot = slots[slotIndex];
        if (!slot.isAvailable) {
            return res.status(400).json({ error: 'Slot is not available' });
        }

        // Update slot
        slot.booked += 1;
        slot.isAvailable = slot.booked < slot.capacity;

        slots[slotIndex] = slot;
        await writeData(FILE_NAME, slots);

        res.json({ success: true, slot });
    } catch (error) {
        res.status(500).json({ error: 'Failed to book slot' });
    }
});

// POST release a booking (undo)
router.post('/release', async (req, res) => {
    try {
        const { furnitureId, date } = req.body;

        const slots = await readData(FILE_NAME);
        const slotIndex = slots.findIndex(s => s.furnitureId === furnitureId && s.date === date);

        if (slotIndex === -1) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        const slot = slots[slotIndex];
        // Update slot
        slot.booked = Math.max(0, slot.booked - 1);
        slot.isAvailable = true; // Always available if we free up space? simplified logic

        slots[slotIndex] = slot;
        await writeData(FILE_NAME, slots);

        res.json({ success: true, slot });
    } catch (error) {
        res.status(500).json({ error: 'Failed to release slot' });
    }
});
