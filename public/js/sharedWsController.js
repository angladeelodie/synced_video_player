export function setupWsController(ws, playPauseBtn, getActiveVideo, getSwiper) {
  let isPlaying = true;      // playback state
  let isAutoplay = true;     // autoplay state

  function updateVideoAndButton() {
    const video = getActiveVideo();
    if (video) {
      if (isPlaying) video.play().catch(() => {});
      else video.pause();
    }

    playPauseBtn.innerHTML = isPlaying
      ? '<img src="./assets/icons/Pause.svg" alt="">'
      : '<img src="./assets/icons/Play.svg" alt="">';
  }

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    switch (data.type) {
      case "play":
        isPlaying = true;
        updateVideoAndButton();
        break;
      case "pause":
        isPlaying = false;
        updateVideoAndButton();
        break;
      case "selectSlide":
        if (typeof window.jumpToSlide === "function") {
          window.jumpToSlide(data.student_id, data.song_id);
          isPlaying = true;
          updateVideoAndButton();
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "play" }));
          }
        }
        break;
      case "reloadAll":
        window.location.reload();
        break;
      case "toggleAutoplay":
        // update local autoplay state
        isAutoplay = !!data.autoplay;
        const swiper = getSwiper?.();
        if (swiper && swiper.autoplay) {
          if (isAutoplay) swiper.autoplay.start();
          else swiper.autoplay.stop();
        }
        break;
    }
  };

  // Play/pause button toggling
  playPauseBtn.onclick = () => {
    if (ws.readyState !== WebSocket.OPEN) return;

    const nextAction = isPlaying ? "pause" : "play";
    ws.send(JSON.stringify({ type: nextAction }));

    isPlaying = !isPlaying;
    updateVideoAndButton();
  };
}
