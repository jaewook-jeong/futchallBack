const passport = require('passport');
const passportJWT = require('passport-jwt');
const JWTStrategy   = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');
const { User } = require('../models');
require('dotenv').config();

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'originalId',
    passwordField: 'password',
  }, async (originalId, password, done) => {
    try {
      const user = await User.findOne({ where: { originalId } });
      if (!user) {
        return done(null, false, { reason: '존재하지 않는 사용자입니다!' });
      }
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        return done(null, user);
      }
      return done(null, false, { reason: '비밀번호가 틀렸습니다.' });
    } catch (e) {
      console.error(e);
      return done(e);
    }
  }));

  passport.use('refresh-jwt', new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    secretOrKey   : process.env.JWT_SECRET,
  }, async (jwtPayload, done) => {
    try {
      console.log('------------------------------------');
      console.log(jwtPayload);
      console.log('------------------------------------');
      const user = await User.findOne({ where: { id: jwtPayload.id } });
      if (!user) {
        return done("존재하지 않는 사용자입니다.", null);
      }
      return done(null, user);
    } catch (e) {
      console.error(e);
      return done(e);
    }
  }
  ));

  passport.use('access-jwt', new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    secretOrKey   : process.env.JWT_SECRET,
  }, async (jwtPayload, done) => {
    try {
      const user = await User.findOne({ where: { originalId: jwtPayload.originalId } });
      if (!user) {
        return done("CSRF Attack", null);
      }
      return done(null, user);
    } catch (e) {
      console.error(e);
      return done(e);
    }
  }
  ));
};