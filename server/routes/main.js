const express = require('express');
const router = express.Router();
const { Room, Info } = require('../models/room');
const User = require('../models/user');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;


const reqireAuth = (req, res, next) => {

    const token = req.cookies.token;

    if(token) {
        res.locals.isAuth = true;
        return next();
    } else {
        res.locals.isAuth = false;
    }

    next();
};

const genToken = (userId) => {
    return jwt.sign({ userId }, jwtSecret);
};




router.get('/', reqireAuth, (req, res) => {
    const locals = {
        title: "Plaza Hotel",
        isAuth: res.locals.isAuth
    }

    res.render('home', { locals });
});

router.get('/sign_in', reqireAuth, (req, res) => {
    const locals = {
        title: "Вход",
        isAuth: res.locals.isAuth
    }

    res.render('sign_in', { locals });
});

router.get('/sign_up', reqireAuth, (req, res) => {
    const locals = {
        title: "Регистрация",
        isAuth: res.locals.isAuth
    }

    res.render('sign_up', { locals });
});

router.get('/sign_out', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});




router.post('/search-rooms', reqireAuth, async (req, res) => {
    const { dateFrom, dateTo, numBeds} = req.body;

    const arrivalDate = new Date(dateFrom);
    const departureDate = new Date(dateTo);
    const today = new Date()

    const locals = {
        title: "Результаты поиска",
        isAuth: res.locals.isAuth,
        arrivalDate: dateFrom,
        departureDate: dateTo,
        numberOfGuests: numBeds
    }; 

    if (arrivalDate >= departureDate || arrivalDate < today) {
        locals.dateMessage = "Введите дату прибытия <b>корректно!"
        res.render('home', {locals});
    }
    else {
        try {

            const data = await Room.find();
            res.render('rooms', {locals, data});

        } catch (err) {
            console.log(err);
        }
    }
});

router.get('/room/:id', reqireAuth, async (req, res) => {
    const { dateFrom, dateTo, numBeds} = req.query;

    const arrivalDate = new Date(dateFrom);
    const departureDate = new Date(dateTo);

    const differenceMs = departureDate - arrivalDate;
    const differenceDays = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));

    const locals = {
        title: "Оформление номера",
        isAuth: res.locals.isAuth,
        arrivalDate: dateFrom,
        departureDate: dateTo,
        numberOfGuests: numBeds,
        daysToPay: differenceDays
    }

    try {

        const ID = req.params.id;
        const data = await Info.findOne({roomId: ID});
        const roomInfo = await Room.findOne({_id: ID});

        res.render('room_info', {data, locals, roomInfo});
        
    } catch (error) {
        console.log(error);
    }
});



router.post('/order', reqireAuth, async (req, res) => {

    const locals = {
        title: "Оформление номера",
        isAuth: res.locals.isAuth,
    }

    if (!locals.isAuth) {
        return res.redirect('sign_in');
    }

    const { dateFrom, dateTo, numBeds, roomPrice, daysToPay, additionalServicesCost, totalPrice } = req.body;

    setTimeout(async () => {

        const token = req.cookies.token;
        const decodeToken = jwt.verify(token, jwtSecret);
        const userId = decodeToken.userId;

        const user = await User.findById(userId);

        res.redirect('/profile');

    }, 5000);

});


router.post('/sign_up', reqireAuth, async (req, res) =>{
    try {

        const locals = {};
    
        const { name, surname, birthday, email, password } = req.body;

        const existingEmail = await User.findOne({ Email: email });

        if (existingEmail) {
            locals.emailMessage = 'Данный Email уже <b>зарегистрирован!</b>';
            return res.render('sign_up', { locals });
        }

        const dateOfBirth = new Date(birthday);
        const today = new Date();
        const checkYears = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

        if(dateOfBirth > checkYears) {
            locals.birthMessage = 'Вы должны быть <b>старше 18 лет!</b>'
            return res.render('sign_up', { locals });
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

        const token = genToken(newUser._id);
        res.cookie('token', token, {httpOnly: true});
    
        res.redirect('profile');
        
    } catch (error) {
        console.error(error);
    }
});

router.post('/sign_in', reqireAuth, async (req, res) => {
    try {
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

        const token = genToken(existingUser._id);
        res.cookie('token', token, {httpOnly: true});
        
        res.redirect('profile');
        
    } catch (error) {
        console.error(error);
    }
});

router.get('/profile', reqireAuth, async (req, res) => {
    
    const token = req.cookies.token;
    const decodeToken = jwt.verify(token, jwtSecret);
    const userId = decodeToken.userId;

    const user = await User.findById(userId);

    const locals = {
        title: "Профиль",
        isAuth: res.locals.isAuth,
        user: user
    }

    if (!locals.isAuth) {
        return res.redirect('/');
    }


    res.render('profile', { locals });
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