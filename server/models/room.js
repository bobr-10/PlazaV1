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


const Room = mongoose.model('Room', RoomSchema);
const Info = mongoose.model('RoomInfo', RoomInfo);

module.exports = {Room, Info};