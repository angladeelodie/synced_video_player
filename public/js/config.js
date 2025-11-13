// config.js
export const WS_URL =
  location.hostname === "localhost"
    ? "ws://localhost:8080"
    : "ws://10.189.8.101:3000";