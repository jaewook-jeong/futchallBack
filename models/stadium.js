const moment = require("moment");
module.exports = (sequelize, DataTypes) => {
    const Stadium = sequelize.define('Stadium', { // 테이블명은 stadia
        title: {
            type: DataTypes.STRING(30), 
            allowNull: false, // 필수
        },
        lat: {
            type: DataTypes.DECIMAL(17,15),
            allowNull: false,
        },
        lng: {
            type: DataTypes.DECIMAL(17,14),
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        time: {
            type: DataTypes.STRING(15), 
            allowNull: false,
        },
        light: {
            type: DataTypes.STRING(2),
            allowNull: false,
        },
        special: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        valid: {
          type: DataTypes.STRING(30),
          allowNull: true,
        }
        }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci', 
    });

    Stadium.associate = (db) => {
        db.Stadium.belongsTo(db.Team);
        db.Stadium.hasMany(db.Match, { onDelete: 'cascade' });
        db.Stadium.hasMany(db.Image, { onDelete: 'cascade' });
        db.Stadium.hasMany(db.Post, { onDelete: 'cascade' });
    };

    Stadium.addHook("afterFind", 'PastTime', async (result) => {
      if (result) {
        if (Array.isArray(result)) {
          var arrayLength = result.length;
          for (var i = 0; i < arrayLength; i++) {
              result[i].logo = "works";
          }
          return result.map(async (v) => {
            if(moment().diff(moment(v.valid, 'YYYY-MM-DD HH:00:00').format(), 'hours') > 0) {
              v.valid = null;
              v.TeamId = null;
              await v.save();
            }
          });
        } else {
            if(moment().diff(moment(result.valid, 'YYYY-MM-DD HH:00:00').format(), 'hours') > 0) {
              result.valid = null;
              result.TeamId = null;
              await result.save();
            }
            return result;
        }
      }
    });
    return Stadium;
};