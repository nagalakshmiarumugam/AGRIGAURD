
import json
import serial
import requests

PORT = "COM4"
BAUD = 115200
API_URL = "http://127.0.0.1:8000/api/sensor-data"

print("AGRIGAURD USB Bridge Starting...")

try:
    esp32 = serial.Serial(PORT, BAUD, timeout=3)
    print("ESP32 connected on", PORT)
    print("Sending real readings to the backend...")

    while True:
        line = esp32.readline().decode(
            "utf-8", errors="ignore"
        ).strip()

        if not line.startswith("{"):
            continue

        try:
            data = json.loads(line)

            response = requests.post(
                API_URL,
                json=data,
                timeout=3
            )
            response.raise_for_status()

            print(
                f"Temperature: {data['temperature']} C | "
                f"Humidity: {data['humidity']} % | "
                f"Distance: {data['distance']} cm | "
                f"Blower suggested: {data['blower']}"
            )

        except (json.JSONDecodeError, KeyError) as error:
            print("Invalid sensor data:", error)

        except requests.RequestException as error:
            print("Backend connection error:", error)

except serial.SerialException as error:
    print("Serial port error:", error)
    print("Close Arduino Serial Monitor and check COM4.")