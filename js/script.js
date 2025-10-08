"use strict";

let seconds = 120;
let timer = null;

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function timerFunction() {
  if (seconds > 0) {
    seconds--;
    const box = document.getElementById('timer-box');
    if (box) box.textContent = formatTime(seconds);
  }

  if (seconds === 0) {
    clearInterval(timer);
    timer = null;
    alert("Vous n'avez pas trouvé le code à temps 😕");
  }
}

// Démarre le timer au chargement
function startTimer() {
  const box = document.getElementById('timer-box');
  if (box) box.textContent = formatTime(seconds);
  timer = setInterval(timerFunction, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const btn = document.querySelector('.stop-timer');
  if (btn) {
    btn.setAttribute('disabled', '');
    btn.setAttribute('aria-pressed', 'true');
    btn.classList.add('stopped');
    btn.textContent = 'Timer arrêté';
  }
  const box = document.getElementById('timer-box');
  if (box) box.classList.add('stopped');
}

// Hover accessibility: add aria-label on hover/focus
function attachStopButtonHandlers() {
  const btn = document.querySelector('.stop-timer');
  if (!btn) return;
  btn.addEventListener('mouseenter', () => btn.setAttribute('aria-label', 'Arrêter le timer'));
  btn.addEventListener('mouseleave', () => btn.removeAttribute('aria-label'));
  btn.addEventListener('focus', () => btn.setAttribute('aria-label', 'Arrêter le timer'));
  btn.addEventListener('blur', () => btn.removeAttribute('aria-label'));
}

// Start on load
document.addEventListener('DOMContentLoaded', () => {
  startTimer();
  attachStopButtonHandlers();
});

const values = [1, 1, 1];
const outputs = [
  document.getElementById('case1'),
  document.getElementById('case2'),
  document.getElementById('case3')
];

let timeoutId = null;
let attempts = 0;
const maxAttempts = 5;

function generateSecretCode() {
  const number = Math.floor(Math.random() * 999) + 1;
  return number.toString().padStart(3, '0');
}

const secretCode = generateSecretCode();
console.log("Secret Code is: " + secretCode);

function logValues() {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  timeoutId = setTimeout(() => {
    const attempt = values.join('');
    console.log("Tentative avec: " + attempt);
    checkCode(attempt);
    timeoutId = null;
  }, 2700);
}

function checkCode(attempt) {
  if (attempt === secretCode) {
    console.log("Bravo, tu as trouvé e code ! Après " + attempts + " tentatives");
    alert("Bravo ! Le code secret était bien " + secretCode);
  } else {
    attempts++;
    console.log("Code incorrect (" + attempts + "/" + maxAttempts + ")");
    giveHints(attempt);

    if (attempts >= maxAttempts) {
      alert("Vous avez perdu ! Le code secret était : " + secretCode);
    }
  }
}

function giveHints(attempt) {
  const hintDigits = findMisplacedDigits(attempt, secretCode);

  if (hintDigits.length > 0) {
    console.log("Indice : Ces chiffres sont mal placés →", hintDigits.join(', '));
  } else {
    console.log("😕 Il n'y à aucune similitude avec le code secret");
  }
}

function findMisplacedDigits(attempt, secret) {
  const misplaced = [];

  for (let i = 0; i < attempt.length; i++) {
    if (secret.includes(attempt[i]) && secret[i] !== attempt[i]) {
      if (!misplaced.includes(attempt[i])) {
        misplaced.push(attempt[i]);
      }
    }
  }
  return misplaced;
}

function increase(index) {
  if (values[index] < 9) {
    values[index]++;
    outputs[index].innerHTML = values[index];
    logValues();
  }
}

function decrease(index) {
  if (values[index] > 0) {
    values[index]--;
    outputs[index].innerHTML = values[index];
    logValues();
  }
}
