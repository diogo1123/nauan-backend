
import express from 'express';
import { readData, writeData } from '../utils/storage.js';

export const router = express.Router();

const FILE_NAME = 'customers.json';

// GET all customers
router.get('/', async (req, res) => {
    try {
        const customers = await readData(FILE_NAME);
        res.json(customers || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// POST create/update customer (Upsert logic based on email)
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, whatsapp } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        let customers = await readData(FILE_NAME) || [];

        const existingIndex = customers.findIndex(c => c.email === email);
        const newCustomer = {
            id: existingIndex >= 0 ? customers[existingIndex].id : Date.now().toString(),
            name,
            email,
            phone,
            whatsapp: whatsapp || phone, // Use phone as whatsapp if not provided
            lastBooking: new Date().toISOString(),
            totalBookings: existingIndex >= 0 ? (customers[existingIndex].totalBookings || 0) + 1 : 1
        };

        if (existingIndex >= 0) {
            customers[existingIndex] = { ...customers[existingIndex], ...newCustomer };
        } else {
            customers.push(newCustomer);
        }

        await writeData(FILE_NAME, customers);
        res.status(200).json(newCustomer);
    } catch (error) {
        console.error("Error saving customer:", error);
        res.status(500).json({ error: 'Failed to save customer' });
    }
});

/**
 * Helper function to save customer from booking data internally
 */
export const saveCustomerFromBooking = async (bookingData) => {
    try {
        const { customerName, customerEmail, customerPhone } = bookingData;
        if (!customerEmail) return;

        let customers = await readData(FILE_NAME) || [];
        const index = customers.findIndex(c => c.email === customerEmail);

        if (index >= 0) {
            // Update existing
            customers[index].lastBooking = new Date().toISOString();
            customers[index].totalBookings = (customers[index].totalBookings || 0) + 1;
            // Update phone/name if provided and different
            if (customerName) customers[index].name = customerName;
            if (customerPhone) {
                customers[index].phone = customerPhone;
                customers[index].whatsapp = customerPhone;
            }
        } else {
            // Create new
            customers.push({
                id: Date.now().toString(),
                name: customerName || 'Cliente',
                email: customerEmail,
                phone: customerPhone || '',
                whatsapp: customerPhone || '',
                lastBooking: new Date().toISOString(),
                totalBookings: 1
            });
        }

        await writeData(FILE_NAME, customers);
        console.log(`Customer saved: ${customerEmail}`);
    } catch (error) {
        console.error('Failed to auto-save customer from booking:', error);
    }
};
