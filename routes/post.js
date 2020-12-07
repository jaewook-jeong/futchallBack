const express = require('express');
const passport = require('passport');

const { Post, Comment, Image, User, Stadium, Team, Match } = require('../models');
const { isLoggedIn, upload } = require('./middlewares');

const router = express.Router();

router.post('/images', passport.authenticate('access-jwt', { session: false }),  upload.array('image'), async (req, res, next) => {
  console.log(req.files);
  res.json(req.files.map((v) => v.location.replace(/\/original\//, '/thumb/')));
});

router.post('/team', passport.authenticate('access-jwt', { session: false }), upload.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
      TeamId: req.body.req,
    });
    if (req.body.image) {
      if (Array.isArray(req.body.image)) {
        const images = await Promise.all(req.body.image.map((image) => Image.create({ src: image })));
        await post.addImages(images);
      } else {
        const image = await Image.create({ src: req.body.image });
        await post.addImages(image);
      }
    }
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [{
        model: Image,
        attributes: ['id', 'src']
      },{
        model: Comment,
      },{
        model: User,
        attributes: ['id', 'nickname', 'TeamId'],
        include: [{
          model: Image,
          attributes: ['id','src'],
        }]
      }]
    });
    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/stadium', passport.authenticate('access-jwt', { session: false }), upload.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
      StadiumId: req.body.req,
    });
    if (req.body.image) {
      if (Array.isArray(req.body.image)) {
        const images = await Promise.all(req.body.image.map((image) => Image.create({ src: image })));
        await post.addImages(images);
      } else {
        const image = await Image.create({ src: req.body.image });
        await post.addImages(image);
      }
    }
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [{
        model: Image,
        attributes: ['id', 'src']
      },{
        model: Comment,
      },{
        model: User,
        attributes: ['id', 'nickname', 'TeamId'],
        include: [{
          model: Image,
          attributes: ['src'],
        }],
      }]
    });
    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/:postId/comment', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: {
        id: req.params.postId,
      }
    })
    if (!post) {
      return res.status(403).send('존재하지 않는 게시글입니다.')
    }
    await Comment.create({
      content: req.body.content,
      PostId: req.params.postId,
      UserId: req.user.id,
      ParentId: req.body.parentId,
    });
    const fullComment = await Comment.findAll({
      where: { PostId: req.params.postId },
      attributes: ['id', 'content', 'createdAt', 'PostId', 'ParentId'],
      include: [{
        model: User,
        attributes: ['id', 'nickname'],
        include: [{
          model: Image,
          attributes: ['id', 'src'],
        }]
      }],
    })
    res.status(201).json(fullComment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:postId', async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: {
        id: req.params.postId,
      },
      include: [{
        model: User,
        attributes: ['id', 'nickname'],
        include: [{
          model: Image,
          attributes: ['src'],
        }]
      },{
        model: Image,
        attributes: ['src'],
      },{
        model: Match,
        attributes: ['date'],
        include: [{
          model: Team,
          as: 'Home',
          attributes: ['id', 'title']
        },{
          model: Team,
          as: 'Away',
          attributes: ['id', 'title']
        },{
          model: Stadium,
          attributes: ['id', 'title', 'address']
        }]
      },{
        model: Comment,
        attributes: ['id', 'content', 'createdAt', 'PostId', 'ParentId'],
        include: [{
          model: User,
          attributes: ['id', 'nickname'],
          include: [{
            model: Image,
            attributes: ['src'],
          }]
        }]
      }],
    });
    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:postId', passport.authenticate('access-jwt', { session: false }), async (req, res, next) => {
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