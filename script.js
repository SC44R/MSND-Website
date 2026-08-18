/* ---------------------------------------------------------
   Cross-page music manager
   --------------------------------------------------------- */
const TRACK_SRC = "alban_gogh-lonely-fairyx27s-lament-209126.mp3";
const MUSIC_TIME_KEY = "msnd_music_time";
const MUSIC_PLAYING_KEY = "msnd_music_playing";

const ambientAudio = new Audio(TRACK_SRC);
ambientAudio.loop = true;
ambientAudio.preload = "auto";

const pauseFab = document.createElement("button");
pauseFab.type = "button";
pauseFab.id = "pauseFab";
pauseFab.className = "pause-fab";
pauseFab.textContent = "Pause Music";
pauseFab.hidden = true;
document.body.appendChild(pauseFab);

function getAmbientControls() {
  return {
    ambientIcon: document.getElementById("ambientIcon"),
    ambientLabel: document.getElementById("ambientLabel"),
  };
}

function syncMusicUI() {
  const isPlaying = !ambientAudio.paused;
  pauseFab.hidden = !isPlaying;

  const { ambientIcon, ambientLabel } = getAmbientControls();
  if (!ambientIcon || !ambientLabel) return;

  if (isPlaying) {
    ambientIcon.textContent = "🎶";
    ambientLabel.textContent = "Music Playing";
  } else {
    ambientIcon.textContent = "🎵";
    ambientLabel.textContent = "Play Music";
  }
}

function saveMusicState() {
  localStorage.setItem(MUSIC_TIME_KEY, String(ambientAudio.currentTime || 0));
  localStorage.setItem(MUSIC_PLAYING_KEY, ambientAudio.paused ? "0" : "1");
}

function restoreMusicState() {
  const savedTime = Number(localStorage.getItem(MUSIC_TIME_KEY) || "0");
  if (!Number.isNaN(savedTime) && savedTime > 0) {
    if (ambientAudio.readyState >= 1) {
      ambientAudio.currentTime = savedTime;
    } else {
      const applyTime = () => {
        ambientAudio.currentTime = savedTime;
        ambientAudio.removeEventListener("loadedmetadata", applyTime);
      };
      ambientAudio.addEventListener("loadedmetadata", applyTime);
    }
  }

  if (localStorage.getItem(MUSIC_PLAYING_KEY) === "1") {
    ambientAudio.play().catch(() => {
      localStorage.setItem(MUSIC_PLAYING_KEY, "0");
    });
  }

  syncMusicUI();
}

function bindAmbientToggle() {
  const ambientToggle = document.getElementById("ambientToggle");
  if (!ambientToggle) return;

  ambientToggle.addEventListener("click", () => {
    if (!ambientAudio.paused) {
      syncMusicUI();
      return;
    }

    ambientAudio.play().catch(() => {
      const { ambientLabel } = getAmbientControls();
      if (ambientLabel) {
        ambientLabel.textContent = "Music file not found";
      }
    });
  });
}

pauseFab.addEventListener("click", () => {
  ambientAudio.pause();
});

ambientAudio.addEventListener("play", () => {
  syncMusicUI();
  saveMusicState();
});
ambientAudio.addEventListener("pause", () => {
  syncMusicUI();
  saveMusicState();
});
ambientAudio.addEventListener("timeupdate", saveMusicState);
window.addEventListener("pagehide", saveMusicState);

restoreMusicState();

/* ---------------------------------------------------------
   Page feature initializers
   --------------------------------------------------------- */
function initGalleryParticles() {
  const galleryItems = document.querySelectorAll(".gallery-item");
  for (const item of galleryItems) {
    if (item.querySelector(".fairy-particle")) continue;
    for (let i = 0; i < 6; i += 1) {
      const particle = document.createElement("span");
      particle.className = "fairy-particle";
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) {
        particle.style.left = `${6 + Math.random() * 88}%`;
        particle.style.top = `${3 + Math.random() * 8}%`;
      } else if (edge === 1) {
        particle.style.left = `${6 + Math.random() * 88}%`;
        particle.style.top = `${89 + Math.random() * 8}%`;
      } else if (edge === 2) {
        particle.style.left = `${3 + Math.random() * 8}%`;
        particle.style.top = `${8 + Math.random() * 84}%`;
      } else {
        particle.style.left = `${89 + Math.random() * 8}%`;
        particle.style.top = `${8 + Math.random() * 84}%`;
      }
      particle.style.animationDelay = `${Math.random() * 2.5}s`;
      particle.style.animationDuration = `${2.4 + Math.random() * 2.8}s`;
      item.appendChild(particle);
    }
  }

  return () => {};
}

function initCountdown() {
  const daysEl = document.getElementById("countdownDays");
  const hoursEl = document.getElementById("countdownHours");
  const minutesEl = document.getElementById("countdownMinutes");
  const secondsEl = document.getElementById("countdownSeconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
    return () => {};
  }

  const now = new Date();
  let target = new Date(now.getFullYear(), 7, 29, 11, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target = new Date(now.getFullYear() + 1, 7, 29, 11, 0, 0);
  }

  const updateCountdown = () => {
    const diff = target.getTime() - Date.now();

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  };

  updateCountdown();
  const timer = window.setInterval(updateCountdown, 1000);

  return () => {
    window.clearInterval(timer);
  };
}

function initGame() {
  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const startBtn = document.getElementById("start");
  const statusEl = document.getElementById("status");
  const tiles = Array.from(document.querySelectorAll(".tile"));
  const hudNameEl = document.getElementById("hudName");

  const nameGate = document.getElementById("nameGate");
  const gameArea = document.getElementById("gameArea");
  const playerNameInput = document.getElementById("playerName");
  const confirmNameBtn = document.getElementById("confirmName");
  const difficultySelect = document.getElementById("difficultySelect");

  if (
    !scoreEl ||
    !timeEl ||
    !startBtn ||
    !statusEl ||
    tiles.length === 0 ||
    !hudNameEl ||
    !nameGate ||
    !gameArea ||
    !playerNameInput ||
    !confirmNameBtn
  ) {
    return () => {};
  }

  const IDLE_EMOJI = "🌙";
  const ACTIVE_EMOJI = "🧚";

  let activeIndex = -1;
  let score = 0;
  let timeLeft = 30;
  let running = false;
  let tickTimer = null;
  let moveTimer = null;
  let playerName = "";
  const difficultySpeeds = {
    easy: 900,
    medium: 650,
    hard: 420,
  };

  function getMoveDelay() {
    const selected = difficultySelect ? difficultySelect.value : "medium";
    return difficultySpeeds[selected] || difficultySpeeds.medium;
  }

  function clearActiveTile() {
    if (activeIndex < 0) return;
    tiles[activeIndex].classList.remove("tile--active");
    tiles[activeIndex].textContent = IDLE_EMOJI;
    activeIndex = -1;
  }

  function setActiveTile(nextIndex) {
    clearActiveTile();
    activeIndex = nextIndex;
    const tile = tiles[activeIndex];
    tile.classList.add("tile--active");
    tile.textContent = ACTIVE_EMOJI;
  }

  function randomTileIndex() {
    const next = Math.floor(Math.random() * tiles.length);
    return next === activeIndex ? (next + 1) % tiles.length : next;
  }

  function stopGame(message) {
    running = false;
    startBtn.disabled = false;
    startBtn.textContent = "Play Again";
    if (tickTimer) window.clearInterval(tickTimer);
    if (moveTimer) window.clearTimeout(moveTimer);
    tickTimer = null;
    moveTimer = null;
    clearActiveTile();
    statusEl.textContent = message;
  }

  function scheduleFairyMove() {
    if (!running) return;
    if (moveTimer) window.clearTimeout(moveTimer);
    moveTimer = window.setTimeout(() => {
      if (!running) return;
      setActiveTile(randomTileIndex());
      scheduleFairyMove();
    }, getMoveDelay());
  }

  function startGame() {
    score = 0;
    timeLeft = 30;
    running = true;
    scoreEl.textContent = String(score);
    timeEl.textContent = String(timeLeft);
    statusEl.textContent = `Go! Tap the fairy light. Difficulty: ${(difficultySelect ? difficultySelect.value : "medium").toUpperCase()}.`;
    startBtn.disabled = true;
    startBtn.textContent = "Playing...";
    setActiveTile(randomTileIndex());
    scheduleFairyMove();

    tickTimer = window.setInterval(() => {
      if (!running) return;
      timeLeft -= 1;
      timeEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        stopGame(`Time! ${playerName}, your final score is ${score}.`);
      }
    }, 1000);
  }

  function enterGrove() {
    const name = playerNameInput.value.trim();
    if (!name) {
      playerNameInput.focus();
      playerNameInput.placeholder = "A name, please...";
      return;
    }
    playerName = name;
    hudNameEl.textContent = playerName;
    nameGate.hidden = true;
    gameArea.hidden = false;
  }

  const onConfirm = () => enterGrove();
  const onKeydown = (e) => {
    if (e.key === "Enter") enterGrove();
  };
  const onStart = () => {
    if (!running) startGame();
  };

  confirmNameBtn.addEventListener("click", onConfirm);
  playerNameInput.addEventListener("keydown", onKeydown);
  startBtn.addEventListener("click", onStart);

  const tileHandlers = [];
  for (const tile of tiles) {
    const onTile = () => {
      if (!running) return;
      const i = Number(tile.dataset.i);
      if (i === activeIndex) {
        score += 1;
        scoreEl.textContent = String(score);
        setActiveTile(randomTileIndex());
        scheduleFairyMove();
      }
    };
    tile.addEventListener("click", onTile);
    tileHandlers.push({ tile, onTile });
  }

  return () => {
    if (tickTimer) window.clearInterval(tickTimer);
    if (moveTimer) window.clearTimeout(moveTimer);
    confirmNameBtn.removeEventListener("click", onConfirm);
    playerNameInput.removeEventListener("keydown", onKeydown);
    startBtn.removeEventListener("click", onStart);
    for (const { tile, onTile } of tileHandlers) {
      tile.removeEventListener("click", onTile);
    }
  };
}

let teardownCurrentPage = () => {};

function initPageFeatures() {
  teardownCurrentPage();

  bindAmbientToggle();
  const teardowns = [initCountdown(), initGame(), initGalleryParticles()];
  syncMusicUI();

  teardownCurrentPage = () => {
    for (const teardown of teardowns) {
      teardown();
    }
  };
}

/* ---------------------------------------------------------
   Client-side page loading to keep music uninterrupted
   --------------------------------------------------------- */
function shouldInterceptLink(anchor, event) {
  if (!anchor || !event) return false;
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (!url.pathname.endsWith(".html") && url.pathname !== "/") return false;

  const current = new URL(window.location.href);
  if (url.pathname === current.pathname && url.search === current.search && url.hash) return false;

  return true;
}

async function navigateTo(url, { push = true } = {}) {
  try {
    const response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) {
      window.location.href = url;
      return;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const nextDoc = parser.parseFromString(html, "text/html");

    const nextHeader = nextDoc.querySelector("header.site-header");
    const nextMain = nextDoc.querySelector("main");
    const nextFooter = nextDoc.querySelector("footer.site-footer");

    const currentHeader = document.querySelector("header.site-header");
    const currentMain = document.querySelector("main");
    const currentFooter = document.querySelector("footer.site-footer");

    if (!nextHeader || !nextMain || !nextFooter || !currentHeader || !currentMain || !currentFooter) {
      window.location.href = url;
      return;
    }

    teardownCurrentPage();
    currentHeader.replaceWith(nextHeader);
    currentMain.replaceWith(nextMain);
    currentFooter.replaceWith(nextFooter);
    document.title = nextDoc.title;

    if (push) {
      window.history.pushState({}, "", url);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    initPageFeatures();
  } catch {
    window.location.href = url;
  }
}

document.addEventListener("click", (event) => {
  const anchor = event.target instanceof Element ? event.target.closest("a") : null;
  if (!shouldInterceptLink(anchor, event)) return;
  event.preventDefault();
  navigateTo(anchor.href, { push: true });
});

window.addEventListener("popstate", () => {
  navigateTo(window.location.href, { push: false });
});

initPageFeatures();
