require("dotenv").config()

const express = require("express");
const cors = require("cors")

const sequelize = require("./config/database");
const loadModels = require ("./models");

loadModels(sequelize);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "CleanSlate backend is running",
    })
})

const PORT = process.env.PORT || 8080;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log("Postgres connection successful")

        app.listen(PORT, () => {
            console.log(`backend listening on port ${PORT}`)
        });
    } catch (error) {
        console.error("Unable to start backend:", error)
        process.exit(1);   
    }
}
startServer();