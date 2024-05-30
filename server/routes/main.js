const express = require('express');
const router = express.Router();
const { Room, Info, Review} = require('../models/room');
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

const checkBooking = async (req, res, next) => {
    const { id } = req.params; // ID комнаты
    const token = req.cookies.token;

    if (!token) {
        req.flash('error', "<b>Авторизуйтесь</b> для оформления заказа");
        return res.redirect('/sign_in');
    }

    try {
        const decodeToken = jwt.verify(token, jwtSecret);
        const userId = decodeToken.userId;

        const existingBooking = await UserOrder.findOne({ userID: userId, roomID: id });
        res.locals.existingBooking = existingBooking;

        next();
    } catch (err) {
        console.log('Error:', err);
        req.flash('error', 'Произошла ошибка. Попробуйте снова.');
        res.redirect('/profile');
    }
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

    res.render('process', { locals });
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
        const { dateFrom, dateTo, numBeds, priceMin, priceMax, stars, smoke, fitness, animals, bathroom,
            parking, guests, fullfood, desk, tv, internet, conditioner, swimming } = req.session.searchParams;

        // Основной фильтр по цене и количеству звезд
        let mainFilterQuery = {
            $and: []
        };

        if (stars) {
            mainFilterQuery.$and.push({ RoomStars: parseInt(stars) });
        }

        if (priceMin && priceMax) {
            mainFilterQuery.$and.push({ RoomPrice: { $gte: parseFloat(priceMin), $lte: parseFloat(priceMax) } });
        }

        if (mainFilterQuery.$and.length === 0) {
            delete mainFilterQuery.$and;
        }

        console.log('Main Filter Query:', mainFilterQuery);

        const initialRooms = await Room.find(mainFilterQuery);
        console.log('Initial Rooms:', initialRooms.length);

        // Дополнительные фильтры по чекбоксам
        const additionalFilters = [];

        if (smoke) additionalFilters.push({ isSmoke: true });
        if (fitness) additionalFilters.push({ isFitness: true });
        if (animals) additionalFilters.push({ isAnimals: true });
        if (bathroom) additionalFilters.push({ isBathroom: true });
        if (parking) additionalFilters.push({ isParking: true });
        if (guests) additionalFilters.push({ isGuests: true });
        if (fullfood) additionalFilters.push({ isFullFood: true });
        if (desk) additionalFilters.push({ isDesk: true });
        if (tv) additionalFilters.push({ isTV: true });
        if (internet) additionalFilters.push({ isInternet: true });
        if (conditioner) additionalFilters.push({ isConditioner: true });
        if (swimming) additionalFilters.push({ isSwimming: true });

        let filteredRooms = initialRooms;

        if (additionalFilters.length > 0) {
            filteredRooms = initialRooms.filter(room => {
                return additionalFilters.some(filter => {
                    for (let key in filter) {
                        if (filter[key] === room[key]) return true;
                    }
                    return false;
                });
            });
        }

        const totalRooms = filteredRooms.length;
        console.log('Filtered Rooms:', totalRooms);

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
            numberOfGuests: numBeds,
            currentPage: currentPage,
            totalPages: Math.ceil(totalRooms / ITEMS_PER_PAGE),
            maxItems: ITEMS_PER_PAGE,
            roomsCount: totalRooms,
            searchParams: req.session.searchParams
        };

        if (arrivalDate < today) {
            req.flash('error', "Введите дату прибытия <b>корректно!</b>");
            return res.redirect('back');
        } else if (departureDate <= arrivalDate) {
            req.flash('error', "Введите дату выезда <b>корректно!</b>");
            return res.redirect('back');
        } else {
            const data = filteredRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

            // console.log('Data:', data);
            console.log("Filter is: ", )

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
    const { dateFrom, dateTo, numBeds, priceMin, priceMax, stars, smoke, fitness, animals, bathroom,
        parking, guests, fullfood, desk, tv, internet, conditioner, swimming } = req.body;

    req.session.searchParams = {
        dateFrom,
        dateTo,
        numBeds,
        priceMin: parseFloat(priceMin),
        priceMax: parseFloat(priceMax),
        stars: parseInt(stars),
        smoke: smoke === "on" ? true : false,
        fitness: fitness === "on" ? true : false,
        animals: animals === "on" ? true : false,
        bathroom: bathroom === "on" ? true : false,
        parking: parking === "on" ? true : false,
        guests: guests === "on" ? true : false,
        fullfood: fullfood === "on" ? true : false,
        desk: desk === "on" ? true : false,
        tv: tv === "on" ? true : false,
        internet: internet === "on" ? true : false,
        conditioner: conditioner === "on" ? true : false,
        swimming: swimming === "on" ? true : false
    };

    res.redirect(`/search-rooms/page/${currentPage}`);
});


router.post('/apply-filters', async (req, res) => {

    const { dateFrom, dateTo, numBeds, priceMin, priceMax, stars, smoke, fitness, animals, bathroom,
        parking, guests, fullfood, desk, tv, internet, conditioner, swimming } = req.body;

    console.log('Apply Filters:', req.body);

    req.session.searchParams = {
        dateFrom,
        dateTo,
        numBeds,
        priceMin: parseFloat(priceMin),
        priceMax: parseFloat(priceMax),
        stars: parseInt(stars),
        smoke: smoke === "on" ? true : false,
        fitness: fitness === "on" ? true : false,
        animals: animals === "on" ? true : false,
        bathroom: bathroom === "on" ? true : false,
        parking: parking === "on" ? true : false,
        guests: guests === "on" ? true : false,
        fullfood: fullfood === "on" ? true : false,
        desk: desk === "on" ? true : false,
        tv: tv === "on" ? true : false,
        internet: internet === "on" ? true : false,
        conditioner: conditioner === "on" ? true : false,
        swimming: swimming === "on" ? true : false
    };

    res.redirect('/search-rooms/page/1');
});

router.post('/reset-filters', reqireAuth, async (req, res) => {
    req.session.searchParams = {
        dateFrom: req.session.searchParams.dateFrom,
        dateTo: req.session.searchParams.dateTo,
        priceMin: req.session.searchParams.priceMin,
        priceMax: req.session.searchParams.priceMax,
        stars: req.session.searchParams.stars
    };
    res.redirect('/search-rooms/page/1');
});

router.get('/room/:id', reqireAuth, checkBooking, async (req, res) => {
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
    } else {
        const token = req.cookies.token;
        const decodeToken = jwt.verify(token, jwtSecret);
        const userId = decodeToken.userId;

        const room = await Room.findOne({ _id: roomID });
        if (room.RoomIsBooked) {
            req.flash('error', "Этот номер уже забронирован.");
            return res.redirect('back');
        }

        const existingBooking = await UserOrder.findOne({ userID: userId, roomID: roomID });
        if (existingBooking) {
            req.flash('error', 'Вы уже забронировали эту комнату.');
            return res.redirect('/profile');
        }

        setTimeout(async () => {
            const newOrder = new UserOrder({
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
//                 RoomIsBooked: false,
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
//                 isSwimming: Math.random() < 0.5
//             },
//             {
//                 RoomID: 2,
//                 RoomPrice: 7856,
//                 RoomURL: "/img/room-img/room_2/room_2_intro.jpg",
//                 RoomStars: 5,
//                 RoomIsBooked: false,
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
//                 isSwimming: Math.random() < 0.5
//             },
//             {
//                 RoomID: 3,
//                 RoomPrice: 5689,
//                 RoomURL: "/img/room-img/room_3/room_3_intro.jpg",
//                 RoomStars: 4,
//                 RoomIsBooked: false,
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
//                 isSwimming: Math.random() < 0.5
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