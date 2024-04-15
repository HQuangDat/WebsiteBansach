const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique:true
    },
    password:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true,
    }
    ,
    phone_number: {
        type: String,
        required: true,
    },
    role:{
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports =  userSchema;
