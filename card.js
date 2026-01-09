// 必要要素の定義
// const card = document.getElementById("card");

// card.addEventListener("click", () => {
//     card.classList.toggle("flipped");
// });



/* =========================
    DOM取得
========================= */
const card = document.getElementById("card");
const front = document.getElementById("card-front");
const back = document.getElementById("card-back");

const dontKnowBtn = document.getElementById("dontknow-btn");
const knownBtn = document.getElementById("known-btn");
const undoBtn = document.getElementById("undo-btn");

/* =========================
    URLパラメータ取得
========================= */
const params = new URLSearchParams(location.search);
const bookId = params.get("book");

const from = Number(params.get("from") ?? 1);
const to = Number(params.get("to"));
const limit = Number(params.get("limit"));
const order = params.get("order");

const rawPos = params.get("pos");
const posFilter = rawPos ? rawPos.split(",") : [];

/* =========================
    品詞マップ
========================= */
const POS_MAP = {
    verb: "動",
    noun: "名",
    adj: "形",
    adv: "副",
    other: "その他"
};

/* =========================
    単語データ準備
========================= */
let words = wordData[bookId] ?? [];

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

/* =========================
    状態管理
========================= */
let currentIndex = 0;
let isDragging = false;
let startX = 0;
let currentX = 0;
let isAnimating = false;

const reviewWords = [];
const knownWords = [];
const historyStack = [];

/* =========================
    カード描画
========================= */
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

/* =========================
    次のカードへ
========================= */
function goNext(direction) {
    const word = words[currentIndex];
    if (!word) return;

    historyStack.push({ index: currentIndex, direction, word });

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

/* =========================
    スワイプアウト処理
========================= */
function swipeOut(direction) {
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
        card.style.opacity = "1";

        goNext(direction);

        requestAnimationFrame(() => {
            card.style.transition = "transform 0.3s ease, opacity 0.25s ease";
        });

        isAnimating = false;
    }, 300);
}

/* =========================
    タッチ操作
========================= */
card.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    isDragging = true;
    card.style.transition = "none";
}, { passive: true });

card.addEventListener("touchmove", e => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    card.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.05}deg)`;
}, { passive: true });

card.addEventListener("touchend", () => {
    if (!isDragging) return;
    isDragging = false;

    const diffX = currentX - startX;
    const threshold = 80;
    const tapRange = 10;

    card.style.transition = "transform 0.3s ease";

    if (Math.abs(diffX) < tapRange) {
        card.classList.toggle("flipped");
        card.style.transform = "";
    } else if (diffX > threshold) {
        swipeOut("right");
    } else if (diffX < -threshold) {
        swipeOut("left");
    } else {
        card.style.transform = "";
    }

    startX = 0;
    currentX = 0;
});

/* =========================
    ボタン操作
========================= */
dontKnowBtn.addEventListener("click", () => swipeOut("left"));
knownBtn.addEventListener("click", () => swipeOut("right"));

/* =========================
    Undo
========================= */
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
    card.classList.remove("flipped");
    renderCard();
}

undoBtn.addEventListener("click", undoLastAction);

/* =========================
    UI更新
========================= */
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

/* =========================
    初期表示
========================= */
if (words.length === 0) {
    front.textContent = "対象の単語がありません";
    back.textContent = "";
} else {
    renderCard();
}
