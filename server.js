const express = require("express");
const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------
// 🌐 Serve static files
// ---------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/videos", express.static(path.join(__dirname, "videos")));

// ---------------------------------------------------
// 🧠 Read videos folder and return structured data
// ---------------------------------------------------
function getMediaStructure() {
  const basePath = path.join(__dirname, "videos");

  // List all students (folders)
  const students = fs
    .readdirSync(basePath)
    .filter((f) => fs.lstatSync(path.join(basePath, f)).isDirectory());

  // Map each student folder to a structured object
  return students.map((student) => {
    const studentPath = path.join(basePath, student);
    const metaPath = path.join(studentPath, "metadata.json");
    let metadata = {};
    if (fs.existsSync(metaPath)) {
      metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    }

    // horizontal video (optional)
    const horizontal = path.join("videos", student, "horizontal.mp4");

    // list song folders (1,2,3...)
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
          cover: `${songPath}/cover.png`,
          title: metadata[songFolder]?.title || songFolder,
          album: metadata[songFolder]?.album || "Unknown Album",
          artist: metadata[songFolder]?.artist || "Unknown Artist",

        };
      });

    return {
      student_id: student,
      horizontal_video: horizontal,
      songs,
    };
  });
}

// ---------------------------------------------------
// 📡 API endpoint for media structure
// ---------------------------------------------------
app.get("/api/media", (req, res) => {
  res.json(getMediaStructure());
});

// ---------------------------------------------------
// 🔌 WebSocket server for controlling clients
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

    // Broadcast to all other clients
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
