const multer = require('multer');
const path =require('path');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

require('dotenv').config();

exports.isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).send('로그인이 필요합니다.');
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.user) {
    next();
  } else {
    res.status(401).send('로그인 하지 않은 상태여야합니다!');
  }
};

exports.refererCheck = (req, res, next) => {
  console.log('------------------------------------');
  console.log(req.headers.referer);
  console.log('------------------------------------');
  if (req.headers.referer === undefined || req.headers.referer.includes('futchall.com')){
    next();
  } else {
    res.status(403).send('Referer Error');
  }
}
AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2',
});

exports.upload = multer({
  storage: multerS3({
    s3: new AWS.S3(),
    bucket: 'futchall',
    key(req, file, cb) {
      cb(null, `original/${Date.now()}_${path.basename(file.originalname)}`)
    }
  })
});