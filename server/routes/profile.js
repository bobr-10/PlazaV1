const express = require('express');
const router = express.Router();
const { Room, Review, Info } = require('../models/room');
const { User, UserOrder } = require('../models/user');
const { reqireAuth, checkOrderAuth } = require('../config/middlewares');

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const admin = process.env.Admin_ID;

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

module.exports = router;