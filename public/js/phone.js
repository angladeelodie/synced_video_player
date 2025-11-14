// phone.js
import { WS_URL } from "./config.js";
const ws = new WebSocket(WS_URL);
let swiper = null;
ws.onopen = () => {
  console.log("📡 Phone connected to server");
};
ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);

  if (data.type === "selectSlide") {
    jumpToSlide(data.student_id, data.song_id);
  }
};
function changeUiElements(studentId, songId, songTitle, songArtist, songAlbum) {
  document.getElementById(
    "coverImage"
  ).src = `videos/${studentId}/${songId}/cover.jpg`;
  document.getElementById("song-title").innerText = `${songTitle}`;
  document.getElementById("song-artist").innerText = `${songArtist}`;
  document.getElementById("student-name").innerText = `${studentId}`;
}

// Fetch media from server
async function loadSongs() {
  const res = await fetch("/api/media");
  const data = await res.json();
  console.log("📥 Media data:", data);

  const swiperWrapper = document.querySelector(".swiper-wrapper");
  swiperWrapper.innerHTML = "";

  data.forEach((student) => {
    student.songs.forEach((song) => {
      const slide = document.createElement("div");
      slide.classList.add("swiper-slide");
      slide.dataset.student = student.student_id;
      slide.dataset.songId = song.id;
      slide.dataset.song = song.title;
      slide.dataset.album = song.album;
      slide.dataset.artist = song.artist;

      slide.innerHTML = `
          <video muted loop autoplay playsinline>
            <source src="${song.vertical}" type="video/mp4">
          </video>
        `;
      swiperWrapper.appendChild(slide);
    });
  });

  // Initialize Swiper
  swiper = new Swiper("#songSwiper", {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    navigation: {
      nextEl: ".button-next",
      prevEl: ".button-prev",
    },
  });

  // send selected slide info when Swiper changes
  swiper.on("slideChange", () => {
    console.log("Slide changed to index:", swiper.activeIndex);
    const slide = swiper.slides[swiper.activeIndex];
    const studentId = slide.dataset.student;
    const songId = slide.dataset.songId;
    const songTitle = slide.dataset.song;
    const songArtist = slide.dataset.artist;
    const songAlbum = slide.dataset.album;

    changeUiElements(studentId, songId, songTitle, songArtist, songAlbum);
    ws.send(
      JSON.stringify({
        type: "selectSlide",
        student_id: studentId,
        song_id: songId,
      })
    );
  });

  changeUiElements(
    data[0].student_id,
    data[0].songs[0].id,
    data[0].songs[0].title,
    data[0].songs[0].artist,
    data[0].songs[0].album
  );
}

function jumpToSlide(studentId, songId) {
  const slides = swiper.slides;

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    if (s.dataset.student === studentId && s.dataset.songId === songId) {
      swiper.slideToLoop(i, 400); // smooth transition
      return;
    }
  }

  console.warn("❗ Slide not found:", studentId, songId);
}

// Play / Pause buttons
const playPauseBtn = document.getElementById("playPause");
let isPlaying = false; // track state manually

playPauseBtn.onclick = () => {
  if (ws.readyState !== WebSocket.OPEN) return;

  if (isPlaying) {
    // Send pause
    // ws.send(JSON.stringify({ type: "pause", ...currentSelection }));
    playPauseBtn.innerHTML = '<img src="./assets/icons/Play.svg" alt="">'; // show play icon
  } else {
    // Send play
    // ws.send(JSON.stringify({ type: "play", ...currentSelection }));
    playPauseBtn.innerHTML = '<img src="./assets/icons/Pause.svg" alt="">'; // show pause icon
  }

  isPlaying = !isPlaying;
};

window.onload = loadSongs;
