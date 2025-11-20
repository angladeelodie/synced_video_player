let swiper;
let albumData = [];

import { WS_URL } from "./config.js";
const ws = new WebSocket(WS_URL);

// ----------------------
// WebSocket listeners
// ----------------------
ws.onopen = () => {
  console.log("📺 TV connected to WebSocket server");
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "selectSlide") {
    const slideIndex = albumData.findIndex(
      (item) => item.student_id === msg.student_id
    );
    if (slideIndex !== -1 && swiper) swiper.slideToLoop(slideIndex);
  }

  if (msg.type === "reloadAll") window.location.reload();

  if (msg.type === "play") {
    const v = swiper.slides[swiper.activeIndex]?.querySelector("video");
    v?.play().catch(() => {});
  }

  if (msg.type === "pause") {
    const v = swiper.slides[swiper.activeIndex]?.querySelector("video");
    if (v) v.pause();
  }
};

const swiperWrapper = document.querySelector(".swiper-wrapper");

// ----------------------
// Load data + build slides
// ----------------------
async function loadAlbums() {
  try {
    const res = await fetch("/api/media");
    const data = await res.json();

    swiperWrapper.innerHTML = "";
    albumData = [];

    data.forEach((student) => {
      albumData.push({
        student_id: student.student_id,
        horizontal_video: student.horizontal_video,
      });

      const slide = document.createElement("div");
      slide.classList.add("swiper-slide");

      slide.innerHTML = `
        <div class="slide-content" style="position:relative; background:black;">
          <video
            muted
            loop
            playsinline
            preload="metadata"
            style="width:100%; height:100%; object-fit:cover; display:none;"
          >
            <source src="${student.horizontal_video}" type="video/mp4" />
          </video>
        </div>
      `;

      swiperWrapper.appendChild(slide);
    });

    initSwiper();
  } catch (err) {
    console.error("❌ Failed to load:", err);
  }
}

// ----------------------
// Swiper Setup
// ----------------------
function initSwiper() {
  swiper = new Swiper(".swiper", {
    slidesPerView: 1,
    loop: true,
    speed: 0,
    navigation: {
      nextEl: ".button-next",
      prevEl: ".button-prev",
    },
    on: {
      init() {
        showAndPlay(this);
      },
      slideChange() {
        showAndPlay(this);
      },
    },
  });
}

// ----------------------
// Show + play video (hard cut)
// ----------------------
function showAndPlay(swiper) {
  swiper.slides.forEach((slide) => {
    const video = slide.querySelector("video");
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    video.style.display = "none"; // hidden until ready
  });

  const active = swiper.slides[swiper.activeIndex];
  const video = active.querySelector("video");

  if (!video) return;

  // When the browser has enough data, show instantly
  video.onloadeddata = () => {
    video.style.display = "block"; // hard cut, no fade
    video.play().catch(() => {});
  };

  video.load();
}

window.addEventListener("DOMContentLoaded", loadAlbums);
