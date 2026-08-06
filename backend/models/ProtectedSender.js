module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        "ProtectedSender",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            senderEmail: {
                type: DataTypes.STRING(320),
                allowNull: false,
                set(value) {
                    this.setDataValue(
                        "senderEmail",
                        value.trim().toLowerCase()
                    );
                },
                validate: {
                    isEmail: true,
                },
            },
        },
        {
            tableName: "protected_senders",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ["userId", "senderEmail"],
                },
            ],
        }
    );
};