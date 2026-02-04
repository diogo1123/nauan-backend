import express from 'express';
import { readData, writeData } from '../utils/storage.js';

import { sendBookingNotification } from '../services/emailService.js';
import { appendBookingToSheet } from '../services/googleSheetsService.js';

import { saveCustomerFromBooking } from './customers.js';

export const router = express.Router(); // Export as router

const FILE_NAME = 'bookings.json';

// GET all bookings
router.get('/', async (req, res) => {
    try {
        const bookings = await readData(FILE_NAME);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// POST new booking
router.post('/', async (req, res) => {
    try {
        const newBooking = req.body;
        // validation could be added here

        const bookings = await readData(FILE_NAME);
        bookings.push(newBooking);

        await writeData(FILE_NAME, bookings);

        // Send notification email (async)
        sendBookingNotification(newBooking).catch(err => console.error('Failed to send email in background:', err));

        // Save customer profile (async)
        saveCustomerFromBooking(newBooking).catch(err => console.error('Failed to save customer in background:', err));

        // Sync to Google Sheets (async)
        appendBookingToSheet(newBooking).catch(err => console.error('Failed to sync to Google Sheets:', err));

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// PATCH update booking
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const bookings = await readData(FILE_NAME);
        const index = bookings.findIndex(b => b.id === id);

        if (index === -1) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        bookings[index] = { ...bookings[index], ...updates };
        await writeData(FILE_NAME, bookings);

        res.json(bookings[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const bookings = await readData(FILE_NAME);
        const filteredBookings = bookings.filter(b => b.id !== id);

        if (bookings.length === filteredBookings.length) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        await writeData(FILE_NAME, filteredBookings);

        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});
