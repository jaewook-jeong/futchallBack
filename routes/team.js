const express = require('express');

const { Team, User, Image, Stadium } = require('../models');
const { isLoggedIn } = require('./middlewares');
const stadium = require('../models/stadium');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const team = await Team.create({
      title: req.body.title,
      location: req.body.location,
      time: req.body.time,
      recruit: req.body.recruit,
      description: req.body.description,
    });
    const user = await User.findOne({
      where: {
        id: req.user.id
      }
    });
    if (!user) return res.status(401).send('유저정보가 없습니다.');
    user.TeamId = team.id;
    user.LeaderId = team.id;
    await user.save();
    res.status(201).json(team);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:teamId', async (req, res, next) => {
  try {
    const team = await Team.findOne({
      where: { id: req.params.teamId },
      include: [{
        model: Image,
      },{
        model: User,
        where: { TeamId: req.params.teamId },
        attributes: ['nickname', 'id', 'positions', 'LeaderId'],
      },{
        model: Stadium,
      }]
    });
    res.status(200).json(team);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;