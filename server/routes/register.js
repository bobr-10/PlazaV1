const express = require('express');
const router = express.Router();
const { Room, Info } = require('../models/room');
const User = require('../models/user');

const ProfileLayout = '../view/layouts/profile';

router.get('/register', async (req, res) => {

    try {
        const locals = {
            title: "Профиль"
        }
    
        const { name, surname, birthday, email, password } = req.body;

        const newUser = new User ({
            FirstName: name,
            SecondName: surname,
            DateOfBirth: birthday,
            Email: email,
            Password: password,
        });

        await newUser.save();
    
        res.render('layouts/profile', { locals, ProfileLayout});
        
    } catch (error) {
        console.error(error);
    }
});



module.exports = router;
