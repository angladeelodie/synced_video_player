// sharedWsController.js
export function setupWsController(ws, playPauseBtn, getActiveVideo) {
  let isPlaying = true; // current actual playback state

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

  function highlightControllerRow(studentId, songId) {
    if (typeof window.highlightSelection === "function") {
      window.highlightSelection(studentId, songId);
    }
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
        console.log("🎯 Jumped to slide:", data.student_id, data.song_id);

        // jump swiper if function exists
        if (typeof window.jumpToSlide === "function") {
          window.jumpToSlide(data.student_id, data.song_id);
        }

        // highlight controller row if function exists
        highlightControllerRow(data.student_id, data.song_id);

        // automatically play after slide change
        isPlaying = true;
        updateVideoAndButton();

        // Broadcast play to other devices
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "play" }));
        }
        break;
      case "reloadAll":
        window.location.reload();
        break;
    }
  };

  // play/pause button click
  playPauseBtn.onclick = () => {
    if (ws.readyState !== WebSocket.OPEN) return;

    const nextAction = isPlaying ? "pause" : "play";

    ws.send(JSON.stringify({ type: nextAction }));
    // Update local state immediately for instant feedback
    isPlaying = !isPlaying;
    updateVideoAndButton();
  };
}
