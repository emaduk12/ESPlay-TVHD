const allowedCodes = {
  "G4X9B7LT": 10,
  "T2V6Q1ZR": 30 * 24 * 60 * 60,
  "L7P0M2XA": 365 * 24 * 60 * 60,
  "C1W9R6EQ": 5 * 365 * 24 * 60 * 60,
  "EMAD2324": 50 * 365 * 24 * 60 * 60
};

let channels = [];

function checkSession(forceCheck = false) {
  const session = JSON.parse(localStorage.getItem("session"));
  if (!session) return false;

  const now = Date.now();
  if (now - session.start > session.expiresIn) {
    const usedCodes = JSON.parse(localStorage.getItem("usedCodes") || "[]");
    if (!usedCodes.includes(session.code)) {
      usedCodes.push(session.code);
      localStorage.setItem("usedCodes", JSON.stringify(usedCodes));
    }

    localStorage.removeItem("session");
    localStorage.removeItem("channels");
    localStorage.removeItem("favorites");
    localStorage.removeItem("lastPlayed");

    if (forceCheck) {
      alert("Your access code has expired.");
      location.reload();
    }

    return false;
  }

  return true;
}

document.getElementById("codeSubmit").onclick = () => {
  const code = document.getElementById("accessCode").value.trim();
  const usedCodes = JSON.parse(localStorage.getItem("usedCodes") || "[]");

  if (usedCodes.includes(code)) {
    alert("ئەڤ کودەیێ هاتیە راگرتن");
    return;
  }

  if (!allowedCodes[code]) {
    alert("کود یێ خەلەتە /  كودي داخل بکە");
    return;
  }

  const now = Date.now();
  const expiresIn = allowedCodes[code] * 1000;

  localStorage.setItem("session", JSON.stringify({ code, start: now, expiresIn }));
  initApp();
};

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("session");
  localStorage.removeItem("channels");
  localStorage.removeItem("favorites");
  localStorage.removeItem("lastPlayed");
  location.reload();
};

document.getElementById("clearChannelsBtn").onclick = () => {
  if (confirm("ئەرێ تە دڤێت هەمی کەنالا ژێببێ؟")) {
    channels = [];
    localStorage.removeItem("channels");
    localStorage.removeItem("favorites");
    localStorage.removeItem("lastPlayed");
    displayChannelList([]);
    displayFavorites();
  }
};

function initApp() {
  if (!checkSession(true)) return;

  document.getElementById("accessCode").style.display = "none";
  document.getElementById("codeSubmit").style.display = "none";
  document.getElementById("appMain").style.display = "flex";

  const storedChannels = localStorage.getItem("channels");
  if (storedChannels) {
    channels = JSON.parse(storedChannels);
    displayChannelList(channels);
    displayFavorites();
  }

  const lastPlayed = JSON.parse(localStorage.getItem("lastPlayed"));
  if (lastPlayed) {
    playChannel(lastPlayed.name, lastPlayed.url);
  }

  document.getElementById("fileInput").addEventListener("change", handleFile);
  document.getElementById("searchInput").addEventListener("input", searchChannels);

  document.getElementById("channelsBtn").onclick = () => {
    document.getElementById("channelList").style.display = "block";
    document.getElementById("favoriteList").style.display = "none";
    document.getElementById("searchInput").style.display = "block";
    document.getElementById("channelsBtn").classList.add("active");
    document.getElementById("favoritesBtn").classList.remove("active");
  };

  document.getElementById("favoritesBtn").onclick = () => {
    document.getElementById("channelList").style.display = "none";
    document.getElementById("favoriteList").style.display = "block";
    document.getElementById("searchInput").style.display = "none";
    document.getElementById("favoritesBtn").classList.add("active");
    document.getElementById("channelsBtn").classList.remove("active");
  };

  updateSessionTimer();
  setInterval(() => {
    if (!checkSession()) {
      alert("کود هاتە راگرتن ژبو نوی کرنێ مە ئاگەهدار بکە");
      location.reload();
    } else {
      updateSessionTimer();
    }
  }, 10000);
}

function updateSessionTimer() {
  const timerEl = document.getElementById("sessionTimer");
  const session = JSON.parse(localStorage.getItem("session"));
  if (!session) {
    timerEl.textContent = "";
    return;
  }

  if (session.code === "EMAD2324") {
    timerEl.textContent = "🚀 جورێ کودی:بێسنوور";
    return;
  }

  const now = Date.now();
  const expiresAt = session.start + session.expiresIn;
  const remaining = expiresAt - now;

  if (remaining <= 0) {
    timerEl.textContent = "⏳ کود بەسەرچوو!";
    return;
  }

  const totalDays = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const days = totalDays % 365;

  let display = "⏳ دەمێ ب سەرڤە چونێ :";
  if (years > 0) display += `${years} ساڵ `;
  if (days > 0 || years === 0) display += `${days} ڕۆژ`;

  timerEl.textContent = display.trim();
}

function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    parseM3U(reader.result);
  };
  reader.readAsText(file);
}

function parseM3U(content) {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",")[1]?.trim() || "Unknown";
      const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
      const logo = logoMatch ? logoMatch[1] : "";
      const url = lines[i + 1]?.trim();
      if (url && url.startsWith("http")) {
        channels.push({ name, url, logo });
      }
    }
  }
  localStorage.setItem("channels", JSON.stringify(channels));
  displayChannelList(channels);
  displayFavorites();
}

function displayChannelList(list) {
  const listEl = document.getElementById("channelList");
  listEl.innerHTML = "";

  list.forEach((channel, index) => {
    const li = document.createElement("li");
    li.setAttribute("draggable", "true");
    li.dataset.index = index;

    li.ondragstart = (e) => {
      e.dataTransfer.setData("text/plain", index);
      li.style.opacity = "0.5";
    };
    li.ondragend = () => li.style.opacity = "1";
    li.ondragover = (e) => {
      e.preventDefault();
      li.style.borderTop = "2px solid #00ffaa";
    };
    li.ondragleave = () => li.style.borderTop = "none";
    li.ondrop = (e) => {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData("text/plain"));
      const to = parseInt(li.dataset.index);
      moveChannel(from, to);
    };

    const left = document.createElement("div");
    if (channel.logo) {
      const img = document.createElement("img");
      img.src = channel.logo;
      img.alt = "logo";
      left.appendChild(img);
    }
    const text = document.createElement("span");
    text.textContent = `${index + 1}. ${channel.name}`;
    left.appendChild(text);

    li.appendChild(left);

    const star = document.createElement("span");
    star.className = "star";
    star.innerHTML = isFavorite(index) ? "★" : "☆";
    if (isFavorite(index)) star.classList.add("active");

    star.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(index);
    };

    li.onclick = () => playChannel(channel.name, channel.url);

    li.appendChild(star);
    listEl.appendChild(li);
  });
}

function moveChannel(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  const moved = channels.splice(fromIndex, 1)[0];
  channels.splice(toIndex, 0, moved);
  localStorage.setItem("channels", JSON.stringify(channels));
  displayChannelList(channels);
  displayFavorites();
}

// ✅ HLS-Enabled Playback
function playChannel(name, url) {
  const player = document.getElementById("videoPlayer");
  const nowPlaying = document.getElementById("nowPlaying");

  nowPlaying.textContent = "Now Playing: " + name;
  localStorage.setItem("lastPlayed", JSON.stringify({ name, url }));

  if (Hls.isSupported()) {
    if (window.hls) {
      window.hls.destroy(); // Cleanup previous instance
    }
    window.hls = new Hls();
    window.hls.loadSource(url);
    window.hls.attachMedia(player);
    window.hls.on(Hls.Events.MANIFEST_PARSED, function () {
      player.play();
    });
  } else if (player.canPlayType("application/vnd.apple.mpegurl")) {
    player.src = url;
    player.addEventListener("loadedmetadata", () => {
      player.play();
    });
  } else {
    alert("⚠️ Your browser does not support HLS playback.");
  }
}

function searchChannels(e) {
  const term = e.target.value.toLowerCase();
  const filtered = channels.filter(c => c.name.toLowerCase().includes(term));
  displayChannelList(filtered);
}

function toggleFavorite(index) {
  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  favs = favs.includes(index)
    ? favs.filter(i => i !== index)
    : [...favs, index];
  localStorage.setItem("favorites", JSON.stringify(favs));
  displayChannelList(channels);
  displayFavorites();
}

function isFavorite(index) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  return favs.includes(index);
}

function displayFavorites() {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  const favoriteList = document.getElementById("favoriteList");
  favoriteList.innerHTML = "";

  favs.forEach(i => {
    const channel = channels[i];
    if (!channel) return;

    const li = document.createElement("li");
    li.textContent = channel.name;
    li.onclick = () => playChannel(channel.name, channel.url);

    favoriteList.appendChild(li);
  });
}

const headerDiv = document.querySelector("header div");
const timerSpan = document.createElement("span");
timerSpan.id = "sessionTimer";
timerSpan.style.marginLeft = "1rem";
timerSpan.style.fontWeight = "bold";
headerDiv.appendChild(timerSpan);

if (checkSession()) {
  initApp();
}