const express = require('express');
const { Op } = require('sequelize');


const db = require('../models');
const router = express.Router();

router.patch('/', async (req, res, next) => {
  try {
    const stadiumList = await db.Stadium.findAll({
      where: {
        lat: {
          [Op.gte]: req.body.left,
          [Op.lte]: req.body.right,
        },
        lng: {
          [Op.gte]: req.body.bottom,
          [Op.lte]: req.body.top,
        }
      },
      include: [{
        model: db.Image,
      }]
    });
    res.status(200).json(stadiumList);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;