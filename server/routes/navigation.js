const express = require('express');
const router = express.Router();
const { reqireAuth } = require('../config/middlewares');


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


module.exports = router