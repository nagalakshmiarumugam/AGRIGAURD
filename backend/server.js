
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Store the latest real ESP32 reading in memory.
let latestData = null;

// Backend health check
app.get("/api/health", (req, res) => {
    res.json({
        name: "AGRIGAURD Backend",
        status: "running",
        sensorConnected: latestData !== null
    });
});

// Receive sensor readings from the ESP32 serial bridge
app.post("/api/sensor-data", (req, res) => {
    const { deviceId, temperature, humidity, distance, blower } = req.body;

    if (
        !deviceId ||
        typeof temperature !== "number" ||
        typeof humidity !== "number" ||
        typeof distance !== "number"
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid sensor data"
        });
    }

    latestData = {
        deviceId,
        temperature,
        humidity,
        distance,
        blower: Boolean(blower),
        timestamp: new Date().toISOString()
    };

    console.log("Sensor Data:", latestData);

    res.json({
        success: true,
        message: "Sensor data received",
        data: latestData
    });
});

// Send the latest reading to the dashboard
app.get("/api/sensor-data", (req, res) => {
    if (latestData === null) {
        return res.status(200).json(null);
    }

    res.json(latestData);
});

// Backend root route
app.get("/", (req, res) => {
    res.send("AGRIGAURD Backend is running. Use /api/health to check status.");
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`AGRIGAURD running on port ${PORT}`);
});
