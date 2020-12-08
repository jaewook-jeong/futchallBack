const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const db = require('../models');
const { isNotLoggedIn } = require('./middlewares');

const router = express.Router();

router.post('/login', isNotLoggedIn, async (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      return res.status(401).send(info.reason);
    }
    return req.login(user, { session: false }, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }
      const fullUserWithoutPwd = await db.User.findOne({
        where: { originalId : user.originalId },
        attributes: ['id', 'nickname','originalId', 'positions', 'age', 'locations', 'LeaderId', 'TeamId', 'JoinInId'],
        include: [{
          model: db.Team,
          attributes: ['id', 'title'],
        }, {
          model: db.Post,
          attributes: ['id'],
        }, {
          model: db.Image,
        }]
      });
      const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: req.body.remember ? '14d' : '1d' });
      fullUserWithoutPwd.token = refreshToken;
      await fullUserWithoutPwd.save();
      const accessToken = jwt.sign({ id: user.id, originalId: fullUserWithoutPwd.originalId }, process.env.JWT_SECRET, { expiresIn: '30m' });
      res.cookie('RefreshToken', refreshToken, { httpOnly: true, maxAge: req.body.remember ? 1000 * 60 * 60 * 24 * 14 : 60 * 60 * 24 * 1000, domain: process.env.NODE_ENV === 'production' && '.futchall.com', secure: true });
      return res.status(200).json({ me: fullUserWithoutPwd, token: accessToken });
    });
  })(req, res, next);
});

router.get('/myinfo', passport.authenticate('refresh-jwt', { session: false }), async (req, res, next) => {
  try {
    const fullUserWithoutPwd = await db.User.findOne({
      where: { id : req.user.id },
      attributes: ['id', 'nickname','originalId', 'positions', 'age', 'locations', 'LeaderId', 'TeamId', 'JoinInId', 'token'],
      include: [{
        model: db.Team,
        attributes: ['id', 'title'],
      }, {
        model: db.Post,
        attributes: ['id'],
      }, {
        model: db.Image,
      }]
    });
    if (req.headers.authorization.slice(7) !== fullUserWithoutPwd.token) {
      console.log('------------------------------------');
      console.log("로그인은 중복접속이 불가합니다.");
      console.log(req.rawHeaders);
      console.log('------------------------------------');
      console.log(req.headers);
      console.log('------------------------------------');
      console.log(req.cookies);
      console.log('------------------------------------');
      res.cookie('RefreshToken', '1', { httpOnly: true, domain: '.futchall.com', secure: true, maxAge: 0 });
      // res.clearCookie('RefreshToken', { httpOnly: true, domain: '.futchall.com', secure: true });
      return res.status(403).send("다른기기에서 접속중입니다.");
    }
    const accessToken = jwt.sign({ id: req.user.id, originalId: fullUserWithoutPwd.originalId }, process.env.JWT_SECRET, { expiresIn: '30m' });
    res.status(200).json({ me: fullUserWithoutPwd, token: accessToken });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/token/expired', passport.authenticate('refresh-jwt', { session: false }), async (req, res, next) => {
  const { id, originalId } = req.user;
  const accessToken = jwt.sign({ id, originalId }, process.env.JWT_SECRET, { expiresIn: '30m' });
  const fullUserWithoutPwd = await db.User.findOne({
    where: { id },
    attributes: ['id', 'nickname','originalId', 'positions', 'age', 'locations', 'LeaderId', 'TeamId', 'JoinInId', 'token'],
    include: [{
      model: db.Team,
      attributes: ['id', 'title'],
    }, {
      model: db.Post,
      attributes: ['id'],
    }, {
      model: db.Image,
    }]
  });
  if (req.headers.authorization.slice(7) !== fullUserWithoutPwd.token) {
    return res.status(403).send("CSRF Attacked");
  }
  res.status(201).json({ token: accessToken, me: fullUserWithoutPwd});
});

module.exports = router;