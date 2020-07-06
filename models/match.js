module.exports = (sequelize, DataTypes) => {
    const Match = sequelize.define('Match', { // 테이블명은 matches
        req: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        homeTeam: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        awayTeam: {
            type: DataTypes.TEXT,
            allowNull: false,
        }
        }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci', 
    });

    Match.associate = (db) => {
        db.Match.hasOne(db.Stadium,{foreignKey:'stadium'});
        db.Match.belongsToMany(db.Team, {/* through: 'Like', as: 'Liked' */});
    };

    return Match;
};