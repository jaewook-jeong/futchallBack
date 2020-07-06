module.exports = (sequelize, DataTypes) => {
    const Team = sequelize.define('Team', { // 테이블명은 teams
        req: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
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
        db.Team.hasMany(db.Match);
        db.Team.hasOne(db.User,{foreignKey:'leader'});
        // db.Team.belongsToMany(db.Post, { through: 'Like', as: 'Liked' });
    };

    return Team;
};