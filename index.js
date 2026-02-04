import express from 'express';
import cors from 'cors';
import { router as bookingsRouter } from './routes/bookings.js';
import { router as availabilityRouter } from './routes/availability.js';
import { router as venuesRouter } from './routes/venues.js';
import { router as furnitureRouter } from './routes/furniture.js';
import { router as mediaRouter } from './routes/media.js';
import { router as configRouter } from './routes/config.js';
import { router as spotsRouter } from './routes/spots.js';
import { router as paymentsRouter } from './routes/payments.js';
import { router as customersRouter } from './routes/customers.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000; // Changed back to 3000

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(express.json());
// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'))); // Serve from root public/uploads

// Routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/venues', venuesRouter);
app.use('/api/furniture', furnitureRouter);
app.use('/api/media', mediaRouter);
app.use('/api/config', configRouter);
app.use('/api/spots', spotsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/customers', customersRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Root route - serve index.html for all non-API routes (Express 5 syntax)
app.get('{*path}', (req, res) => {
    // skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        // If it's an API route that wasn't caught by the previous routers, return 404 JSON
        return res.status(404).json({ error: 'Not Found' });
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data storage location: ${path.join(__dirname, 'data')}`);
});

server.on('error', (e) => {
    console.error('Server failed to start:', e);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
