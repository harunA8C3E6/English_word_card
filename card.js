// URL パラメータ取得
const params = new URLSearchParams(location.search);
const from = Number(params.get("from") || 1);
const to = Number(params.get("to") || 10);
const posFilter = (params.get("pos") || "").split(",").filter(Boolean);
const randomMode = params.get("random") === "1";
const randomCount = Number(params.get("count") || 10);

console.log({ from, to, posFilter, randomMode, randomCount });

// ここから単語カード用に wordData から範囲を抽出して表示可能




const card = document.getElementById("card");
const enEl = document.getElementById("card-en");
const jaEl = document.getElementById("card-ja");

// ===== 学習用データ =====
let studyWords = [];
let currentIndex = 0;

let knownWords = [];
let unknownWords = [];

// ===== 仮データ（後で設定モーダルから渡す）=====
studyWords = [
    {
        en: "follow",
        ja: [{ pos: "動", meaning: "～（の後）に続く" }]
    },
    {
        en: "consider",
        ja: [{ pos: "動", meaning: "～を考慮する" }]
    },
    {
        en: "increase",
        ja: [{ pos: "動", meaning: "増える／増やす" }]
    }
];

// ===== 初期表示 =====
renderCard();

// ===== カード描画 =====
function renderCard() {
    const word = studyWords[currentIndex];
    if (!word) return;

    enEl.textContent = word.en;

    jaEl.innerHTML = word.ja.map(j =>
        `<div class="ja-line">
            <span class="pos-tag" data-pos="${j.pos}">${j.pos}</span>
            <span class="meaning">${j.meaning}</span>
        </div>`
    ).join("");
}

// =========================
// タップ & スワイプ処理
// =========================
let startX = 0;
let currentX = 0;
let isDragging = false;
let isFlipped = false;

const SWIPE_THRESHOLD = 80;

// タップ（反転）
card.addEventListener("click", () => {
    if (isDragging) return;
    isFlipped = !isFlipped;
    card.classList.toggle("flipped", isFlipped);
});

// タッチ開始
card.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    card.classList.add("dragging");
});

// タッチ移動
card.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    currentX = e.touches[0].clientX - startX;
    card.style.transform = `
        translateX(${currentX}px)
        rotate(${currentX * 0.05}deg)
    `;
});

// タッチ終了
card.addEventListener("touchend", () => {
    card.classList.remove("dragging");

    if (Math.abs(currentX) > SWIPE_THRESHOLD) {
        currentX > 0 ? swipeRight() : swipeLeft();
    } else {
        resetPosition();
    }

    currentX = 0;
    isDragging = false;
});

// ===== 判定 =====
function swipeRight() {
    card.classList.add("swipe-right");
    handleAnswer(true);
}

function swipeLeft() {
    card.classList.add("swipe-left");
    handleAnswer(false);
}

// ===== 回答処理 =====
function handleAnswer(isKnown) {
    const word = studyWords[currentIndex];

    if (isKnown) {
        knownWords.push(word);
    } else {
        unknownWords.push(word);
    }

    setTimeout(() => {
        nextCard();
    }, 400);
}

// ===== 次のカード =====
function nextCard() {
    card.classList.remove("swipe-right", "swipe-left");
    card.style.transform = "";
    isFlipped = false;
    card.classList.remove("flipped");

    currentIndex++;

    if (currentIndex >= studyWords.length) {
        finishStudy();
        return;
    }

    renderCard();
}

// ===== 位置リセット =====
function resetPosition() {
    card.style.transform = "";
}

// ===== 学習終了 =====
function finishStudy() {
    console.log("学習終了");
    console.log("知っていた:", knownWords);
    console.log("知らなかった:", unknownWords);

    // 次：結果画面へ
    // location.href = "result.html";
}
