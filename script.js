// pid's site interactive logic & features

// ==========================================
// 1. THEME SWITCHER (dark mode default, light mode alternative)
// ==========================================
const THEMES = [
  { id: 'dark', label: '🌙 dark mode' },
  { id: 'light', label: '☀️ light mode' }
];

function initTheme() {
  let savedTheme = localStorage.getItem('pid_theme') || 'dark';
  if (savedTheme === 'midnight') savedTheme = 'dark';
  if (savedTheme === 'lavender') savedTheme = 'light';
  applyTheme(savedTheme);

  const themeBtns = document.querySelectorAll('.topbar__theme-btn');
  themeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      let current = document.documentElement.getAttribute('data-theme') || 'dark';
      if (current === 'midnight') current = 'dark';
      if (current === 'lavender') current = 'light';
      const currentIndex = THEMES.findIndex((t) => t.id === current);
      const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
      applyTheme(nextTheme.id);
    });
  });
}

function applyTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem('pid_theme', themeId);
  const themeObj = THEMES.find((t) => t.id === themeId) || THEMES[0];
  document.querySelectorAll('.topbar__theme-btn').forEach((btn) => {
    btn.textContent = themeObj.label;
  });
}

// ==========================================
// 2. NAVMENU TOGGLING & ACCESSIBLE TABS (index.html)
// ==========================================
function initNavmenu() {
  const toggleBtn = document.getElementById('navmenuToggle');
  const navmenu = document.getElementById('navmenu');
  if (!toggleBtn || !navmenu) return;

  const tabs = Array.from(document.querySelectorAll('.navmenu__item'));
  const panels = Array.from(document.querySelectorAll('.navmenu__panel'));

  function setNavmenuOpen(open, shouldScroll = false) {
    if (open) {
      navmenu.classList.add('is-open');
      navmenu.removeAttribute('aria-hidden');
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.classList.add('is-open');
      if (shouldScroll) {
        setTimeout(() => {
          navmenu.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 80);
      }
    } else {
      navmenu.classList.remove('is-open');
      navmenu.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.classList.remove('is-open');
    }
  }

  toggleBtn.addEventListener('click', () => {
    const isCurrentlyOpen = navmenu.classList.contains('is-open');
    setNavmenuOpen(!isCurrentlyOpen, !isCurrentlyOpen);
  });

  function selectTab(targetPanelId) {
    tabs.forEach((tab) => {
      const isTarget = tab.getAttribute('aria-controls') === targetPanelId;
      tab.classList.toggle('is-active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      tab.tabIndex = isTarget ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isTarget = panel.id === targetPanelId;
      if (isTarget) {
        panel.classList.add('is-active');
        panel.removeAttribute('hidden');
      } else {
        panel.classList.remove('is-active');
        panel.setAttribute('hidden', '');
      }
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      selectTab(tab.getAttribute('aria-controls'));
    });

    tab.addEventListener('keydown', (e) => {
      let nextIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        tabs[nextIndex].focus();
        selectTab(tabs[nextIndex].getAttribute('aria-controls'));
      }
    });
  });

  const hash = window.location.hash.toLowerCase();
  if (hash === '#about') {
    setNavmenuOpen(true);
    selectTab('panel-about');
  } else if (hash === '#byf') {
    setNavmenuOpen(true);
    selectTab('panel-byf');
  } else if (hash === '#interests') {
    setNavmenuOpen(true);
    selectTab('panel-interests');
  } else if (hash === '#silly') {
    setNavmenuOpen(true);
    selectTab('panel-silly');
  }
}

// ==========================================
// 3. FUNCTIONAL MUSIC PLAYER (YOUTUBE & AUDIO ENGINE)
// ==========================================
const PLAYLIST = [
  {
    title: 'TUYU - Under Kids',
    artist: 'TUYU ・ J-Rock',
    duration: '3:26',
    durationSec: 206,
    url: 'https://youtu.be/TBoBfT-_sfM'
  },
  {
    title: 'Mili - In Hell We Live, Lament feat. KIHOW from MYTH & ROID / Limbus Company',
    artist: 'Mili ・ J-Pop',
    duration: '3:45',
    durationSec: 225,
    url: 'https://youtu.be/XfTWgMgknpY'
  },
  {
    title: 'Aiobahn +81 feat. ななひら & P丸様。- 天天天国地獄国 (Official Music Video)',
    artist: 'Aiobahn ・ J-Pop',
    duration: '3:53',
    durationSec: 233,
    url: 'https://youtu.be/eTplxWaAD8o'
  },
  {
    title: '謳',
    artist: 'Imperial Circus Dead Decadence ・ Symphonic Death Metal',
    duration: '9:02',
    durationSec: 542,
    url: 'https://youtu.be/x8i6A-k2ShY'
  },
  {
    title: 'TUYU - Hide and Seek Alone MV',
    artist: 'TUYU ・ J-Rock',
    duration: '2:50',
    durationSec: 170,
    url: 'https://youtu.be/Bq0ZINOzVng'
  }
];

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

class AudioController {
  constructor() {
    this.isPlaying = false;
    this.currentIndex = 0;
    this.currentTimeSec = 0;
    this.progressTimer = null;
    this.ytPlayer = null;
    this.isYtReady = false;
    this.pendingPlayIndex = null;
    this.htmlAudio = new Audio();
    this.isUsingHtmlAudio = false;

    this.htmlAudio.addEventListener('ended', () => {
      this.next();
    });
  }

  initYouTube() {
    if (this.ytPlayer) return;

    let targetElId = 'playerVideoEmbed';
    const embedEl = document.getElementById('playerVideoEmbed');

    if (!embedEl) {
      let bgHost = document.getElementById('globalYtPlayerHost');
      if (!bgHost) {
        bgHost = document.createElement('div');
        bgHost.id = 'globalYtPlayerHost';
        document.body.appendChild(bgHost);
      }
      targetElId = 'globalYtPlayerHost';
    }

    const firstTrack = PLAYLIST[this.currentIndex] || PLAYLIST[0];
    const initialId = extractYouTubeId(firstTrack ? firstTrack.url : '') || 'TBoBfT-_sfM';

    try {
      this.ytPlayer = new window.YT.Player(targetElId, {
        height: '100%',
        width: '100%',
        videoId: initialId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: () => {
            this.isYtReady = true;
            if (this.pendingPlayIndex !== null) {
              const idxToPlay = this.pendingPlayIndex;
              this.pendingPlayIndex = null;
              this.play(idxToPlay);
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              this.isPlaying = true;
              this.startProgressTimer();
              this.notifyUpdate();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              this.isPlaying = false;
              this.stopProgressTimer();
              this.notifyUpdate();
            } else if (event.data === window.YT.PlayerState.ENDED) {
              this.next();
            }
          }
        }
      });
    } catch (e) {
      console.warn('YT Player creation deferred/fallback:', e);
    }
  }

  stopAllAudio() {
    this.stopProgressTimer();
    if (this.ytPlayer && this.isYtReady && typeof this.ytPlayer.stopVideo === 'function') {
      try {
        this.ytPlayer.stopVideo();
      } catch (_) {}
    }
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      this.htmlAudio.currentTime = 0;
    }
    this.isUsingHtmlAudio = false;
  }

  startProgressTimer() {
    this.stopProgressTimer();
    this.progressTimer = setInterval(() => {
      if (!this.isPlaying) return;

      if (!this.isUsingHtmlAudio && this.ytPlayer && this.isYtReady && typeof this.ytPlayer.getCurrentTime === 'function') {
        const cur = this.ytPlayer.getCurrentTime();
        if (typeof cur === 'number' && !isNaN(cur)) {
          this.currentTimeSec = Math.floor(cur);
        }
      } else if (this.isUsingHtmlAudio && this.htmlAudio) {
        this.currentTimeSec = Math.floor(this.htmlAudio.currentTime);
      } else {
        this.currentTimeSec++;
      }

      const track = PLAYLIST[this.currentIndex];
      if (track && this.currentTimeSec >= track.durationSec) {
        this.next();
      } else {
        this.notifyUpdate();
      }
    }, 500);
  }

  stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  play(index = this.currentIndex) {
    const isDifferentTrack = this.currentIndex !== index;

    // Always completely stop and reset any previous track before loading new one!
    this.stopAllAudio();

    this.currentIndex = index;
    if (isDifferentTrack) {
      this.currentTimeSec = 0;
    }

    const track = PLAYLIST[this.currentIndex];
    if (!track) return;

    const ytId = extractYouTubeId(track.url);

    if (ytId) {
      this.isUsingHtmlAudio = false;
      if (this.ytPlayer && this.isYtReady) {
        try {
          this.ytPlayer.loadVideoById(ytId);
          this.ytPlayer.playVideo();
          this.isPlaying = true;
          this.startProgressTimer();
        } catch (err) {
          console.error('Error playing YouTube video:', err);
        }
      } else {
        this.pendingPlayIndex = index;
        this.isPlaying = true;
        this.startProgressTimer();
      }
    } else if (track.url) {
      this.isUsingHtmlAudio = true;
      this.htmlAudio.src = track.url;
      this.htmlAudio.play().then(() => {
        this.isPlaying = true;
        this.startProgressTimer();
        this.notifyUpdate();
      }).catch((e) => {
        console.warn('Playback error:', e);
      });
    }

    this.notifyUpdate();
  }

  pause() {
    this.isPlaying = false;
    this.stopProgressTimer();

    if (!this.isUsingHtmlAudio && this.ytPlayer && this.isYtReady && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch (_) {}
    }

    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }

    this.notifyUpdate();
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play(this.currentIndex);
    }
  }

  next() {
    this.currentTimeSec = 0;
    const nextIdx = (this.currentIndex + 1) % PLAYLIST.length;
    this.play(nextIdx);
  }

  prev() {
    this.currentTimeSec = 0;
    const prevIdx = (this.currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    this.play(prevIdx);
  }

  seek(percent) {
    const track = PLAYLIST[this.currentIndex];
    if (!track) return;

    let totalDuration = track.durationSec;
    if (!this.isUsingHtmlAudio && this.ytPlayer && this.isYtReady && typeof this.ytPlayer.getDuration === 'function') {
      const dur = this.ytPlayer.getDuration();
      if (dur && dur > 0) totalDuration = dur;
    }

    const seekSec = Math.floor(percent * totalDuration);
    this.currentTimeSec = seekSec;

    if (!this.isUsingHtmlAudio && this.ytPlayer && this.isYtReady && typeof this.ytPlayer.seekTo === 'function') {
      try {
        this.ytPlayer.seekTo(seekSec, true);
      } catch (_) {}
    } else if (this.isUsingHtmlAudio && this.htmlAudio) {
      this.htmlAudio.currentTime = seekSec;
    }

    this.notifyUpdate();
  }

  notifyUpdate() {
    const track = PLAYLIST[this.currentIndex] || PLAYLIST[0];
    const mins = Math.floor(this.currentTimeSec / 60);
    const secs = String(this.currentTimeSec % 60).padStart(2, '0');
    const formattedCurrent = `${mins}:${secs}`;

    const topbarBtn = document.getElementById('topbarPlayerBtn');
    const topbarPlayIcon = document.getElementById('topbarPlayIcon');
    const topbarTime = document.getElementById('topbarTime');
    const topbarEqualizer = document.getElementById('topbarEqualizer');
    const topbarSong = document.querySelector('.topbar__song');

    if (topbarSong) {
      topbarSong.textContent = track.title;
    }

    if (topbarBtn) {
      topbarBtn.classList.toggle('is-playing', this.isPlaying);
      topbarBtn.setAttribute('aria-label', `${this.isPlaying ? 'Pause' : 'Play'} ${track.title}`);
      if (topbarPlayIcon) topbarPlayIcon.textContent = this.isPlaying ? '⏸' : '▶︎';
      if (topbarTime) topbarTime.textContent = formattedCurrent;
      if (topbarEqualizer) {
        topbarEqualizer.textContent = this.isPlaying
          ? (this.currentTimeSec % 2 === 0 ? ' •၊|။||၊|။ ' : ' •။၊||၊||၊ ')
          : ' •၊၊||၊|။||||| ';
      }
    }

    const pagePlayBtn = document.getElementById('playerPlayBtn');
    const pageTrackTitle = document.getElementById('playerTrackTitle');
    const pageTrackArtist = document.getElementById('playerTrackArtist');
    const pageCurrentTime = document.getElementById('playerCurrentTime');
    const pageDuration = document.getElementById('playerDuration');
    const pageProgressFill = document.getElementById('playerProgressFill');

    if (pagePlayBtn) pagePlayBtn.textContent = this.isPlaying ? '⏸' : '▶︎';
    if (pageTrackTitle) pageTrackTitle.textContent = track.title;
    if (pageTrackArtist) pageTrackArtist.textContent = track.artist;
    if (pageCurrentTime) pageCurrentTime.textContent = formattedCurrent;
    if (pageDuration) pageDuration.textContent = track.duration;
    if (pageProgressFill) {
      const pct = (this.currentTimeSec / track.durationSec) * 100;
      pageProgressFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }

    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach((item, idx) => {
      item.classList.toggle('is-active', idx === this.currentIndex);
    });
  }
}

const globalPlayer = new AudioController();

// Dynamically load YouTube IFrame API
(function loadYouTubeApi() {
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(tag, firstScript);
    } else {
      document.head.appendChild(tag);
    }
  }
})();

window.onYouTubeIframeAPIReady = function() {
  globalPlayer.initYouTube();
};

if (window.YT && window.YT.Player) {
  globalPlayer.initYouTube();
}

function initMusicPlayer() {
  if (window.YT && window.YT.Player) {
    globalPlayer.initYouTube();
  }

  const topbarBtn = document.getElementById('topbarPlayerBtn');
  if (topbarBtn) {
    topbarBtn.addEventListener('click', () => {
      globalPlayer.toggle();
    });
  }

  const pagePlayBtn = document.getElementById('playerPlayBtn');
  const prevBtn = document.getElementById('playerPrevBtn');
  const nextBtn = document.getElementById('playerNextBtn');
  const playlistContainer = document.getElementById('playerPlaylist');
  const progressBar = document.getElementById('playerProgressBar');

  if (pagePlayBtn) {
    pagePlayBtn.addEventListener('click', () => globalPlayer.toggle());
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => globalPlayer.prev());
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => globalPlayer.next());
  }
  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      globalPlayer.seek(pct);
    });
  }

  if (playlistContainer) {
    playlistContainer.innerHTML = '';
    PLAYLIST.forEach((track, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `playlist-item ${idx === 0 ? 'is-active' : ''}`;
      btn.innerHTML = `<span>▶ ${track.title}</span><span style="opacity:0.7">${track.duration}</span>`;
      btn.addEventListener('click', () => {
        globalPlayer.play(idx);
      });
      playlistContainer.appendChild(btn);
    });
  }

  globalPlayer.notifyUpdate();
}

// ==========================================
// 4. PARTICLE SPARKLES CANVAS
// ==========================================
function initSparkles() {
  const canvas = document.getElementById('sparkleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const sparkles = [];
  const maxSparkles = 28;

  function createSparkle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1.5,
      speedY: -(Math.random() * 0.4 + 0.15),
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.7 + 0.3,
      pulse: Math.random() * Math.PI,
      pulseSpeed: Math.random() * 0.04 + 0.02
    };
  }

  for (let i = 0; i < maxSparkles; i++) {
    sparkles.push(createSparkle());
  }

  function drawSparkleStar(cx, cy, spikes, outerRadius, innerRadius, alpha) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = `rgba(244, 215, 255, ${alpha})`;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(235, 183, 245, 0.8)';
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    sparkles.forEach((s) => {
      s.pulse += s.pulseSpeed;
      const currentAlpha = Math.max(0.1, s.alpha * Math.abs(Math.sin(s.pulse)));
      s.y += s.speedY;
      s.x += s.speedX;

      if (s.y < -10) {
        s.y = height + 10;
        s.x = Math.random() * width;
      }
      if (s.x < -10) s.x = width + 10;
      if (s.x > width + 10) s.x = -10;

      drawSparkleStar(s.x, s.y, 4, s.size * 2, s.size * 0.6, currentAlpha);
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// ==========================================
// 5. FIREBASE HELPER (Supports Live Firestore & Local Fallback)
// ==========================================
function getFirebaseDb() {
  const cfg =
    (typeof window !== 'undefined' && (window.FIREBASE_CONFIG || window.firebaseConfig)) ||
    (typeof firebaseConfig !== 'undefined' ? firebaseConfig : null);

  if (
    typeof firebase !== 'undefined' &&
    cfg &&
    cfg.apiKey &&
    cfg.apiKey !== 'YOUR_API_KEY'
  ) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      return firebase.firestore();
    } catch (err) {
      console.warn('Firebase init warning:', err);
      return null;
    }
  }
  return null;
}

// One-time cleanup of any legacy test messages or doodles to ensure a fresh 0-item state
if (typeof localStorage !== 'undefined' && localStorage.getItem('pid_clean_reset_v3') !== 'done') {
  localStorage.removeItem('pid_guestbook_messages');
  localStorage.removeItem('pid_doodles');
  localStorage.setItem('pid_clean_reset_v3', 'done');
}

// ==========================================
// 6. GUESTBOOK / LEAVE A MESSAGE (message.html)
// ==========================================
function initGuestbook() {
  const form = document.getElementById('guestbookForm');
  const messagesList = document.getElementById('messagesList');
  const countEl = document.getElementById('msgCount');
  const imageInput = document.getElementById('msgImageInput');
  const previewContainer = document.getElementById('msgImagePreviewContainer');
  const previewImg = document.getElementById('msgImagePreview');
  const fileNameSpan = document.getElementById('msgImageFileName');
  const removeImgBtn = document.getElementById('removeImgBtn');
  const formErrorMsg = document.getElementById('formErrorMsg');

  if (!messagesList) return;

  const db = getFirebaseDb();
  let currentImageData = null;

  function loadLocalMessages() {
    try {
      const raw = localStorage.getItem('pid_guestbook_messages');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (_) {
      return [];
    }
  }

  function saveLocalMessages(msgs) {
    localStorage.setItem('pid_guestbook_messages', JSON.stringify(msgs));
  }

  function renderMessagesList(msgs) {
    if (countEl) countEl.textContent = msgs.length;
    messagesList.innerHTML = '';

    if (!msgs || msgs.length === 0) {
      messagesList.innerHTML = '<p style="font-family:\'Cute Font\', cursive; font-size:1.4rem; opacity:0.8;">no messages yet! be the first to leave one :p</p>';
      return;
    }

    msgs.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'msg-card';

      let imgHtml = '';
      if (m.image) {
        imgHtml = `<img class="msg-attachment" src="${m.image}" alt="Attached by ${escapeHtml(m.author)}" loading="lazy" />`;
      }

      let bodyHtml = '';
      if (m.body) {
        bodyHtml = `<p class="msg-body">${escapeHtml(m.body)}</p>`;
      }

      card.innerHTML = `
        <div class="msg-header">
          <span class="msg-author">${escapeHtml(m.author)}</span>
          <span class="msg-date">${m.date || ''}</span>
        </div>
        ${bodyHtml}
        ${imgHtml}
      `;

      messagesList.appendChild(card);
    });
  }

  // Connect to Firestore real-time listener if configured
  if (db) {
    try {
      db.collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(60)
        .onSnapshot(
          (snapshot) => {
            const msgs = [];
            snapshot.forEach((doc) => {
              msgs.push({ id: doc.id, ...doc.data() });
            });
            renderMessagesList(msgs);
          },
          (err) => {
            console.warn('Firestore subscription failed, falling back to local storage:', err);
            renderMessagesList(loadLocalMessages());
          }
        );
    } catch (e) {
      console.warn('Error attaching Firestore listener:', e);
      renderMessagesList(loadLocalMessages());
    }
  } else {
    renderMessagesList(loadLocalMessages());
  }

  // Handle image upload with 5MB validation
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        alert('Please choose a valid PNG or JPEG image!');
        imageInput.value = '';
        return;
      }

      const MAX_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        alert('File size exceeds the 5MB limit. Please choose a smaller image!');
        imageInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        currentImageData = event.target.result;
        if (previewImg) previewImg.src = currentImageData;
        if (fileNameSpan) fileNameSpan.textContent = file.name;
        if (previewContainer) previewContainer.style.display = 'flex';
        if (formErrorMsg) formErrorMsg.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeImgBtn) {
    removeImgBtn.addEventListener('click', () => {
      currentImageData = null;
      if (imageInput) imageInput.value = '';
      if (previewContainer) previewContainer.style.display = 'none';
    });
  }

  // Handle Form Submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const authorInput = document.getElementById('msgAuthorInput');
      const bodyInput = document.getElementById('msgBodyInput');

      let author = authorInput ? authorInput.value.trim() : '';
      const body = bodyInput ? bodyInput.value.trim() : '';

      if (!body && !currentImageData) {
        if (formErrorMsg) formErrorMsg.style.display = 'block';
        return;
      }
      if (formErrorMsg) formErrorMsg.style.display = 'none';

      if (!author) {
        author = 'anonymous sender';
      }

      const now = new Date();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

      const newMsg = {
        author,
        date: dateStr,
        body,
        image: currentImageData || null,
        createdAt: now.toISOString()
      };

      if (db) {
        db.collection('messages')
          .add(newMsg)
          .catch((err) => {
            console.warn('Firestore write failed, falling back to local:', err);
            const msgs = loadLocalMessages();
            msgs.unshift(newMsg);
            saveLocalMessages(msgs);
            renderMessagesList(msgs);
          });
      } else {
        const msgs = loadLocalMessages();
        msgs.unshift(newMsg);
        saveLocalMessages(msgs);
        renderMessagesList(msgs);
      }

      if (authorInput) authorInput.value = '';
      if (bodyInput) bodyInput.value = '';
      if (imageInput) imageInput.value = '';
      if (previewContainer) previewContainer.style.display = 'none';
      currentImageData = null;
    });
  }
}

// ==========================================
// 7. DRAWING GIMMICK CANVAS (gimmicks.html)
// ==========================================
function initDrawingGimmick() {
  const canvas = document.getElementById('drawingCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const brushBtn = document.getElementById('brushBtn');
  const eraserBtn = document.getElementById('eraserBtn');
  const fillBtn = document.getElementById('fillBtn');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const brushSize = document.getElementById('brushSize');
  const colorPicker = document.getElementById('colorPicker');
  const downloadBtn = document.getElementById('downloadBtn');
  const sendBtn = document.getElementById('sendBtn');
  const gallery = document.getElementById('doodlesGallery');
  const doodleCount = document.getElementById('doodleCount');

  const db = getFirebaseDb();
  let currentTool = 'brush';
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  const history = [];

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function saveState() {
    history.push(canvas.toDataURL());
    if (history.length > 30) history.shift();
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function hexToRgba(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
  }

  function floodFill(startX, startY, fillColor) {
    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const x = Math.floor(startX * dpr);
    const y = Math.floor(startY * dpr);

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const startPos = (y * width + x) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    const [fillR, fillG, fillB, fillA] = fillColor;

    if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) {
      return;
    }

    const stack = [[x, y]];
    const visited = new Uint8Array(width * height);

    while (stack.length) {
      const [cx, cy] = stack.pop();
      const idx = cy * width + cx;

      if (visited[idx]) continue;
      visited[idx] = 1;

      const pos = idx * 4;
      if (
        data[pos] !== startR ||
        data[pos + 1] !== startG ||
        data[pos + 2] !== startB ||
        data[pos + 3] !== startA
      ) {
        continue;
      }

      data[pos] = fillR;
      data[pos + 1] = fillG;
      data[pos + 2] = fillB;
      data[pos + 3] = fillA;

      if (cx + 1 < width) stack.push([cx + 1, cy]);
      if (cx - 1 >= 0) stack.push([cx - 1, cy]);
      if (cy + 1 < height) stack.push([cx, cy + 1]);
      if (cy - 1 >= 0) stack.push([cx, cy - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function startDrawing(e) {
    e.preventDefault();
    const pos = getPos(e);

    if (currentTool === 'fill') {
      saveState();
      const fillColor = hexToRgba(colorPicker.value);
      floodFill(pos.x, pos.y, fillColor);
      return;
    }

    isDrawing = true;
    lastX = pos.x;
    lastY = pos.y;
    saveState();
  }

  function draw(e) {
    if (!isDrawing || currentTool === 'fill') return;
    e.preventDefault();

    const pos = getPos(e);

    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = colorPicker.value;
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
  }

  function stopDrawing() {
    isDrawing = false;
    ctx.globalCompositeOperation = 'source-over';
  }

  function setActiveTool(tool) {
    currentTool = tool;
    if (brushBtn) brushBtn.classList.toggle('active', tool === 'brush');
    if (eraserBtn) eraserBtn.classList.toggle('active', tool === 'eraser');
    if (fillBtn) fillBtn.classList.toggle('active', tool === 'fill');
  }

  if (brushBtn) brushBtn.addEventListener('click', () => setActiveTool('brush'));
  if (eraserBtn) eraserBtn.addEventListener('click', () => setActiveTool('eraser'));
  if (fillBtn) fillBtn.addEventListener('click', () => setActiveTool('fill'));

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);

  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      if (history.length === 0) return;
      const lastState = history.pop();
      const img = new Image();
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dpr = window.devicePixelRatio || 1;
        ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
      };
      img.src = lastState;
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      saveState();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  function loadLocalDoodles() {
    try {
      const raw = localStorage.getItem('pid_doodles');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (_) {
      return [];
    }
  }

  function saveLocalDoodles(doodles) {
    localStorage.setItem('pid_doodles', JSON.stringify(doodles));
  }

  function renderDoodlesList(doodles) {
    if (!gallery) return;
    if (doodleCount) doodleCount.textContent = doodles.length;
    gallery.innerHTML = '';

    if (!doodles || doodles.length === 0) {
      gallery.innerHTML = '<p style="font-family:\'Cute Font\', cursive; font-size:1.35rem; opacity:0.8;">no saved drawings yet! doodle something above and hit send drawing :3</p>';
      return;
    }

    doodles.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.textAlign = 'center';
      card.innerHTML = `
        <img src="${item.dataUrl}" alt="Doodle ${idx + 1}" style="width:100%; border-radius:10px; background:#fff; display:block;" />
        <div style="margin-top:8px; text-align:center;">
          <small style="font-family:'Space Mono', monospace; font-size:0.75rem; opacity:0.8;">${item.date || ''}</small>
        </div>
      `;

      gallery.appendChild(card);
    });
  }

  // Connect to Firestore real-time listener if configured
  if (db) {
    try {
      db.collection('doodles')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot(
          (snapshot) => {
            const doodles = [];
            snapshot.forEach((doc) => {
              doodles.push({ id: doc.id, ...doc.data() });
            });
            renderDoodlesList(doodles);
          },
          (err) => {
            console.warn('Firestore subscription failed, falling back to local storage:', err);
            renderDoodlesList(loadLocalDoodles());
          }
        );
    } catch (e) {
      console.warn('Error attaching Firestore listener:', e);
      renderDoodlesList(loadLocalDoodles());
    }
  } else {
    renderDoodlesList(loadLocalDoodles());
  }

  // Button 1: Download drawing as PNG
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'my-drawing.png';
      link.href = dataUrl;
      link.click();
    });
  }

  // Button 2: Send drawing to doodle gallery (Firestore / Local)
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const dataUrl = canvas.toDataURL('image/png');
      const now = new Date();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const dateStr = `${months[now.getMonth()]} ${now.getDate()}`;

      const newDoodle = {
        dataUrl,
        date: dateStr,
        createdAt: now.toISOString()
      };

      if (db) {
        db.collection('doodles')
          .add(newDoodle)
          .catch((err) => {
            console.warn('Firestore write failed, falling back to local:', err);
            const doodles = loadLocalDoodles();
            doodles.unshift(newDoodle);
            saveLocalDoodles(doodles);
            renderDoodlesList(doodles);
          });
      } else {
        const doodles = loadLocalDoodles();
        doodles.unshift(newDoodle);
        saveLocalDoodles(doodles);
        renderDoodlesList(doodles);
      }

      sendBtn.textContent = 'sent! ✨';
      setTimeout(() => {
        sendBtn.textContent = 'send drawing';
      }, 1200);
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavmenu();
  initMusicPlayer();
  initSparkles();
  initGuestbook();
  initDrawingGimmick();
});
