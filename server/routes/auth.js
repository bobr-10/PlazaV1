const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const { reqireAuth, genToken } = require('../config/middlewares');
const admin = process.env.Admin_ID;

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

module.exports = router;