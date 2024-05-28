const express = require('express');
const router = express.Router();
const { Room, Info, Review, Filters } = require('../models/room');
const { User, UserOrder } = require('../models/user');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

const ITEMS_PER_PAGE = 9;

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

router.get('/search-rooms/page/:page', reqireAuth, async (req, res) => {
    const currentPage = parseInt(req.params.page) || 1;

    if (!req.session.searchParams) {
        req.flash('error', "Параметры поиска не найдены. Пожалуйста, начните поиск заново.");
        return res.redirect('/');
    }

    try {
        const { dateFrom, dateTo, numBeds } = req.session.searchParams;
        const arrivalDate = new Date(dateFrom);
        const departureDate = new Date(dateTo);
        const today = new Date();

        arrivalDate.setHours(0, 0, 0, 0);
        departureDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const totalRooms = await Room.countDocuments();

        const locals = {
            title: "Результаты поиска",
            isAuth: res.locals.isAuth,
            userGender: res.locals.userGender,
            arrivalDate: dateFrom,
            departureDate: dateTo,
            numberOfGuests: numBeds,
            currentPage: currentPage,
            totalPages: Math.ceil(totalRooms / ITEMS_PER_PAGE),
            maxItems: ITEMS_PER_PAGE,
            roomsCount: totalRooms
        };

        if (arrivalDate < today) {
            req.flash('error', "Введите дату прибытия <b>корректно!</b>")
            return res.redirect('back');
        } else if (departureDate <= arrivalDate) {
            req.flash('error', "Введите дату выезда <b>корректно!</b>")
            return res.redirect('back');
        } else {
            const data = await Room.find()
                .skip((currentPage - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)

            const remainingRooms = totalRooms - ((currentPage - 1) * ITEMS_PER_PAGE + data.length);
            locals.remainingRooms = remainingRooms > 0 ? remainingRooms : 0;

            res.render('rooms', { locals, data });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

router.post('/search-rooms/page/:page', reqireAuth, async (req, res) => {
    const currentPage = parseInt(req.params.page) || 1;
    const { dateFrom, dateTo, numBeds } = req.body;

    req.session.searchParams = {
        dateFrom,
        dateTo,
        numBeds
    }

    try {
        const arrivalDate = new Date(dateFrom);
        const departureDate = new Date(dateTo);
        const today = new Date();

        arrivalDate.setHours(0, 0, 0, 0);
        departureDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const totalRooms = await Room.countDocuments();

        const locals = {
            title: "Результаты поиска",
            isAuth: res.locals.isAuth,
            userGender: res.locals.userGender,
            arrivalDate: dateFrom,
            departureDate: dateTo,
            numberOfGuests: numBeds,
            currentPage: currentPage,
            totalPages: Math.ceil(totalRooms / ITEMS_PER_PAGE),
            maxItems: ITEMS_PER_PAGE,
            roomsCount: totalRooms
        };

        if (arrivalDate < today) {
            req.flash('error', "Введите дату прибытия <b>корректно!</b>")
            return res.redirect('back');
        } else if (departureDate <= arrivalDate) {
            req.flash('error', "Введите дату выезда <b>корректно!</b>")
            return res.redirect('back');
        } else {
            const data = await Room.find()
                .skip((currentPage - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)

            const remainingRooms = totalRooms - ((currentPage - 1) * ITEMS_PER_PAGE + data.length);
            locals.remainingRooms = remainingRooms > 0 ? remainingRooms : 0;

            res.render('rooms', { locals, data });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});


router.post('/apply-filters', async (req, res) => {

    const { dateFrom, dateTo, numBeds, priceMin, priceMax, stars } = req.body;

    req.session.searchParams = {
        dateFrom,
        dateTo,
        numBeds,
        priceMin,
        priceMax,
        stars
    };

});


router.get('/room/:id', reqireAuth, async (req, res) => {
    const { dateFrom, dateTo, numBeds } = req.session.searchParams;

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
        req.flash('error', "<b>Авторизуйтесь</b> для оформления заказа");
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

            const updateBooking = await Room.findOneAndUpdate (
                {_id: roomID},
                {RoomIsBooked: true},
                {new: true}
            );
    
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
            req.flash('error', 'Данный Email уже <b>зарегистрирован!</b>');
            return res.redirect('back');
        }

        const dateOfBirth = new Date(birthday);
        const today = new Date();
        const checkYears = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

        if(dateOfBirth > checkYears) {
            req.flash('error', 'Вы должны быть <b> от 18 лет и старше!</b>');
            return res.redirect('back');
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
        // req.flash('error', "<b>Авторизуйтесь</b> для оформления заказа");
        // return res.redirect('sign_in');

        if (!existingUser) {
            req.flash('error', 'Данный Email не <b>зарегистрирован!</b>')
            return res.redirect('back');
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.Password);

        if (!isPasswordCorrect) {
            req.flash('error', '<b>Неверный</b> пароль!')
            return res.redirect('back');
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
//                 RoomStars: 3,
//                 RoomIsBooked: false
//             },
//             {
//                 RoomID: 2,
//                 RoomPrice: 7856,
//                 RoomURL: "/img/room-img/room_2/room_2_intro.jpg",
//                 RoomStars: 5,
//                 RoomIsBooked: false
//             },
//             {
//                 RoomID: 3,
//                 RoomPrice: 5689,
//                 RoomURL: "/img/room-img/room_3/room_3_intro.jpg",
//                 RoomStars: 4,
//                 RoomIsBooked: false
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

//             await Filters.create({
//                 RoomID: roomId,
//                 isSmoke: Math.random() < 0.5,
//                 isFitness: Math.random() < 0.5,
//                 isAnimals: Math.random() < 0.5,
//                 isBathroom: Math.random() < 0.5,
//                 isParking: Math.random() < 0.5,
//                 isGuests: Math.random() < 0.5,
//                 isFullFood: Math.random() < 0.5,
//                 isDesk: Math.random() < 0.5,
//                 isTV: Math.random() < 0.5,
//                 isInternet: Math.random() < 0.5,
//                 isConditioner: Math.random() < 0.5,
//                 isSwimming: Math.random() < 0.5,
//             })

//             console.log(`Данные успешно добавлены для комнаты с ID: ${rooms[i].RoomID}.`);
//         }
//     } catch (error) {
//         console.error("Ошибка при вставке данных:", error);
//     }
// }

// insertRoomData();