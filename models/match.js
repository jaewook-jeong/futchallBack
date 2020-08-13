module.exports = (sequelize, DataTypes) => {
  const Match = sequelize.define('Match', { // 테이블명은 matches
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      scores: {
        type: DataTypes.STRING(5),
        allowNull: false,
      },
    }, {
      charset: 'utf8',
      collate: 'utf8_general_ci', 
  });

  Match.associate = (db) => {
    db.Match.belongsTo(db.Stadium);
    db.Match.belongsTo(db.Team, { as: 'Home' });
    db.Match.belongsTo(db.Team, { as: 'Away' });
  };

  return Match;
};