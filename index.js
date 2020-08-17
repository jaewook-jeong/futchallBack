const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const passportConfig = require('./passport');
const db = require('./models');
const userAPIRouter = require('./routes/user');
const postApiRouter = require('./routes/post');

dotenv.config();
const app = express();
db.sequelize.sync()
  .then(() => {
    console.log("DB connected");
  })
  .catch(console.error);

passportConfig();

app.use(cors({
    origin: true,
    credentials: true,
})); 
app.use(express.json()); // json형태의 data를 req.body!
app.use(express.urlencoded({ extended: true })); // form submit시 req.body처리!
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(expressSession({
  saveUninitialized: false,
  resave: false,
  secret: process.env.COOKIE_SECRET,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/user', userAPIRouter);
app.use('/post', postApiRouter);

// app.use((err, req, res, next) => {
// // 에러처리 미들웨어 custom 가능, 여기부분에서!
// });

app.listen(3065, () => {
    console.log('server is running on http://localhost:3065');
});