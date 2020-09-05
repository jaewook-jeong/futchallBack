const express = require('express');

const { Team, User, Image, Stadium } = require('../models');
const { isLoggedIn, upload } = require('./middlewares');

const router = express.Router();

router.post('/image', isLoggedIn, upload.single('image'), async (req, res, next) => {
  console.log(req.file);
  res.json(req.file.filename);
})

router.post('/register', isLoggedIn, async (req, res, next) => {
  try {
    const team = await Team.create({
      title: req.body.title,
      location: req.body.location,
      time: req.body.time,
      recruit: req.body.recruit,
      description: req.body.description,
    });
    await team.addUsers(req.user.id);
    await team.setLeader(req.user.id);
    if (req.body.image) {
      const image = await Image.create({ src: req.body.image });
      await team.addImages(image);
    }
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