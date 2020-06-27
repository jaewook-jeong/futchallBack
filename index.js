const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');

const passport = require('passport');
const passportConfig = require('./passport');

const db = require('./models');

const userAPIRouter = require('./routes/user');
const teamAPIRouter = require('./routes/team');
const stadiumAPIRouter = require('./routes/stadium');

dotenv.config();
const app = express();
db.sequelize.sync();
passportConfig();

app.use(morgan('dev'));
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false, // https를 쓸 때 true
    },
    name: 'futchall',
}));
app.use(passport.initialize());
app.use(passport.session());

// API는 다른 서비스가 내 서비스의 기능을 실행할 수 있게 열어둔 창구
app.use('/api/user', userAPIRouter);
app.use('/api/team', teamAPIRouter);
app.use('/api/stadium', stadiumAPIRouter);

app.listen(3065, () => {
    console.log('server is running on http://localhost:3065');
});