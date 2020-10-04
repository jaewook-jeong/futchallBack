const express = require('express');
const { Op, sequelize } = require('sequelize');
const db = require('../models');

const { Team, User, Image, Stadium, Match, Post, Sequelize } = require('../models');
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

router.post('/search', async (req, res, next) => {
  try {
    const query1 = `SELECT * FROM stadia WHERE REPLACE(title, ' ', '') like :query`;
    const query2 = `SELECT * FROM posts WHERE REPLACE(content, ' ', '') like :query`;
    const query3 = `SELECT * FROM teams WHERE REPLACE(description, ' ', '') like :query`;

    const stadiumList = await db.sequelize.query(
      query1,
      {
        replacements: {
          query: `%${req.body.query}%`
        }, 
        type: Sequelize.QueryTypes.SELECT, 
        raw: true
      });
    const postList = await db.sequelize.query(
      query2, 
      {
        replacements: {
          query: `%${req.body.query}%`,
        }, 
        type: Sequelize.QueryTypes.SELECT, 
        raw: true
      });
    const teamList = await db.sequelize.query(
      query3, 
      {
        replacements: {
          query: `%${req.body.query}%`,
        }, 
        type: Sequelize.QueryTypes.SELECT, 
        raw: true
      });
    res.status(200).json([postList, stadiumList, teamList]);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/autocomplete', async (req, res, next) => {
  try {
    const searchTeamList = await Team.findAll({
      where: {
        title: {
          [Op.like]: `%${req.query.q}%`
        }
      },
      attributes: ['title', 'id'],
      limit: 5,
    });
    const searchStadiumList = await Stadium.findAll({
      where: {
        title: {
          [Op.like]: `%${req.query.q}%`
        }
      },
      attributes: ['id', 'title', 'address'],
      limit: 5,
    });
    res.status(200).json([searchStadiumList, searchTeamList])
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:teamId/joinlist', isLoggedIn, async (req, res, next) => {
  try {
    if (req.user.LeaderId != req.params.teamId) {
      return res.status(403).send('접근권한이 없습니다!');
    }
    const joinList = await User.findAll({
      where: {
        JoinInId: req.params.teamId
      },
      attributes: ['id', 'nickname', 'positions', 'age', 'locations']
    });
    res.status(200).json(joinList);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:teamId/:tabId', async (req, res, next) => {
  try {
    if(req.params.tabId === '1') {
      return res.status(200).send('ok');
    }
    if (req.params.tabId === '2') {
      // team member list
      const memberList = await User.findAll({
        where: {
          TeamId: req.params.teamId,
        },
        attributes: ['id', 'LeaderId', 'positions', 'nickname']
      });
      return res.status(200).json(memberList);
    }
    if (req.params.tabId === '3') {
      const matchList = await Match.findAll({
        where: {
          [Op.or]: [{ HomeId: req.params.teamId }, { awayId: req.params.teamId }],
          confirm: 'Y',
        },
        order:[['date', 'DESC']],
        attributes: {
          exclude : ['updatedAt', 'createdAt', 'confirm']
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
      return res.status(200).json(matchList);
    }
    if (req.params.tabId === '4') {
      const pictureList = await Post.findAll({
        where: {
          TeamId: req.params.teamId
        },
        attributes: ['Images.id', 'Images.src'],
        include: [{
          model: Image,
          attributes: {
            exclude: ['updatedAt', 'createdAt', 'UserId']
          },
        }]
      });
      return res.status(200).json(pictureList);
    }
    res.status(404).send('오류발생');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:teamId', isLoggedIn, async (req, res, next) => {
  try {
    if (req.user.LeaderId !== parseInt(req.params.teamId, 10)) {
      return res.status(403).send('권한이 없습니다.');
    }
    await Team.update({
      ...req.body
    },{
      where: {
        id: req.params.teamId,
      }
    })
    const team = await Team.findOne({
      where: { id: req.params.teamId },
      include: [{
        model: Image,
        attributes: ['id', 'src'],
      },{
        model: User,
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

router.get('/:teamId', async (req, res, next) => {
  try {
    const team = await Team.findOne({
      where: { id: req.params.teamId },
      include: [{
        model: Image,
        attributes: ['id', 'src'],
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