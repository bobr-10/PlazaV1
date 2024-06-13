const express = require('express');
const router = express.Router();
const { Room, Info, Review} = require('../models/room');
const { User, UserOrder } = require('../models/user');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const admin = process.env.Admin_ID;

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
    const { id } = req.params;
    const token = req.cookies.token;

    if (!token) {
        req.flash('error', "<b>Авторизуйтесь</b> для оформления заказа");
        return res.redirect('/sign_in');
    }

    try {
        const decodeToken = jwt.verify(token, jwtSecret);
        const userId = decodeToken.userId;

        const existingBooking = await UserOrder.findOne({ UserID: userId, HotelID: id });
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
        const { dateFrom, dateTo, numBeds, priceMin, priceMax, stars, smoke, fitness, animals, bathroom,
            parking, guests, fullfood, desk, tv, internet, conditioner, swimming } = req.session.searchParams;

        let mainFilterQuery = {
            $and: []
        };

        if (stars) {
            mainFilterQuery.$and.push({ HotelStars: parseInt(stars) });
        }

        if (priceMin && priceMax) {
            mainFilterQuery.$and.push({ HotelPrice: { $gte: parseFloat(priceMin), $lte: parseFloat(priceMax) } });
        }

        if (mainFilterQuery.$and.length === 0) {
            delete mainFilterQuery.$and;
        }

        console.log('Main Filter Query:', mainFilterQuery);

        const initialRooms = await Room.find(mainFilterQuery);
        console.log('Initial Rooms:', initialRooms.length);

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
        const data = await Info.findOne({HotelId: ID});
        const roomInfo = await Room.findOne({_id: ID});
        const hotelReview = await Review.find({HotelId: ID});
        const reviewCount = hotelReview.length;

        const totalReviewScore = hotelReview.reduce((sum, review) => sum + review.ReviewRate, 0);
        const averageReviewScore = reviewCount > 0 ? (totalReviewScore / reviewCount).toFixed(1) : 0;


        res.render('room_info', {data, locals, roomInfo, hotelReview, reviewCount, averageReviewScore});
        
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
        
        const data = await UserOrder.findOne({HotelNum: roomNum, UserID: userId});
        console.log(data);

        if (!data) {
            return res.status(404).send('<h1>Не найдено (404)</h1>');
        }

        const review = await Review.findOne({ HotelId: data.HotelID});
        console.log(review);
        locals.review = review;

        res.render('order_info', {locals, data, roomNum});

    } catch (error) {
        console.log(error);
    }
});

router.get('/order/:id', reqireAuth, async (req, res) => {
    const { dateFrom, dateTo, numBeds } = req.session.searchParams;
    
    const token = req.cookies.token;
    const decodeToken = jwt.verify(token, jwtSecret);
    const userId = decodeToken.userId;

    const user = await User.findById(userId);

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
        daysToPay: differenceDays,
        user: user
    }

    try {
        const ID = req.params.id;
        const data = await Info.findOne({HotelId: ID});
        const roomInfo = await Room.findOne({_id: ID});

        res.render('process', {data, locals, roomInfo});
        
    } catch (error) {
        console.log(error);
    }
});


router.post('/payment', reqireAuth, async (req, res) => {
    const { roomNumId, roomID, pricePerDay, daysToPay, additionalServicesCost, finalPrice, dateFrom, dateTo, numBeds} = req.body;
    
    let hasErrors = false;

    const locals = {
        title: "Оформление номера",
        isAuth: res.locals.isAuth,
        userGender: res.locals.userGender
    }

    if (!locals.isAuth) {
        req.flash('error', "<b>Авторизуйтесь</b> для оформления заказа");
        return res.redirect('sign_in');
    } else {

        try {

            const token = req.cookies.token;
            const decodeToken = jwt.verify(token, jwtSecret);
            const userId = decodeToken.userId;
            console.log(`roomID: ${roomID}`);
            const room = await Room.findOne({ _id: roomID });

            if (room.IsBooked) {
                req.flash('error', "Этот номер уже забронирован.");
                return res.redirect('back');
            }

            const existingBooking = await UserOrder.findOne({ UserID: userId, HotelID: roomID });
            if (existingBooking) {
                req.flash('error', 'Вы уже забронировали эту комнату.');
                return res.redirect('/profile');
            }

            setTimeout(async () => {
                const newOrder = new UserOrder({
                    UserID: userId,
                    HotelNum: roomNumId,
                    HotelID: roomID,
                    ArrivalDate: dateFrom,
                    DepartureDate: dateTo,
                    NumberOfGuests: numBeds,
                    HotelPricePerDay: pricePerDay,
                    HotelDays: daysToPay,
                    ServiceCost: additionalServicesCost,
                    TotalPrice: finalPrice
                });

                await newOrder.save();

                const updateBooking = await Room.findOneAndUpdate (
                    {_id: roomID},
                    {IsBooked: true},
                    {new: true}
                );
            
                if (hasErrors) {
                    return res.redirect('back');
                }
    
                res.redirect(`/profile/order/${newOrder.HotelNum}`);
    
            }, 4000);


        } catch (error) {
            console.log(error)
        }
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

router.post('/sign_in', async (req, res) => {
    try {
        const locals = {
            title: "Профиль",
            userGender: res.locals.userGender
        }

        const { email, password } = req.body;

        const existingUser = await User.findOne({ Email: email });

        if (!existingUser) {
            req.flash('error', 'Данный Email не <b>зарегистрирован!</b>');
            return res.redirect('back');
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.Password);

        if (!isPasswordCorrect) {
            req.flash('error', '<b>Неверный</b> пароль!');
            return res.redirect('back');
        }

        const token = genToken(existingUser._id);
        res.cookie('token', token, { httpOnly: true });

        if (existingUser._id.toString() === admin) {
            return res.redirect('/admin');
        } else {
            return res.redirect('/profile');
        }
                
    } catch (error) {
        console.error(error);
        req.flash('error', 'Произошла ошибка при входе. Пожалуйста, попробуйте еще раз.');
        return res.redirect('back');
    }
});

router.get('/admin', reqireAuth, async (req, res) => {
    try {
        const token = req.cookies.token;
        const decodeToken = jwt.verify(token, jwtSecret);
        const userId = decodeToken.userId;
        
        if (userId !== admin) {
            req.flash('error', 'У вас нет прав для доступа к этой странице.');
            return res.redirect('/');
        }
        
        const orders = await UserOrder.find();
        
        res.render('admin', {
            title: 'Административная панель',
            userId: userId,
            orders: orders
        });
    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        req.flash('error', 'Произошла ошибка при получении данных заказов.');
        res.redirect('/');
    }
});

router.get('/profile', reqireAuth, async (req, res) => {
    
    const token = req.cookies.token;
    const decodeToken = jwt.verify(token, jwtSecret);
    const userId = decodeToken.userId;

    const user = await User.findById(userId);

    const userOrders = await UserOrder.find({ UserID: userId });

    const ordersWithRoomImages = [];

    for (const order of userOrders) {
        const room = await Room.findOne({ HotelID: order.HotelNum });

        if (room) {
            const roomImageURL = room.HotelURL;

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
    const {rateNum, rateText, roomNumId} = req.body;

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
    const userOrders = await UserOrder.findOne({ UserID: userId, HotelNum: roomNumId});

    const newReview = new Review({
        HotelId: userOrders.HotelID,
        ReviewText: rateText,
        ReviewRate: rateNum,
        ReviewAuthorName: user.FirstName,
        ReviewAuthorMale: user.Gender,
        ReviewDate: today
    });

    await newReview.save();
    res.redirect('/profile');
});

router.get('/review', (req, res) => {
    res.redirect('/');
});




router.get('/about', reqireAuth, (req, res) => {
    const locals = {
        title: "О нас",
        isAuth: res.locals.isAuth
    }
    
    res.render('navigation/about', { locals });
});

router.get('/service', reqireAuth, (req, res) => {
    const locals = {
        title: "Услуги",
        isAuth: res.locals.isAuth
    }
    
    res.render('navigation/service', { locals });
});

router.get('/vacancy', reqireAuth, (req, res) => {
    const locals = {
        title: "Вакансии",
        isAuth: res.locals.isAuth
    }
    
    res.render('navigation/vacancy', { locals });
});

router.get('/news', reqireAuth, (req, res) => {
    const locals = {
        title: "Новости",
        isAuth: res.locals.isAuth
    }
    
    res.render('navigation/news', { locals });
});

router.get('/agreements', reqireAuth, (req, res) => {
    const locals = {
        title: "Соглашения",
        isAuth: res.locals.isAuth
    }
    
    res.render('navigation/agreements', { locals });
});

router.get('/help', reqireAuth, (req, res) => {
    const locals = {
        title: "Служба поддержки",
        isAuth: res.locals.isAuth
    }
    
    res.render('navigation/help', { locals });
});

router.get('/team', reqireAuth, (req, res) => {
    const locals = {
        title: "Наша команда",
        isAuth: res.locals.isAuth
    }
    
    res.render('navigation/team', { locals });
});



module.exports = router;


// async function insertRoomData() {
//     try {
//         const rooms = await Room.insertMany([
//             {
//                 HotelID: 1,
//                 HotelPrice: 3266,
//                 HotelName: "AKYAN",
//                 HotelGeo: "Москва",
//                 HotelURL: "/img/room-img/room_1/room_1_intro.jpg",
//                 HotelStars: 3,
//                 IsBooked: false,
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
//                 HotelID: 2,
//                 HotelPrice: 7856,
//                 HotelName: "Welton Club Hotel & Apartments",
//                 HotelGeo: "Санкт-Петербург",
//                 HotelURL: "/img/room-img/room_2/room_2_intro.jpg",
//                 HotelStars: 5,
//                 IsBooked: false,
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
//                 HotelID: 3,
//                 HotelPrice: 5689,
//                 HotelName: "Valo Soul",
//                 HotelGeo: "Санкт-Петербург",
//                 HotelURL: "/img/room-img/room_3/room_3_intro.jpg",
//                 HotelStars: 4,
//                 IsBooked: false,
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
//             const roomNumber = rooms[i].HotelID;

//             await Info.create({
//                 HotelId: roomId,
//                 ImageURLs: [
//                     `/img/room-img/room_${roomNumber}/room_${roomNumber}_info_1.jpg`,
//                     `/img/room-img/room_${roomNumber}/room_${roomNumber}_info_2.jpg`,
//                     `/img/room-img/room_${roomNumber}/room_${roomNumber}_info_3.jpg`
//                 ]
//             });

//             console.log(`Данные успешно добавлены для комнаты с ID: ${rooms[i].HotelID}.`);
//         }
//     } catch (error) {
//         console.error("Ошибка при вставке данных:", error);
//     }
// }

// insertRoomData();