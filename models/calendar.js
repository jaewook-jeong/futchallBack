module.exports = (sequelize, DataTypes) => {
  const Calendar = sequelize.define('Calendar', {
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    possible: {
      type: DataTypes.STRING(3),
      // 0: 오전, 1: 오후, 2: 늦은저녁
      allowNull: false,
    }
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci',
  });

  Calendar.associate = (db) => {
    db.Calendar.belongsTo(db.User);
    db.Calendar.belongsTo(db.Team);
  };
  return Calendar;
};