import express from 'express';
import { Booking } from '../utils/database.js';

import { sendBookingNotification } from '../services/emailService.js';
import { appendBookingToSheet } from '../services/googleSheetsService.js';

import { saveCustomerFromBooking } from './customers.js';

export const router = express.Router();

// GET all bookings
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Failed to fetch bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// GET bookings by date
router.get('/date/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await Booking.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        res.json(bookings);
    } catch (error) {
        console.error('Failed to fetch bookings by date:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// POST new booking
router.post('/', async (req, res) => {
    try {
        const newBookingData = req.body;

        // Derive date from items if not provided at top level
        let bookingDate = newBookingData.date;
        if (!bookingDate && newBookingData.items && newBookingData.items.length > 0) {
            bookingDate = newBookingData.items[0].date;
        }
        // Fallback to now if still missing (though specific spots usually need a specific date)
        if (!bookingDate) {
            bookingDate = new Date();
        }

        const booking = new Booking({
            ...newBookingData,
            date: bookingDate,
            id: newBookingData.id || `booking-${Date.now()}`,
            createdAt: new Date()
        });

        await booking.save();

        // Send notification email (async)
        sendBookingNotification(newBookingData).catch(err => console.error('Failed to send email:', err));

        // Save customer profile (async)
        saveCustomerFromBooking(newBookingData).catch(err => console.error('Failed to save customer:', err));

        // Sync to Google Sheets (async)
        appendBookingToSheet(newBookingData).catch(err => console.error('Failed to sync to Sheets:', err));

        res.status(201).json(booking);
    } catch (error) {
        console.error('Failed to create booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// PATCH update booking
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const booking = await Booking.findOneAndUpdate(
            { id: id },
            { $set: updates },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Failed to update booking:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Booking.findOneAndDelete({ id: id });

        if (!result) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Failed to delete booking:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});
