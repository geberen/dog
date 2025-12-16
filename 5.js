const captions = [
  "it sucks because for a minute i was happy, for a minute i was getting better but in a minute i lost it all again",
  "when i walk into a haunted house expecting to see ghosts, but i see my younger self crying in my room begging to feel loved and wanted",
  "i hate how i can suddenly be so isolated & disconnected from everyone around me, even though connection is something i want. it's confusing."
];

const videos = [
  { src: "video1.mp4" },
  { src: "video2.mp4" },
  { src: "video3.mp4" },
  { src: "video4.mp4", caption: "be quiet." },
  {
    src: "video5.mp4",
    caption: "ur so lucky, i love you.",
    effects: { rainbowText: true, confetti: true },
    rare: true
  },
  { src: "video6.mp4" },
  { src: "video7.mov", size: "compact" },
  { src: "video8.mp4", size: "compact" },
  { src: "video9.mp4" },
  { src: "video10.mp4" }
];

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

const pickVideo = () => {
  const rareVideos = videos.filter((video) => video.rare);
  const commonVideos = videos.filter((video) => !video.rare);

  if (rareVideos.length && Math.random() < 0.01) {
    const rarePool = rareVideos.filter((video) => video.src !== lastVideoSrc);
    return pickRandom(rarePool.length ? rarePool : rareVideos);
  }

  const sourceList = commonVideos.length ? commonVideos : videos;
  const pool = sourceList.filter((video) => video.src !== lastVideoSrc);
  return pickRandom(pool.length ? pool : sourceList);
};

const videoEl = document.querySelector(".video-frame video");
const videoSource = videoEl?.querySelector("source");
const captionEl = document.querySelector(".caption-text");

const setCaption = (text) => {
  if (!captionEl) return;
  captionEl.textContent = text;
  captionEl.dataset.content = text;
  captionEl.classList.remove("is-revealing");
  void captionEl.offsetWidth;
  captionEl.classList.add("is-revealing");
};

const rainbowColors = [
  "#ff7f7f",
  "#ffd86a",
  "#6ff7ff",
  "#c58bff",
  "#ff8add",
  "#8aff9d"
];

let rainbowInterval = null;
let currentVideo = null;
let lastVideoSrc = null;

const applyVideoSize = (size) => {
  if (!videoEl) return;
  videoEl.classList.toggle("video-compact", size === "compact");
};

const applyRainbowText = (shouldApply) => {
  if (!captionEl) return;
  captionEl.classList.toggle("rainbow-text", Boolean(shouldApply));

  if (rainbowInterval) {
    clearInterval(rainbowInterval);
    rainbowInterval = null;
  }

  if (shouldApply) {
    let index = 0;
    const tick = () => {
      const color = rainbowColors[index];
      captionEl.style.color = color;
      captionEl.style.textShadow =
        "0 0 12px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 0, 0, 0.45)";
      index = (index + 1) % rainbowColors.length;
    };
    tick();
    rainbowInterval = setInterval(tick, 400);
  } else {
    captionEl.style.color = "";
    captionEl.style.textShadow = "";
  }
};

const triggerConfetti = () => {
  const duration = 4500;
  const particles = 120;
  const colors = ["#ff6b6b", "#ffd93d", "#6bcfff", "#b26bff", "#6bff95"];

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const flakes = Array.from({ length: particles }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 4,
    d: Math.random() * particles,
    color: pickRandom(colors),
    tilt: Math.random() * 10 - 5,
    tiltAngle: 0,
    tiltAngleIncrement: Math.random() * 0.07 + 0.04
  }));

  let start = null;
  const animate = (timestamp) => {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    flakes.forEach((flake, i) => {
      ctx.beginPath();
      ctx.fillStyle = flake.color;
      ctx.ellipse(
        flake.x + flake.tilt,
        flake.y,
        flake.r,
        flake.r / 2,
        Math.PI / 4,
        0,
        2 * Math.PI
      );
      ctx.fill();

      flake.y += (Math.cos(flake.d) + 1 + flake.r / 2) * 0.8;
      flake.x += Math.sin(progress / 500 + i);
      flake.tiltAngle += flake.tiltAngleIncrement;
      flake.tilt = Math.sin(flake.tiltAngle) * 10;

      if (flake.y > canvas.height) {
        flake.y = -10;
        flake.x = Math.random() * canvas.width;
      }
    });

    if (progress < duration) {
      requestAnimationFrame(animate);
    } else {
      window.removeEventListener("resize", resize);
      canvas.remove();
    }
  };

  requestAnimationFrame(animate);
};

const ensureAutoPlay = () => {
  if (!videoEl) return;
  videoEl.muted = true;
  const playPromise = videoEl.play();
  if (playPromise?.then) {
    playPromise
      .then(() => {
        setTimeout(() => {
          videoEl.muted = false;
          videoEl.volume = 1;
        }, 150);
      })
      .catch(() => {
      });
  }
};

const loadAndPlayVideo = (video) => {
  if (!videoEl || !videoSource || !video) return;
  currentVideo = video;
  lastVideoSrc = video.src;
  videoSource.src = video.src;
  applyVideoSize(video.size);

  const effectiveCaption = video.caption ?? pickRandom(captions);
  setCaption(effectiveCaption);
  applyRainbowText(video.effects?.rainbowText);

  videoEl.load();
  ensureAutoPlay();

  if (video.effects?.confetti) {
    triggerConfetti();
  }
};

if (videoSource && videoEl) {
  loadAndPlayVideo(pickVideo());
  videoEl.addEventListener("ended", () => {
    loadAndPlayVideo(pickVideo());
  });
} else if (captionEl) {
  setCaption(pickRandom(captions));
}
