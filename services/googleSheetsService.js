import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to credentials file (place in server folder)
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-credentials.json');

// Your Google Spreadsheet ID (from URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1jw9ZMMkqCOYjmVq2ztNjYkVJ14y132mb0MjY8XyM0F0';

let sheetsClient = null;

async function getGoogleSheetsClient() {
    if (sheetsClient) return sheetsClient;

    try {
        let auth;

        // 1. Try environment variable (Production/Railway)
        if (process.env.GOOGLE_CREDENTIALS_JSON) {
            try {
                const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
                auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
                console.log('✅ Google Sheets client initialized from Environment Variable');
            } catch (jsonError) {
                console.error('❌ Failed to parse GOOGLE_CREDENTIALS_JSON:', jsonError.message);
                return null;
            }
        }
        // 2. Try local file (Development)
        else if (fs.existsSync(CREDENTIALS_PATH)) {
            auth = new google.auth.GoogleAuth({
                keyFile: CREDENTIALS_PATH,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            console.log('✅ Google Sheets client initialized from Local File');
        } else {
            console.warn('⚠️ Google Sheets: Credentials not found (Env var or File). Sync disabled.');
            return null;
        }

        sheetsClient = google.sheets({ version: 'v4', auth });
        return sheetsClient;
    } catch (error) {
        console.error('❌ Failed to initialize Google Sheets:', error.message);
        return null;
    }
}

/**
 * Get or create the sheet tab for the current month
 */
async function getOrCreateMonthlySheet(sheets) {
    const now = new Date();
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const sheetTitle = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    try {
        // Get existing sheets
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        const existingSheet = spreadsheet.data.sheets.find(
            s => s.properties.title === sheetTitle
        );

        if (existingSheet) {
            return sheetTitle;
        }

        // Create new sheet for this month
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: { title: sheetTitle }
                    }
                }]
            }
        });

        // Add header row
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetTitle}!A1:J1`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[
                    'ID', 'Data', 'Hora', 'Cliente', 'Email', 'Telefone',
                    'Local', 'Extras', 'Total', 'Status'
                ]]
            }
        });

        console.log(`📊 Created new sheet: ${sheetTitle}`);
        return sheetTitle;
    } catch (error) {
        console.error('❌ Failed to get/create monthly sheet:', error.message);
        throw error;
    }
}

/**
 * Append a booking to the current month's sheet
 */
export async function appendBookingToSheet(booking) {
    try {
        const sheets = await getGoogleSheetsClient();
        if (!sheets) {
            console.log('⚠️ Google Sheets sync skipped (not configured)');
            return false;
        }

        const sheetTitle = await getOrCreateMonthlySheet(sheets);

        // Format booking data for spreadsheet
        const bookingDate = new Date(booking.createdAt || Date.now());
        const items = booking.items || [];
        const spotNames = items.map(i => i.furnitureName).join(', ') || 'N/A';
        const addons = items.flatMap(i => i.addons || []).join(', ') || 'Nenhum';

        const row = [
            booking.id || 'N/A',
            bookingDate.toLocaleDateString('pt-BR'),
            bookingDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            booking.customerName || booking.guestName || 'N/A',
            booking.customerEmail || booking.email || 'N/A',
            booking.customerPhone || booking.phone || 'N/A',
            spotNames,
            addons,
            `R$ ${(booking.totalAmount || 0).toFixed(2)}`,
            booking.status || 'Pendente'
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetTitle}!A:J`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [row]
            }
        });

        console.log(`📊 Booking ${booking.id} synced to Google Sheets (${sheetTitle})`);
        return true;
    } catch (error) {
        console.error('❌ Failed to sync booking to Google Sheets:', error.message);
        return false;
    }
}

/**
 * Update a booking status in the sheet (optional utility)
 */
export async function updateBookingStatusInSheet(bookingId, newStatus) {
    try {
        const sheets = await getGoogleSheetsClient();
        if (!sheets) return false;

        // Get all sheets in the spreadsheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        for (const sheet of spreadsheet.data.sheets) {
            const sheetTitle = sheet.properties.title;

            // Search for the booking in this sheet
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${sheetTitle}!A:J`,
            });

            const rows = response.data.values || [];
            for (let i = 0; i < rows.length; i++) {
                if (rows[i][0] === bookingId) {
                    // Update the status column (column J, index 9)
                    await sheets.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_ID,
                        range: `${sheetTitle}!J${i + 1}`,
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [[newStatus]]
                        }
                    });
                    console.log(`📊 Booking ${bookingId} status updated to: ${newStatus}`);
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('❌ Failed to update booking status in sheet:', error.message);
        return false;
    }
}
