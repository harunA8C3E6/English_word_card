const front = document.getElementById("card-front");
const back = document.getElementById("card-back");
const flipBtn = document.getElementById("flip-btn");
const card = document.getElementById("card");

let startX = 0;
let currentX = 0;
let isDragging = false;

const params = new URLSearchParams(location.search)
const bookId = params.get("book");
let words = wordData[bookId] ?? [];
const from = Number(params.get("from") ?? 1);
const to = Number(params.get("to") ?? words.length);
const limit = Number(params.get("limit"));
const order = params.get("order");
const rawPos = params.get("pos");
const posFilter = rawPos ? rawPos.split(",") : [];
let currentIndex = 0;
const POS_MAP = {
    verb: "動",
    noun: "名",
    adj: "形",
    adv: "副",
    other: "その他"
};

const reviewWords = []; // 左（要復習）
const knownWords = [];  // 右（覚えた）
const historyStack = [];

// flipBtn.addEventListener("click", () => {
//     front.classList.toggle("hidden");
//     back.classList.toggle("hidden");
// });

// カード本体をクリックしてもめくれる（おすすめ）
card.addEventListener("click", () => {
    card.classList.toggle("flipped");
});

// const params = new URLSearchParams(location.search);

// const words = wordData[bookId] ?? [];
// let currentIndex = 0;

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

    updateProgress(); // ★追加
}

// renderCard();

function goNext(direction = "left") {
    const word = words[currentIndex];
    if (!word) return;

    historyStack.push({
        index: currentIndex,
        direction: direction,
        word: word
    });

    // 評価を記録
    if (direction === "left") {
        if (!reviewWords.includes(word)) {
            reviewWords.push(word);
        }
    } else {
        if (!knownWords.includes(word)) {
            knownWords.push(word);
        }
    }

    updateSwipeCounter(); // ★追加

    const isLast = currentIndex >= words.length - 1;

    // slideCards(direction);

    if (isLast) {
        setTimeout(showCompleteModal, 300);
        return;
    }

    currentIndex++;
    renderCard(); // ← ここで中身だけ変える
}


card.addEventListener("touchend", () => {
    if (!isDragging) return;
    isDragging = false;

    const diffX = currentX - startX;
    const threshold = 80;

    card.style.transition = "transform 0.3s ease, opacity 0.25s ease";

    if (diffX < -threshold) {
        swipeOut("left");
    } else if (diffX > threshold) {
        swipeOut("right");
    } else {
        // 元に戻す
        card.style.transform = "";
    }

    startX = 0;
    currentX = 0;
});

function swipeOut(direction) {
    // ① 画面外へ飛ばす
    card.style.transform =
        direction === "left"
            ? "translateX(-120%) rotate(-15deg)"
            : "translateX(120%) rotate(15deg)";

    // ② 少し待って内容を切り替え
    setTimeout(() => {
        // transform リセット
        card.style.transition = "none";
        card.style.transform = "translateX(0)";
        card.style.opacity = "0";

        goNext(direction); // index 更新・評価記録

        // ③ フェードイン
        requestAnimationFrame(() => {
            card.style.transition = "opacity 0.25s ease";
            card.style.opacity = "1";
        });
    }, 300);
}




// function goPrev() {
//     if (currentIndex <= 0) return;

//     slideCard("right");
//     currentIndex--;
// }

// スライド処理
// function slideCard(direction) {
//     card.classList.remove("flipped");

//     card.classList.add(
//         direction === "left" ? "slide-left" : "slide-right"
//     );

//     setTimeout(() => {
//         card.classList.add("reset");
//         renderCard();

//         // 再描画トリガ
//         card.offsetHeight;

//         card.classList.remove("slide-left", "slide-right", "reset");
//     }, 300);
// }

card.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    isDragging = true;

    // アニメーションを一時的に無効化
    card.style.transition = "none";
}, { passive: true });

card.addEventListener("touchmove", e => {
    if (!isDragging) return;

    currentX = e.touches[0].clientX;
    const diffX = currentX - startX;

    // 指の移動に追従
    card.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.05}deg)`;
}, { passive: true });



// card.addEventListener("touchend", e => {
//     if (startX === null) return;

//     const endX = e.changedTouches[0].clientX;
//     const diff = endX - startX;

//     if (diff < -50) {
//         goNext("left");   // 左スワイプ → 次
//     } else if (diff > 50) {
//         goNext("right");   // 右スワイプ → 前
//     }

//     startX = null;
// });


// 単語配列を加工
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
currentIndex = 0;
renderCard();

if (words.length === 0) {
    front.textContent = "対象の単語がありません";
    back.textContent = "";
}

// モーダル関連
function showCompleteModal() {
    const total = words.length;
    const known = knownWords.length;
    const review = reviewWords.length;

    document.getElementById("total-count").textContent = words.length;
    document.getElementById("known-count").textContent = knownWords.length;
    document.getElementById("review-count").textContent = reviewWords.length;

    drawResultChart(known, review); // ★ 追加

    document.getElementById("complete-modal")
        .classList.remove("modal-hidden");
}

// 再学習用関数
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

// document.getElementById("restart-review").addEventListener("click", () => {
//     if (reviewWords.length === 0) {
//         alert("要復習の単語はありません");
//         return;
//     }

//     // 出題配列を「要復習のみ」に置き換え
//     words = [...reviewWords];

//     // 評価結果をリセット
//     reviewWords.length = 0;
//     knownWords.length = 0;

//     currentIndex = 0;

//     // モーダルを閉じる
//     document.getElementById("complete-modal")
//         .classList.add("hidden");

//     // 最初のカードを表示
//     renderCard();
// });


// slideCard(direction);
// setTimeout(showCompleteModal, 300);


// 円グラフの作成関数
function drawResultChart(known, review) {
    const canvas = document.getElementById("result-chart");
    const ctx = canvas.getContext("2d");

    const total = known + review;
    if (total === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    let startAngle = -Math.PI / 2;

    // ===== 覚えた（緑） =====
    const knownAngle = (known / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + knownAngle);
    ctx.fillStyle = "#4caf50";
    ctx.fill();

    startAngle += knownAngle;

    // ===== 要復習（赤） =====
    const reviewAngle = (review / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + reviewAngle);
    ctx.fillStyle = "#f44336";
    ctx.fill();

    // ===== 中央の正答率テキスト =====
    const accuracy = Math.round((known / total) * 100);

    ctx.fillStyle = "#333";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${accuracy}%`, centerX, centerY);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#333";
    ctx.fillText("正答率", centerX, centerY - 22);

}

function clearChart() {
    const canvas = document.getElementById("result-chart");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 結果モーダルを閉じる
document.getElementById("result-close").onclick = () => {
    location.href =`study.html?book=${bookId}`
};

// 学習進度表示
function updateProgress() {
    const current = currentIndex + 1;
    document.getElementById("current-index").textContent = current;
    document.getElementById("total-count-card").textContent = words.length;

    const bar = document.getElementById("progress-bar");
    bar.max = words.length;
    bar.value = current;
}

function updateSwipeCounter() {
    document.getElementById("review-count-live").textContent = reviewWords.length;
    document.getElementById("known-count-live").textContent = knownWords.length;
}

function resetSwipeCounter() {
    document.getElementById("review-count-live").textContent = 0;
    document.getElementById("known-count-live").textContent = 0;
}

// ひとつ前に戻る関数
function undoLastAction() {
    if (historyStack.length === 0) return;

    const last = historyStack.pop();

    // インデックスを戻す
    currentIndex = last.index;

    // 評価を取り消す
    if (last.direction === "left") {
        const i = reviewWords.lastIndexOf(last.word);
        if (i !== -1) reviewWords.splice(i, 1);
    } else {
        const i = knownWords.lastIndexOf(last.word);
        if (i !== -1) knownWords.splice(i, 1);
    }

    // カウンター更新
    updateSwipeCounter();

    slideBack(last.direction);

    // カードを表示（アニメーションなし）
    card.classList.remove("flipped");
    renderCard();
}

document.getElementById("undo-btn").addEventListener("click", undoLastAction);

function updateUndoButton() {
    document.getElementById("undo-btn").disabled = historyStack.length === 0;
}

function slideBack(direction) {
    card.classList.remove("flipped");

    // 一度画面外に置く（逆方向）
    const backClass =
        direction === "left" ? "slide-back-right" : "slide-back-left";

    card.classList.add(backClass);

    // 強制再描画
    card.offsetHeight;

    // 元の位置へ戻す（アニメーション）
    card.style.transition = "transform 0.3s, opacity 0.3s";
    card.classList.remove(backClass);
}

let isAnimating = false;









// デバック用ボタン設定
// function goNext(direction = "left") {
//     if (currentIndex >= words.length - 1) return;

//     slideCard(direction);
//     currentIndex++;
// }


// function goPrev() {
//     if (currentIndex <= 0) return;
//     slideCard("right");
//     currentIndex--;
// }

document.getElementById("next-btn-left").addEventListener("click", () => goNext("left"));
document.getElementById("next-btn-right").addEventListener("click", () => goNext("right"));