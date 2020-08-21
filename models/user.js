module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', { // 테이블명은 users
        nickname: {
            type: DataTypes.STRING(20), // 20글자 이하
            allowNull: false, // 필수
        },
        originalId: {
            type: DataTypes.STRING(20),
            allowNull: false,
            // primaryKey: true,
        },
        password: {
            type: DataTypes.STRING(100), // 100글자 이하
            allowNull: false,
        },
        positions: {
            type: DataTypes.STRING(300),
            allowNull: true,
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        locations: {
            type: DataTypes.STRING(300),
            allowNull: true,
        },
        }, {
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });

    User.associate = (db) => {
        db.User.belongsTo(db.Team);
        db.User.belongsTo(db.Team, { as: 'Leader' });
        db.User.hasMany(db.Comment, { onDelete: 'cascade' });
        db.User.hasMany(db.Post, { onDelete: 'cascade' });
        db.User.hasMany(db.Image, { onDelete: 'cascade' });
    };

    return User;
};