module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },{
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  });

  Post.associate = (db) => {
    db.Post.belongsTo(db.User);
    db.Post.belongsTo(db.Stadium);
    db.Post.belongsTo(db.Team);
    db.Post.hasMany(db.Comment);
    db.Post.hasMany(db.Image);
  };

  return Post;
};
