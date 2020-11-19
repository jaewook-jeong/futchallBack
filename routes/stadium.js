const express = require('express');
const moment = require('moment');
const { Op, Sequelize } = require('sequelize');
const passport = require('passport');

const { Stadium, Image, Match, Team, User, Post } = require('../models');
const { isLoggedIn, upload } = require('./middlewares');

const router = express.Router();

router.post('/image', passport.authenticate('access-jwt', { session: false }), upload.single('image'), async (req, res, next) => {
  console.log(req.file);
  res.json(req.file.location);
})

router.post('/register', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
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
    if (req.body.image) {
      const image = await Image.create({ src: req.body.image });
      await stadium.addImages(image);
    }
    if (req.user.TeamId) {
      stadium.TeamId = req.user.TeamId
      stadium.valid = moment(stadium.createdAt, 'YYYY-MM-DD HH:mm:ss').add(3, 'days').format('YYYY-MM-DD HH:00:00');
      await stadium.save();
    }
    res.status(201).send('done');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/search', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    const searchList = await Stadium.findAll({
      where: {
        title: {
          [Op.like]: `%${req.query.q}%`,
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

router.get('/istaken', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    
    const stadia = await Stadium.findAll({
      where: {
        title: {
          [Op.like]: `%${req.query.q}%`,
        },
        TeamId: {
          [Op.ne]: null,
          [Op.ne]: req.user.LeaderId,
        },
      },
      attributes:['id', 'title', 'valid'],
      limit: 5,
      include: [{
        model: Team,
        attributes: ['title', 'id']
      },{
        model: Match,
        required: false,
        where: {
          //점령전이고, 승인이 되었고, 결과가 나오지 않은 경기
          capture: {
            [Op.eq]: 'Y',
          },
          confirm: {
            [Op.eq]: 'Y'
          },
          WinnerId: {
            [Op.eq]: null,
          },
        }
      }]
    });
    res.status(200).json(stadia.filter((v) => v.Matches.length === 0));
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/:stadiumId/take', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    const isInTeam = await User.findOne({
      where: { id : req.user.id },
      attributes: ['id', 'nickname', 'LeaderId', 'TeamId', 'JoinInId'],
    });
    if (!isInTeam.TeamId) {
      return res.status(401).send('팀에 가입 후 점령해주세요.');
    }
    const stadium = await Stadium.findOne({
      where: { id: req.params.stadiumId },
    });
    stadium.TeamId = isInTeam.TeamId;
    stadium.valid = moment().add(3, 'days').format('YYYY-MM-DD HH:00:00');
    await stadium.save();
    const afterStadiumInfo = await Stadium.findOne({
      where: { id: req.params.stadiumId },
      include: [{
        model: Image,
      },{
        model: Match,
      },{
        model: Team,
      }]
    });
    res.status(200).json(afterStadiumInfo);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:stadiumId/:tabId', async (req, res, next) => {
  try {
    if(req.params.tabId === '1') {
      return res.status(200).send('ok');
    }
    if (req.params.tabId === '2') {
      // stadium match list
      const matchList = await Match.findAll({
        where: {
          StadiumId: req.params.stadiumId,
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
    if (req.params.tabId === '3') {
      const pictureList = await Post.findAll({
        where: {
          StadiumId: req.params.stadiumId
        },
        attributes: ['Images.id', 'Images.src'],
        include: [{
          model: Image,
          required: true,
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
  if (req.params.tabId == '4') {
    //후기
    return res.status(200).send('ok');
  }
});

router.get('/:stadiumId', async (req, res, next) => {
  try {
    const stadium = await Stadium.findOne({
      where: { id: req.params.stadiumId },
      include: [{
        model: Image,
      },{
        model: Match,
      },{
        model: Team,
      }]
    });
    // if (moment().diff(moment(stadium.valid, 'YYYY-MM-DD HH:00:00').format(), 'hours') > 0){
    //   // const now = moment();
    //   // console.log(now);
    //   console.log(moment(stadium.valid, 'YYYY-MM-DD HH:00:00').format());
    //   // console.log(now.diff(moment(stadium.valid, 'YYYY-MM-DD HH:00:00').format(), 'days'));
    //   // console.log(now.diff(moment(stadium.valid, 'YYYY-MM-DD HH:00:00').format(), 'hours'));
    //   // console.log(now.diff(moment('2020-09-15 14:00:00', 'YYYY-MM-DD HH:00:00').format(), 'days'));
    //   // console.log(now.diff(moment('2020-09-15 14:00:00', 'YYYY-MM-DD HH:00:00').format(), 'hours'));
    //   // console.log(now.diff(moment('2020-09-15 15:00:00', 'YYYY-MM-DD HH:00:00').format(), 'days'));
    //   // console.log(now.diff(moment('2020-09-15 15:00:00', 'YYYY-MM-DD HH:00:00').format(), 'hours'));
    //   stadium.valid = null;
    //   stadium.TeamId = null;
    //   await stadium.save();
    //   const deleteValidStadium = await Stadium.findOne({
    //     where: { id: req.params.stadiumId },
    //     include: [{
    //       model: Image,
    //     },{
    //       model: Match,
    //     },{
    //       model: Team,
    //     }]
    //   });
    //   return res.status(200).json({data : deleteValidStadium, expired: true});
    // }
    
    res.status(200).json(stadium);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;