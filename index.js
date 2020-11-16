const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');
const hpp = require('hpp');
const helmet = require('helmet');

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

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(hpp());
  app.use(helmet());
} else {
  app.use(morgan('dev'));
}
app.use(cors({
  origin: ['http:/localhost:3000', 'futchall.com', 'http://54.180.102.143'],
  credentials: true,
  allowedHeaders: ['Origin', 'Accept', 'Content-Type', 'Authorization']
})); 
app.use('/', express.static(path.join(__dirname, 'uploads')));
app.use(express.json()); // json형태의 data를 req.body!
app.use(express.urlencoded({ extended: true })); // form submit시 req.body처리!
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use('/auth', refererCheck, authAPIRouter);
app.use('/user', refererCheck, userAPIRouter);
app.use('/post', refererCheck, postAPIRouter);
app.use('/posts', postsAPIRouter);
app.use('/team', refererCheck, teamAPIRouter);
app.use('/stadium', refererCheck, stadiumAPIRouter);
app.use('/stadia', refererCheck, stadiaAPIRouter);
app.use('/match', refererCheck, passport.authenticate('access-jwt', { session: false }), matchAPIRouter);

app.listen(80, () => {
    console.log('server is running on port 80');
});