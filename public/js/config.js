// config.js
export const WS_URL =
  location.hostname === "localhost"
    ? "ws://localhost:8080"
    : "ws://192.168.0.20:3000";