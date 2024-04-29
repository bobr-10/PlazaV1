const express = require('express');
const router = express.Router();
const { Room, Info } = require('../models/room');


router.get('/', (req, res) => {
    const locals = {
        title: "Plaza Hotel"
    }

    res.render('home', { locals });
});

router.get('/sign_in', (req, res) => {
    res.render('sign_in');
});

router.get('/sign_up', (req, res) => {
    res.render('sign_up');
});

router.get('/search-rooms', async (req, res) => {
    const locals = {
        title: "Результаты поиска"
    }

    try {
        const data = await Room.find();
        res.render('rooms', {locals, data});
    } catch (error) {
        console.log('Error');
    }

});

router.get('/room/:id', async (req, res) => {

    try {

        const ID = req.params.id;
        const data = await Info.findOne({roomId: ID});

        res.render('room_info', {data});
        
    } catch (error) {
        console.log(error);
    }
})

module.exports = router;




// async function insertRoomData() {
//     try {
//         const rooms = await Room.insertMany([
//             {
//                 RoomID: 222,
//                 RoomPrice: 5664,
//                 RoomURL: "/img/image-9.0f24218c.jpg",
//                 RoomStars: 5
//             }
//         ]);

//         const roomId = rooms[0]._id;

//         await Info.create({
//             roomId: roomId,
//             imageURLs: [
//                 "/img/image-10.8da2e0d4.jpg",
//                 "/img/image-12.fd11183b.jpg",
//                 "/img/image-9.0f24218c.jpg"
//             ]
//         });

//         console.log("Данные успешно добавлены.");
//     } catch (error) {
//         console.error("Ошибка при вставке данных:", error);
//     }
// }

// insertRoomData();