const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');

const passportConfig = require('./passport');
const db = require('./models');
const userAPIRouter = require('./routes/user');
const postAPIRouter = require('./routes/post');
const postsAPIRouter = require('./routes/posts');
const teamAPIRouter = require('./routes/team');
const stadiumAPIRouter = require('./routes/stadium');
const stadiaAPIRouter = require('./routes/stadia');
const matchAPIRouter = require('./routes/match');
const authAPIRouter = require('./routes/auth');
const { refererCheck } = require('./routes/middlewares');

dotenv.config();
passportConfig();
const app = express();
db.sequelize.sync()
  .then(() => {
    console.log("DB connected");
  })
  .catch(console.error);

app.use(morgan('dev'));
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Origin', 'Accept', 'Content-Type', 'Authorization']
})); 
app.use('/', express.static(path.join(__dirname, 'uploads')));
app.use(express.json()); // json형태의 data를 req.body!
app.use(express.urlencoded({ extended: true })); // form submit시 req.body처리!
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(refererCheck);
app.use('/auth', authAPIRouter);
app.use('/user', userAPIRouter);
app.use('/post', postAPIRouter);
app.use('/posts', postsAPIRouter);
app.use('/team', teamAPIRouter);
app.use('/stadium', stadiumAPIRouter);
app.use('/stadia', stadiaAPIRouter);
app.use('/match', passport.authenticate('jwt', { session: false }), matchAPIRouter);

app.listen(3065, () => {
    console.log('server is running on http://localhost:3065');
});