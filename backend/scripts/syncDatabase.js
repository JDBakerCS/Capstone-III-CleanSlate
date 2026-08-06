const sequelize = require("../config/database");
const loadModels = require("../models");

loadModels(sequelize);

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Database connection successful.");

    await sequelize.sync();
    console.log("Tables created successfully.");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

syncDatabase();