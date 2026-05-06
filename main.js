const totalInput = document.querySelector("#totalCount");
const winnerInput = document.querySelector("#winnerCount");
const prefixInput = document.querySelector("#labelPrefix");
const shuffleButton = document.querySelector("#shuffleButton");
const resetButton = document.querySelector("#resetButton");
const drawArea = document.querySelector("#drawArea");
const result = document.querySelector("#result");

let lots = [];
let openedCount = 0;

function clampSettings() {
  const total = Math.min(50, Math.max(2, Number(totalInput.value) || 10));
  const winners = Math.min(total - 1, Math.max(1, Number(winnerInput.value) || 1));

  totalInput.value = total;
  winnerInput.max = total - 1;
  winnerInput.value = winners;

  return { total, winners };
}

function shuffle(values) {
  const shuffled = [...values];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

function createLots() {
  const { total, winners } = clampSettings();
  const pool = Array.from({ length: total }, (_, index) => index < winners);

  lots = shuffle(pool);
  openedCount = 0;
  result.textContent = "제비가 준비되었습니다.";
  renderLots();
}

function openLot(lot, isWinner) {
  if (lot.classList.contains("open")) return;

  openedCount += 1;
  lot.classList.add("open");
  lot.disabled = true;
  lot.textContent = isWinner ? "당첨" : "꽝";

  if (!isWinner) {
    lot.classList.add("lose");
  }

  result.textContent = isWinner
    ? `축하합니다. ${openedCount}번째 뽑기에서 당첨입니다.`
    : `${openedCount}번째 뽑기는 꽝입니다.`;
}

function renderLots() {
  const prefix = prefixInput.value.trim() || "제비";
  drawArea.innerHTML = "";

  lots.forEach((isWinner, index) => {
    const lot = document.createElement("button");
    lot.type = "button";
    lot.className = "lot";
    lot.textContent = `${prefix} ${index + 1}`;
    lot.setAttribute("aria-label", `${prefix} ${index + 1} 뽑기`);
    lot.addEventListener("click", () => openLot(lot, isWinner));
    drawArea.append(lot);
  });
}

function reset() {
  totalInput.value = 10;
  winnerInput.value = 2;
  prefixInput.value = "제비";
  createLots();
}

shuffleButton.addEventListener("click", createLots);
resetButton.addEventListener("click", reset);
totalInput.addEventListener("change", clampSettings);
winnerInput.addEventListener("change", clampSettings);
prefixInput.addEventListener("input", renderLots);

createLots();
