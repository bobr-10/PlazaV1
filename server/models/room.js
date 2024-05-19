const mongoose = require('mongoose');
const { type } = require('os');
const { text } = require('stream/consumers');

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
    }
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