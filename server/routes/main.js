const express = require('express');
const router = express.Router();
const { Room, Info, Review, Filters } = require('../models/room');
const { User, UserOrder } = require('../models/user');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;


const reqireAuth = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        res.locals.isAuth = false;
        return next();
    }

    try {
        const decodeToken = jwt.verify(token, jwtSecret);
        const userId = decodeToken.userId;

        const user = await User.findById(userId);

        if (user) {
            res.locals.isAuth = true;
            res.locals.userGender = user.Gender;
        } else {
            res.locals.isAuth = false;
        }
    } catch (err) {
        console.log('Error:', err);
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
        isAuth: res.locals.isAuth,
        userGender: res.locals.userGender
    }

    res.render('home', { locals });
});

router.get('/sign_in', reqireAuth, (req, res) => {
    const locals = {
        title: "Вход",
        isAuth: res.locals.isAuth
    }

    if(locals.isAuth) {
        res.redirect('/profile');
    }

    res.render('sign_in', { locals });
});

router.get('/sign_up', reqireAuth, (req, res) => {
    const locals = {
        title: "Регистрация",
        isAuth: res.locals.isAuth,
        userGender: res.locals.userGender
    }

    if(locals.isAuth) {
        res.redirect('/profile');
    }

    res.render('sign_up', { locals });
});

router.get('/sign_out', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

router.get('/search-rooms', (req, res) => {
    res.redirect('/');
});

router.post('/search-rooms', reqireAuth, async (req, res) => {
    const { dateFrom, dateTo, numBeds} = req.body;

    const arrivalDate = new Date(dateFrom);
    const departureDate = new Date(dateTo);
    const today = new Date();

    arrivalDate.setHours(0, 0, 0, 0);
    departureDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const locals = {
        title: "Результаты поиска",
        isAuth: res.locals.isAuth,
        userGender: res.locals.userGender,
        arrivalDate: dateFrom,
        departureDate: dateTo,
        numberOfGuests: numBeds
    }; 

    if (arrivalDate < today) {

        locals.dateMessage = "Введите дату прибытия <b>корректно!</b>";
        res.render('home', { locals });

    } else if (departureDate <= arrivalDate) {

        locals.dateMessage = "Введите дату выезда <b>корректно!</b>";
        res.render('home', { locals });

    } else {
        try {
            const data = await Room.find();
            res.render('rooms', { locals, data });
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
        userGender: res.locals.userGender,
        arrivalDate: dateFrom,
        departureDate: dateTo,
        numberOfGuests: numBeds,
        daysToPay: differenceDays
    }

    try {
        const ID = req.params.id;
        const data = await Info.findOne({roomId: ID});
        const roomInfo = await Room.findOne({_id: ID});
        const roomReview = await Review.find({roomId: ID});
        const reviewCount = roomReview.length;

        res.render('room_info', {data, locals, roomInfo, roomReview, reviewCount});
        
    } catch (error) {
        console.log(error);
    }
});

router.get('/profile/order/:id', reqireAuth, async(req, res) => {
    
    const locals = {
        title: "Аренда",
        isAuth: res.locals.isAuth,
        userGender: res.locals.userGender
    };

    try {
        const roomNum = req.params.id;

        const token = req.cookies.token;
        const decodeToken = jwt.verify(token, jwtSecret);
        const userId = decodeToken.userId;
        
        const data = await UserOrder.findOne({roomNum: roomNum, userID: userId});

        if (!data) {
            return res.status(404).send('<h1>Не найдено (404)</h1>');
        }

        const review = await Review.findOne({ roomId: data.roomID});
        locals.review = review;

        res.render('order_info', {locals, data});

    } catch (error) {
        console.log(error);
    }
});

router.post('/order', reqireAuth, async (req, res) => {

    const { roomNumId, roomID, pricePerDay, daysToPay, additionalServicesCost, finalPrice, dateFrom, dateTo, numBeds} = req.body;

    const locals = {
        title: "Оформление номера",
        isAuth: res.locals.isAuth,
        userGender: res.locals.userGender
    }

    if (!locals.isAuth) {
        return res.redirect('sign_in');
    }
    else {
        setTimeout(async () => {

            const token = req.cookies.token;
            const decodeToken = jwt.verify(token, jwtSecret);
            const userId = decodeToken.userId;


            const newOrder = new UserOrder ({
                userID: userId,
                roomNum: roomNumId,
                roomID: roomID,
                arrivalDate: dateFrom,
                departureDate: dateTo,
                numberOfGuests: numBeds,
                roomPricePerDay: pricePerDay,
                roomDays: daysToPay,
                serviceCost: additionalServicesCost,
                totalPrice: finalPrice
            });

            await newOrder.save();
    
            res.redirect('/profile');
    
        }, 4000);
    }

});


router.post('/sign_up', reqireAuth, async (req, res) =>{
    try {

        const locals = {};
    
        const { name, surname, birthday, email, password, gender } = req.body;

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
            Gender: gender
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
        const locals = {
            title: "Профиль",
            userGender: res.locals.userGender
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

    const userOrders = await UserOrder.find({ userID: userId });

    const ordersWithRoomImages = [];

    for (const order of userOrders) {
        const room = await Room.findOne({ RoomID: order.roomNum });

        if (room) {
            const roomImageURL = room.RoomURL;

            ordersWithRoomImages.push({
                order: order,
                roomImageURL: roomImageURL
            });
        }
    }

    const locals = {
        title: "Профиль",
        isAuth: res.locals.isAuth,
        user: user,
        ordersWithRoomImages: ordersWithRoomImages,
        userGender: res.locals.userGender
    }

    if (!locals.isAuth) {
        return res.redirect('/');
    }

    res.render('profile', { locals });
});


router.post('/review', reqireAuth, async(req, res) => {
    const {rateNum, rateText} = req.body;

    if (!rateText || rateText.trim() === "") {
        req.flash('error', "Текст отзыва не может быть пустым!");
        return res.redirect('back');
    }

    if (!rateNum || rateNum == null) {
        req.flash('error', "Оценка отзыва должна быть от 1 до 5");
        return res.redirect('back');
    }

    const token = req.cookies.token;
    const decodeToken = jwt.verify(token, jwtSecret);
    const userId = decodeToken.userId;
    const today = new Date();

    const user = await User.findById(userId);
    const userOrders = await UserOrder.findOne({ userID: userId });

    const newReview = new Review({
        roomId: userOrders.roomID,
        reviewText: rateText,
        reviewRate: rateNum,
        reviewAuthorName: user.FirstName,
        reviewAuthorMale: user.Gender,
        reviewDate: today
    });

    await newReview.save();
    res.redirect('/profile');
});

router.get('/review', (req, res) => {
    res.redirect('/');
});


module.exports = router;


// async function insertRoomData() {
//     try {
//         const rooms = await Room.insertMany([
//             {
//                 RoomID: 1,
//                 RoomPrice: 3266,
//                 RoomURL: "/img/room-img/room_1/room_1_intro.jpg",
//                 RoomStars: 3
//             },
//             {
//                 RoomID: 2,
//                 RoomPrice: 7856,
//                 RoomURL: "/img/room-img/room_2/room_2_intro.jpg",
//                 RoomStars: 5
//             },
//             {
//                 RoomID: 3,
//                 RoomPrice: 5689,
//                 RoomURL: "/img/room-img/room_3/room_3_intro.jpg",
//                 RoomStars: 4
//             }
//         ]);


//         for (let i = 0; i < rooms.length; i++) {
//             const roomId = rooms[i]._id;
//             const roomNumber = rooms[i].RoomID;

//             await Info.create({
//                 roomId: roomId,
//                 imageURLs: [
//                     `/img/room-img/room_${roomNumber}/room_${roomNumber}_info_1.jpg`,
//                     `/img/room-img/room_${roomNumber}/room_${roomNumber}_info_2.jpg`,
//                     `/img/room-img/room_${roomNumber}/room_${roomNumber}_info_3.jpg`
//                 ]
//             });

//             console.log(`Данные успешно добавлены для комнаты с ID: ${rooms[i].RoomID}.`);
//         }
//     } catch (error) {
//         console.error("Ошибка при вставке данных:", error);
//     }
// }

// insertRoomData();