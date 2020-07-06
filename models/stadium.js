module.exports = (sequelize, DataTypes) => {
    const Stadium = sequelize.define('Stadium', { // 테이블명은 stadiums
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
        lat: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        lng: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        time: {
            type: DataTypes.STRING(10), 
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
        }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci', 
    });

    Stadium.associate = (db) => {
        db.Stadium.hasOne(db.Team,{foreignKey:'occupation'});
    };

    return Stadium;
};