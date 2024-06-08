const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
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

const checkOrderAuth = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        req.flash('error', "<b>Авторизуйтесь</b> для оформления заказа");
        return res.redirect('/sign_in');
    }
};

const genToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};


module.exports = {
    reqireAuth,
    genToken,
    checkOrderAuth
};
