const express = require('express');

const { Post } = require('../models');
const { noExtendLeft } = require('sequelize/types/lib/operators');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
    });
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    next(error);
  }
});