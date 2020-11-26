const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const moment = require('moment');
const passport = require('passport');

const { Team, User, Image, Stadium, Match, Post, Sequelize, Calendar } = require('../models');
const { isLoggedIn, upload } = require('./middlewares');

const router = express.Router();

router.post('/image', passport.authenticate('access-jwt', { session: false }), upload.single('image'), async (req, res, next) => {
  console.log(req.file);
  res.json(req.file.location.replace(/\/original\//, '/thumb/'));
})

router.post('/register', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
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
    const query1 = `SELECT Stadia.id, Stadia.title, Stadia.address, Stadia.description, Images.src
                    FROM Stadia left outer join Images on Stadia.id = Images.StadiumId
                    WHERE REPLACE(Stadia.title, ' ', '') like :query or REPLACE(Stadia.description, ' ', '') like :query`;
    const query2 = `SELECT Posts.content, Posts.id, Users.nickname, Posts.createdAt, Images.src
                    FROM Posts left outer join Users on Posts.UserId = Users.id left outer join Images on Posts.id = Images.PostId
                    WHERE REPLACE(Posts.content, ' ', '') like :query`;
    const query3 = `SELECT Teams.id, Teams.title, Teams.description, Images.src, Teams.location
                    FROM Teams left outer join Images on Teams.id = Images.TeamId
                    WHERE REPLACE(Teams.description, ' ', '') like :query or REPLACE(Teams.title, ' ', '') like :query`;

    const stadiumList = await db.sequelize.query(
      query1,
      {
        replacements: {
          query: `%${req.body.query.replace(/ /gi, '')}%`
        }, 
        type: Sequelize.QueryTypes.SELECT, 
        raw: true
      });
    const postList = await db.sequelize.query(
      query2, 
      {
        replacements: {
          query: `%${req.body.query.replace(/ /gi, '')}%`,
        }, 
        type: Sequelize.QueryTypes.SELECT, 
        raw: true
      });
    const teamList = await db.sequelize.query(
      query3, 
      {
        replacements: {
          query: `%${req.body.query.replace(/ /gi, '')}%`,
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

router.get('/search', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    const searchList = await Team.findAll({
      where: {
        title: {
          [Op.like]: `%${req.query.q}%`,
        },
        id: {
          [Op.ne]: req.user.LeaderId,
        }
      },
      limit: 5,
      attributes: ['id', 'title'],
    });
    res.status(200).json(searchList);
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

router.post('/calendar', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    await Calendar.destroy({
      where: {
        UserId: req.user.id,
        date: req.body.date,
      }
    });
    if (Array.isArray(req.body.possible)) {
      await Promise.all(req.body.possible.map((possible) => Calendar.create({
        date: req.body.date,
        possible,
        UserId: req.user.id,
        TeamId: req.user.TeamId,
      })));
    } else {
      await Calendar.create({
        date: req.body.date,
        possible: req.body.possible,
        UserId: req.user.id,
        TeamId: req.user.TeamId,
      });
    }
    const calendar = await Calendar.findAll({
      where: {
        TeamId: req.user.TeamId,
        date: {
          [Op.between]: [moment(req.body.date).startOf('month').format('YYYY-MM-DD'), moment(req.body.date).endOf('month').format('YYYY-MM-DD')],
        }
      },
      attributes: {
        exclude : ['updatedAt', 'createdAt']
      },
      include: [{
        model: User,
        attributes: ['id', 'nickname']
      }]
    });
    res.status(200).json(calendar);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/rank', async (req, res, next) => {
  try {
    const Rank = await db.sequelize.query(
      `SELECT Teams.id, Teams.title, Teams.location, Teams.recruit, ifnull(Cnt.occupation, 0) as occupation FROM Teams left outer join 
      (select Stadia.TeamId, count(*) as occupation from Stadia where Stadia.TeamId is not null group by TeamId) as Cnt 
      on Teams.id = Cnt.TeamId order by Cnt.occupation desc limit 10`,
      {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      }
    );
    if (Rank) {
      let occ = Rank[0].occupation;
      let rnk = 1;
      const addRank = Rank.map((v) => {
        if (v.occupation === occ){
          return {
            ...v,
            rank: rnk,
          }
        } else {
          rnk += 1;
          occ = v.occupation;
          return {
            ...v,
            rank: rnk,
          }
        }
      });
      res.status(200).json(addRank);
    } else {
      res.status(200).json(null);
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/:teamId/joinlist', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
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

router.post('/:teamId/calendar', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    if (parseInt(req.params.teamId, 10) !== req.user.TeamId) {
      return res.status(403).send('해당 정보에 접근할 권한이 없습니다.');
    }
    const calendar = await Calendar.findAll({
      where: {
        TeamId: req.params.teamId,
        date: {
          [Op.between]: [req.body.startDate, req.body.endDate],
        }
      },
      attributes: {
        exclude : ['updatedAt', 'createdAt']
      },
      include: [{
        model: User,
        attributes: ['id', 'nickname']
      }]
    });
    res.status(200).json(calendar);
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

router.patch('/:teamId', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
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
    console.log('------------------------------------');
    console.log("WTF", req.params.teamId);
    console.log(team);
    console.log('------------------------------------');
    res.status(200).json(team);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;