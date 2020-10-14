const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.User = require('./user')(sequelize, Sequelize);
db.Team = require('./team')(sequelize, Sequelize);
db.Stadium = require('./stadium')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);
db.Match = require('./match')(sequelize, Sequelize);
db.Image = require('./image')(sequelize, Sequelize);
db.Comment = require('./comment')(sequelize, Sequelize);
db.Calendar = require('./calendar')(sequelize, Sequelize);



Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
