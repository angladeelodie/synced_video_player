const express = require("express");
const { WebSocketServer } = require("ws");

const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (HTML, JS, CSS, videos, etc.)
app.use(express.static(path.join(__dirname, "public")));
app.use("/videos", express.static(path.join(__dirname, "videos")));

// ---------------------------------------------------
// 🧠 Function to read folder structure dynamically
// ---------------------------------------------------
function getMediaStructure() {
  const basePath = path.join(__dirname, "videos");
  const students = fs.readdirSync(basePath).filter((f) =>
    fs.lstatSync(path.join(basePath, f)).isDirectory()
  );

  return students.map((student) => {
    const studentPath = path.join(basePath, student);
    const horizontal = path.join("videos", student, "horizontal.mp4");

    const songs = fs
      .readdirSync(studentPath)
      .filter(
        (f) =>
          fs.lstatSync(path.join(studentPath, f)).isDirectory() &&
          /^\d+$/.test(f)
      )
      .map((songFolder) => {
        const songPath = path.join("videos", student, songFolder);
        return {
          id: songFolder,
          audio: `${songPath}/audio.mp3`,
          vertical: `${songPath}/vertical.mp4`,
          square: `${songPath}/square.mp4`,
        };
      });

    return {
      student_id: student,
      horizontal_video: horizontal,
      songs,
    };
  });
}

// API route to fetch media structure
app.get("/api/media", (req, res) => {
  res.json(getMediaStructure());
});

// ---------------------------------------------------
// 🔌 WebSocket server
// ---------------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

let clients = [];

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");
  clients.push(ws);

  ws.on("message", (message) => {
    console.log("📩 Received:", message.toString());
    // Broadcast message to all *other* clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    clients = clients.filter((c) => c !== ws);
  });
});
