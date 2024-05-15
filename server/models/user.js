const mongoose = require('mongoose');
const { type } = require('os');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
    FirstName: {
        type: String,
        require: true
    },

    SecondName: {
        type: String,
        require: true
    },

    DateOfBirth: {
        type: Date,
        require: true
    },

    Email: {
        type: String,
        require: true
    },

    Password: {
        type: String,
        require: true
    }
});


const OrderSchema = new Schema ({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },

    roomNum: {
        type: Number,
        require: true
    },

    arrivalDate: {
        type: Date,
        require: true
    },

    departureDate: {
        type: Date,
        require: true
    },

    numberOfGuests: {
        type: Number,
        require: true
    },

    roomPricePerDay: {
        type: Number,
        require: true
    },

    roomDays: {
        type: Number,
        require: true
    },

    serviceCost: {
        type: Number,
        require: true
    },

    totalPrice: {
        type: Number,
        require: true
    }
});


const User = mongoose.model('User', UserSchema);
const UserOrder = mongoose.model('UserOrder', OrderSchema);

module.exports = {User, UserOrder};