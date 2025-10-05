"use strict";

let seconds = 120;
let timer = setInterval(timerFunction ,1000);
function timerFunction() {
  seconds--;
  document.getElementById("date-today").textContent = seconds + " secondes";

  if (seconds === 0) {
    clearInterval(timer);
    alert("Vous n'avez pas trouver le code à temps 😕")
  }
}

function stopTimer() {
  clearTimeout(timer);
}

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
