import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { readData, writeData } from '../utils/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const router = express.Router();
const FILE_NAME = 'media.json';

// Configure upload storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// GET all media
router.get('/', async (req, res) => {
    try {
        const media = await readData(FILE_NAME) || [];
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch media' });
    }
});

// POST create media (JSON only) - keeping for compatibility or video links
router.post('/', async (req, res) => {
    try {
        const newItem = req.body;
        const media = await readData(FILE_NAME) || [];
        media.push(newItem);
        await writeData(FILE_NAME, media);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create media' });
    }
});

// POST upload file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Construct public URL
        // Assumes server is running on port 3001 and serving statics from /uploads
        const fileUrl = `http://localhost:3001/uploads/${req.file.filename}`;

        res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// PATCH update media
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        let media = await readData(FILE_NAME) || [];
        const index = media.findIndex(m => m.id === id);

        if (index === -1) return res.status(404).json({ error: 'Media not found' });

        media[index] = { ...media[index], ...updates };
        await writeData(FILE_NAME, media);
        res.json(media[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update media' });
    }
});

// DELETE media
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let media = await readData(FILE_NAME) || [];
        media = media.filter(m => m.id !== id);
        await writeData(FILE_NAME, media);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete media' });
    }
});
