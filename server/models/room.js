const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const HotelSchema = new Schema({
    HotelID: {
        type: Number,
        require: true
    },

    HotelPrice: {
        type: Number,
        require: true
    },

    HotelGeo: {
        type: String,
        require: true
    },

    HotelURL: {
        type: String,
        require: true
    },

    HotelStars: {
        type: Number,
        require: true
    },

    IsBooked: {
        type: Boolean,
        require: true
    },

    isSmoke: {
        type: Boolean,
        require: true
    },

    isFitness: {
        type: Boolean,
        require: true
    },

    isAnimals: {
        type: Boolean,
        require: true
    },

    isBathroom: {
        type: Boolean,
        require: true
    },

    isParking: {
        type: Boolean,
        require: true
    },

    isGuests: {
        type: Boolean,
        require: true
    },

    isFullFood: {
        type: Boolean,
        require: true
    },

    isDesk: {
        type: Boolean,
        require: true
    },

    isTV: {
        type: Boolean,
        require: true
    },

    isInternet: {
        type: Boolean,
        require: true
    },

    isConditioner: {
        type: Boolean,
        require: true
    },

    isSwimming: {
        type: Boolean,
        require: true
    },
});


const HotelInfo = new Schema({
    HotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        require: true
    },

    ImageURLs: [{
        type: String
    }]
});

const HotelReview = new Schema({
    HotelId: {
        type: String,
        require: true
    },

    ReviewText: {
        type: String,
        require: true
    },

    ReviewRate: {
        type: Number,
        require: true
    },

    ReviewAuthorName: {
        type: String,
        require: true
    },

    ReviewAuthorMale: {
        type: String,
        require: true
    },

    ReviewDate: {
        type: Date,
        require: true
    }
});


const Room = mongoose.model('Room', HotelSchema);
const Review = mongoose.model('RoomReview', HotelReview);
const Info = mongoose.model('RoomInfo', HotelInfo);

module.exports = {Room, Info, Review};