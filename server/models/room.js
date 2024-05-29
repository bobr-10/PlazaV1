const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const RoomSchema = new Schema({
    RoomID: {
        type: Number,
        require: true
    },

    RoomPrice: {
        type: Number,
        require: true
    },

    RoomURL: {
        type: String,
        require: true
    },

    RoomStars: {
        type: Number,
        require: true
    },

    RoomIsBooked: {
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


const RoomInfo = new Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        require: true
    },

    imageURLs: [{
        type: String
    }]
});

const RoomReview = new Schema({
    roomId: {
        type: String,
        require: true
    },

    reviewText: {
        type: String,
        require: true
    },

    reviewRate: {
        type: Number,
        require: true
    },

    reviewAuthorName: {
        type: String,
        require: true
    },

    reviewAuthorMale: {
        type: String,
        require: true
    },

    reviewDate: {
        type: Date,
        require: true
    }
});


const Room = mongoose.model('Room', RoomSchema);
const Review = mongoose.model('RoomReview', RoomReview);
const Info = mongoose.model('RoomInfo', RoomInfo);

module.exports = {Room, Info, Review};