const express = require('express');
const router = express.Router();
const { Room, Info } = require('../models/room');
const User = require('../models/user');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;


router.get('/', (req, res) => {
    const locals = {
        title: "Plaza Hotel"
    }

    res.render('home', { locals });
});

router.get('/sign_in', (req, res) => {
    const locals = {
        title: "Вход"
    }

    res.render('sign_in', { locals });
});

router.get('/sign_up', (req, res) => {
    const locals = {
        title: "Регистрация"
    }

    res.render('sign_up', { locals });
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
});


router.post('/sign_up', async (req, res) =>{
    try {
        const locals = {
            title: "Профиль"
        }
    
        const { name, surname, birthday, email, password } = req.body;

        const existingEmail = await User.findOne({ Email: email });

        if (existingEmail) {
            locals.emailMessage = 'Данный Email уже <b>зарегистрирован!</b>';
            return res.render('sign_up', {locals});
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        const newUser = new User ({
            FirstName: name,
            SecondName: surname,
            DateOfBirth: birthday,
            Email: email,
            Password: hashedPassword,
        });

        await newUser.save();
    
        res.render('profile', { locals });
        
    } catch (error) {
        console.error(error);
    }
});


router.post('/sign_in', async (req, res) =>{
    try {
        const locals = {
            title: "Профиль"
        }
    
        const { email, password } = req.body;

        const existingUser = await User.findOne({ Email: email });

        if (!existingUser) {
            locals.emailMessage = 'Данный Email не <b>зарегистрирован!</b>';
            return res.render('sign_in', {locals});
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.Password);

        if (!isPasswordCorrect) {
            locals.passwordMessage = '<b>Неверный</b> пароль!';
            return res.render('sign_in', {locals});
        }

        const token = jwt.sign({userId: existingUser._id}, jwtSecret)
        res.cookie('token', token, {httpOnly: true});
        
        res.render('profile', { locals });
        
    } catch (error) {
        console.error(error);
    }
});

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