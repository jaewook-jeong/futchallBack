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
      const token = jwt.sign({ id: user.id, nickname: user.nickname }, process.env.JWT_SECRET, { expiresIn: req.body.remember === 'Y' ? '30d' : '1d' });
      res.cookie('AuthToken', token, { httpOnly: true, maxAge: req.body.remember ? 60 * 60 * 24 * 30 * 1000 : 60 * 60 * 24 * 1000 });
      return res.status(200).json(fullUserWithoutPwd);
    });
  })(req, res, next);
});

router.get('/myinfo', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const fullUserWithoutPwd = await db.User.findOne({
      where: { id : req.user.id },
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
    res.status(200).json(fullUserWithoutPwd);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/token/refresh', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  const { id, nickname } = req.user;
  const freshToken = jwt.sign({ id, nickname }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('AuthToken', freshToken, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true
  });
  res.status(201).send('token refreshed');
});

module.exports = router;