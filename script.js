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
  const mascotEmoji = document.getElementById("mascotEmoji");
  const resetBtn = document.getElementById("resetBtn");
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

  // ==================== Состояние ====================
  let score = 0;
  let wrong = 0;
  let streak = 0;
  let bestStreak = 0;
  let currentProblem = null;
  let isWaitingForNext = false;
  let operandCount = 2;

  let memberSettings = [
    { min: 1, max: 10, operation: "random" },
    { min: 1, max: 10, operation: "random" },
  ];

  const opsList = ["+", "-", "×", "÷"];

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

  // ==================== Построение UI настроек ====================
  function buildMemberUI() {
    membersContainer.innerHTML = "";
    for (let i = 0; i < operandCount; i++) {
      const s = memberSettings[i] || { min: 1, max: 10, operation: "random" };
      const row = document.createElement("div");
      row.className = "member-row";
      row.innerHTML = `
                <span class="member-label">Член ${i + 1}</span>
                <div class="member-range">
                    от <input type="number" class="member-min" value="${s.min}" min="0" max="100">
                    до <input type="number" class="member-max" value="${s.max}" min="1" max="100">
                </div>
                <select class="member-op-select${s.operation === "random" ? " random-active" : ""}">
                    <option value="random" ${s.operation === "random" ? "selected" : ""}>🎲 Случайно</option>
                    <option value="+" ${s.operation === "+" ? "selected" : ""}>+ Сложение</option>
                    <option value="-" ${s.operation === "-" ? "selected" : ""}>− Вычитание</option>
                    <option value="×" ${s.operation === "×" ? "selected" : ""}>× Умножение</option>
                    <option value="÷" ${s.operation === "÷" ? "selected" : ""}>÷ Деление</option>
                </select>
            `;

      const minInp = row.querySelector(".member-min");
      const maxInp = row.querySelector(".member-max");
      const sel = row.querySelector(".member-op-select");

      const update = () => {
        let mn = parseInt(minInp.value) || 1;
        let mx = parseInt(maxInp.value) || 10;
        if (mn < 0) mn = 0;
        if (mx < 1) mx = 1;
        if (mn > mx) [mn, mx] = [mx, mn];
        minInp.value = mn;
        maxInp.value = mx;
        memberSettings[i].min = mn;
        memberSettings[i].max = mx;
        memberSettings[i].operation = sel.value;
        sel.classList.toggle("random-active", sel.value === "random");
        generateNewProblem();
        answerInput.focus();
      };

      minInp.addEventListener("change", update);
      maxInp.addEventListener("change", update);
      sel.addEventListener("change", update);

      membersContainer.appendChild(row);
    }
  }

  // ==================== Выбор количества членов ====================
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
        memberSettings.push({ min: 1, max: 10, operation: "random" });
      }
      while (memberSettings.length > operandCount) {
        memberSettings.pop();
      }
      buildMemberUI();
      generateNewProblem();
      answerInput.focus();
    }
  });

  // ==================== Генерация примера ====================
  function generateProblem() {
    const maxAttempts = 500;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const operands = [];
      const ops = [];

      for (let i = 0; i < operandCount - 1; i++) {
        let op = memberSettings[i].operation;
        if (op === "random") {
          op = opsList[Math.floor(Math.random() * opsList.length)];
        }
        ops.push(op);
      }

      const firstSettings = memberSettings[0];
      operands.push(randInt(firstSettings.min, firstSettings.max));
      let valid = true;

      for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        const nextSettings = memberSettings[i + 1];

        if (!nextSettings) {
          valid = false;
          break;
        }

        let next;

        if (op === "+" || op === "-" || op === "×") {
          next = randInt(nextSettings.min, nextSettings.max);
        } else if (op === "÷") {
          const current = operands[i];
          const candidates = [];

          for (let d = nextSettings.min; d <= nextSettings.max; d++) {
            if (d !== 0 && current % d === 0) {
              candidates.push(d);
            }
          }

          if (candidates.length === 0) {
            valid = false;
            break;
          }
          next = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          valid = false;
          break;
        }

        operands.push(next);
      }

      if (!valid) continue;

      let answer = operands[0];
      for (let i = 0; i < ops.length; i++) {
        const b = operands[i + 1];
        switch (ops[i]) {
          case "+":
            answer += b;
            break;
          case "-":
            answer -= b;
            break;
          case "×":
            answer *= b;
            break;
          case "÷":
            if (b === 0) {
              valid = false;
              break;
            }
            answer /= b;
            break;
        }
        if (!valid) break;
      }

      if (!valid) continue;

      const lastSettings = memberSettings[operandCount - 1];

      if (
        Number.isInteger(answer) &&
        answer >= lastSettings.min &&
        answer <= lastSettings.max &&
        !isNaN(answer) &&
        isFinite(answer)
      ) {
        let expr = String(operands[0]);
        for (let i = 0; i < ops.length; i++) {
          expr += ` ${ops[i]} ${operands[i + 1]}`;
        }
        expr += ' = <span class="highlight">?</span>';

        return { expressionStr: expr, answer };
      }
    }

    // Запасной вариант
    console.warn("Использую запасной пример");
    const a = randInt(1, 10);
    const b = randInt(1, 10);
    return {
      expressionStr: `${a} + ${b} = <span class="highlight">?</span>`,
      answer: a + b,
    };
  }

  function generateNewProblem() {
    currentProblem = generateProblem();
    problemExpression.innerHTML = currentProblem.expressionStr;
    problemCard.classList.remove("shake", "celebrate");
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

    if (isCorrect) {
      score++;
      streak++;
      if (streak > bestStreak) bestStreak = streak;

      problemCard.classList.add("celebrate");
      answerInput.classList.add("correct-flash");
      const messages = [
        "Великолепно! 🌟",
        "Отлично! 🎉",
        "Молодец! ⭐",
        "Супер! 🚀",
        "Правильно! 💯",
      ];
      feedbackMsg.textContent =
        messages[Math.floor(Math.random() * messages.length)];
      feedbackMsg.className = "feedback-msg correct";
      mascotEmoji.textContent = "🥳";
      playRandomSound(correctSounds); // 🔊 Случайный звук победы
    } else {
      wrong++;
      streak = 0;

      problemCard.classList.add("shake");
      answerInput.classList.add("wrong-flash");
      feedbackMsg.innerHTML = `Не совсем! Ответ: <strong>${currentProblem.answer}</strong> 💪`;
      feedbackMsg.className = "feedback-msg wrong";
      mascotEmoji.textContent = "🦉💜";
      playRandomSound(wrongSounds); // 🔊 Случайный звук ошибки
    }

    updateStats();
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
    bestStreak = 0;
    updateStats();
    generateNewProblem();
    answerInput.focus();
  });

  // ==================== Инициализация ====================
  buildMemberUI();
  generateNewProblem();
  updateStats();
})();
