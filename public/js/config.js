// config.js
export const WS_URL =
  location.hostname === "localhost"
    ? "ws://localhost:3000"
    : "ws://192.168.0.214:3000";