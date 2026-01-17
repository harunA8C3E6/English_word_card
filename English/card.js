// ===============================
// DOM取得
// ===============================
const card = document.getElementById("card");
const speakBtn = document.getElementById("speak-btn");
const front = document.getElementById("card-front");
const back = document.getElementById("card-back");
const onCard = document.getElementById("soundEtc");
let displayedIndex = 0;

const dontKnowBtn = document.getElementById("dontknow-btn");
const knownBtn = document.getElementById("known-btn");
const undoBtn = document.getElementById("undo-btn");
// ===============================
// メモモーダル DOM取得
// ===============================
const memoModal = document.getElementById("memo-modal");
const memoTitle = document.getElementById("memo-modal-title");
const memoView = document.getElementById("memo-view");
const memoTextarea = document.getElementById("memo-textarea");

const memoEditBtn = document.getElementById("memo-edit-btn");
const memoSaveBtn = document.getElementById("memo-save-btn");
const memoCancelBtn = document.getElementById("memo-cancel-btn");


console.log("card:", card);
console.log("front:", front);
console.log("back:", back);

card.addEventListener("click", () => {
    card.classList.toggle("flipped");
});

// ===============================
// メモ関連（study.js と共通）
// ===============================
const MEMO_KEY = "wordMemos";
let wordMemos = loadJSON(MEMO_KEY, {});
let currentMemoWordId = null;


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

const OTHER_POS = ["前", "接", "助"];

// ===============================
// 出題配列の加工
// ===============================
let filteredWords = words
    .slice(from - 1, to || words.length)
    .filter(w => {
        if (posFilter.length === 0) return true;
        if (!Array.isArray(w.ja)) return true;
        
        return w.ja.some(j => {
            // 直接一致する品詞をチェック
            const directMatch = posFilter.some(p => POS_MAP[p] === j.pos);
            if (directMatch) return true;
            
            // 「その他」が選択されていて、かつ前・接・助のいずれか
            if (posFilter.includes("other") && OTHER_POS.includes(j.pos)) {
                return true;
            }
            
            return false;
        });
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

    // メモ用
    const hasMemo = !!wordMemos[word.id]?.trim();

    onCard.innerHTML = `
        <div class="buttonsInCard">
            <button id="speak-btn" class="speak-btn button-text" data-word="${word.en}">🔊 再生</button>
            <button class="example-btn button-text" data-index="${currentIndex}">例文</button>
            <button class="tag-edit-btn button-text">タグ設定</button>
            <button class="memo-btn button-text ${hasMemo ? "has-memo" : ""}">メモ</button>
        </div>
    `

    console.log(currentIndex);

    front.textContent = word.en

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

    // 変更点→コメントアウト
    // card.classList.remove("flipped");

    card.style.transition = "transform 0.3s ease, opacity 0.25s ease";
    card.style.transform =
        direction === "left"
            ? "translateX(-120%) rotate(-15deg)"
            : "translateX(120%) rotate(15deg)";
    card.style.opacity = "0";

    setTimeout(() => {

        goNext(direction);

        card.style.transition = "none";
        card.style.transform = "";
        card.style.opacity = "0";
        
        requestAnimationFrame(() => {
            card.style.transition = "transform 0.3s ease, opacity 0.25s ease";
            card.style.opacity = "1"
        });
        
        // 変更点→追加
        card.classList.remove("flipped");

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

    console.log(currentIndex);
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

// ===============================
// 音声・例文・タグ設定
// ===============================
onCard.addEventListener("click", (e) => {
    const btn = e.target.closest(".speak-btn");
    if (!btn) return;

    e.stopPropagation();
    const wordEn = btn.dataset.word;
    speak(wordEn);
});
function speak(text) {
    if (!("speechSynthesis" in window)) {
        alert("このブラウザは音声読み上げに対応していません");
        return;
    }

    // 既に再生中なら止める
    speechSynthesis.cancel();

    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = "en-US";   // 英語
    uttr.rate = 1.0;      // 速度
    uttr.pitch = 1.0;     // 音の高さ

    speechSynthesis.speak(uttr);
}

const exampleModal = document.getElementById("example-modal");
const exampleEn = document.querySelector(".example-en");
const exampleJa = document.querySelector(".example-ja");
const closeModalBtn = document.getElementById("close-modal");
const toggleJaBtn = document.getElementById("toggle-ja");
const playAudioBtn = document.getElementById("play-audio");
onCard.addEventListener("click", (e) => {
    const exampleBtn = e.target.closest(".example-btn");
    if (!exampleBtn) return;

    e.stopPropagation();

    const index = Number(exampleBtn.dataset.index);
    const word = words[index];

    if (!word || !word.example) {
        alert("例文がありません");
        return;
    }

    exampleEn.textContent = word.example.en;
    exampleJa.textContent = word.example.ja;
    exampleJa.classList.add("modal-hidden");

    exampleModal.classList.remove("modal-hidden");
});
closeModalBtn.addEventListener("click", () => {
    exampleModal.classList.add("modal-hidden");
});
toggleJaBtn.addEventListener("click", () => {
    exampleJa.classList.toggle("modal-hidden");
});
playAudioBtn.addEventListener("click", () => {
    const text = exampleEn.textContent;
    if (text) speak(text);
});

onCard.addEventListener("click", (e) => {
    const tagBtn = e.target.closest(".tag-edit-btn");
    if (!tagBtn) return;

    e.stopPropagation();
    openTagModal();
});

// ===============================
// タグ設定モーダル
// ===============================
const tagModal = document.getElementById("tag-modal");
const tagModalTitle = document.getElementById("tag-modal-title");
const tagCheckboxArea = document.getElementById("tag-checkbox-area");
const tagSaveBtn = document.getElementById("tag-save-btn");
const tagCloseBtn = document.getElementById("tag-close-btn");

let currentWordId = null;

function loadJSON(key, defaultValue) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
    } catch {
        return defaultValue;
    }
}

let wordTags = loadJSON("wordTags", {});
let tags = loadJSON("tags", {});


// タグ編集ボタンクリック
onCard.addEventListener("click", (e) => {
    const tagBtn = e.target.closest(".tag-edit-btn");
    if (!tagBtn) return;

    e.stopPropagation();
    
    const word = words[currentIndex];
    if (!word) return;
    
    openTagModal(word);
});

function openTagModal(word) {
    currentWordId = word.id;

    tagModalTitle.textContent = `${word.en} のタグ設定`;
    tagCheckboxArea.innerHTML = "";

    const currentTags = wordTags[word.id] ?? [];

    Object.entries(tags).forEach(([tagId, tag]) => {
        const checked = currentTags.includes(tagId) ? "checked" : "";

        tagCheckboxArea.innerHTML += `
            <label>
                <input type="checkbox" value="${tagId}" ${checked}>
                ${tag.name}
            </label>
        `;
    });

    tagModal.classList.remove("modal-hidden");
}

function closeTagModal() {
    tagModal.classList.add("modal-hidden");
    currentWordId = null;
}

// 保存ボタン
tagSaveBtn.onclick = () => {
    const selected = [];

    tagCheckboxArea
        .querySelectorAll("input[type='checkbox']:checked")
        .forEach(cb => {
            selected.push(cb.value);
        });

    wordTags[currentWordId] = selected;
    localStorage.setItem("wordTags", JSON.stringify(wordTags));

    closeTagModal();
};

// 閉じるボタン
tagCloseBtn.onclick = closeTagModal;

// モーダル背景クリックで閉じる
tagModal.onclick = closeTagModal;
tagModal.querySelector(".modal-tag-content").onclick = e => {
    e.stopPropagation();
};


// メモ用
onCard.addEventListener("click", (e) => {
    const memoBtn = e.target.closest(".memo-btn");
    if (!memoBtn) return;

    e.stopPropagation();

    const word = words[currentIndex];
    if (!word) return;

    openMemoModal(word);
});

function openMemoModal(word) {
    currentMemoWordId = word.id;

    const memo = wordMemos[word.id] ?? "";

    memoTitle.textContent = `${word.en} のメモ`;

    memoView.textContent = memo || "（メモはまだありません）";
    memoView.classList.toggle("empty", !memo);

    memoTextarea.value = memo;

    // 閲覧モード
    memoView.classList.remove("modal-hidden");
    memoTextarea.classList.add("modal-hidden");

    memoEditBtn.textContent = memo ? "編集" : "新規作成";
    memoEditBtn.classList.remove("modal-hidden");
    memoSaveBtn.classList.add("modal-hidden");
    memoCancelBtn.classList.add("modal-hidden");

    memoModal.classList.remove("modal-hidden");
}

memoSaveBtn.onclick = () => {
    const value = memoTextarea.value;

    wordMemos[currentMemoWordId] = value;
    localStorage.setItem(MEMO_KEY, JSON.stringify(wordMemos));

    memoView.textContent = value || "（メモはまだありません）";
    memoView.classList.toggle("empty", !value);

    // ★ カード側を更新
    renderCard();

    memoView.classList.remove("modal-hidden");
    memoTextarea.classList.add("modal-hidden");

    memoEditBtn.classList.remove("modal-hidden");
    memoSaveBtn.classList.add("modal-hidden");
    memoCancelBtn.classList.add("modal-hidden");
};

memoCancelBtn.onclick = () => {
    memoView.classList.remove("modal-hidden");
    memoTextarea.classList.add("modal-hidden");

    memoEditBtn.classList.remove("modal-hidden");
    memoSaveBtn.classList.add("modal-hidden");
    memoCancelBtn.classList.add("modal-hidden");
};

memoEditBtn.onclick = () => {
    memoView.classList.add("modal-hidden");
    memoTextarea.classList.remove("modal-hidden");

    memoTextarea.focus();

    memoEditBtn.classList.add("modal-hidden");
    memoSaveBtn.classList.remove("modal-hidden");
    memoCancelBtn.classList.remove("modal-hidden");
};

memoModal.onclick = closeMemoModal;
memoModal.querySelector(".modal-tag-content").onclick = e => {
    e.stopPropagation();
};

const memoCloseBtn = document.getElementById("memo-close-btn");

memoCloseBtn.onclick = closeMemoModal;

function closeMemoModal() {
    memoModal.classList.add("modal-hidden");
    currentMemoWordId = null;
}