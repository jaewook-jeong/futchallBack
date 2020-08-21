const express = require('express');
const moment = require('moment');

const { Stadium } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

router.post('/register', isLoggedIn, async (req, res, next) => {
  try {
    const taken = await Stadium.findOne({
      where: {
        address: req.body.address,
      }
    });
    if (taken) {
      return res.status(403).send("이미 해당 주소로 등록된 구장이 있습니다.");
    }
    const stadium = await Stadium.create({
      title: req.body.title,
      lat: req.body.lat,
      lng: req.body.lng,
      address: req.body.address,
      time: req.body.time,
      light: req.body.light,
      special: req.body.special,
      description: req.body.description,
    });
    if (req.user.TeamId) {
      stadium.TeamId = req.user.TeamId
      stadium.valid = moment(stadium.createdAt, 'YYYY-MM-DD HH:mm:ss').add(3, 'days').format('YYYY-MM-DD HH:mm:ss');
      await stadium.save();
    }
    res.status(201).send('done');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;