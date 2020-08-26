const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');

const db = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    if (req.user){
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
      })
      res.status(200).json(fullUserWithoutPwd);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
})

router.post('/login', isNotLoggedIn, (req, res, next) => {
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
      })
      return res.status(200).json(fullUserWithoutPwd);
    });
  })(req, res, next);
});

router.post('/join', isLoggedIn, async (req, res, next) => {
    try {
      const team = await db.Team.findOne({
        where: {
          id: req.body.id,
        }
      });
      if (!team) {
        return res.status(400).send('존재하지 않는 팀입니다.');
      }
      const user = await db.User.findOne({
        where: {
          id: req.user.id
        }
      });
      // team.addJoinIns(team.id); 
      user.JoinInId = team.id;
      await user.save();
      res.status(200).json(team.id);
    } catch (error) {
      console.error(error);
      next(error);
    }
});

router.post('/signup', isNotLoggedIn, async (req, res, next) => {
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
        })
        return res.status(200).json(fullUserWithoutPwd);
      });
    })(req, res, next);
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

router.post('/logout', isLoggedIn, async (req, res) => {
  req.logOut();
  req.session.destroy();
  res.send('ok');
})

module.exports = router;