const express = require('express');
const { Op } = require('sequelize');
const { Post, User, Image, Comment } = require('../models');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.where === 'team') {
      where.TeamId = req.query.id;
    } else if (req.query.where === 'stadium') {
      where.StadiumId = req.query.id;
    } else {
      return res.status(400).send('잘못된 접근입니다!');
    }
    if (parseInt(req.query.lastId, 10)) { // 초기 로딩이 아닐 때
      where.id = { [Op.lt]: parseInt(req.query.lastId, 10)}
    }
    const posts = await Post.findAll({
      where,
      limit: 5,
      order: [
        ['createdAt', 'DESC'],
        [Comment, 'createdAt', 'ASC']
      ],
      include: [{
        model: User,
        attributes: ['id', 'nickname'],
        include: [{
          model: Image,
          attributes: ['id', 'src'],
        }]
      },{
        model: Image,
        attributes: ['id', 'src'],
      },{
        model: Comment,
        attributes: ['id', 'content', 'createdAt', 'PostId', 'ParentId'],
        include: [{
          model: User,
          attributes: ['id', 'nickname'],
          include: [{
            model: Image,
            attributes: ['id', 'src'],
          }]
        }]
      }]
    });
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    next(err);
  }
})

module.exports = router;