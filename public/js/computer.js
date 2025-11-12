// computer.js
let swiper;
let albumData = []; 

const ws = new WebSocket("ws://localhost:3000");

ws.onopen = () => {
  console.log("💻 Computer connected to WebSocket server");
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log("📩 Message from server:", msg);

  if (msg.type === "selectSlide") {
    const slideIndex = albumData.findIndex(
      (item) =>
        item.student_id === msg.student_id && item.song_id === msg.song_id
    );

    if (slideIndex !== -1 && swiper) {
      console.log("🎯 Going to slide index:", slideIndex);
      swiper.slideToLoop(slideIndex);
    } else {
      console.warn("⚠️ Slide not found in albumData");
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

    // Loop through all students and their songs
    data.forEach((student) => {
      student.songs.forEach((song) => {
        albumData.push({
          student_id: student.student_id,
          song_id: song.id,
        });

        const slide = document.createElement("div");
        slide.classList.add("swiper-slide");
        slide.innerHTML = `
          <div class="slide-content">
            <video muted loop playsinline autoplay>
              <source src="${song.square}" type="video/mp4" />
            </video>
            <div class="project-name">${student.student_id} - Song ${song.id}</div>
          </div>
        `;
        swiperWrapper.appendChild(slide);
      });
    });

    // Initialize Swiper
    swiper = new Swiper(".swiper", {
      slidesPerView: 3,
      centeredSlides: true,
      loop: true,
      spaceBetween: 30,
      effect: "coverflow",
      coverflowEffect: {
        rotate: 30,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
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

  const activeVideo =
    swiper.slides[swiper.activeIndex].querySelector("video");
  if (activeVideo) activeVideo.play().catch((err) => console.warn(err));
}

window.addEventListener("DOMContentLoaded", loadAlbums);