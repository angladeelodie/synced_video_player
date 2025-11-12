// phone.js
const ws = new WebSocket("ws://localhost:3000");

ws.onopen = () => {
  console.log("📡 Phone connected to server");
};

// Initialize Swiper
const swiper = new Swiper("#songSwiper", {
  slidesPerView: 1,
  spaceBetween: 20,
  loop: true,
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});

// send selected slide info when Swiper changes
swiper.on("slideChange", () => {
  console.log("Slide changed to index:", swiper.activeIndex);
  const slide = swiper.slides[swiper.activeIndex];
  const studentId = slide.dataset.student;
  const songId = slide.dataset.song;
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

  const songsGrid = document.getElementById("songsGrid");
  songsGrid.innerHTML = "";

  data.forEach((student) => {
    student.songs.forEach((song) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      slide.dataset.student = student.student_id;
        slide.dataset.song = song.id;
      
      slide.innerHTML = `
          <video muted loop autoplay>
            <source src="${song.vertical}" type="video/mp4">
          </video>
          <div class="song-name">${student.student_id} - Song ${song.id}</div>
        `;
      //   slide.onclick = () => selectSong(student.student_id, song.id);
      songsGrid.appendChild(slide);
    });
  });

  swiper.update();
}



// Play / Pause buttons
document.getElementById("play").onclick = () => {
  if (currentSelection && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "play", ...currentSelection }));
  }
};
document.getElementById("pause").onclick = () => {
  if (currentSelection && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "pause", ...currentSelection }));
  }
};

window.onload = loadSongs;
