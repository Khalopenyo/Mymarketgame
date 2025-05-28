const box = document.getElementById('box');
const gameArea = document.getElementById('gameArea');
const scoreElem = document.getElementById('score');
const timerElem = document.getElementById('timer');
const attemptsElem = document.getElementById('attempts');
const livesContainer = document.getElementById('livesContainer');
const startScreen = document.getElementById('startScreen');
const certificate = document.getElementById('certificate');
const certName = document.getElementById('certName');
const certPrize = document.getElementById('certPrize');
const certDate = document.getElementById('certDate');
const certPromo = document.getElementById('certPromo');
const bgMusic = document.getElementById('bgMusic');
const goodSound = document.getElementById('goodSound');
const bonusSound = document.getElementById('bonusSound');
const levelUpMessage = document.getElementById('levelUpMessage');
const telegramLink = document.getElementById('telegramLink');

let telegramId = null;
let isFromTelegram = false;

window.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp;

  if (tg && tg.initDataUnsafe?.user?.id) {
    tg.ready();
    tg.expand();
    telegramId = tg.initDataUnsafe.user.id.toString();
    isFromTelegram = true;
    console.log("✅ Telegram ID:", telegramId);
  } else {
    console.log("🌐 Запуск в браузере. Telegram ID недоступен.");
  }

  document.getElementById("subscribeModal").style.display = "flex";

});

let isGameActive = false;

document.body.addEventListener('touchmove', function (e) {
  if (isGameActive) {
    e.preventDefault();
  }
}, { passive: false });


function isValidPhone(phone) {
  return /^\+7\d{10}$/.test(phone);
}

function isValidInstagramNick(nick) {
  return /^@[\w._]{2,30}$/.test(nick);
}

let score = 0;
let attempts = 3;
let level = 1;
let gameInterval;
let spawnInterval;
let gameTimer;
let spawnSpeed = 1000;
let fallSpeed = 2;
let playerName = "";
let timeLeft = 90;

const ponchikImages = [
  '121.png',
  '101.png',
  '33.png',
  '4.png'
];


// 🔁 Заглушка
async function checkInstagramExists(nick) {
  console.log("⏩ Пропущена проверка ника:", nick);
  return true;
}

async function startGame() {
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const instagramNick = document.getElementById('instagramNick').value.trim();

  if (!isValidPhone(phoneNumber) || !isValidInstagramNick(instagramNick)) {
    alert("Введите корректный номер телефона и ник в Instagram (например: @nickname)");
    return;
  }

  const exists = await checkInstagramExists(instagramNick);
  if (!exists) {
    alert("Instagram-ник не существует!");
    return;
  }

  if (isFromTelegram && telegramId) {
    const res = await fetch("/check_attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: telegramId })
    });

    const result = await res.json();
    if (!result.allowed) {
      alert("❌ " + result.message);
      return;
    }
  } else {
    console.log("🌐 Игра в браузере — промокод не будет выдан.");
  }

  playerName = `${phoneNumber}, ${instagramNick}`;
  startScreen.style.display = "none";
  gameArea.style.display = "block";
  bgMusic.play();
  isGameActive = true;


  score = 0;
  attempts = 3;
  level = 1;
  spawnSpeed = 1000;
  fallSpeed = 2;
  timeLeft = 90;

  scoreElem.textContent = score;
  attemptsElem.textContent = attempts;
  drawLives();
  startTimer();
  spawnInterval = setInterval(spawnPonchik, spawnSpeed);
  gameInterval = setInterval(updateGame, 20);
}

function startTimer() {
  timerElem.textContent = timeLeft;
  gameTimer = setInterval(() => {
    timeLeft--;
    timerElem.textContent = timeLeft;
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function spawnPonchik() {
  const numberOfPonchiks = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < numberOfPonchiks; i++) {
    const ponchik = document.createElement('div');
    ponchik.classList.add('ponchik');
    const imgIndex = Math.floor(Math.random() * ponchikImages.length);
    ponchik.style.backgroundImage = `url('${ponchikImages[imgIndex]}')`;
    ponchik.style.left = Math.random() * (gameArea.clientWidth - 60) + 'px';
    ponchik.style.top = '-60px';
    gameArea.appendChild(ponchik);
  }
}

function updateGame() {
  const ponchiks = document.querySelectorAll('.ponchik');
  ponchiks.forEach(ponchik => {
    ponchik.style.top = (ponchik.offsetTop + fallSpeed) + 'px';

    if (ponchik.offsetTop > gameArea.clientHeight) {
      ponchik.remove();
      loseLife();
    }

    if (isColliding(ponchik, box)) {
      goodSound.play();
      score++;
      scoreElem.textContent = score;
      ponchik.remove();
      checkLevelUp();
    }
  });
}

function checkLevelUp() {
  if (score >= 50 && level === 1) {
    level = 2;
    nextLevel();
  } else if (score >= 100 && level === 2) {
    level = 3;
    nextLevel();
  } else if (score >= 150 && level === 3) {
    level = 4;
    nextLevel();
  } else if (score >= 200 && level === 4) {
    winGame();
  }
}

function nextLevel() {
  if (level === 2) {
    fallSpeed = 3;
    spawnSpeed = 800;
  } else if (level === 3) {
    fallSpeed = 4;
    spawnSpeed = 600;
  } else if (level === 4) {
    fallSpeed = 4;
    spawnSpeed = 400;
  }

  timeLeft += 30;
  timerElem.textContent = timeLeft;

  clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnPonchik, spawnSpeed);
  showLevelMessage();
}

function showLevelMessage() {
  levelUpMessage.textContent = `Уровень ${level}!`;
  levelUpMessage.style.display = 'block';
  levelUpMessage.style.animation = 'levelUpShow 2s ease';
  setTimeout(() => {
    levelUpMessage.style.display = 'none';
    levelUpMessage.style.animation = 'none';
  }, 2000);
}

function winGame() {
  clearInterval(gameTimer);
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  isGameActive = false;

  bgMusic.pause();

  gameArea.style.display = "none";
  certificate.style.display = "flex";

  const now = new Date();
  const dateString = now.toLocaleDateString();
  const promo = generatePromoCode();

  certName.textContent = playerName;
  certPrize.textContent = `Поздравляем! Вы прошли все уровни с результатом ${score} очков! 🎉🍩`;
  certPromo.textContent = `Промокод: ${promo}`;
  certDate.textContent = `Дата: ${dateString}`;
  telegramLink.href = `https://t.me/donuts_gamebot?start=${promo}`;

  sendPromoToTelegram(promo, score, playerName);
}

function endGame() {
  clearInterval(gameTimer);
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  isGameActive = false;

  bgMusic.pause();

  gameArea.style.display = "none";
  certificate.style.display = "flex";

  const now = new Date();
  const dateString = now.toLocaleDateString();
  const promo = generatePromoCode();

  certName.textContent = playerName;
  certPrize.textContent = `Ваш счёт: ${score} пончиков! `;
  certPromo.textContent = `Промокод: ${promo}`;
  certDate.textContent = `Дата: ${dateString}`;
  telegramLink.href = `https://t.me/donuts_gamebot?start=${promo}`;

  sendPromoToTelegram(promo, score, playerName);
}

function drawLives() {
  livesContainer.innerHTML = '';
  for (let i = 0; i < attempts; i++) {
    const heart = document.createElement('span');
    heart.textContent = '❤️';
    heart.style.fontSize = '24px';
    heart.style.margin = '0 3px';
    livesContainer.appendChild(heart);
  }
}

function loseLife() {
  attempts--;
  attemptsElem.textContent = attempts;
  drawLives();
  if (attempts <= 0) {
    endGame();
  }
}

function isColliding(a, b) {
  const aRect = a.getBoundingClientRect();
  const bRect = b.getBoundingClientRect();
  return !(
    aRect.bottom < bRect.top ||
    aRect.top > bRect.bottom ||
    aRect.right < bRect.left ||
    aRect.left > bRect.right
  );
}

gameArea.addEventListener('mousemove', (e) => {
  const x = e.clientX - gameArea.getBoundingClientRect().left;
  box.style.left = (x - box.offsetWidth / 2) + 'px';
});

gameArea.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  const x = touch.clientX - gameArea.getBoundingClientRect().left;
  box.style.left = (x - box.offsetWidth / 2) + 'px';
});

function generatePromoCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'My-' + code;
}

function sendPromoToTelegram(promoCode, score, name) {
  if (!isFromTelegram || !telegramId) {
    console.log("🌐 Не Telegram — промокод не отправляется");
    return;
  }

  fetch("/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      promo: promoCode,
      name: name,
      score: score,
      telegram_id: telegramId
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === "ok") {
      console.log("✅ Промокод успешно отправлен и записан");
    } else {
      console.error("❌ Ошибка при отправке:", data.message);
    }
  })
  .catch(error => console.error("❌ Сетевая ошибка:", error));
}

function downloadCertificate() {
  html2canvas(document.getElementById('certContainer')).then(canvas => {
    const link = document.createElement('a');
    link.download = 'certificate.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}

function onNickInput() {
  const nick = document.getElementById("fakeNickInput").value.trim();
  const confirmBtn = document.getElementById("confirmFakeCheckBtn");
  confirmBtn.disabled = nick.length < 3 || !/^@[\w._]{2,30}$/.test(nick);
}

function closeSubscribeModal() {
  document.getElementById("subscribeModal").style.display = "none";
}
