// controller.js
import { WS_URL } from "./config.js";

const ws = new WebSocket(WS_URL);

ws.onopen = () => {
  console.log("📡 controller.html connected to server");
};

ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  if (data.type === "selectSlide") {
    highlightSelection(data.student_id, data.song_id);
  }
};

// ---------- highlight selection ----------
function highlightSelection(studentId, songId) {
  document.querySelectorAll(".table-row").forEach((row) => {
    if (
      row.dataset.student === studentId &&
      row.dataset.songId === songId
    ) {
      row.classList.add("selected");
    } else {
      row.classList.remove("selected");
    }
  });
}

// ---------- Load table rows ----------
async function loadSongs() {
  const res = await fetch("/api/media");
  const data = await res.json();

  const grid = document.getElementById("controllerGrid");
  grid.innerHTML = "";

  data.forEach((student) => {
    student.songs.forEach((song) => {
      const row = document.createElement("div");
      row.className = "table-row";
      row.dataset.student = student.student_id;
      row.dataset.songId = song.id;

      row.innerHTML = `
        <div class="thumbnail">
          <video muted loop autoplay playsinline>
            <source src="${song.vertical}" type="video/mp4">
          </video>
        </div>
        <div>${student.student_id}</div>
        <div>${song.id}</div>

        <div class="song-info">
          <strong>${song.title}</strong><br>
          <small>${song.artist}</small>
        </div>

      `;

      row.onclick = () => {
        ws.send(
          JSON.stringify({
            type: "selectSlide",
            student_id: student.student_id,
            song_id: song.id,
          })
        );
        highlightSelection(student.student_id, song.id);
      };

      grid.appendChild(row);
    });
  });
}

window.onload = loadSongs;
