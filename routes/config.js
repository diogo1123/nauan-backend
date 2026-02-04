import express from 'express';
import { readData, writeData } from '../utils/storage.js';

export const router = express.Router();
const FILE_NAME = 'config.json';
const DEFAULT_CONFIG = {
    colors: {
        primary: '#4ecdc4',
        secondary: '#1a1a1a',
        background: '#000000',
        surface: '#1a1a1a',
        text: '#ffffff',
        accent: '#4ecdc4',
    },
    branding: {
        logo: '/logo.png',
        favicon: '/favicon.ico',
        siteName: 'FINNS Beach Club',
        tagline: "World's Best Beach Club",
    },
    contact: {
        email: 'info@finnsbeachclub.com',
        phone: '+62 811 3831 6547',
        whatsapp: '+62 811 3831 6547',
        address: 'Jalan Pantai Berawa, Canggu, Bali - Indonesia',
    },
    social: {
        facebook: 'https://facebook.com/finnsbeachclub',
        instagram: 'https://instagram.com/finnsbeachclub',
        youtube: 'https://youtube.com/finnsbali',
        tiktok: 'https://tiktok.com/@finnsbeachclubbali',
        linkedin: 'https://linkedin.com/company/finns-global',
    },
    content: {
        welcome: {
            title: "THE WORLD'S BEST BEACH CLUB",
            subtitle: "Welcome to FINNS",
            description: "For all-day beach parties, sunset drinks, and the best day out. FINNS Beach Club offers it all at the most famous 170m beachfront in Canggu, Bali."
        },
        about: {
            title: "About Us",
            description: "FINNS Beach Club is the ultimate destination in Bali."
        },
        events: {
            title: "Upcoming Events",
            subtitle: "Don't miss out on the party"
        },
        booking: {
            title: "NAUAH Beach Club",
            subtitle: "Sistema de Reservas",
            stepDate: "Selecione sua Data",
            stepVenue: "Escolha seu Local",
            stepAddons: "Extras",
            stepReview: "Revisar Pedido",
            stepPayment: "Pagamento"
        }
    }
};

// GET config
router.get('/', async (req, res) => {
    try {
        let config = await readData(FILE_NAME);
        // Helper to check if config is invalid (empty array from storage default, or null)
        const isInvalid = !config || (Array.isArray(config) && config.length === 0) || !config.colors;

        if (isInvalid) {
            config = DEFAULT_CONFIG;
            await writeData(FILE_NAME, config);
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

// POST update config (replaces entirely or merges)
router.post('/', async (req, res) => {
    try {
        const newConfig = req.body;
        await writeData(FILE_NAME, newConfig);
        res.json(newConfig);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update config' });
    }
});
