const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const weatherRoutes = require("./routes/weather");
const iaRoutes = require("./routes/ia");

const app = express();
const rootDir = path.join(__dirname, "..");

app.use(cors());
app.use(express.json());
app.use(express.static(rootDir));

app.use("/weather", weatherRoutes);
app.use("/ia", iaRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});