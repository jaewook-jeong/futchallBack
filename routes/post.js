const express = require('express');

const { Post, Comment, Image, User, Stadium, Team } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

router.post('/', isLoggedIn, async (req, res, next) => {
  // 경기정보도 들어있는 게시글
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [{
        model: Image,
      },{
        model: Comment,
      },{
        model: User,
      },{
        model: Stadium,
      },{
        model: Team,
      }]
    });
    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/team', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
      TeamId: req.body.req,
    });
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [{
        model: Image,
      },{
        model: Comment,
      },{
        model: User,
      },{
        model: Stadium,
      },{
        model: Team,
      }]
    });
    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/stadium', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
      StadiumId: req.body.req,
    });
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [{
        model: Image,
      },{
        model: Comment,
      },{
        model: User,
      },{
        model: Stadium,
      },{
        model: Team,
      }]
    });
    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/:postId/comment', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: {
        id: req.params.postId,
      }
    })
    if (!post) {
      return res.status(403).send('존재하지 않는 게시글입니다.')
    }
    const comment = await Comment.create({
      content: req.body,content,
      PostId: req.params.postId,
      UserId: req.user.id, // passport에서 deserialize 한 후 req.user에 넣어준다
    });
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:postId', isLoggedIn, async (req, res, next) => {
  try {
    await Post.destroy({
      where: {
        id: req.params.postId,
        UserId: req.user.id,
      }
    });
    res.status(200).json({ PostId: parseInt(req.params.postId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;