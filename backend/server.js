
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Render provides PORT; locally, AGRIGAURD uses port 8000.
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

let latestData = null;

// Backend health check
app.get("/api/health", (req, res) => {
    res.json({
        name: "AGRIGAURD Backend",
        status: "running"
    });
});

// Receive real ESP32 sensor readings
app.post("/api/sensor-data", (req, res) => {
    latestData = {
        deviceId: req.body.deviceId,
        temperature: req.body.temperature,
        humidity: req.body.humidity,
        distance: req.body.distance,
        blower: req.body.blower,
        timestamp: new Date().toISOString()
    };

    console.log("Sensor Data:", latestData);

    res.json({
        success: true,
        message: "Sensor data received",
        data: latestData
    });
});

// Send the latest sensor readings to the dashboard
app.get("/api/sensor-data", (req, res) => {
    res.json(latestData);
});

// Serve the built React dashboard when available
const frontendPath = path.join(
    __dirname,
    "..",
    "frontend",
    "dist"
);

app.use(express.static(frontendPath));

// Support React dashboard navigation
app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return next();
    }

    res.sendFile(
        path.join(frontendPath, "index.html"),
        (err) => {
            if (err) {
                next(err);
            }
        }
    );
});

// Listen for connections
app.listen(PORT, "0.0.0.0", () => {
    console.log(`AGRIGAURD running on port ${PORT}`);
});
