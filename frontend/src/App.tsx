
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CircleCheck,
  Droplets,
  Gauge,
  Leaf,
  Menu,
  Radio,
  Settings,
  Thermometer,
  Wind,
  Wifi,
  X,
} from "lucide-react";
import "./App.css";

interface SensorData {
  deviceId: string;
  temperature: number;
  humidity: number;
  distance: number;
  blower?: boolean;
  timestamp?: string;
}

interface HistoryPoint {
  temperature: number;
  humidity: number;
  distance: number;
  time: string;
}

type Page =
  | "Dashboard"
  | "Live Monitoring"
  | "Analytics"
  | "Aeration"
  | "System Settings";

const pages: { name: Page; icon: typeof Gauge }[] = [
  { name: "Dashboard", icon: Gauge },
  { name: "Live Monitoring", icon: Activity },
  { name: "Analytics", icon: BarChart3 },
  { name: "Aeration", icon: Wind },
  { name: "System Settings", icon: Settings },
];

function App() {
  const [data, setData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [backendStatus, setBackendStatus] = useState("CONNECTING");
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const API_URL = "";

  // Fetch the existing real sensor data every two seconds.
  useEffect(() => {
    let mounted = true;

    const getSensorData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/sensor-data`);

        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        const result = await response.json();

        if (!mounted) return;

        if (
          result &&
          Number.isFinite(Number(result.temperature)) &&
          Number.isFinite(Number(result.humidity)) &&
          Number.isFinite(Number(result.distance))
        ) {
          const sensorData: SensorData = {
            ...result,
            temperature: Number(result.temperature),
            humidity: Number(result.humidity),
            distance: Number(result.distance),
          };

          setData(sensorData);
          setBackendStatus("ONLINE");

          const point: HistoryPoint = {
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
            distance: sensorData.distance,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          };

          setHistory((previous) => [...previous, point].slice(-60));
        } else {
          setBackendStatus("WAITING");
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Sensor connection:", error);
        setBackendStatus("OFFLINE");
      }
    };

    getSensorData();

    const interval = window.setInterval(getSensorData, 2000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const temperature = data?.temperature ?? null;
  const humidity = data?.humidity ?? null;
  const distance = data?.distance ?? null;

  // Existing automation rule, displayed as a decision only.
  const blowerOn =
    temperature !== null &&
    humidity !== null &&
    (temperature > 25 || humidity < 70);

  const temperatureAlert =
    temperature !== null && temperature > 25;

  const humidityAlert =
    humidity !== null && humidity < 70;

  const navigateTo = (page: Page) => {
    setActivePage(page);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const format = (value: number | null, digits = 1) =>
    value === null ? "--" : value.toFixed(digits);

  const average = (values: number[]) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

  const min = (values: number[]) =>
    values.length ? Math.min(...values) : null;

  const max = (values: number[]) =>
    values.length ? Math.max(...values) : null;

  const temperatures = history.map((point) => point.temperature);
  const humidities = history.map((point) => point.humidity);

  const descriptions: Record<Page, string> = {
    Dashboard: "Smart grain storage overview",
    "Live Monitoring": "Live readings from your connected sensors",
    Analytics: "Trends and statistics from this session",
    Aeration: "Automatic aeration decision and trigger conditions",
    "System Settings": "Current system configuration and device status",
  };

  const MetricCard = ({
    title,
    value,
    unit,
    icon: Icon,
    status,
    footer,
    className = "",
  }: {
    title: string;
    value: string;
    unit?: string;
    icon: typeof Gauge;
    status?: string;
    footer?: string;
    className?: string;
  }) => (
    <div className={`sensor-card ${className}`}>
      <div className="card-top">
        <div className="sensor-icon">
          <Icon size={22} />
        </div>
        {status && (
          <span
            className={
              status === "HIGH" || status === "LOW"
                ? "alert-pill"
                : status === "REQUESTED ON"
                  ? "active-pill"
                  : "normal-pill"
            }
          >
            {status}
          </span>
        )}
      </div>
      <div className="card-label">{title}</div>
      <div className="sensor-value">
        {value}
        {unit && <span>{unit}</span>}
      </div>
      {footer && (
        <div className="card-footer">
          <span>Information</span>
          <strong>{footer}</strong>
        </div>
      )}
    </div>
  );

  const SettingsItem = ({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) => (
    <div className="setting-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );

  const HistoryChart = () => (
    <section className="panel history-panel">
      <div className="panel-header">
        <div>
          <span className="panel-overline">SENSOR HISTORY</span>
          <h3>Environmental Trend</h3>
        </div>
        <div className="live-indicator">
          <span />
          LIVE
        </div>
      </div>

      <div className="chart">
        {history.length > 0 ? (
          <div className="bars">
            {history.slice(-12).map((point, index) => (
              <div
                className="bar-group"
                key={`${point.time}-${index}`}
                title={`${point.time}: ${point.temperature}°C, ${point.humidity}%`}
              >
                <div className="bar-values">
                  <span>{point.temperature.toFixed(1)}°</span>
                </div>
                <div
                  className="bar temperature-bar"
                  style={{
                    height: `${Math.min(
                      100,
                      Math.max(5, point.temperature * 2),
                    )}%`,
                  }}
                />
                <div
                  className="bar humidity-bar"
                  style={{
                    height: `${Math.min(
                      100,
                      Math.max(5, point.humidity),
                    )}%`,
                  }}
                />
                <small>{point.time}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-chart">
            <Activity size={35} />
            <p>Waiting for real sensor readings...</p>
          </div>
        )}
      </div>

      <div className="chart-legend">
        <span>
          <i className="legend-temp" />
          Temperature
        </span>
        <span>
          <i className="legend-humidity" />
          Humidity
        </span>
      </div>
      <p className="muted-note">
        The chart uses readings collected during this browser session.
      </p>
    </section>
  );

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "show" : ""}`}>
        <div className="brand">
          <div className="brand-logo">
            <Leaf size={25} />
          </div>
          <div>
            <h1>AGRIGAURD</h1>
            <span>SMART SILO SYSTEM</span>
          </div>
        </div>

        <nav>
          {pages.map(({ name, icon: Icon }) => (
            <div
              key={name}
              className={`nav-item ${activePage === name ? "active" : ""}`}
              onClick={() => navigateTo(name)}
              role="button"
              tabIndex={0}
              aria-current={activePage === name ? "page" : undefined}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigateTo(name);
                }
              }}
            >
              <Icon size={19} />
              {name}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-mini">
            <div
              className={`mini-status ${
                backendStatus === "ONLINE" ? "" : "status-offline"
              }`}
            />
            <div>
              <strong>
                {backendStatus === "ONLINE"
                  ? "System Connected"
                  : "System Status"}
              </strong>
              <span>{backendStatus}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE MENU */}
      <button
        className="mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>

      <main className="main">
        {/* COMMON HEADER */}
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              AGRIGAURD <span>/</span> {activePage}
            </div>
            <h2>
              {activePage === "Dashboard"
                ? "Smart Silo Control Center"
                : activePage}
            </h2>
            <p>{descriptions[activePage]}</p>
          </div>

          <div className="top-actions">
            <div className={`connection ${backendStatus.toLowerCase()}`}>
              <span className="connection-dot" />
              <div>
                <small>BACKEND STATUS</small>
                <strong>{backendStatus}</strong>
              </div>
              <Wifi size={18} />
            </div>
          </div>
        </header>

        {/* =================================================
            PAGE 1 - DASHBOARD
        ================================================= */}
        {activePage === "Dashboard" && (
          <>
            <section className="device-bar">
              <div className="device-info">
                <div className="device-icon">
                  <Radio size={20} />
                </div>
                <div>
                  <span>DEVICE ID</span>
                  <strong>{data?.deviceId || "AGRIGAURD-ESP32-01"}</strong>
                </div>
              </div>
              <div className="device-live">
                <CircleCheck size={17} />
                {backendStatus === "ONLINE"
                  ? "SENSOR DATA RECEIVED"
                  : "WAITING FOR SENSOR DATA"}
              </div>
            </section>

            <section className="sensor-grid">
              <MetricCard
                title="TEMPERATURE"
                value={format(temperature)}
                unit="°C"
                icon={Thermometer}
                status={
                  temperature === null
                    ? "WAITING"
                    : temperatureAlert
                      ? "HIGH"
                      : "NORMAL"
                }
                footer="Threshold 25°C"
                className="temperature-card"
              />
              <MetricCard
                title="HUMIDITY"
                value={format(humidity)}
                unit="%"
                icon={Droplets}
                status={
                  humidity === null
                    ? "WAITING"
                    : humidityAlert
                      ? "LOW"
                      : "NORMAL"
                }
                footer="Threshold 70%"
                className="humidity-card"
              />
              <MetricCard
                title="GRAIN DISTANCE"
                value={format(distance)}
                unit="cm"
                icon={Leaf}
                status={distance === null ? "WAITING" : "LIVE"}
                footer="Sensor HC-SR04"
                className="grain-card"
              />
              <MetricCard
                title="AERATION DECISION"
                value={
                  temperature === null || humidity === null
                    ? "--"
                    : blowerOn
                      ? "ON"
                      : "OFF"
                }
                icon={Wind}
                status={
                  temperature === null || humidity === null
                    ? "WAITING"
                    : blowerOn
                      ? "REQUESTED ON"
                      : "REQUESTED OFF"
                }
                footer="Calculated status"
                className="blower-card"
              />
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-overline">STORAGE MONITOR</span>
                    <h3>Grain Surface</h3>
                  </div>
                  <div className="panel-icon">
                    <Leaf size={20} />
                  </div>
                </div>

                <div className="silo-visual">
                  <div className="silo-body">
                    <div
                      className="grain-fill"
                      style={{
                        height:
                          distance !== null &&
                          distance >= 0 &&
                          distance <= 150
                            ? `${Math.max(
                                15,
                                Math.min(85, 100 - (distance / 150) * 100),
                              )}%`
                            : "15%",
                      }}
                    >
                      <div className="grain-wave" />
                    </div>
                    <div className="silo-lines">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                    </div>
                  </div>
                  <div className="silo-info">
                    <strong>
                      {distance !== null ? `${distance.toFixed(1)} cm` : "--"}
                    </strong>
                    <span>Distance to grain surface</span>
                    <div className="level-status">
                      <span />
                      HC-SR04 reading
                    </div>
                  </div>
                </div>
                <p className="muted-note">
                  The visual fill is illustrative. Accurate grain percentage
                  requires the actual silo height and sensor position.
                </p>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-overline">CURRENT CONDITIONS</span>
                    <h3>Environmental Status</h3>
                  </div>
                  <div className="panel-icon">
                    <Activity size={20} />
                  </div>
                </div>

                <div className="condition-list">
                  <div className={`condition ${temperatureAlert ? "triggered" : ""}`}>
                    <span className="condition-dot" />
                    <div>
                      <strong>Temperature</strong>
                      <small>
                        {temperature === null ? "--" : `${temperature.toFixed(1)}°C`}
                      </small>
                    </div>
                    <b>
                      {temperature === null
                        ? "WAITING"
                        : temperatureAlert
                          ? "HIGH"
                          : "NORMAL"}
                    </b>
                  </div>
                  <div className={`condition ${humidityAlert ? "triggered" : ""}`}>
                    <span className="condition-dot" />
                    <div>
                      <strong>Humidity</strong>
                      <small>
                        {humidity === null ? "--" : `${humidity.toFixed(1)}%`}
                      </small>
                    </div>
                    <b>
                      {humidity === null
                        ? "WAITING"
                        : humidityAlert
                          ? "LOW"
                          : "NORMAL"}
                    </b>
                  </div>
                </div>

                <div className="summary-stat">
                  <span>Samples collected this session</span>
                  <strong>{history.length}</strong>
                </div>
              </div>
            </section>
          </>
        )}

        {/* =================================================
            PAGE 2 - LIVE MONITORING
        ================================================= */}
        {activePage === "Live Monitoring" && (
          <>
            <section className="device-bar">
              <div className="device-info">
                <div className="device-icon">
                  <Radio size={20} />
                </div>
                <div>
                  <span>MONITORED DEVICE</span>
                  <strong>{data?.deviceId || "AGRIGAURD-ESP32-01"}</strong>
                </div>
              </div>
              <div className="device-live">
                <span className="connection-dot" />
                {backendStatus === "ONLINE" ? "RECEIVING DATA" : backendStatus}
              </div>
            </section>

            <section className="sensor-grid three-cards">
              <MetricCard
                title="LIVE TEMPERATURE"
                value={format(temperature)}
                unit="°C"
                icon={Thermometer}
                status={temperatureAlert ? "HIGH" : temperature === null ? "WAITING" : "NORMAL"}
                footer="DHT22 sensor"
                className="temperature-card"
              />
              <MetricCard
                title="LIVE HUMIDITY"
                value={format(humidity)}
                unit="%"
                icon={Droplets}
                status={humidityAlert ? "LOW" : humidity === null ? "WAITING" : "NORMAL"}
                footer="DHT22 sensor"
                className="humidity-card"
              />
              <MetricCard
                title="LIVE DISTANCE"
                value={format(distance)}
                unit="cm"
                icon={Leaf}
                status={distance === null ? "WAITING" : "LIVE"}
                footer="HC-SR04 sensor"
                className="grain-card"
              />
            </section>

            <section className="panel section-gap">
              <div className="panel-header">
                <div>
                  <span className="panel-overline">CONNECTION DETAILS</span>
                  <h3>Live Device Information</h3>
                </div>
                <div className="panel-icon">
                  <Wifi size={20} />
                </div>
              </div>

              <div className="settings-grid">
                <SettingsItem label="Backend status" value={backendStatus} />
                <SettingsItem
                  label="Device ID"
                  value={data?.deviceId || "Waiting for data"}
                />
                <SettingsItem label="Refresh interval" value="2 seconds" />
                <SettingsItem
                  label="Last received"
                  value={
                    data?.timestamp
                      ? new Date(data.timestamp).toLocaleString()
                      : "Not provided by backend"
                  }
                />
                <SettingsItem label="Samples in this session" value={String(history.length)} />
                <SettingsItem label="Data endpoint" value="/api/sensor-data" />
              </div>
            </section>

            <section className="panel section-gap">
              <div className="panel-header">
                <div>
                  <span className="panel-overline">RECENT READINGS</span>
                  <h3>Latest Sensor Samples</h3>
                </div>
              </div>
              <div className="table-wrap">
                <table className="readings-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Temperature</th>
                      <th>Humidity</th>
                      <th>Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(-10).reverse().map((point, index) => (
                      <tr key={`${point.time}-${index}`}>
                        <td>{point.time}</td>
                        <td>{point.temperature.toFixed(1)} °C</td>
                        <td>{point.humidity.toFixed(1)}%</td>
                        <td>{point.distance.toFixed(1)} cm</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={4}>Waiting for real sensor readings...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* =================================================
            PAGE 3 - ANALYTICS
        ================================================= */}
        {activePage === "Analytics" && (
          <>
            <section className="sensor-grid">
              <MetricCard
                title="AVERAGE TEMPERATURE"
                value={format(average(temperatures))}
                unit="°C"
                icon={Thermometer}
                footer={`${history.length} samples`}
                className="temperature-card"
              />
              <MetricCard
                title="AVERAGE HUMIDITY"
                value={format(average(humidities))}
                unit="%"
                icon={Droplets}
                footer={`${history.length} samples`}
                className="humidity-card"
              />
              <MetricCard
                title="MIN TEMPERATURE"
                value={format(min(temperatures))}
                unit="°C"
                icon={Thermometer}
                footer="Session minimum"
                className="grain-card"
              />
              <MetricCard
                title="MAX TEMPERATURE"
                value={format(max(temperatures))}
                unit="°C"
                icon={Thermometer}
                footer="Session maximum"
                className="blower-card"
              />
            </section>

            <HistoryChart />

            <section className="panel section-gap">
              <div className="panel-header">
                <div>
                  <span className="panel-overline">SESSION STATISTICS</span>
                  <h3>Recorded Ranges</h3>
                </div>
                <div className="panel-icon">
                  <BarChart3 size={20} />
                </div>
              </div>

              <div className="settings-grid">
                <SettingsItem label="Minimum temperature" value={`${format(min(temperatures))} °C`} />
                <SettingsItem label="Maximum temperature" value={`${format(max(temperatures))} °C`} />
                <SettingsItem label="Minimum humidity" value={`${format(min(humidities))}%`} />
                <SettingsItem label="Maximum humidity" value={`${format(max(humidities))}%`} />
                <SettingsItem label="Samples collected" value={String(history.length)} />
                <SettingsItem label="History storage" value="Current session only" />
              </div>
              <p className="muted-note">
                Analytics are calculated from readings collected while this
                dashboard is open. They are not permanent database history.
              </p>
            </section>
          </>
        )}

        {/* =================================================
            PAGE 4 - AERATION
        ================================================= */}
        {activePage === "Aeration" && (
          <>
            <section className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-overline">AUTOMATION ENGINE</span>
                    <h3>Aeration Decision</h3>
                  </div>
                  <div className={`fan-status ${blowerOn ? "running" : ""}`}>
                    <Wind size={22} />
                  </div>
                </div>

                <div className={`aeration-display ${blowerOn ? "active" : ""}`}>
                  <div className="fan-circle">
                    <Wind size={42} />
                  </div>
                  <h4>
                    {temperature === null || humidity === null
                      ? "WAITING FOR DATA"
                      : blowerOn
                        ? "AERATION REQUESTED"
                        : "NO TRIGGER DETECTED"}
                  </h4>
                  <p>
                    {temperature === null || humidity === null
                      ? "Temperature and humidity readings are required."
                      : blowerOn
                        ? "At least one configured aeration condition is true."
                        : "Neither configured condition currently triggers aeration."}
                  </p>
                </div>

                <div className="condition-list">
                  <div className={`condition ${temperatureAlert ? "triggered" : ""}`}>
                    <span className="condition-dot" />
                    <div>
                      <strong>Temperature above 25°C</strong>
                      <small>{temperature === null ? "--" : `${temperature.toFixed(1)}°C`}</small>
                    </div>
                    <b>
                      {temperature === null ? "WAITING" : temperatureAlert ? "TRIGGERED" : "NORMAL"}
                    </b>
                  </div>

                  <div className={`condition ${humidityAlert ? "triggered" : ""}`}>
                    <span className="condition-dot" />
                    <div>
                      <strong>Humidity below 70%</strong>
                      <small>{humidity === null ? "--" : `${humidity.toFixed(1)}%`}</small>
                    </div>
                    <b>
                      {humidity === null ? "WAITING" : humidityAlert ? "TRIGGERED" : "NORMAL"}
                    </b>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-overline">CONTROL LOGIC</span>
                    <h3>Configured Conditions</h3>
                  </div>
                  <div className="panel-icon">
                    <Settings size={20} />
                  </div>
                </div>

                <div className="settings-grid">
                  <SettingsItem label="Temperature trigger" value="Above 25°C" />
                  <SettingsItem label="Humidity trigger" value="Below 70%" />
                  <SettingsItem label="Logic operator" value="OR" />
                  <SettingsItem label="Mode" value="Automatic calculation" />
                </div>

                <p className="muted-note">
                  The current rule is temperature &gt; 25°C OR humidity &lt; 70%.
                </p>
              </div>
            </section>

            <section className="panel section-gap">
              <div className="panel-header">
                <div>
                  <span className="panel-overline">HARDWARE STATUS</span>
                  <h3>Blower Operation</h3>
                </div>
                <div className="panel-icon">
                  <Wind size={20} />
                </div>
              </div>
              <p>
                The ON/OFF indication represents the calculated aeration
                decision. It does not confirm physical relay switching or
                actual 12V blower operation.
              </p>
            </section>
          </>
        )}

        {/* =================================================
            PAGE 5 - SYSTEM SETTINGS
        ================================================= */}
        {activePage === "System Settings" && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <span className="panel-overline">CONFIGURATION</span>
                  <h3>System Settings</h3>
                </div>
                <div className="panel-icon">
                  <Settings size={20} />
                </div>
              </div>

              <div className="settings-grid">
                <SettingsItem label="Temperature threshold" value="25°C" />
                <SettingsItem label="Humidity threshold" value="70%" />
                <SettingsItem label="Temperature/humidity sensor" value="DHT22" />
                <SettingsItem label="Distance sensor" value="HC-SR04" />
                <SettingsItem label="OLED display" value="0.96-inch I2C" />
                <SettingsItem label="Automation logic" value="Temperature > 25 OR humidity < 70%" />
                <SettingsItem
                  label="Device ID"
                  value={data?.deviceId || "AGRIGAURD-ESP32-01"}
                />
                <SettingsItem label="Backend status" value={backendStatus} />
                <SettingsItem label="API endpoint" value="/api/sensor-data" />
                <SettingsItem label="Dashboard polling" value="Every 2 seconds" />
              </div>
            </section>

            <section className="panel section-gap">
              <div className="panel-header">
                <div>
                  <span className="panel-overline">COMPONENT STATUS</span>
                  <h3>Sensor Connections</h3>
                </div>
                <div className="panel-icon">
                  <Radio size={20} />
                </div>
              </div>

              <div className="condition-list">
                <div className="condition">
                  <span className="condition-dot" />
                  <div>
                    <strong>DHT22</strong>
                    <small>Temperature and humidity</small>
                  </div>
                  <b>{temperature !== null && humidity !== null ? "DATA RECEIVED" : "WAITING"}</b>
                </div>
                <div className="condition">
                  <span className="condition-dot" />
                  <div>
                    <strong>HC-SR04</strong>
                    <small>Grain surface distance</small>
                  </div>
                  <b>{distance !== null ? "DATA RECEIVED" : "WAITING"}</b>
                </div>
                <div className="condition">
                  <span className="condition-dot" />
                  <div>
                    <strong>Node.js backend</strong>
                    <small>Local API connection</small>
                  </div>
                  <b>{backendStatus}</b>
                </div>
              </div>
              <p className="muted-note">
                These settings are display-only. Changing a displayed value
                does not change the ESP32 firmware or its thresholds.
              </p>
            </section>
          </>
        )}

        {/* FOOTER */}
        <footer>
          <div>
            <strong>AGRIGAURD</strong>
            <span>Smart Grain Silo Monitoring System</span>
          </div>
          <div>
            Last received:{" "}
            <strong>
              {data?.timestamp
                ? new Date(data.timestamp).toLocaleTimeString()
                : "Timestamp unavailable"}
            </strong>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;