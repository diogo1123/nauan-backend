import express from 'express';
import { readData, writeData } from '../utils/storage.js';

export const router = express.Router();
const FILE_NAME = 'venues.json';

// GET all venues
router.get('/', async (req, res) => {
    try {
        const venues = await readData(FILE_NAME) || [];
        res.json(venues);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch venues' });
    }
});

// POST create venue
router.post('/', async (req, res) => {
    try {
        const newVenue = req.body;
        const venues = await readData(FILE_NAME) || [];
        venues.push(newVenue);
        await writeData(FILE_NAME, venues);
        res.status(201).json(newVenue);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create venue' });
    }
});

// PATCH update venue
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        let venues = await readData(FILE_NAME) || [];
        const index = venues.findIndex(v => v.id === id);

        if (index === -1) return res.status(404).json({ error: 'Venue not found' });

        venues[index] = { ...venues[index], ...updates };
        await writeData(FILE_NAME, venues);
        res.json(venues[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update venue' });
    }
});

// DELETE venue
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let venues = await readData(FILE_NAME) || [];
        venues = venues.filter(v => v.id !== id);
        await writeData(FILE_NAME, venues);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete venue' });
    }
});
