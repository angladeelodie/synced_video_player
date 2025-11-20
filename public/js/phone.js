// phone.js
import { WS_URL } from "./config.js";
import { setupWsController } from "./sharedWsController.js";

const ws = new WebSocket(WS_URL);
let swiper = null;
const playPauseBtn = document.getElementById("playPause");

// Setup WebSocket with shared controller logic
setupWsController(
  ws,
  playPauseBtn,
  () => swiper?.slides[swiper.activeIndex]?.querySelector("video"),
  () => swiper // pass Swiper instance
);

// Update UI elements when a slide is active
function changeUiElements(studentId, songId, songTitle, songArtist, songAlbum) {
  document.getElementById(
    "coverImage"
  ).src = `videos/${studentId}/${songId}/cover.png`;
  document.getElementById("song-title").innerText = songTitle;
  document.getElementById("song-artist").innerText = songArtist;
  document.getElementById("student-name").innerText = studentId;
}

// Jump to a specific slide
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

// Load songs and initialize swiper
async function loadSongs() {
  const res = await fetch("/api/media");
  const data = await res.json();

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
        <video
          class="phone-video"
          muted
          loop
          playsinline
          preload="none"
          data-src="${song.vertical}"
        ></video>
      `;

      swiperWrapper.appendChild(slide);
    });
  });

  // Initialize Swiper
  swiper = new Swiper("#songSwiper", {
    slidesPerView: 1,
    spaceBetween: 0,
    autoplay: {
      delay: 10000,
      disableOnInteraction: true,
    },
    loop: true,
    navigation: {
      nextEl: ".button-next",
      prevEl: ".button-prev",
    },
  });

  // Initial load
  handleSlideVideos(swiper);

  swiper.on("slideChangeTransitionEnd", () => {
    handleSlideVideos(swiper);

    const slide = swiper.slides[swiper.activeIndex];
    const studentId = slide.dataset.student;
    const songId = slide.dataset.songId;
    const songTitle = slide.dataset.song;
    const songArtist = slide.dataset.artist;
    const songAlbum = slide.dataset.album;

    changeUiElements(studentId, songId, songTitle, songArtist, songAlbum);

    // Broadcast slide change
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "selectSlide",
        student_id: studentId,
        song_id: songId
      }));
    }
  });

  // Initial UI
  changeUiElements(
    data[0].student_id,
    data[0].songs[0].id,
    data[0].songs[0].title,
    data[0].songs[0].artist,
    data[0].songs[0].album
  );

  window.jumpToSlide = jumpToSlide;
}


function loadVideo(videoEl) {
  if (!videoEl || videoEl.src) return;

  if (videoEl.dataset.src) {
    videoEl.src = videoEl.dataset.src;
    videoEl.load();
  }
}

function unloadVideo(videoEl) {
  if (!videoEl) return;
  videoEl.pause();
  videoEl.removeAttribute("src");
  videoEl.load(); // clears buffer
}

function handleSlideVideos(swiper) {
  const active = swiper.slides[swiper.activeIndex];
  const prev = swiper.slides[swiper.activeIndex - 1];
  const next = swiper.slides[swiper.activeIndex + 1];

  // Unload all distant slides
  swiper.slides.forEach((slide) => {
    if (slide !== active && slide !== prev && slide !== next) {
      unloadVideo(slide.querySelector("video"));
    }
  });

  // Load neighbor preview videos
  [prev, next].forEach((slide) => {
    if (slide) loadVideo(slide.querySelector("video"));
  });

  // Load + play active slide
  const activeVideo = active.querySelector("video");
  loadVideo(activeVideo);
  activeVideo.muted = false;
  activeVideo.play().catch(() => {});
}



window.onload = loadSongs;
