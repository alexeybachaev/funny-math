(function () {
  // ==================== DOM-элементы ====================
  const problemCard = document.getElementById("problemCard");
  const problemExpression = document.getElementById("problemExpression");
  const answerInput = document.getElementById("answerInput");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");
  const feedbackMsg = document.getElementById("feedbackMsg");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const wrongDisplay = document.getElementById("wrongDisplay");
  const streakDisplay = document.getElementById("streakDisplay");
  const bestStreakDisplay = document.getElementById("bestStreakDisplay");
  const historyDots = document.getElementById("historyDots");
  const mascotEmoji = document.getElementById("mascotEmoji");
  const resetBtn = document.getElementById("resetBtn");
  const themeBtn = document.getElementById("themeBtn");
  const membersContainer = document.getElementById("membersContainer");
  const countPills = document.getElementById("countPills");

  // ==================== Звуковые массивы ====================
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

  // ==================== Конфетти и эмодзи ====================
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

    const container = document.createElement("div");
    container.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
    document.body.appendChild(container);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < 80; i++) {
      const piece = document.createElement("div");
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 6 + Math.random() * 14;
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 400;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 100;
      const rotation = Math.random() * 720 - 360;
      const duration = 0.8 + Math.random() * 1.6;
      const delay = Math.random() * 0.3;

      piece.style.cssText = `
                position:absolute;left:${centerX}px;top:${centerY}px;
                width:${size}px;height:${size}px;background:${color};
                border-radius:${Math.random() > 0.5 ? "50%" : "3px"};
                animation:confetti-fall ${duration}s ease-out ${delay}s forwards;
                --dx:${dx}px;--dy:${dy}px;--rot:${rotation}deg;
            `;
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 2500);
  }

  function spawnFloatingEmojis() {
    const emojis = [
      "⭐",
      "🌟",
      "💫",
      "✨",
      "🎉",
      "💖",
      "🔥",
      "🏅",
      "👏",
      "🥇",
      "🎊",
      "💯",
      "🦉",
      "🌈",
    ];
    const container = document.createElement("div");
    container.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;";
    document.body.appendChild(container);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < 12; i++) {
      const emoji = document.createElement("span");
      emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      emoji.style.cssText = `
                position:absolute;left:${centerX + (Math.random() - 0.5) * 250}px;
                top:${centerY + (Math.random() - 0.5) * 100}px;
                font-size:${1.5 + Math.random() * 2.5}rem;
                animation:float-up ${1.2 + Math.random() * 1.6}s ease-out ${Math.random() * 0.3}s forwards;
                opacity:0;
            `;
      container.appendChild(emoji);
    }

    setTimeout(() => container.remove(), 2500);
  }

  // Добавляем стили для анимаций
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
        @keyframes confetti-fall {
            0%{transform:translate(0,0) rotate(0deg) scale(1);opacity:1}
            60%{opacity:0.9}
            100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot)) scale(0.2);opacity:0}
        }
        @keyframes float-up {
            0%{transform:translateY(0) scale(0.4) rotate(0deg);opacity:0}
            20%{opacity:1}
            100%{transform:translateY(-250px) scale(1.4) rotate(25deg);opacity:0}
        }
        @keyframes mascot-dance {
            0%,100%{transform:translateY(0) rotate(0deg)}
            15%{transform:translateY(-20px) rotate(-5deg)}
            30%{transform:translateY(0) rotate(5deg)}
            45%{transform:translateY(-15px) rotate(-3deg)}
            60%{transform:translateY(0) rotate(3deg)}
            75%{transform:translateY(-8px) rotate(0deg)}
        }
        .mascot-dance{animation:mascot-dance 0.8s ease-in-out !important}
        @keyframes pulse-card{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        .pulse-card{animation:pulse-card 0.5s ease-in-out}
    `;
  document.head.appendChild(styleSheet);

  // ==================== Загрузка сохранённых данных ====================
  function loadSavedData() {
    try {
      const saved = JSON.parse(localStorage.getItem("mathTrainer"));
      if (saved) {
        return {
          score: saved.score || 0,
          wrong: saved.wrong || 0,
          streak: saved.streak || 0,
          bestStreak: saved.bestStreak || 0,
          history: saved.history || [],
          operandCount: saved.operandCount || 2,
          memberSettings: saved.memberSettings || [
            { min: 1, max: 10 },
            { min: 1, max: 10 },
          ],
          operationSettings: saved.operationSettings || ["random"],
          lastProblem: saved.lastProblem || null,
          theme: saved.theme || "light",
        };
      }
    } catch (e) {
      console.warn("Не удалось загрузить сохранения:", e);
    }
    return null;
  }

  function saveData() {
    try {
      const data = {
        score,
        wrong,
        streak,
        bestStreak,
        history,
        operandCount,
        memberSettings,
        operationSettings,
        lastProblem: currentProblem
          ? {
              expressionStr: currentProblem.expressionStr,
              answer: currentProblem.answer,
              _pending: currentProblem._pending || false,
            }
          : null,
        theme: document.body.classList.contains("dark") ? "dark" : "light",
      };
      localStorage.setItem("mathTrainer", JSON.stringify(data));
    } catch (e) {
      console.warn("Не удалось сохранить данные:", e);
    }
  }

  // ==================== Инициализация состояния ====================
  const saved = loadSavedData();

  let score = saved ? saved.score : 0;
  let wrong = saved ? saved.wrong : 0;
  let streak = saved ? saved.streak : 0;
  let bestStreak = saved ? saved.bestStreak : 0;
  let history = saved ? saved.history : [];
  let operandCount = saved ? saved.operandCount : 2;
  let memberSettings = saved
    ? saved.memberSettings
    : [
        { min: 1, max: 10 },
        { min: 1, max: 10 },
      ];
  let operationSettings = saved ? saved.operationSettings : ["random"];

  let currentProblem = null;
  let isWaitingForNext = false;

  const opsList = ["+", "-", "×", "÷"];

  // Применяем тему
  if (saved?.theme === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️";
  } else {
    themeBtn.textContent = "🌙";
  }

  // ==================== Вспомогательные функции ====================
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function playRandomSound(soundArray) {
    if (!soundArray || soundArray.length === 0) return;
    const randomIndex = Math.floor(Math.random() * soundArray.length);
    const audio = new Audio(soundArray[randomIndex]);
    audio.volume = 0.6;
    audio.play().catch((err) => {
      console.warn("Не удалось проиграть звук:", err);
    });
  }

  function updateHistoryDots() {
    if (!historyDots) return;
    historyDots.innerHTML = "";
    const recent = history.slice(-15);
    recent.forEach((result) => {
      const dot = document.createElement("span");
      dot.className =
        "history-dot " + (result === "correct" ? "correct-dot" : "wrong-dot");
      historyDots.appendChild(dot);
    });
  }

  // ==================== Построение UI настроек ====================
  function buildMemberUI() {
    membersContainer.innerHTML = "";

    for (let i = 0; i < operandCount; i++) {
      const s = memberSettings[i] || { min: 1, max: 10 };
      const row = document.createElement("div");
      row.className = "member-row";

      row.innerHTML = `
                <span class="member-label">Член ${i + 1}</span>
                <div class="member-range">
                    от <input type="number" class="member-min" value="${s.min}" min="0" max="100" data-index="${i}">
                    до <input type="number" class="member-max" value="${s.max}" min="1" max="100" data-index="${i}">
                </div>
            `;

      const minInp = row.querySelector(".member-min");
      const maxInp = row.querySelector(".member-max");

      if (minInp && maxInp) {
        const updateRange = () => {
          const idx = parseInt(minInp.dataset.index);
          let mn = parseInt(minInp.value);
          let mx = parseInt(maxInp.value);

          if (isNaN(mn)) mn = memberSettings[idx]?.min || 1;
          if (isNaN(mx)) mx = memberSettings[idx]?.max || 10;
          if (mn < 0) mn = 0;
          if (mx < 1) mx = 1;
          if (mn > mx) [mn, mx] = [mx, mn];

          minInp.value = mn;
          maxInp.value = mx;
          memberSettings[idx].min = mn;
          memberSettings[idx].max = mx;
          currentProblem = null; // сбрасываем текущий пример
          if (saved) saved.lastProblem = null; // сбрасываем сохранённый
          saveData();
          generateNewProblem();
          answerInput.focus();
        };

        minInp.addEventListener("change", updateRange);
        maxInp.addEventListener("change", updateRange);
      }

      membersContainer.appendChild(row);

      if (i < operandCount - 1) {
        const opRow = document.createElement("div");
        opRow.className = "member-row";
        opRow.style.justifyContent = "center";
        opRow.style.background = "var(--op-row-bg)";
        opRow.style.border = "2px dashed var(--op-row-border)";

        const op = operationSettings[i] || "random";
        opRow.innerHTML = `
                    <span class="member-label">Действие ${i + 1}</span>
                    <select class="member-op-select${op === "random" ? " random-active" : ""}" data-op-index="${i}">
                        <option value="random" ${op === "random" ? "selected" : ""}>🎲 Случайно</option>
                        <option value="+" ${op === "+" ? "selected" : ""}>+ Сложение</option>
                        <option value="-" ${op === "-" ? "selected" : ""}>− Вычитание</option>
                        <option value="×" ${op === "×" ? "selected" : ""}>× Умножение</option>
                        <option value="÷" ${op === "÷" ? "selected" : ""}>÷ Деление</option>
                    </select>
                `;

        const sel = opRow.querySelector(".member-op-select");
        if (sel) {
          sel.addEventListener("change", () => {
            const opIdx = parseInt(sel.dataset.opIndex);
            operationSettings[opIdx] = sel.value;
            sel.classList.toggle("random-active", sel.value === "random");
            currentProblem = null;
            if (saved) saved.lastProblem = null;
            saveData();
            generateNewProblem();
            answerInput.focus();
          });
        }

        membersContainer.appendChild(opRow);
      }
    }
  }

  // ==================== Выбор количества членов ====================
  function updateCountPills() {
    countPills.querySelectorAll(".count-pill").forEach((p) => {
      p.classList.remove("active");
      if (parseInt(p.dataset.count) === operandCount) {
        p.classList.add("active");
      }
    });
  }

  countPills.addEventListener("click", (e) => {
    const pill = e.target.closest(".count-pill");
    if (!pill || pill.classList.contains("active")) return;

    countPills
      .querySelectorAll(".count-pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");

    const newCount = parseInt(pill.dataset.count);
    if (newCount !== operandCount) {
      operandCount = newCount;

      while (memberSettings.length < operandCount) {
        memberSettings.push({ min: 1, max: 10 });
      }
      while (memberSettings.length > operandCount) {
        memberSettings.pop();
      }

      while (operationSettings.length < operandCount - 1) {
        operationSettings.push("random");
      }
      while (operationSettings.length > operandCount - 1) {
        operationSettings.pop();
      }

      // Сбрасываем сохранённый пример
      if (saved) saved.lastProblem = null;

      saveData();
      buildMemberUI();
      generateNewProblem();
      setTimeout(() => answerInput.focus(), 100);
    }
  });

  // ==================== Генерация примера ====================
  function generateProblem() {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const ops = [];
      for (let i = 0; i < operandCount - 1; i++) {
        let op = operationSettings[i] || "random";
        if (op === "random") {
          op = opsList[Math.floor(Math.random() * opsList.length)];
        }
        ops.push(op);
      }

      const operands = [];
      for (let i = 0; i < operandCount; i++) {
        const settings = memberSettings[i];
        if (!settings) continue;
        const num = randInt(settings.min, settings.max);
        operands.push(num);
      }

      // Вычисляем ответ с учётом приоритета: сначала × и ÷, потом + и -
      let answer = calculateWithPriority(operands, ops);

      if (answer !== null && Number.isInteger(answer) && answer >= 0) {
        let expr = String(operands[0]);
        for (let i = 0; i < ops.length; i++) {
          expr += ` ${ops[i]} ${operands[i + 1]}`;
        }
        expr += ' = <span class="highlight">?</span>';
        return {
          expressionStr: expr,
          answer,
          _pending: true,
        };
      }
    }

    console.warn("Запасной пример");
    const a = randInt(
      memberSettings[0]?.min || 1,
      memberSettings[0]?.max || 10,
    );
    const b = randInt(
      memberSettings[1]?.min || 1,
      memberSettings[1]?.max || 10,
    );
    return {
      expressionStr: `${a} + ${b} = <span class="highlight">?</span>`,
      answer: a + b,
      _pending: true,
    };
  }

  // Новая функция: вычисление с приоритетом × и ÷
  function calculateWithPriority(operands, ops) {
    // Создаём копии массивов, чтобы не менять оригиналы
    let nums = [...operands];
    let operations = [...ops];

    // Первый проход: выполняем все × и ÷ слева направо
    for (let i = 0; i < operations.length; i++) {
      if (operations[i] === "×" || operations[i] === "÷") {
        const a = nums[i];
        const b = nums[i + 1];
        let result;

        if (operations[i] === "×") {
          result = a * b;
        } else {
          if (b === 0 || a % b !== 0) return null; // деление не нацело — не подходит
          result = a / b;
        }

        // Заменяем два числа одним результатом
        nums.splice(i, 2, result);
        operations.splice(i, 1);
        i--; // отступаем назад, так как массив уменьшился
      }
    }

    // Второй проход: выполняем все + и - слева направо
    let result = nums[0];
    for (let i = 0; i < operations.length; i++) {
      const b = nums[i + 1];
      if (operations[i] === "+") {
        result += b;
      } else if (operations[i] === "-") {
        result -= b;
        if (result < 0) return null; // отрицательный результат не подходит
      }
    }

    return result;
  }

  function generateNewProblem() {
    if (
      saved &&
      saved.lastProblem &&
      saved.lastProblem.expressionStr &&
      saved.lastProblem._pending
    ) {
      currentProblem = {
        expressionStr: saved.lastProblem.expressionStr,
        answer: saved.lastProblem.answer,
        _pending: false,
      };
    } else {
      currentProblem = generateProblem();
      // Сохраняем только если это новый пример (не из настроек)
      if (!currentProblem._dontSave) {
        saved.lastProblem = {
          expressionStr: currentProblem.expressionStr,
          answer: currentProblem.answer,
          _pending: true,
        };
        saveData();
      }
    }

    problemExpression.innerHTML = currentProblem.expressionStr;
    problemCard.classList.remove("shake", "celebrate", "pulse-card");
    answerInput.classList.remove("correct-flash", "wrong-flash");
    answerInput.value = "";
    answerInput.disabled = false;
    submitBtn.disabled = false;
    nextBtn.style.display = "none";
    feedbackMsg.textContent = "";
    feedbackMsg.className = "feedback-msg";
    isWaitingForNext = false;
    answerInput.focus();
  }

  // ==================== Проверка ответа ====================
  function checkAnswer() {
    if (isWaitingForNext || !currentProblem) return;

    const userAnswerStr = answerInput.value.trim();
    if (userAnswerStr === "") {
      feedbackMsg.textContent = "Введи ответ! ✍️";
      feedbackMsg.className = "feedback-msg";
      answerInput.focus();
      return;
    }

    const userAnswer = parseInt(userAnswerStr, 10);
    if (isNaN(userAnswer)) {
      feedbackMsg.textContent = "Это не число 🤔";
      feedbackMsg.className = "feedback-msg";
      return;
    }

    const isCorrect = userAnswer === currentProblem.answer;
    isWaitingForNext = true;
    answerInput.disabled = true;
    submitBtn.disabled = true;

    if (saved && saved.lastProblem) {
      delete saved.lastProblem._pending;
    }
    saveData();

    if (isCorrect) {
      score++;
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      history.push("correct");
      if (history.length > 20) history.shift();

      problemCard.classList.add("celebrate", "pulse-card");
      answerInput.classList.add("correct-flash");
      mascotEmoji.textContent = ["🥳", "🎉", "😍", "🤩", "🦉✨"][
        Math.floor(Math.random() * 5)
      ];
      mascotEmoji.classList.add("mascot-dance");
      setTimeout(() => mascotEmoji.classList.remove("mascot-dance"), 800);

      const messages = [
        "Великолепно! 🌟",
        "Отлично! 🎉",
        "Молодец! ⭐",
        "Супер! 🚀",
        "Правильно! 💯",
        "Ты гений! 🧠",
        "Так держать! 👏",
      ];
      feedbackMsg.textContent =
        messages[Math.floor(Math.random() * messages.length)];
      feedbackMsg.className = "feedback-msg correct";

      playRandomSound(correctSounds);
      spawnConfetti();
      spawnFloatingEmojis();
    } else {
      wrong++;
      streak = 0;
      history.push("wrong");
      if (history.length > 20) history.shift();

      problemCard.classList.add("shake");
      answerInput.classList.add("wrong-flash");
      mascotEmoji.textContent = ["🦉💜", "😢", "💪", "🤗"][
        Math.floor(Math.random() * 4)
      ];

      feedbackMsg.innerHTML = `Не совсем! Ответ: <strong>${currentProblem.answer}</strong> 💪`;
      feedbackMsg.className = "feedback-msg wrong";

      playRandomSound(wrongSounds);
    }

    saveData();
    updateStats();
    updateHistoryDots();
    nextBtn.style.display = "inline-block";
    nextBtn.focus();
  }

  function updateStats() {
    scoreDisplay.textContent = score;
    wrongDisplay.textContent = wrong;
    streakDisplay.textContent = streak;
    bestStreakDisplay.textContent = bestStreak;
  }

  // ==================== Обработчики событий ====================
  submitBtn.addEventListener("click", checkAnswer);

  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkAnswer();
    }
  });

  nextBtn.addEventListener("click", () => {
    generateNewProblem();
  });

  nextBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      generateNewProblem();
    }
  });

  resetBtn.addEventListener("click", () => {
    score = 0;
    wrong = 0;
    streak = 0;
    history = [];
    saveData();
    updateStats();
    updateHistoryDots();
    generateNewProblem();
    answerInput.focus();
  });

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    themeBtn.textContent = isDark ? "☀️" : "🌙";
    saveData();
  });

  // ==================== Инициализация ====================
  updateCountPills();
  buildMemberUI();
  updateStats();
  updateHistoryDots();
  generateNewProblem();
})();
