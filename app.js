require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const connectDB = require('./server/config/db');
const flash = require('connect-flash');

const session = require("express-session");
const MongoStore = require('connect-mongo');

const app = express();
const PORT = 8000 || process.env.PORT;

connectDB();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(expressLayout);
app.use(cookieParser());

app.use(
    session({
        secret: 'my secret',
        saveUninitialized: true,
        resave: false,
        store: MongoStore.create ({
            mongoUrl: process.env.MONGODB_URI
        })
    })
);

app.use(flash());

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

const homeRoutes = require('./server/routes/home');
const authRoutes = require('./server/routes/auth');
const searchRoutes = require('./server/routes/search');
const profileRoutes = require('./server/routes/profile');
const navigationRoutes = require('./server/routes/navigation')

app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/', searchRoutes);
app.use('/', profileRoutes);
app.use('/', navigationRoutes);

app.use((req, res, next) => {
    res.status(404).send('Извините, такой страницы не существует.');
});

app.listen(PORT, () => {
    console.log(`Server is active on port: ${PORT}`);
})