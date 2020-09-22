const express = require('express');
const { Match } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

router.patch('/:matchId/winner/:teamId', isLoggedIn, async (req, res, next) => {
  try {
    if (!req.user.LeaderId) {
      return res.status(403).send('권한이 없습니다.')
    }
    const match = await Match.findOne({
      where: {
        id: req.params.matchId,
      }
    });
    console.log(match, "aaa");
    if (!match) {
      return res.status(400).send('해당 경기정보를 찾을 수 없습니다');
    }
    match.WinnerId = req.params.teamId;
    await match.save();
    res.status(200).send("success");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:matchId/loser/:teamId', isLoggedIn, async (req, res, next) => {
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
    match.WinnerId = req.params.teamId == match.HomeId ? match.AwayId : match.HomeId;
    await match.save();
    res.status(200).send("success");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:matchId/approve', isLoggedIn, async (req, res, next) => {
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
    res.status(200).send("success");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:matchId/cancel', isLoggedIn, async (req, res, next) => {
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
    res.status(200).send("success");
  } catch (error) {
    console.error(error);
    next(error);
  }
});


router.patch('/:matchId/timeout', isLoggedIn, async (req, res, next) => {
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