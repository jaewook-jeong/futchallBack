const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');

const db = require('../models');

const router = express.Router();

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      return res.status(401).send(info.reason);
    }
    return req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }
      const fullUserWithoutPwd = await db.User.findOne({
        where: {originalId : user.originalId},
        attributes: ['id', 'originalId', 'positions', 'age', 'locations'],
        include: [{
          model: db.Team
        }]
      })
      return res.status(200).json(user);
    });
  })(req, res, next);
});

router.post('/signup', async (req, res, next) => {
  try {
    const taken = await db.User.findOne({
      where: {
        originalId: req.body.originalId,
      }
    });
    if (taken) {
      return res.status(403).send("이미 사용중인 아이디입니다.");
    }
    const hashedPwd = await bcrypt.hash(req.body.password, 11);
    await db.User.create({
      originalId: req.body.originalId,
      nickname: req.body.nickname,
      password: hashedPwd,
      positions: req.body.selectedPositions ? req.body.selectedPositions.join() : null,
      age: req.body.age,
      locations: req.body.selectedLocations ? req.body.selectedLocations.join() : null,
    });
    res.status(201).send('ok');
  } catch (error) {
    console.error(error);
    next(error); //status 500 server error
  }
});

router.post('/isTaken', async (req, res, next) => {
  try {
    console.log(req.body);
    const taken = await db.User.findOne({
      where: {
        originalId: req.body.originalId,
      }
    });
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000/signup');
    res.status(200).send(taken);
  } catch (error) {
    console.error(error);
    next(error); //status 500 server error
  }
});

router.post('/logout', async (req, res) => {
  req.logOut();
  req.session.destroy();
  res.send('ok');
})

module.exports = router;