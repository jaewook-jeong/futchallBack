module.exports = (sequelize, DataTypes) => {
  const Match = sequelize.define('Match', { // 테이블명은 matches
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      captrue: {
        type: DataTypes.STRING(3),
        allowNull: false,
      },
      confirm: {
        type: DataTypes.STRING(3),
        allowNull: true,
      }
    }, {
      charset: 'utf8',
      collate: 'utf8_general_ci', 
  });

  Match.associate = (db) => {
    db.Match.belongsTo(db.Stadium);
    db.Match.belongsTo(db.Post);
    db.Match.belongsTo(db.Team, { as: 'Home' });
    db.Match.belongsTo(db.Team, { as: 'Away' });
    db.Match.belongsTo(db.Team, { as: 'Winner' });
  };

  return Match;
};