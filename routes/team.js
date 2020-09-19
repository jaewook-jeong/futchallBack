const express = require('express');
const { Op } = require('sequelize');

const { Team, User, Image, Stadium, Match } = require('../models');
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

router.get('/:teamId/management/:tabId', isLoggedIn, async (req, res, next) => {
  try {
    if (req.user.LeaderId != req.params.teamId) {
      return res.status(403).send('접근권한이 없습니다!');
    }
    if (req.params.tabId === "1") {
      //경기관리
      const matchList = await Match.findAll({
        order: ['date', 'DESC'],
        where: {
          [Op.or]: [{ HomeId: req.params.teamId }, { awayId: req.params.teamId }]
        },
        attributes: {
          exclude : ['updatedAt', 'createdAt']
        },
        include: [{
          model: Team,
          as: 'Home',
          attributes: ['title']
        },{
          model: Team,
          as: 'Away',
          attributes: ['title']
        },{
          model: Team,
          as: 'Winner',
          attributes: ['title']
        },{
          model: Stadium,
          attributes: ['title']
        }]
      });
      
      const matchList2 = matchList.map((v) => {
        return {
          ...v.dataValues,
          TeamId: req.user.TeamId,
        }
      });
      console.log('------------------------------------');
      console.log(matchList2);
      console.log('------------------------------------');
      return res.status(200).json(matchList2);
    } else if (req.params.tabId === "2") {
      //입단신청
      const joinList = await User.findAll({
        where: {
          JoinInId: req.params.teamId
        },
        attributes: ['id', 'nickname', 'positions', 'age', 'locations']
      });
      return res.status(200).json(joinList);
    } else if (req.params.tabId === "3") {
      //팀정보수정
      const teamInfo = await Team.findOne({
        where: {
          id: req.params.teamId
        },
      });
      return res.status(200).json(teamInfo);
    }
    res.status(404).send("탭 아이디가 없어요.");
  } catch (error) {
    console.error(error);
    next(error);
  }
})

router.get('/:teamId', async (req, res, next) => {
  try {
    const team = await Team.findOne({
      where: { id: req.params.teamId },
      include: [{
        model: Image,
        attributes: ['id', 'src'],
      },{
        model: User,
        // where: { TeamId: req.params.teamId },
        attributes: ['nickname', 'id', 'positions', 'LeaderId'],
      },{
        model: Stadium,
        attributes: ['lat', 'lng', 'id', 'title']
      }]
    });
    res.status(200).json(team);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;