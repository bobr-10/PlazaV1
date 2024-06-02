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

    Gender: {
        type: String,
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
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },

    HotelName: {
        type: String,
        require: true
    },

    HotelID: {
        type: String, 
        require: true
    },

    HotelNum: {
        type: Number,
        require: true
    },

    ArrivalDate: {
        type: Date,
        require: true
    },

    DepartureDate: {
        type: Date,
        require: true
    },

    NumberOfGuests: {
        type: Number,
        require: true
    },

    HotelPricePerDay: {
        type: Number,
        require: true
    },

    HotelDays: {
        type: Number,
        require: true
    },

    ServiceCost: {
        type: Number,
        require: true
    },

    TotalPrice: {
        type: Number,
        require: true
    }
});


const User = mongoose.model('User', UserSchema);
const UserOrder = mongoose.model('UserOrder', OrderSchema);

module.exports = {User, UserOrder};