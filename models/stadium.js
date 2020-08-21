module.exports = (sequelize, DataTypes) => {
    const Stadium = sequelize.define('Stadium', { // 테이블명은 stadia
        title: {
            type: DataTypes.STRING(30), 
            allowNull: false, // 필수
        },
        lat: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        lng: {
            type: DataTypes.STRING(20),
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

    return Stadium;
};