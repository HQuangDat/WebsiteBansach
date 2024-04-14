const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
    author_name: {
        type: String,
        required: true,
        unique:true
    },
    dateofbirth:{
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = authorSchema;
