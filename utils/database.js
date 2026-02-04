import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://diogoooalbuquerque_db_user:GrVaskJduXXeMSGt@cluster0.dtgfztw.mongodb.net/nauan-beach-club?retryWrites=true&w=majority';

let isConnected = false;

export async function connectDB() {
    if (isConnected) {
        console.log('📦 Using existing MongoDB connection');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        throw error;
    }
}

// Booking Schema
const bookingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    items: [{
        furnitureId: String,
        furnitureName: String,
        price: Number,
        addons: [String]
    }],
    totalAmount: Number,
    status: { type: String, default: 'pending' },
    paymentMethod: String,
    couponCode: String,
    discount: Number,
    createdAt: { type: Date, default: Date.now }
});

// Customer Schema
const customerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    email: { type: String, unique: true },
    phone: String,
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    lastBooking: Date
});

// Config Schema
const configSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed
});

export const Booking = mongoose.model('Booking', bookingSchema);
export const Customer = mongoose.model('Customer', customerSchema);
export const Config = mongoose.model('Config', configSchema);

export default { connectDB, Booking, Customer, Config };
