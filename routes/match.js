const express = require('express');
const { Match, Stadium, Team } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const router = express.Router();

router.get('/team/:teamId', async (req, res, next) => {
  try {
    if (req.user.LeaderId != req.params.teamId) {
      return res.status(403).send('접근권한이 없습니다!');
    }
    const matchList = await Match.findAll({
      order: [['date', 'DESC']],
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
    matchList.map(async(v) => {
      if (!v.confirm){
        if (moment().diff(moment(v.date.toString()).locale('ko').format('YYYY-MM-DD HH:mm'), 'hours') > -3) {
          v.confirm = 'T';
          await v.save();
          return v;
        }
      }
    });
    res.status(200).json(matchList);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/reservation', async (req, res, next) => {
  try {
    const match = await Match.create({
      date: req.body.date,
      capture: 'N',
      HomeId: req.body.HomeId,
      StadiumId: req.body.StadiumId,
      AwayId: req.user.LeaderId,
    });
    return res.status(201).send('경기신청을 완료하였습니다!')
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/capture', async (req, res, next) => {
  try {
    if (!req.user.LeaderId) {
      return res.status(403).send('권한이 없습니다!');
    }
    const match = await Match.create({
      date: req.body.date,
      capture: 'Y',
      HomeId: req.body.HomeId,
      StadiumId: req.body.StadiumId,
      AwayId: req.user.LeaderId,
    });
    return res.status(201).send('점령팀에게 점령경기를 신청하였습니다!');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:matchId/winner/:teamId', async (req, res, next) => {
  try {
    if (!req.user.LeaderId) {
      return res.status(403).send('권한이 없습니다.')
    }
    const match = await Match.findOne({
      where: {
        id: req.params.matchId,
      }
    });
    if (!match) {
      return res.status(400).send('해당 경기정보를 찾을 수 없습니다');
    }
    if (moment().diff(moment(match.date, 'YYYY-MM-DD HH:00:00').format(), 'hours') < 1){
      return res.status(403).send('경기 2시간이 지나고 등록할 수 있습니다.');
    }
    match.WinnerId = req.params.teamId;
    await match.save();
    if (match.capture === 'Y'){
      const stadium = await Stadium.findOne({
        where: {
          id: match.StadiumId,
        }
      });
      stadium.valid = moment(match.date, 'YYYY-MM-DD HH:mm:ss').add(7, 'days').format('YYYY-MM-DD HH:00:00');
      stadium.TeamId = req.params.teamId;
      await stadium.save();
    }
    const fullmatch = await Match.findOne({
      where: {
        id: req.params.matchId,
      },
      include: [{
        model: Team,
        as: 'Winner',
        attributes: ['title']
      }]
    });
    res.status(200).json(fullmatch);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:matchId/loser/:teamId', async (req, res, next) => {
  try {
    if (!req.user.LeaderId) {
      return res.status(403).send('권한이 없습니다.')
    }
    const match = await Match.findOne({
      where: {
        id: req.params.matchId,
      }
    });
    if (!match) {
      return res.status(400).send('해당 경기정보를 찾을 수 없습니다');
    }
    if (moment().diff(moment(match.date, 'YYYY-MM-DD HH:00:00').format(), 'hours') < 1){
      return res.status(403).send('경기 2시간이 지나고 등록할 수 있습니다.');
    }
    match.WinnerId = req.params.teamId == match.HomeId ? match.AwayId : match.HomeId;
    await match.save();
    if (match.capture === 'Y'){
      const stadium = await Stadium.findOne({
        where: {
          id: match.StadiumId,
        }
      });
      stadium.valid = moment(match.date, 'YYYY-MM-DD HH:mm:ss').add(7, 'days').format('YYYY-MM-DD HH:00:00');
      stadium.TeamId = req.params.teamId == match.HomeId ? match.AwayId : match.HomeId;
      await stadium.save();
    }
    const fullMatch = await Match.findOne({
      where: {
        id: req.params.matchId,
      },
      include: [{
        model: Team,
        as: 'Winner',
        attributes: ['title']
      }]
    })
    res.status(200).json(fullMatch);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:matchId/approve', async (req, res, next) => {
  try {
    if (!req.user.LeaderId) {
      return res.status(403).send('권한이 없습니다.')
    }
    const match = await Match.findOne({
      where: {
        id: req.params.matchId,
        HomeId: req.user.LeaderId,
      }
    });
    if (!match) {
      return res.status(400).send('해당 경기정보를 찾을 수 없습니다');
    }
    match.confirm = 'Y';
    await match.save();
    if (match.capture === 'Y') {
      // 점령 신청한 모든 게임 취소하기
      await Match.update({
        confirm: 'N',
      },{
        where: {
          StadiumId: match.StadiumId,
          capture: 'Y',
          confirm: null,
        }
      });
    }
    res.status(200).json(match);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:matchId/cancel', async (req, res, next) => {
  try {
    if (!req.user.LeaderId) {
      return res.status(403).send('권한이 없습니다.')
    }
    const match = await Match.findOne({
      where: {
        id: req.params.matchId,
        HomeId: req.user.LeaderId,
      }
    });
    if (!match) {
      return res.status(400).send('해당 경기정보를 찾을 수 없습니다');
    }
    match.confirm = 'N';
    await match.save();
    res.status(200).json(match);
  } catch (error) {
    console.error(error);
    next(error);
  }
});


router.patch('/:matchId/timeout', async (req, res, next) => {
  try {
    if (!req.user.LeaderId){
      return res.status(403).send("권한이 없습니다!");
    }
    const match = await Match.findOne({
      where: { id: req.params.matchId }
    });
    match.confirm = "T";
    await match.save();
    res.status(200).send("시간초과 데이터 입력 완료");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;