const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const db = require('../models');
const { upload } = require('./middlewares');

const router = express.Router();
require('dotenv').config();


router.post('/image', upload.single('image'), async (req, res, next) => {
  console.log(req.file);
  res.json(req.file.location.replace(/\/original\//, '/thumb/'));
})

router.patch('/joinmanage', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    if (!req.user.LeaderId) {
      return res.status(403).send('권한이 없습니다.');
    }
    const user = await db.User.findOne({
      where: {
        id: req.body.userId,
        JoinInId: req.user.LeaderId,
      }
    });
    if (!user) {
      return res.status(403).send('해당 팀에 가입을 요청한 사용자가 없습니다.');
    }
    user.JoinInId = null;
    if (req.body.action === 'approve'){
      user.TeamId = req.user.LeaderId;
      await user.save();
      return res.status(200).json(user);
    }
    await user.save();
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/join', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
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
    const user = await db.User.create({
      originalId: req.body.originalId,
      nickname: req.body.nickname,
      password: hashedPwd,
      positions: req.body.selectedPositions ? req.body.selectedPositions.join() : null,
      age: req.body.age,
      locations: req.body.selectedLocations ? req.body.selectedLocations.join() : null,
    });
    if (req.body.image) {
      const image = await db.Image.create({ src: req.body.image });
      await user.addImages(image);
    }
    passport.authenticate('local', { session: false},  (err, user, info) => {
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
          where: { id : user.id },
          attributes: ['id', 'nickname','originalId'],
        });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        fullUserWithoutPwd.token = refreshToken;
        await fullUserWithoutPwd.save();
        res.cookie('RefreshToken', refreshToken, { httpOnly: true, maxAge: 3 * 60 * 60 * 24 * 1000, domain: process.env.NODE_ENV === 'production' && '.futchall.com', secure: true });
        return res.status(200).send('회원가입을 축하합니다!');
      });
    })(req, res, next);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/isTaken', async (req, res, next) => {
  try {
    const taken = await db.User.findOne({
      where: {
        originalId: req.body.originalId,
      }
    });
    res.status(200).send(taken);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/logout', passport.authenticate('refresh-jwt', { session: false }), async (req, res) => {
  console.log('------------------------------------');
  console.log("로그ㅇㅏ웃이닷!");
  console.log(req.rawHeaders);
  console.log('------------------------------------');
  console.log(req.headers);
  console.log('------------------------------------');
  console.log(req.cookies);
  console.log('------------------------------------');
  console.log(req.session?.cookie);
  console.log('------------------------------------');
  res.cookie('RefreshToken', null, { maxAge: 0, httpOnly: true, domain: process.env.NODE_ENV === 'production' && '.futchall.com', secure: true });
  await db.User.update({ token: null }, { where: { id: req.user.id } })
  return res.status(204).send('ok');
})

router.patch('/pwd', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    const findUser = await db.User.findOne({
      where: req.user.id,
    });
    const result = await bcrypt.compare(req.body.prevpwd, findUser.password);
    if (result) {
      const hashedPwd = await bcrypt.hash(req.body.password, 11);
      await db.User.update({
        password: hashedPwd,
      },{
        where: {
          id: req.user.id,
        }
      });
      res.status(200).send('ok');
    } else {
      return res.status(403).send('비밀번호가 일치하지 않습니다.');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/modify', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    const findUser = await db.User.findOne({ 
      where: req.user.id,
    });
    const result = await bcrypt.compare(req.body.password, findUser.password);
    if (result) {
      await db.User.update({
        nickname: req.body.nickname,
        positions: req.body.positions ? req.body.positions.join() : null,
        age: req.body.age,
        locations: req.body.locations ? req.body.locations.join() : null,
      },{
        where: {
          id: req.user.id,
        },
        plain: true,
      });
      const fullUserWithoutPwd = await db.User.findOne({
        where: { id: req.user.id },
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
    } else {
      return res.status(401).send('입력하신 정보가 올바르지 않습니다!');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;