"use strict";

// active l'appel réel à l'IA (false = mock immédiat)
const USE_AI = false;

/* ---------- VARIABLES ---------- */
let seconds = 120; // 2 minutes
let timer = null;
let hasWon = false;

let values = [1, 1, 1];
let outputs = []; // initialisé en DOMContentLoaded
let timeoutId = null;
let attempts = 0; // nombre d'échecs déjà enregistrés
const maxAttempts = 5;
let secretCode = null;
let focusedIndex = 0; // pour surbrillance clavier
let anecdoteBox = null;

/* ---------- UTILITAIRES ---------- */
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function generateSecretCode() {
  const number = Math.floor(Math.random() * 1000); // 0..999
  return number.toString().padStart(3, "0");
}

/* ---------- TIMER ---------- */
function timerFunction() {
  if (seconds > 0) {
    seconds--;
    const box = document.getElementById("timer-box");
    if (box) box.textContent = formatTime(seconds);
  }

  if (seconds === 0) {
    clearInterval(timer);
    timer = null;
    alert("⏰ Temps écoulé !");
    localStorage.removeItem("gameState");
  }
}

function startTimer() {
  if (timer) return;
  const box = document.getElementById("timer-box");
  if (box) box.textContent = formatTime(seconds);

  timer = setInterval(timerFunction, 1000);

  // activer le bouton Pause uniquement quand le timer a démarré
  const btn = document.querySelector(".stop-timer");
  if (btn) btn.removeAttribute("disabled");
}

function togglePause() {
  const btn = document.querySelector(".stop-timer");
  const box = document.getElementById("timer-box");

  if (timer) {
    clearInterval(timer);
    timer = null;
    if (btn) btn.textContent = "Reprendre";
    if (box) box.classList.add("paused");
  } else {
    if (hasWon || seconds === 0) return;
    timer = setInterval(timerFunction, 1000);
    if (btn) btn.textContent = "Pause";
    if (box) box.classList.remove("paused");
  }
}

/* ---------- SAUVEGARDE / RESTAURATION ---------- */
/* Sauvegarde de l'état de la partie (sauf si gagné/perdu) */
function saveGameState() {
  if (hasWon || seconds === 0) {
    localStorage.removeItem("gameState");
    return;
  }
  const data = {
    seconds,
    values,
    attempts,
    secretCode,
    timerRunning: !!timer,
    focusedIndex
  };
  localStorage.setItem("gameState", JSON.stringify(data));
}

/* Restaurer (si présent) */
function restoreGameState() {
  const savedData = JSON.parse(localStorage.getItem("gameState"));
  if (!savedData) return false;

  seconds = savedData.seconds ?? seconds;
  attempts = savedData.attempts ?? 0;
  values = savedData.values ?? values;
  secretCode = savedData.secretCode ?? secretCode;
  focusedIndex = savedData.focusedIndex ?? 0;

  // mettre à jour UI
  for (let i = 0; i < 3; i++) {
    if (outputs[i]) outputs[i].textContent = values[i];
  }
  const box = document.getElementById("timer-box");
  if (box) box.textContent = formatTime(seconds);

  if (savedData.timerRunning) startTimer();
  updateAttemptsDisplay();
  highlightFocused();
  return true;
}

/* Avant unload */
window.addEventListener("beforeunload", () => {
  saveGameState();
});

/* ---------- SCORES (valides 1h) ---------- */
/*
 - Chaque record : { score, dateISO, expiresAt }
 - On supprime à l'affichage les records expirés (donc durée 1h respectée)
*/
function pushScoreRecord(score) {
  const raw = localStorage.getItem("scores");
  const arr = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const rec = {
    score,
    dateISO: new Date(now).toISOString(),
    expiresAt: now + 3600 * 1000
  };
  arr.unshift(rec);
  localStorage.setItem("scores", JSON.stringify(arr));
  renderScores();
}

function renderScores() {
  const list = document.getElementById("scores-list");
  if (!list) return;
  const raw = localStorage.getItem("scores");
  let arr = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  // filter expired
  arr = arr.filter(r => r.expiresAt > now);
  // save cleaned
  localStorage.setItem("scores", JSON.stringify(arr));
  list.innerHTML = "";
  if (arr.length === 0) {
    list.innerHTML = "<li>Aucun score récent</li>";
    return;
  }
  arr.forEach(r => {
    const li = document.createElement("li");
    const date = new Date(r.dateISO);
    li.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} — score: ${r.score}`;
    list.appendChild(li);
  });
}

/* ---------- GESTION DES TENTATIVES ---------- */
function updateAttemptsDisplay() {
  const el = document.getElementById("attempts-box");
  if (!el) return;
  // attempts = nombre d'échecs; afficher essais restants ou tentatives effectuées
  const attemptNumber = attempts + 1; // tentative en cours
  el.textContent = `Tentative : ${attemptNumber}/${maxAttempts}`;
}

/* Calcule le score selon la règle demandée :
   Si gagnant à la tentative N (1..5), score = (maxAttempts - N) * (100/(maxAttempts-1))
   -> attempt 1 => 100, 2 => 75, 3 => 50, 4 => 25, 5 => 0
   Nous transmettons attemptNumber = attempts + 1 */
function computeScoreOnWin() {
  const attemptNumber = attempts + 1;
  const score = Math.round((maxAttempts - attemptNumber) * (100 / (maxAttempts - 1)));
  return Math.max(0, score);
}

/* ---------- CHECK CODE & HINTS & IA ---------- */
function logValues() {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    const attempt = values.join("");
    checkCode(attempt);
    timeoutId = null;
  }, 800); // délai raccourci pour UX plus réactive
}

function checkCode(attempt) {
  updateAttemptsDisplay();

  //showAnecdoteMock(`Recherche d'une anecdote pour ${attempt}...`);
  //if (USE_AI) {
  // si activé, appeler l'IA asynchrone (non-bloquant)
  //  fetchAnecdoteFromAI(attempt).catch(() => {});
  //}

  if (attempt === secretCode) {
    hasWon = true;
    clearInterval(timer);
    timer = null;
    showPopup("🎉 Bravo ! Votre valise est débloquée, vous pouvez profiter de votre vol en toute tranquillité !", () => {
      restartGame();
    });


    // score
    const score = computeScoreOnWin();
    pushScoreRecord(score);

    // ne plus sauvegarder la partie
    localStorage.removeItem("gameState");

    // jouer la musique de récompense (essaye)
    playRandomDeezerPreview().catch(() => {});

    const btn = document.querySelector(".stop-timer");
    if (btn) {
      btn.textContent = "Partie terminée";
      btn.setAttribute("disabled", "");
    }
    renderScores();
  } else {
    attempts++;
    const hintBox = document.getElementById("hint-box");
    if (hintBox) hintBox.textContent = "Code incorrect";

    updateAttemptsDisplay();

    if (attempts >= maxAttempts) {
      clearInterval(timer);
      timer = null;
      showPopup("😢 Oh non, vous n’avez pas trouvé votre code à temps !", () => {
        restartGame();
      });
      localStorage.removeItem("gameState");
    } else {
      saveGameState();
    }
  }
}

/* ---------- INTERACTIONS UI ---------- */
function increase(index) {
  if (values[index] < 9) {
    values[index]++;
    if (outputs[index]) outputs[index].textContent = values[index];
    // démarre au premier mouvement
    if (!timer && !hasWon && seconds > 0) startTimer();
    logValues();
  }
}
function decrease(index) {
  if (values[index] > 0) {
    values[index]--;
    if (outputs[index]) outputs[index].textContent = values[index];
    if (!timer && !hasWon && seconds > 0) startTimer();
    logValues();
  }
}

function restartGame() {
  localStorage.removeItem("gameState");
  hasWon = false;
  seconds = 120;
  attempts = 0;
  clearInterval(timer);
  timer = null;
  secretCode = generateSecretCode();
  console.log("Nouveau code secret :", secretCode);

  values = [1, 1, 1];
  for (let i = 0; i < 3; i++) {
    if (outputs[i]) outputs[i].textContent = values[i];
  }

  const box = document.getElementById("timer-box");
  if (box) box.textContent = formatTime(seconds);
  const btn = document.querySelector(".stop-timer");
  if (btn) {
    btn.removeAttribute("disabled");
    btn.textContent = "Pause";
  }
  const hintBox = document.getElementById("hint-box");
  if (hintBox) hintBox.textContent = "";
  const anecdoteEl = document.getElementById("anecdote-box");
  if (anecdoteEl) anecdoteEl.textContent = "";
  updateAttemptsDisplay();
  renderScores();
}

/* ---------- CLAVIER (non intrusif) ---------- */
function attachKeyboardHandlers() {
  document.addEventListener("keydown", (e) => {
    // si la partie est terminée, on ignore
    if (hasWon || seconds === 0) return;

    // ignore si focus sur input / button / textarea (pour ne pas casser les formulaires)
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") {
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      increase(focusedIndex);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      decrease(focusedIndex);
    } else if (/^[0-9]$/.test(e.key)) {
      values[focusedIndex] = parseInt(e.key, 10);
      if (outputs[focusedIndex]) outputs[focusedIndex].textContent = values[focusedIndex];
      if (!timer) startTimer();
      logValues();
    } else if (e.key === "Enter") {
      const attempt = values.join("");
      checkCode(attempt);
    }
  });
}

/* clic sur la valeur pour focaliser (utile pour clavier) */
function attachClicksToValues() {
  for (let i = 0; i < 3; i++) {
    const el = outputs[i];
    if (!el) continue;
    el.addEventListener("click", () => {
      focusedIndex = i;
      highlightFocused();
    });
  }
}
function highlightFocused() {
  for (let i = 0; i < outputs.length; i++) {
    if (!outputs[i]) continue;
    if (i === focusedIndex) outputs[i].classList.add("focused");
    else outputs[i].classList.remove("focused");
  }
}

/* ---------- IA (Désativer) ---------- */
async function fetchAnecdoteFromAI(value) {
  if (!window.puter || !window.puter.ai) throw new Error("API Puter non disponible");
  const prompt = `Donne une courte anecdote (1 phrase) liée au nombre ${value}.`;
  const res = await puter.ai.chat(prompt, { model: "gpt-5-nano" });
  const text = typeof res === "string" ? res : (res.message?.content || JSON.stringify(res));
  const el = document.getElementById("anecdote-box");
  if (el) el.textContent = `💡 ${text}`;
  return text;
}

/* ---------- DEEZER (récompense) ---------- */
function jsonpFetch(url) {
  return new Promise((resolve, reject) => {
    const cbId = "cb_" + Math.random().toString(36).slice(2);
    window[cbId] = (data) => { resolve(data); delete window[cbId]; script.remove(); };
    const script = document.createElement("script");
    script.src = `${url}?output=jsonp&callback=${cbId}`;
    script.onerror = () => { reject(new Error("JSONP failed")); delete window[cbId]; script.remove(); };
    document.body.appendChild(script);
  });
}

async function playRandomDeezerPreview() {
  try {
    const data = await jsonpFetch("https://api.deezer.com/chart/0/tracks");
    if (!data || !data.data || !data.data.length) return;
    const track = data.data[Math.floor(Math.random() * data.data.length)];
    const audio = document.getElementById("reward-audio");
    const info = document.getElementById("music-info");
    audio.src = track.preview;
    audio.style.display = "block";
    await audio.play().catch(() => { /* autoplay might be blocked */ });
    if (info) info.textContent = `🎵 ${track.title} — ${track.artist.name}`;
  } catch (err) {
    console.warn("Deezer failed:", err);
  }
}

/* ---------- ACCESSIBILITÉ / BOUTON PAUSE HOVER ---------- */
function attachStopButtonHandlers() {
  const btn = document.querySelector(".stop-timer");
  if (!btn) return;
  btn.addEventListener("mouseenter", () => btn.setAttribute("aria-label", "Pause / Reprendre le timer"));
  btn.addEventListener("mouseleave", () => btn.removeAttribute("aria-label"));
  btn.addEventListener("focus", () => btn.setAttribute("aria-label", "Pause / Reprendre le timer"));
  btn.addEventListener("blur", () => btn.removeAttribute("aria-label"));
}

/* ---------- POPUP ---------- */
function showPopup(message, callback) {
  const overlay = document.getElementById("popup-overlay");
  const msg = document.getElementById("popup-message");
  const btn = document.getElementById("popup-button");
  if (!overlay || !msg || !btn) return;

  msg.innerHTML = message;
  overlay.style.display = "flex";

  // clic sur OK
  const onClick = () => {
    overlay.style.display = "none";
    btn.removeEventListener("click", onClick);
    if (callback) callback();
  };
  btn.addEventListener("click", onClick);
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  outputs = [
    document.getElementById("case1"),
    document.getElementById("case2"),
    document.getElementById("case3")
  ];
  anecdoteBox = document.getElementById("anecdote-box");

  // tenter la restauration ; si aucune sauvegarde, générer un nouveau secret unique ici
  const restored = restoreGameState();
  if (!restored) {
    secretCode = generateSecretCode();
    console.log("Nouveau secret généré :", secretCode);
  } else {
    console.log("Secret restauré :", secretCode);
  }

  // initialiser l'affichage des valeurs si non restaurées
  for (let i = 0; i < 3; i++) {
    if (outputs[i] && outputs[i].textContent.trim() === "") outputs[i].textContent = values[i];
  }

  // bouton pause désactivé tant que pas de démarrage
  const btn = document.querySelector(".stop-timer");
  if (btn) btn.setAttribute("disabled", "");

  attachStopButtonHandlers();
  attachKeyboardHandlers();
  attachClicksToValues();

  updateAttemptsDisplay();
  renderScores();
  highlightFocused();

  showPopup(`
    <strong>Oh non !</strong><br>
    Votre valise est bloquée et vous allez rater votre avion.<br><br>
    Trouvez vite le code secret pour la débloquer !<br><br>
    Vous pouvez utiliser votre <strong>souris</strong> ou votre <strong>clavier</strong> 
    avec les flèches directionnelles <strong>Haut</strong> et <strong>Bas</strong> pour changer les chiffres.
  `, () => {
    console.log("Jeu démarré");
});

});
