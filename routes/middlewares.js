const multer = require('multer');
const path =require('path');
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
  if (req.headers.referer === 'http://54.180.102.143' || req.headers.referer === undefined){
    next();
  } else {
    res.status(403).send('Referer Error');
  }
}

exports.upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, 'uploads');
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname); //확장자 추출
      const basename = path.basename(file.originalname, ext);
      done(null, basename + '_'+ new Date().getTime() + ext);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, //20Mb
});