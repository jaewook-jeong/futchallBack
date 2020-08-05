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
    db.Post.hasMany(db.Comment);
  };

  return Post;
};
