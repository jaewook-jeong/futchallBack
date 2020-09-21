const express = require('express');
const { Match } = require('../models');const { isLoggedIn } = require('./middlewares');
;

const router = express.Router();

router.get('/:matchId/timeout', isLoggedIn, async (req, res, next) => {
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