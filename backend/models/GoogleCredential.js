module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        "GoogleCredential",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true,
            },
            encryptedRefreshToken: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            grantedScopes: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            refreshTokenUpdatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            authorizationStatus: {
                type: DataTypes.ENUM(
                    "active",
                    "revoked",
                    "expired",
                    "reauthorization_required"
                ),
                allowNull: false,
                defaultValue: "active",
            },
        },
        {
            tableName: "google_credentials",
            timestamps: true,
        }
    );
};