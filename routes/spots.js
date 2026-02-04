import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const router = express.Router();

// Path to the beachClubMap.ts file
const SPOTS_FILE = path.join(__dirname, '../../src/data/beachClubMap.ts');

// GET current spots configuration
router.get('/', async (req, res) => {
    try {
        const content = await fs.readFile(SPOTS_FILE, 'utf-8');
        res.json({ success: true, content });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read spots file' });
    }
});

// PUT update spots positions
router.put('/', async (req, res) => {
    try {
        const { spots } = req.body;

        if (!spots || !Array.isArray(spots)) {
            return res.status(400).json({ error: 'Invalid spots data' });
        }

        // Read current file
        let content = await fs.readFile(SPOTS_FILE, 'utf-8');

        // Update each spot's position in the file
        for (const spot of spots) {
            // Create regex to find and replace the spot's coordinates
            // Matches: id: 'spot-XX', number: 'XX', name: 'XXXXX', type: 'XXXX', area: 'XXXX',
            //          x: XX.XX, y: XX.XX, width: XX.XX, height: XX.XX,
            const spotIdPattern = `id: '${spot.id}'`;

            // Find the line with this spot ID and update x, y, width, height
            const lines = content.split('\n');
            let inSpotBlock = false;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(spotIdPattern)) {
                    inSpotBlock = true;
                }

                if (inSpotBlock && lines[i].includes('x:') && lines[i].includes('y:') && lines[i].includes('width:') && lines[i].includes('height:')) {
                    // Replace the coordinates line
                    lines[i] = lines[i].replace(
                        /x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*width:\s*[\d.]+,\s*height:\s*[\d.]+/,
                        `x: ${spot.x}, y: ${spot.y}, width: ${spot.width}, height: ${spot.height}`
                    );
                    inSpotBlock = false;
                    break;
                }
            }

            content = lines.join('\n');
        }

        // Write the updated file
        await fs.writeFile(SPOTS_FILE, content, 'utf-8');

        res.json({ success: true, message: 'Spots updated successfully' });
    } catch (error) {
        console.error('Error updating spots:', error);
        res.status(500).json({ error: 'Failed to update spots file' });
    }
});
