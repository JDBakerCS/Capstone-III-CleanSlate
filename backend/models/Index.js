const { DataTypes } = require("sequelize");

const defineUser = require("./User");
const defineGoogleCredential = require("./GoogleCredential");
const defineProtectedSender = require("./ProtectedSender");
const defineScan = require("./Scan");
const defineScanItem = require("./ScanItem");

module.exports = (sequelize) => {
    const User = defineUser(sequelize, DataTypes);
    const GoogleCredential = defineGoogleCredential(sequelize, DataTypes);
    const ProtectedSender = defineProtectedSender(sequelize, DataTypes);
    const Scan = defineScan(sequelize, DataTypes);
    const ScanItem = defineScanItem(sequelize, DataTypes);

    User.hasOne(GoogleCredential, {
        foreignKey: "userId",
        as: "googleCredential",
        onDelete: "CASCADE",
    });

    GoogleCredential.belongsTo(User, {
        foreignKey: "userId",
        as: "user",
    });

    User.hasMany(ProtectedSender, {
        foreignKey: "userId",
        as: "protectedSenders",
        onDelete: "CASCADE",
    });

    ProtectedSender.belongsTo(User, {
        foreignKey: "userId",
        as: "user",
    });

    User.hasMany(Scan, {
        foreignKey: "userId",
        as: "scans",
        onDelete: "CASCADE",
    });

    Scan.belongsTo(User, {
        foreignKey: "userId",
        as: "user",
    });

    Scan.hasMany(ScanItem, {
        foreignKey: "scanId",
        as: "items",
        onDelete: "CASCADE",
    });

    ScanItem.belongsTo(Scan, {
        foreignKey: "scanId",
        as: "scan",
    });

    return {
        sequelize,
        User,
        GoogleCredential,
        ProtectedSender,
        Scan,
        ScanItem,
    };
};