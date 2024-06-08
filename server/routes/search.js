const express = require('express');
const router = express.Router();
const { Room, Info, Review} = require('../models/room');
const { reqireAuth, checkBooking } = require('../config/middlewares');

const ITEMS_PER_PAGE = 9;

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

router.post('/apply-filters', reqireAuth, async (req, res) => {

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

module.exports = router;