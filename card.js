// 必要要素の定義
// const card = document.getElementById("card");



// ===============================
// DOM取得
// ===============================
const card = document.getElementById("card");
const front = document.getElementById("card-front");
const back = document.getElementById("card-back");

const dontKnowBtn = document.getElementById("dontknow-btn");
const knownBtn = document.getElementById("known-btn");
const undoBtn = document.getElementById("undo-btn");

console.log("card:", card);
console.log("front:", front);
console.log("back:", back);

card.addEventListener("click", () => {
    card.classList.toggle("flipped");
});
// ===============================
// URL パラメータ
// ===============================
const params = new URLSearchParams(location.search);
const bookId = params.get("book");

const from = Number(params.get("from") ?? 1);
const to = Number(params.get("to"));
const limit = Number(params.get("limit"));
const order = params.get("order");
const rawPos = params.get("pos");
const posFilter = rawPos ? rawPos.split(",") : [];

// ===============================
// 単語データ取得
// ===============================
let words = wordData[bookId] ?? [];

const POS_MAP = {
    verb: "動",
    noun: "名",
    adj: "形",
    adv: "副",
    other: "その他"
};

// ===============================
// 出題配列の加工
// ===============================
let filteredWords = words
    .slice(from - 1, to || words.length)
    .filter(w => {
        if (posFilter.length === 0) return true;
        if (!Array.isArray(w.ja)) return true;
        return w.ja.some(j => posFilter.some(p => POS_MAP[p] === j.pos));
    });

if (order === "random") {
    filteredWords.sort(() => Math.random() - 0.5);
}

if (limit && limit < filteredWords.length) {
    filteredWords = filteredWords.slice(0, limit);
}

words = filteredWords;

// ===============================
// 状態管理
// ===============================
let currentIndex = 0;
const reviewWords = [];
const knownWords = [];
const historyStack = [];

let isAnimating = false;

// ===============================
// カード描画
// ===============================
function renderCard() {
    const word = words[currentIndex];
    if (!word) return;

    front.textContent = word.en;

    if (Array.isArray(word.ja)) {
        back.innerHTML = word.ja
            .map(j => `${j.pos}：${j.meaning}`)
            .join("<br>");
    } else {
        back.textContent = word.ja;
    }

    updateProgress();
}

// ===============================
// 次のカードへ（評価記録）
// ===============================
function goNext(direction) {
    const word = words[currentIndex];
    if (!word) return;

    historyStack.push({
        index: currentIndex,
        direction,
        word
    });

    if (direction === "left") {
        reviewWords.push(word);
    } else {
        knownWords.push(word);
    }

    updateSwipeCounter();

    const isLast = currentIndex >= words.length - 1;

    if (isLast) {
        setTimeout(showCompleteModal, 300);
        return;
    }

    currentIndex++;
    renderCard();
}

// ===============================
// カードを飛ばすアニメーション
// ===============================
function slideOut(direction) {
    if (isAnimating) return;
    isAnimating = true;

    card.classList.remove("flipped");

    card.style.transition = "transform 0.3s ease, opacity 0.25s ease";
    card.style.transform =
        direction === "left"
            ? "translateX(-120%) rotate(-15deg)"
            : "translateX(120%) rotate(15deg)";
    card.style.opacity = "0";

    setTimeout(() => {
        card.style.transition = "none";
        card.style.transform = "";
        card.style.opacity = "0";

        goNext(direction);

        requestAnimationFrame(() => {
            card.style.transition = "transform 0.3s ease, opacity 0.25s ease";
            card.style.opacity = "1"
        });

        isAnimating = false;
    }, 300);
}

// ===============================
// ボタン操作
// ===============================
dontKnowBtn.addEventListener("click", () => {
    slideOut("left");   // 要復習
});

knownBtn.addEventListener("click", () => {
    slideOut("right");  // 覚えた
});

// ===============================
// ひとつ前に戻る
// ===============================
function undoLastAction() {
    if (historyStack.length === 0) return;

    const last = historyStack.pop();
    currentIndex = last.index;

    if (last.direction === "left") {
        reviewWords.pop();
    } else {
        knownWords.pop();
    }

    updateSwipeCounter();
    renderCard();
}

undoBtn.addEventListener("click", undoLastAction);

// ===============================
// 進捗表示
// ===============================
function updateProgress() {
    document.getElementById("current-index").textContent = currentIndex + 1;
    document.getElementById("total-count-card").textContent = words.length;

    const bar = document.getElementById("progress-bar");
    bar.max = words.length;
    bar.value = currentIndex + 1;
}

function updateSwipeCounter() {
    document.getElementById("review-count-live").textContent = reviewWords.length;
    document.getElementById("known-count-live").textContent = knownWords.length;
}

// ===============================
// 完了モーダル
// ===============================
function showCompleteModal() {
    document.getElementById("total-count").textContent = words.length;
    document.getElementById("known-count").textContent = knownWords.length;
    document.getElementById("review-count").textContent = reviewWords.length;

    drawResultChart(knownWords.length, reviewWords.length);

    document
        .getElementById("complete-modal")
        .classList.remove("modal-hidden");
}

// 再学習用ボタン
document.getElementById("restart-review").addEventListener("click", () => {
    if (reviewWords.length === 0) {
        alert("要復習の単語はありません");
        return;
    }

    words = [...reviewWords]; // コピー重要
    reviewWords.length = 0;
    knownWords.length = 0;
    currentIndex = 0;

    document.getElementById("complete-modal")
        .classList.add("modal-hidden");

    renderCard();
    clearChart();
    resetSwipeCounter();
});

// モーダルを閉じる
document.getElementById("result-close").onclick = () => {
    location.href =`study.html?book=${bookId}`
}

function clearChart() {
    const canvas = document.getElementById("result-chart");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function resetSwipeCounter() {
    document.getElementById("review-count-live").textContent = 0;
    document.getElementById("known-count-live").textContent = 0;
}

// ===============================
// 円グラフ
// ===============================
function drawResultChart(known, review) {
    const canvas = document.getElementById("result-chart");
    const ctx = canvas.getContext("2d");

    const total = known + review;
    if (total === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = canvas.width / 2 - 10;

    let start = -Math.PI / 2;

    const knownAngle = (known / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + knownAngle);
    ctx.fillStyle = "#4caf50";
    ctx.fill();

    start += knownAngle;

    const reviewAngle = (review / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + reviewAngle);
    ctx.fillStyle = "#f44336";
    ctx.fill();

    const accuracy = Math.round((known / total) * 100);
    ctx.fillStyle = "#333";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${accuracy}%`, cx, cy);
}

// ===============================
// 初期表示
// ===============================
if (words.length === 0) {
    front.textContent = "対象の単語がありません";
    back.textContent = "";
} else {
    renderCard();
}
