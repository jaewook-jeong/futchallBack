const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name; // futchall
  const Key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const filename = Key.split('/')[Key.split('/').length - 1];
  const requiredFormat = Key.split('.')[Key.split('.').length - 1].toLowerCase();
  try {
    if (requiredFormat !== 'jpg' && requiredFormat !== 'gif') {
      const s3Object = await s3.getObject({ Bucket, Key }).promise();
      const resizedImage = await sharp(s3Object.Body)
        .resize(400, 400, { fit: 'inside' })
        .toFormat(requiredFormat)
        .toBuffer();
      await s3.putObject({
        Bucket,
        Key: `thumb/${filename}`,
        Body: resizedImage,
      }).promise();
      return callback(null, `thumb/${filename}`);
    } else if(requiredFormat === 'jpg') {
      const s3Object = await s3.getObject({ Bucket, Key }).promise();
      const resizedImage = await sharp(s3Object.Body)
        .resize(400, 400, { fit: 'inside' })
        .jpeg({
          quality: 100,
          force: true,
        })
        .toBuffer();
      await s3.putObject({
        Bucket,
        Key: `thumb/${filename}`,
        Body: resizedImage,
      }).promise();
      return callback(null, `thumb/${filename}`);
    }
    return callback(null);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
}
