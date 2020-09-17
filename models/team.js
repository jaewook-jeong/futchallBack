module.exports = (sequelize, DataTypes) => {
    const Team = sequelize.define('Team', { // 테이블명은 teams
        title: {
            type: DataTypes.STRING(30), 
            allowNull: false, // 필수
        },
        location: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        time: {
            type: DataTypes.STRING(30), 
            allowNull: false,
        },
        recruit: {
            type: DataTypes.STRING(2),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci', 
    });

    Team.associate = (db) => {
      db.Team.hasMany(db.User);
      db.Team.hasMany(db.Stadium);
      db.Team.hasMany(db.Post, { onDelete: 'cascade' });
      db.Team.hasMany(db.Image, { onDelete: 'cascade' });
      db.Team.hasOne(db.Match, { as: 'Home' });
      db.Team.hasOne(db.Match, { as: 'Away' });
      db.Team.hasOne(db.Match, { as: 'Winner' });
      db.Team.hasOne(db.User, { as: 'Leader' });
      db.Team.hasMany(db.User, { as: 'JoinIn' });
    };

    return Team;
};