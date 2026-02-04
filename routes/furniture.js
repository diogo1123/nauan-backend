import express from 'express';
import { readData, writeData } from '../utils/storage.js';

export const router = express.Router();
const FILE_NAME = 'furniture.json';

// GET all furniture
router.get('/', async (req, res) => {
    try {
        const furniture = await readData(FILE_NAME) || [];
        res.json(furniture);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch furniture' });
    }
});

// POST create furniture
router.post('/', async (req, res) => {
    try {
        const newItem = req.body;
        const furniture = await readData(FILE_NAME) || [];
        furniture.push(newItem);
        await writeData(FILE_NAME, furniture);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create furniture' });
    }
});

// PATCH update furniture
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        let furniture = await readData(FILE_NAME) || [];
        const index = furniture.findIndex(f => f.id === id);

        if (index === -1) return res.status(404).json({ error: 'Furniture not found' });

        furniture[index] = { ...furniture[index], ...updates };
        await writeData(FILE_NAME, furniture);
        res.json(furniture[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update furniture' });
    }
});

// DELETE furniture
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let furniture = await readData(FILE_NAME) || [];
        furniture = furniture.filter(f => f.id !== id);
        await writeData(FILE_NAME, furniture);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete furniture' });
    }
});
