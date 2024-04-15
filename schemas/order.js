const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    books: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    }],
    shipping_address: {
        type: String,
        required: true
    },
    order_date: {
        type: Date,
        default: Date.now,
        required: true
    },
    total_price: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        required: true
    },
    order_status: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
        required: true
    }
}, { timestamps: true });

module.exports = orderSchema;
