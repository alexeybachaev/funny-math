(function () {
  // ==================== DOM ELEMENTS ====================
  const problemCard = document.getElementById("problemCard");
  const problemExpression = document.getElementById("problemExpression");
  const answerInput = document.getElementById("answerInput");
  const submitBtn = document.getElementById("submitBtn");
  const feedbackMsg = document.getElementById("feedbackMsg");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const streakDisplay = document.getElementById("streakDisplay");
  const bestStreakDisplay = document.getElementById("bestStreakDisplay");
  const streakBadge = document.getElementById("streakBadge");
  const historyDots = document.getElementById("historyDots");
  const confettiContainer = document.getElementById("confettiContainer");
  const mascotEmoji = document.getElementById("mascotEmoji");
  const resetBtn = document.getElementById("resetBtn");
  const minNumberInput = document.getElementById("minNumber");
  const maxNumberInput = document.getElementById("maxNumber");
  const opPills = document.getElementById("opPills");
  const countPills = document.getElementById("countPills");
  const nextBtn = document.getElementById("nextBtn");
  const correctSounds = [
    "./sound/correct1.mp3",
    "./sound/correct2.mp3",
    "./sound/correct3.mp3",
    "./sound/correct4.mp3",
  ];

  const wrongSounds = [
    "./sound/false1.mp3",
    "./sound/false2.mp3",
    "./sound/false3.mp3",
    "./sound/false4.mp3",
  ];

  // ==================== STATE ====================
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let totalAttempts = 0;
  let currentProblem = null;
  let isWaitingForNext = false;
  let history = []; // array of 'correct' | 'wrong', max 20

  // Settings
  let operation = "multiply"; // 'add' | 'subtract' | 'multiply' | 'divide'
  let minNumber = 1;
  let maxNumber = 10;
  let operandCount = 2;

  // ==================== SETTINGS HANDLERS ====================
  function getValidMinMax() {
    let mn = parseInt(minNumberInput.value) || 1;
    let mx = parseInt(maxNumberInput.value) || 10;
    if (mn < 0) mn = 0;
    if (mx < 1) mx = 1;
    if (mx > 100) mx = 100;
    if (mn > mx) [mn, mx] = [mx, mn];
    // For division, min should be at least 1 for divisors
    if (operation === "divide" && mn < 1) mn = 1;
    minNumberInput.value = mn;
    maxNumberInput.value = mx;
    return { mn, mx };
  }

  function updateSettingsFromUI() {
    const { mn, mx } = getValidMinMax();
    minNumber = mn;
    maxNumber = mx;
    // Operation from active pill
    const activeOp = opPills.querySelector(".op-pill.active");
    if (activeOp) operation = activeOp.dataset.op;
    // Operand count from active pill
    const activeCount = countPills.querySelector(".count-pill.active");
    if (activeCount) operandCount = parseInt(activeCount.dataset.count);
    // For division, ensure min >= 1
    if (operation === "divide" && minNumber < 1) {
      minNumber = 1;
      minNumberInput.value = 1;
    }
  }

  function onSettingChanged() {
    updateSettingsFromUI();
    generateNewProblem();
    answerInput.focus();
  }

  // Operation pills
  opPills.addEventListener("click", (e) => {
    const pill = e.target.closest(".op-pill");
    if (!pill || pill.classList.contains("active")) return;
    opPills
      .querySelectorAll(".op-pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    // Adjust min for division
    if (pill.dataset.op === "divide" && parseInt(minNumberInput.value) < 1) {
      minNumberInput.value = 1;
    }
    onSettingChanged();
  });

  // Count pills
  countPills.addEventListener("click", (e) => {
    const pill = e.target.closest(".count-pill");
    if (!pill || pill.classList.contains("active")) return;
    countPills
      .querySelectorAll(".count-pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    onSettingChanged();
  });

  // Range inputs
  minNumberInput.addEventListener("change", onSettingChanged);
  maxNumberInput.addEventListener("change", onSettingChanged);
  minNumberInput.addEventListener("input", () => {
    // Live validation
    const { mn, mx } = getValidMinMax();
    if (operation === "divide" && mn < 1) minNumberInput.value = 1;
  });

  // Reset button
  resetBtn.addEventListener("click", () => {
    score = 0;
    streak = 0;
    bestStreak = 0;
    totalAttempts = 0;
    history = [];
    updateStatsDisplay();
    updateHistoryDots();
    feedbackMsg.textContent = "";
    feedbackMsg.className = "feedback-msg";
    mascotEmoji.textContent = "🦉";
    generateNewProblem();
    answerInput.focus();
  });

  // ==================== PROBLEM GENERATION ====================
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateProblem() {
    updateSettingsFromUI();
    const op = operation;
    const count = operandCount;
    const mn = minNumber;
    const mx = maxNumber;
    let operands = [];
    let answer;
    let expressionStr;

    if (op === "add") {
      // Forward generation: a + b + c + ...
      for (let i = 0; i < count; i++) {
        operands.push(randInt(mn, mx));
      }
      answer = operands.reduce((sum, val) => sum + val, 0);
      expressionStr =
        operands.join(" + ") + ' = <span class="highlight">?</span>';
    } else if (op === "subtract") {
      // Backward generation to ensure non-negative result
      // For a - b - c - ... = d: pick b,c,... and d, then a = d + b + c + ...
      const subtrahends = [];
      for (let i = 0; i < count - 1; i++) {
        subtrahends.push(randInt(mn, mx));
      }
      answer = randInt(0, mx); // result can be 0 or positive
      const firstOperand = answer + subtrahends.reduce((s, v) => s + v, 0);
      operands = [firstOperand, ...subtrahends];
      expressionStr =
        operands.join(" − ") + ' = <span class="highlight">?</span>';
    } else if (op === "multiply") {
      for (let i = 0; i < count; i++) {
        operands.push(randInt(mn, mx));
      }
      answer = operands.reduce((prod, val) => prod * val, 1);
      expressionStr =
        operands.join(" × ") + ' = <span class="highlight">?</span>';
    } else if (op === "divide") {
      // Backward generation for clean division
      // a ÷ b ÷ c ÷ ... = d: pick divisors b,c,... and answer d, then a = d * b * c * ...
      const divisors = [];
      const divMn = Math.max(1, mn); // divisors must be >= 1
      const divMx = Math.max(1, mx);
      for (let i = 0; i < count - 1; i++) {
        divisors.push(randInt(divMn, divMx));
      }
      answer = randInt(divMn, divMx);
      const firstOperand = answer * divisors.reduce((p, v) => p * v, 1);
      operands = [firstOperand, ...divisors];
      expressionStr =
        operands.join(" ÷ ") + ' = <span class="highlight">?</span>';
    }

    return { operands, answer, expressionStr, operation: op };
  }

  function generateNewProblem() {
    currentProblem = generateProblem();
    problemExpression.innerHTML = currentProblem.expressionStr;
    problemCard.classList.remove("shake", "celebrate");
    answerInput.classList.remove("correct-flash", "wrong-flash");
    answerInput.value = "";
    answerInput.disabled = false;
    submitBtn.disabled = false;
    feedbackMsg.textContent = "";
    feedbackMsg.className = "feedback-msg";
    isWaitingForNext = false;
    answerInput.focus();
    nextBtn.style.display = "none"; // добавить эту строку
  }

  // ==================== ANSWER CHECKING ====================
  function checkAnswer() {
    if (isWaitingForNext) return;
    if (!currentProblem) {
      generateNewProblem();
      return;
    }

    const userAnswerStr = answerInput.value.trim();
    if (userAnswerStr === "") {
      feedbackMsg.textContent = "Введи ответ! ✍️";
      feedbackMsg.className = "feedback-msg";
      answerInput.focus();
      answerInput.style.animation = "none";
      answerInput.offsetHeight;
      answerInput.style.animation = "shakeInput 0.4s ease-in-out";
      setTimeout(() => {
        answerInput.style.animation = "";
      }, 400);
      return;
    }

    const userAnswer = parseInt(userAnswerStr, 10);
    if (isNaN(userAnswer)) {
      feedbackMsg.textContent = "Это не похоже на число 🤔";
      feedbackMsg.className = "feedback-msg";
      return;
    }

    const correctAnswer = currentProblem.answer;
    const isCorrect = userAnswer === correctAnswer;
    totalAttempts++;

    // Блокируем ввод и кнопку "Проверить"
    isWaitingForNext = true;
    answerInput.disabled = true;
    submitBtn.disabled = true;

    if (isCorrect) {
      // Правильный ответ
      score++;
      streak++;

      if (streak > bestStreak) bestStreak = streak;
      history.push("correct");
      if (history.length > 20) history.shift();

      problemCard.classList.add("celebrate");
      answerInput.classList.add("correct-flash");
      feedbackMsg.textContent = getCorrectMessage();
      feedbackMsg.className = "feedback-msg correct";
      mascotEmoji.textContent = getHappyMascot();
      playRandomSound(correctSounds);
      spawnConfetti();
      spawnFloatingEmojis();
      updateStatsDisplay();
      updateHistoryDots();
      animateStreakBadge();
    } else {
      // Неправильный ответ
      streak = 0;
      history.push("wrong");
      if (history.length > 20) history.shift();

      problemCard.classList.add("shake");
      answerInput.classList.add("wrong-flash");
      feedbackMsg.innerHTML = `Не совсем! Правильный ответ: <strong>${correctAnswer}</strong> 💪 Попробуй ещё!`;
      feedbackMsg.className = "feedback-msg wrong";
      mascotEmoji.textContent = "🦉💜";
      playRandomSound(wrongSounds);
      updateStatsDisplay();
      updateHistoryDots();
      animateStreakBadge();
    }

    // Показываем кнопку "Далее" и переводим на неё фокус
    nextBtn.style.display = "inline-block";
    nextBtn.focus();

    // Никаких setTimeout для автоматического перехода!
    // Ребёнок сам нажмёт "Далее", когда будет готов.
  }

  function getCorrectMessage() {
    const messages = [
      "Великолепно! 🌟",
      "Отлично! 🎉",
      "Молодец! ⭐",
      "Супер! 🚀",
      "Правильно! 💯",
      "Ты гений! 🧠✨",
      "Так держать! 👏",
      "Замечательно! 🏅",
      "В яблочко! 🎯",
      "Круто! 😎",
    ];
    if (streak >= 10) return "Невероятная серия! 🔥🔥🔥 Ты легенда! 🏆";
    if (streak >= 7) return "Ого, серия из " + streak + "! 🔥 Ты на высоте! 🚀";
    if (streak >= 5) return "Пять подряд! 🔥 Супер-звезда! ⭐";
    return messages[Math.floor(Math.random() * messages.length)];
  }

  function getHappyMascot() {
    const happy = ["🦉🎉", "🦉⭐", "🦉💫", "🦉🌟", "😊🦉", "🥳", "🤩", "😎"];
    return happy[Math.floor(Math.random() * happy.length)];
  }

  // ==================== VISUAL EFFECTS ====================
  function spawnConfetti() {
    const colors = [
      "#f97316",
      "#ec4899",
      "#8b5cf6",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#06b6d4",
      "#84cc16",
      "#f43f5e",
      "#a855f7",
      "#14b8a6",
      "#eab308",
      "#6366f1",
      "#22c55e",
    ];
    const pieceCount = 40;
    const fragment = document.createDocumentFragment();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 80;

    for (let i = 0; i < pieceCount; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = centerX + "px";
      piece.style.top = centerY + "px";
      piece.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = 6 + Math.random() * 14 + "px";
      piece.style.height = 6 + Math.random() * 14 + "px";
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "3px";
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 350;
      piece.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      piece.style.setProperty(
        "--dy",
        Math.sin(angle) * distance - 80 - Math.random() * 200 + "px",
      );
      piece.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
      piece.style.animationDuration = 0.8 + Math.random() * 1.4 + "s";
      piece.style.animationDelay = Math.random() * 0.3 + "s";
      fragment.appendChild(piece);
    }
    confettiContainer.appendChild(fragment);

    // Clean up after animation
    setTimeout(() => {
      while (confettiContainer.firstChild) {
        confettiContainer.removeChild(confettiContainer.firstChild);
      }
    }, 2000);
  }

  function spawnFloatingEmojis() {
    const emojis = ["⭐", "🌟", "💫", "✨", "🎉", "💖", "🔥", "🏅", "👏", "🥇"];
    const count = 8;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 60;

    for (let i = 0; i < count; i++) {
      const emojiEl = document.createElement("span");
      emojiEl.className = "float-emoji";
      emojiEl.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      emojiEl.style.left = centerX + (Math.random() - 0.5) * 200 + "px";
      emojiEl.style.top = centerY + (Math.random() - 0.5) * 60 + "px";
      emojiEl.style.animationDuration = 1.2 + Math.random() * 1.6 + "s";
      emojiEl.style.animationDelay = Math.random() * 0.25 + "s";
      emojiEl.style.fontSize = 1.4 + Math.random() * 2.2 + "rem";
      document.body.appendChild(emojiEl);

      setTimeout(() => {
        if (emojiEl.parentNode) emojiEl.parentNode.removeChild(emojiEl);
      }, 2200);
    }
  }

  function animateStreakBadge() {
    if (streak >= 3) {
      streakBadge.classList.add("fire");
      setTimeout(() => streakBadge.classList.remove("fire"), 600);
    }
  }

  // ==================== UI UPDATES ====================
  function updateStatsDisplay() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
    bestStreakDisplay.textContent = bestStreak;

    // Update streak badge appearance
    if (streak >= 10) {
      streakBadge.style.borderColor = "#f59e0b";
      streakBadge.style.background = "#fffbeb";
    } else if (streak >= 5) {
      streakBadge.style.borderColor = "#fbbf24";
      streakBadge.style.background = "#fffdf5";
    } else {
      streakBadge.style.borderColor = "#fde68a";
      streakBadge.style.background = "#fffbeb";
    }
  }

  function updateHistoryDots() {
    historyDots.innerHTML = "";
    // Show last 15 dots
    const recent = history.slice(-15);
    recent.forEach((result) => {
      const dot = document.createElement("span");
      dot.className =
        "history-dot " + (result === "correct" ? "correct-dot" : "wrong-dot");
      historyDots.appendChild(dot);
    });
    // Scroll-like: newest on the right
  }

  //==================== SOUNDS ====================
  function playRandomSound(soundArray) {
    if (!soundArray || soundArray.length === 0) return;
    const randomIndex = Math.floor(Math.random() * soundArray.length);
    const audio = new Audio(soundArray[randomIndex]);
    audio.volume = 0.7; // громкость по желанию
    audio.play().catch((err) => {
      console.warn("Не удалось проиграть звук:", err);
    });
  }

  // ==================== EVENT LISTENERS ====================
  submitBtn.addEventListener("click", checkAnswer);

  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkAnswer();
    }
  });

  // Prevent form submission on enter
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.activeElement === answerInput) {
      e.preventDefault();
    }
  });

  nextBtn.addEventListener("click", () => {
    // Убираем все классы анимации, чтобы поле стало обычным
    problemCard.classList.remove("shake", "celebrate");
    answerInput.classList.remove("correct-flash", "wrong-flash");
    feedbackMsg.textContent = "";
    feedbackMsg.className = "feedback-msg";
    // Генерируем новый пример
    generateNewProblem();
    answerInput.focus();
  });

  // ==================== INITIALIZATION ====================
  function init() {
    updateSettingsFromUI();
    // Sync UI for division min
    if (operation === "divide" && minNumber < 1) {
      minNumber = 1;
      minNumberInput.value = 1;
    }
    updateStatsDisplay();
    updateHistoryDots();
    generateNewProblem();
    answerInput.focus();
  }

  init();

  // ==================== SERVICE WORKER HINT FOR PWA (optional) ====================
  // This app works perfectly as a standalone page.
  // For an even better mobile experience, it can be added to the home screen.

  console.log("🦉 Весёлая математика готова!");
  console.log("   Действие: " + operation);
  console.log("   Диапазон: " + minNumber + " – " + maxNumber);
  console.log("   Количество: " + operandCount);
  console.log("   🎯 Удачи юному математику!");
})();
