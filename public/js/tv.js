let swiper;
let albumData = [];

const ws = new WebSocket("ws://localhost:3000");

ws.onopen = () => {
  console.log("📺 TV connected to WebSocket server");
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log("📩 Message from server:", msg);

  if (msg.type === "selectSlide") {
    // Find which student was selected
    const slideIndex = albumData.findIndex(
      (item) => item.student_id === msg.student_id
    );

    if (slideIndex !== -1 && swiper) {
      console.log("🎯 Going to student slide index:", slideIndex);
      swiper.slideToLoop(slideIndex);
    } else {
      console.warn("⚠️ Student not found in albumData");
    }
  }
};

const swiperWrapper = document.querySelector(".swiper-wrapper");

async function loadAlbums() {
  try {
    const response = await fetch("/api/media");
    const data = await response.json();
    console.log("📂 Media data:", data);

    swiperWrapper.innerHTML = ""; // clear previous slides
    albumData = []; // reset

    // One slide per student, with their horizontal video
    data.forEach((student) => {
      albumData.push({
        student_id: student.student_id,
        horizontal_video: student.horizontal_video,
      });

      const slide = document.createElement("div");
      slide.classList.add("swiper-slide");
      slide.innerHTML = `
        <div class="slide-content">
          <video muted loop playsinline autoplay>
            <source src="${student.horizontal_video}" type="video/mp4" />
          </video>
        </div>
      `;
      swiperWrapper.appendChild(slide);
    });

    // Initialize Swiper
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
          playActiveSlideVideo(this);
        },
        slideChange() {
          playActiveSlideVideo(this);
        },
      },
    });

    console.log("✅ Swiper initialized with", albumData.length, "slides");
  } catch (err) {
    console.error("❌ Failed to load albums:", err);
    swiperWrapper.innerHTML =
      '<div class="swiper-slide">Erreur de chargement</div>';
  }
}

function playActiveSlideVideo(swiper) {
  swiper.slides.forEach((slide) => {
    const video = slide.querySelector("video");
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  });

  const activeVideo = swiper.slides[swiper.activeIndex].querySelector("video");
  if (activeVideo) activeVideo.play().catch((err) => console.warn(err));
}

window.addEventListener("DOMContentLoaded", loadAlbums);
