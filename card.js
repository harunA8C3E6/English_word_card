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
const knownLabel = card.querySelector(".known");
const unknownLabel = card.querySelector(".unknown");
const settings = JSON.parse(
    localStorage.getItem("studySettings") || "{}"
);

function applySettings(words, settings) {
    let result = [...words];

    // 範囲
    if (settings.range) {
        result = result.slice(
            settings.range.from - 1,
            settings.range.to
        );
    }

    // 品詞フィルタ
    if (settings.posFilter?.length) {
        result = result.filter(w =>
            settings.posFilter.includes(w.pos)
        );
    }

    // 並び順
    if (settings.order === "random") {
        result.sort(() => Math.random() - 0.5);
    }

    return result;
}

// ===== 全単語配列を作成 =====
function getAllWords() {
    const result = [];

    Object.values(wordData).forEach(bookWords => {
        bookWords.forEach(word => {
            result.push(word);
        });
    });

    return result;
}

const ALL_WORDS = getAllWords();



let currentIndex = 0;
let wordList = applySettings(ALL_WORDS, settings);

function renderCard() {
    const word = wordList[currentIndex];
    if (!word) return;

    card.classList.remove("flipped");

    cardEn.textContent = word.en;

    cardJa.innerHTML = `
        <span class="pos-tag" data-pos="${word.pos}">
            ${word.pos}
        </span>
        ${settings.showMeaning ? word.ja : ""}
    `;
}

function swipeNext(direction) {
    card.classList.add(
        direction === "right" ? "swipe-right" : "swipe-left"
    );

    setTimeout(() => {
        card.className = "card enter";
        currentIndex++;
        renderCard();
    }, 300);
}

function swipeNext(direction) {
    card.classList.add(
        direction === "right" ? "swipe-right" : "swipe-left"
    );

    setTimeout(() => {
        card.className = "card enter";
        currentIndex++;
        renderCard();
    }, 300);
}

let startX = 0;

card.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
}, { passive: true });

card.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 60) {
        swipeNext(diff > 0 ? "right" : "left");
    }
});

btnKnown.onclick = () => swipeNext("right");
btnUnknown.onclick = () => swipeNext("left");








// ===== 学習用データ =====
let studyWords = [];
// let currentIndex = 0;

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

// ===== 単語生成 =====
function createStudyWords(words, options) {
    let list = [...words];

    // ① 学習範囲（単語番号）
    list = list.filter(word =>
        word.id >= options.from && word.id <= options.to
    );

    // ② 品詞フィルタ
    if (options.posFilter.length > 0) {
        list = list.filter(word =>
            options.posFilter.includes(word.pos)
        );
    }

    // ③ ランダム処理
    if (options.randomMode) {
        shuffle(list);

        // ④ 個数制限
        list = list.slice(0, options.randomCount);
    }

    return list;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}



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
// let startX = 0;
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
card.addEventListener("touchmove", e => {
    if (!startX) return;

    const diffX = e.touches[0].clientX - startX;
    const rotate = diffX / 15;

    card.style.transform = `translateX(${diffX}px) rotate(${rotate}deg)`;

    // 表示制御
    if (diffX > 30) {
        card.classList.add("swiping-right");
        card.classList.remove("swiping-left");

        knownLabel.style.opacity = 1;
        unknownLabel.style.opacity = 0;
    } else if (diffX < -30) {
        card.classList.add("swiping-left");
        card.classList.remove("swiping-right");

        knownLabel.style.opacity = 0;
        unknownLabel.style.opacity = 1;
    } else {
        resetSwipeUI();
    }
});


// タッチ終了
card.addEventListener("touchend", e => {
    if (!startX) return;

    const diffX = e.changedTouches[0].clientX - startX;

    resetSwipeUI();

    if (diffX > threshold) {
        handleAnswer("known");
    } else if (diffX < -threshold) {
        handleAnswer("unknown");
    } else {
        card.style.transform = "";
    }

    startX = null;
});

function resetSwipeUI() {
    card.classList.remove("swiping-right", "swiping-left");
    knownLabel.style.opacity = 0;
    unknownLabel.style.opacity = 0;
}

card.addEventListener("touchstart", onTouchStart, { passive: false });
card.addEventListener("touchmove", onTouchMove, { passive: false });
card.addEventListener("touchend", onTouchEnd, { passive: false });

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
    // スワイプしたカードはそのまま消える
    card.classList.remove("swipe-right", "swipe-left");

    isFlipped = false;
    card.classList.remove("flipped");

    currentIndex++;

    if (currentIndex >= studyWords.length) {
        finishStudy();
        return;
    }

    // 次のカードを初期状態で表示
    card.style.transform = "";
    renderCard();

    // 出現アニメーション
    card.classList.add("enter");
    setTimeout(() => {
        card.classList.remove("enter");
    }, 250);
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

// let startX = 0;
let startY = 0;
// let currentX = 0;
let isSwiping = false;

function onTouchStart(e) {
    if (e.touches.length !== 1) return;

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = true;
}

function onTouchMove(e) {
    if (!isSwiping) return;

    currentX = e.touches[0].clientX;

    // 横スワイプ優先（縦スクロール防止）
    const dx = currentX - startX;
    const dy = e.touches[0].clientY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault(); // ← ここがあるので passive:false が必要
    }
}

function onTouchEnd(e) {
    if (!isSwiping) return;
    isSwiping = false;

    const dx = currentX - startX;

    if (dx > 80) {
        console.log("→ 知っている単語");
    } else if (dx < -80) {
        console.log("← 知らない単語");
    } else {
        console.log("タップ or スワイプ不足");
    }
}



// ===== デバッグ用ボタン =====
const btnKnown = document.getElementById("btn-known");
const btnUnknown = document.getElementById("btn-unknown");

if (btnKnown && btnUnknown) {
    btnKnown.onclick = () => {
        card.classList.add("swipe-right");
        handleAnswer(true);
    };

    btnUnknown.onclick = () => {
        card.classList.add("swipe-left");
        handleAnswer(false);
    };
}
