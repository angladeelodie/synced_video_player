// phone.js
import { WS_URL } from "./config.js";
const ws = new WebSocket(WS_URL);

ws.onopen = () => {
  console.log("📡 Phone connected to server");
};

// Initialize Swiper
const swiper = new Swiper("#songSwiper", {
  slidesPerView: 1,
  spaceBetween: 0,
  loop: true,
  navigation: {
    nextEl: ".button-next",
    prevEl: ".button-prev",
  },
});

function changeUiElements(studentId, songId) {
  document.getElementById(
    "coverImage"
  ).src = `videos/${studentId}/${songId}/cover.jpg`;
  document.getElementById("song-title").innerText = `Song ${songId}`;
  document.getElementById("song-artist").innerText = `By ${studentId}`;
}

// send selected slide info when Swiper changes
swiper.on("slideChange", () => {
  console.log("Slide changed to index:", swiper.activeIndex);
  const slide = swiper.slides[swiper.activeIndex];
  const studentId = slide.dataset.student;
  const songId = slide.dataset.song;
  changeUiElements(studentId, songId);
  ws.send(
    JSON.stringify({
      type: "selectSlide",
      student_id: studentId,
      song_id: songId,
    })
  );
});

// Fetch media from server
async function loadSongs() {
  const res = await fetch("/api/media");
  const data = await res.json();
  console.log("📥 Media data:", data);

  const songsGrid = document.getElementById("songsGrid");
  songsGrid.innerHTML = "";

  data.forEach((student) => {
    student.songs.forEach((song) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      slide.dataset.student = student.student_id;
      slide.dataset.song = song.id;

      slide.innerHTML = `
          <video muted loop autoplay playsinline>
            <source src="${song.vertical}" type="video/mp4">
          </video>
          <div class="song-name">${student.student_id} - Song ${song.id}</div>
        `;
      //   slide.onclick = () => selectSong(student.student_id, song.id);
      songsGrid.appendChild(slide);
    });
  });
  changeUiElements(data[0].student_id, data[0].songs[0].id);
  swiper.update();
}

// Play / Pause buttons
const playPauseBtn = document.getElementById("playPause");
let isPlaying = false; // track state manually

playPauseBtn.onclick = () => {
  if (ws.readyState !== WebSocket.OPEN) return;

  if (isPlaying) {
    // Send pause
    // ws.send(JSON.stringify({ type: "pause", ...currentSelection }));
    playPauseBtn.textContent = "▶"; // show play icon
  } else {
    // Send play
    // ws.send(JSON.stringify({ type: "play", ...currentSelection }));
    playPauseBtn.textContent = "⏸"; // show pause icon
  }

  isPlaying = !isPlaying;
};

window.onload = loadSongs;
