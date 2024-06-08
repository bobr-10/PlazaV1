const express = require('express');
const router = express.Router();
const { reqireAuth } = require('../config/middlewares');

router.get('/', reqireAuth, (req, res) => {
    const locals = {
        title: "Plaza Hotel",
        isAuth: res.locals.isAuth,
        userGender: res.locals.userGender
    }

    res.render('home', { locals });
});

module.exports = router;