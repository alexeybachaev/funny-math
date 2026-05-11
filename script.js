// const correctSounds = [
//   "./sound/correct1.mp3",
//   "./sound/correct2.mp3",
//   "./sound/correct3.mp3",
//   "./sound/correct4.mp3",
// ];

// const wrongSounds = [
//   "./sound/false1.mp3",
//   "./sound/false2.mp3",
//   "./sound/false3.mp3",
//   "./sound/false4.mp3",
// ];
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
  const historyDots = document.getElementById("historyDots");

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
  let history = []; // массив 'correct' | 'wrong', максимум 20 штук

  let memberSettings = [
    { min: 1, max: 10 },
    { min: 1, max: 10 },
  ];

  let operationSettings = ["random"];

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

    // Если 2 члена: [Член 1] [операция] [Член 2]
    // Если 3 члена: [Член 1] [оп1] [Член 2] [оп2] [Член 3]
    // и т.д.

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

      // Обработчики изменения диапазона
      const minInp = row.querySelector(".member-min");
      const maxInp = row.querySelector(".member-max");

      if (minInp && maxInp) {
        const updateRange = () => {
          const idx = parseInt(minInp.dataset.index);
          let mn = parseInt(minInp.value);
          let mx = parseInt(maxInp.value);

          // Исправляем: проверяем на NaN
          if (isNaN(mn)) mn = memberSettings[idx]?.min || 1;
          if (isNaN(mx)) mx = memberSettings[idx]?.max || 10;
          if (mn < 0) mn = 0;
          if (mx < 1) mx = 1;
          if (mn > mx) [mn, mx] = [mx, mn];

          minInp.value = mn;
          maxInp.value = mx;
          memberSettings[idx].min = mn;
          memberSettings[idx].max = mx;
          generateNewProblem();
          answerInput.focus();
        };

        minInp.addEventListener("change", updateRange);
        maxInp.addEventListener("change", updateRange);
      }

      membersContainer.appendChild(row);

      // Добавляем операцию после каждого члена, кроме последнего
      if (i < operandCount - 1) {
        const opRow = document.createElement("div");
        opRow.className = "member-row";
        opRow.style.justifyContent = "center";
        opRow.style.background = "#f5f3ff";
        opRow.style.border = "2px dashed #c4b5fd";

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
            generateNewProblem();
            answerInput.focus();
          });
        }

        membersContainer.appendChild(opRow);
      }
    }
  }

  function updateHistoryDots() {
    if (!historyDots) return;
    historyDots.innerHTML = "";
    const recent = history.slice(-15); // показываем последние 15
    recent.forEach((result) => {
      const dot = document.createElement("span");
      dot.className =
        "history-dot " + (result === "correct" ? "correct-dot" : "wrong-dot");
      historyDots.appendChild(dot);
    });
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

      buildMemberUI();
      generateNewProblem();
      answerInput.focus();
    }
  });

  // ==================== Генерация примера ====================
  function generateProblem() {
    // Пробуем сгенерировать пример 1000 раз
    for (let attempt = 0; attempt < 1000; attempt++) {
      // 1. Определяем, какие операции будут между членами
      const ops = [];
      for (let i = 0; i < operandCount - 1; i++) {
        let op = operationSettings[i] || "random";
        if (op === "random") {
          op = opsList[Math.floor(Math.random() * opsList.length)];
        }
        ops.push(op);
      }

      // 2. Генерируем числа для каждого члена В ЕГО ДИАПАЗОНЕ
      const operands = [];
      for (let i = 0; i < operandCount; i++) {
        const settings = memberSettings[i];
        if (!settings) continue;

        // Просто случайное число от min до max
        const num = randInt(settings.min, settings.max);
        operands.push(num);
      }

      // 3. Вычисляем ответ (слева направо, без приоритета операций)
      let answer = operands[0];
      let valid = true;

      for (let i = 0; i < ops.length; i++) {
        const b = operands[i + 1];

        switch (ops[i]) {
          case "+":
            answer += b;
            break;
          case "-":
            answer -= b;
            // Проверяем только что ответ не отрицательный (для детей)
            if (answer < 0) valid = false;
            break;
          case "×":
            answer *= b;
            break;
          case "÷":
            // Проверяем, что деление будет нацело
            if (b === 0 || answer % b !== 0) {
              valid = false;
            } else {
              answer /= b;
            }
            break;
        }

        if (!valid) break;
      }

      // 4. Проверяем только что ответ натуральный (целый и неотрицательный)
      if (valid && Number.isInteger(answer) && answer >= 0) {
        // 5. Формируем строку для отображения
        let expr = String(operands[0]);
        for (let i = 0; i < ops.length; i++) {
          expr += ` ${ops[i]} ${operands[i + 1]}`;
        }
        expr += ' = <span class="highlight">?</span>';

        return {
          expressionStr: expr,
          answer: answer,
          operands: operands,
          ops: ops,
        };
      }
    }

    // Если не удалось подобрать за 1000 попыток — упрощённый пример
    console.warn(
      "Не удалось подобрать пример с заданными параметрами, использую запасной",
    );
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
      playRandomSound(correctSounds);
      history.push("correct");
      if (history.length > 20) history.shift();
      updateHistoryDots();
    } else {
      wrong++;
      streak = 0;

      problemCard.classList.add("shake");
      answerInput.classList.add("wrong-flash");
      feedbackMsg.innerHTML = `Не совсем! Ответ: <strong>${currentProblem.answer}</strong> 💪`;
      feedbackMsg.className = "feedback-msg wrong";
      mascotEmoji.textContent = "🦉💜";
      playRandomSound(wrongSounds);
      history.push("wrong");
      if (history.length > 20) history.shift();
      updateHistoryDots();
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
    history = [];
    updateHistoryDots();
  });

  // ==================== Инициализация ====================
  buildMemberUI();
  generateNewProblem();
  updateStats();
})();
